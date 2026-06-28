const { parseJNE } = require('../parsers/jne');
const { parseJNT } = require('../parsers/jnt');
const { parseLion } = require('../parsers/lion');
const { parseSicepat } = require('../parsers/sicepat');

async function trackResi(req, res, next) {
  const { courier, resi, verify, recaptcha } = req.query;
  const timestamp = new Date().toLocaleString();

  console.log(`[${timestamp}] [Tracker] Starting tracking process for courier: "${courier}", resi: "${resi}", verify: "${verify || '-'}"`);

  if (!courier || !resi) {
    console.log(`[${timestamp}] [Tracker] Validation Failed: Missing courier or resi`);
    return res.status(400).json({
      success: false,
      message: 'Parameter "courier" and "resi" are required'
    });
  }

  const courierKey = courier.toLowerCase();

  try {
    let trackingData;
    switch (courierKey) {
      case 'jne':
        console.log(`[${timestamp}] [Tracker] Routing request to JNE parser...`);
        trackingData = await parseJNE(resi, verify);
        break;
      case 'jnt':
      case 'j&t':
        console.log(`[${timestamp}] [Tracker] Routing request to J&T parser...`);
        trackingData = await parseJNT(resi, verify);
        break;
      case 'lion':
      case 'lionparcel':
      case 'lion-parcel':
        console.log(`[${timestamp}] [Tracker] Routing request to Lion Parcel parser...`);
        trackingData = await parseLion(resi, verify);
        break;
      case 'sicepat':
        console.log(`[${timestamp}] [Tracker] Routing request to SiCepat parser...`);
        trackingData = await parseSicepat(resi, verify, recaptcha);
        break;
      default:
        console.log(`[${timestamp}] [Tracker] Validation Failed: Courier "${courier}" not supported`);
        return res.status(400).json({
          success: false,
          message: `Courier "${courier}" is not supported. Supported couriers: jne, jnt, lion, sicepat`
        });
    }

    console.log(`[${timestamp}] [Tracker] Tracking SUCCESS! Normalized Data:`, JSON.stringify(trackingData, null, 2));

    return res.status(200).json({
      success: true,
      data: trackingData
    });
  } catch (error) {
    console.error(`[${timestamp}] [Tracker] Tracking FAILED! Error details:`, error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  trackResi
};
