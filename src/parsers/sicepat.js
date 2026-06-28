const puppeteer = require('puppeteer');

async function parseSicepat(resi, verify) {
  if (!verify) {
    throw new Error('Verification parameter (last 5 digits of receiver phone number) is required for SiCepat');
  }

  const verifyStr = String(verify).trim();
  if (verifyStr.length !== 5) {
    throw new Error('Verification parameter must be exactly 5 digits');
  }

  const browser = await puppeteer.launch({
    headless: 'shell',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-crash-reporter',
      '--disable-breakpad'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36');

  let apiResponse = null;
  let responseError = null;

  page.on('response', async response => {
    if (response.url().includes('check-awb') && response.request().method() === 'POST') {
      try {
        const json = await response.json();
        if (json.statusCode === 200) {
          apiResponse = json;
        } else {
          responseError = json.message || 'API returned non-200 status';
        }
      } catch (err) {
        responseError = 'Failed to parse API response JSON';
      }
    }
  });

  try {
    await page.goto('https://www.sicepat.com/', { waitUntil: 'networkidle2', timeout: 30000 });

    const inputSelector = 'input[placeholder="Masukkan No. Resi"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.type(inputSelector, resi);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lacakBtn = buttons.find(b => b.textContent.includes('Lacak'));
      if (lacakBtn) lacakBtn.click();
    });

    await page.waitForSelector('#mobile-otp-input-0', { timeout: 10000 });

    for (let i = 0; i < 5; i++) {
      await page.type(`#mobile-otp-input-${i}`, verifyStr[i]);
    }

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lanjutkanBtn = buttons.find(b => b.textContent.includes('Lanjutkan'));
      if (lanjutkanBtn) lanjutkanBtn.click();
    });

    const maxRetries = 15;
    for (let retry = 0; retry < maxRetries; retry++) {
      if (apiResponse) break;
      if (responseError) throw new Error(responseError);
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!apiResponse) {
      throw new Error('Timeout waiting for tracking data response from SiCepat');
    }

    const result = apiResponse.data.sicepat.result;

    return {
      courier: 'SiCepat',
      resi: result.waybill_number,
      status: result.last_status ? result.last_status.status : 'UNKNOWN',
      service: result.service,
      sender: {
        name: result.sender || '-',
        city: '-'
      },
      receiver: {
        name: result.receiver_name || '-',
        city: result.receiver_address || '-',
        relationship: '-'
      },
      info: {
        date: result.send_date || '-',
        weight: '-',
        quantity: 1,
        description: result.POD_receiver || '-',
        podDate: result.POD_receiver_time || '-'
      },
      history: (result.track_history || []).map(item => ({
        date: item.date_time,
        description: `${item.status} - ${item.city || item.receiver_name || ''}`.trim(),
        isCurrent: result.last_status && result.last_status.date_time === item.date_time
      }))
    };

  } catch (error) {
    throw new Error(`Failed to fetch SiCepat tracking data: ${error.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = {
  parseSicepat
};
