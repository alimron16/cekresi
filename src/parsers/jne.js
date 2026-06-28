const axios = require('axios');

async function parseJNE(resi, verify) {
  if (!verify) {
    throw new Error('Verification parameter (last 5 digits of receiver phone number) is required for JNE');
  }

  const url = `https://cekresi.jne.co.id/${resi}?verify=${verify}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Referer': 'https://jne.co.id/',
        'Connection': 'keep-alive'
      }
    });

    const html = response.data;
    return extractDataFromHtml(html, resi);
  } catch (error) {
    throw new Error(`Failed to fetch JNE tracking data: ${error.message}`);
  }
}

function extractDataFromHtml(html, resi) {
  const regex = /window\.allTrackingData\s*=\s*({[\s\S]*?});/;
  const match = html.match(regex);
  
  if (!match) {
    throw new Error('Tracking data script block not found in JNE response');
  }

  try {
    const allData = JSON.parse(match[1]);
    const resiData = allData[resi];
    
    if (!resiData) {
      throw new Error(`Tracking data for resi ${resi} not found in the response`);
    }

    return {
      courier: 'JNE',
      resi: resiData.resiNumber,
      status: resiData.currentStatus,
      service: resiData.service,
      sender: {
        name: resiData.shipperName ? resiData.shipperName.trim() : '-',
        city: resiData.shipperCity ? resiData.shipperCity.trim() : '-'
      },
      receiver: {
        name: resiData.receiverNameDetail ? resiData.receiverNameDetail.trim() : (resiData.receiverName ? resiData.receiverName.trim() : '-'),
        city: resiData.receiverCityDetail ? resiData.receiverCityDetail.trim() : (resiData.to ? resiData.to.trim() : '-'),
        relationship: resiData.receiverRelationship ? resiData.receiverRelationship.trim() : '-'
      },
      info: {
        date: resiData.shipmentDate || '-',
        weight: resiData.weight || '-',
        quantity: resiData.koli || 1,
        description: resiData.goodDescription || '-',
        podDate: resiData.podDate || '-'
      },
      history: (resiData.history || []).map(item => ({
        date: item.date,
        description: item.title,
        isCurrent: !!item.active
      }))
    };
  } catch (parseError) {
    throw new Error(`Failed to parse JNE tracking data: ${parseError.message}`);
  }
}

module.exports = {
  parseJNE,
  extractDataFromHtml
};
