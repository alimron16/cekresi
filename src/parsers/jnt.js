const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

async function parseJNT(resi, verify) {
  if (!verify) {
    throw new Error('Verification parameter (last 4 digits of receiver/sender phone number) is required for J&T');
  }

  const verifyStr = String(verify).trim();
  if (verifyStr.length !== 4) {
    throw new Error('Verification parameter must be exactly 4 digits');
  }

  const url = 'https://jet.co.id/index/router/index.html';
  
  // We can generate a random 32-character hex string as pId
  const pId = crypto.randomBytes(16).toString('hex');
  const pst = md5(pId + 'j&t2020app!@#');

  const payload = {
    method: 'query/findTrack',
    'data[billcode]': resi,
    'data[lang]': 'en',
    'data[source]': '3',
    'data[phone]': verifyStr,
    'data[type]': '1',
    pId: pId,
    pst: pst
  };

  const headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Origin': 'https://jet.co.id',
    'Referer': 'https://jet.co.id/track',
    'X-Requested-With': 'XMLHttpRequest',
    'X-SimplyPost-Id': pId,
    'X-SimplyPost-Signature': pst,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
  };

  try {
    const response = await axios.post(url, querystring.stringify(payload), { headers });
    
    // The J&T API returns double JSON-encoded strings or a single string that needs parsing
    let responseData = response.data;
    if (typeof responseData === 'string') {
      responseData = JSON.parse(responseData);
    }

    if (!responseData.success || !responseData.data || responseData.data.length === 0) {
      throw new Error(responseData.desc || 'Failed to fetch tracking data from J&T');
    }

    const trackData = responseData.data[0];
    const details = trackData.details || [];

    if (details.length === 0) {
      throw new Error(`No details found for J&T resi: ${resi}`);
    }

    const latest = details[0];
    const oldest = details[details.length - 1];
    const weightDetail = details.find(d => d.weight);

    return {
      courier: 'J&T',
      resi: resi,
      status: latest.status ? latest.status.toUpperCase() : 'UNKNOWN',
      service: 'EZ',
      sender: {
        name: oldest.remark1 || '-',
        city: oldest.scanNetworkCity || '-'
      },
      receiver: {
        name: latest.remark1 || '-',
        city: latest.scanNetworkCity || '-',
        relationship: '-'
      },
      info: {
        date: oldest.scanTime || '-',
        weight: weightDetail ? `${weightDetail.weight} Kg` : '-',
        quantity: 1,
        description: latest.customerTracking || '-',
        podDate: latest.status === 'Delivered' ? latest.scanTime : '-'
      },
      history: details.map((item, idx) => ({
        date: item.scanTime,
        description: `${item.status || item.scanTypeName} - ${item.customerTracking || item.remark1 || ''}`.trim(),
        isCurrent: idx === 0
      }))
    };

  } catch (error) {
    throw new Error(`Failed to fetch J&T tracking data: ${error.message}`);
  }
}

module.exports = {
  parseJNT
};
