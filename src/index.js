const path = require('path');
process.env.PUPPETEER_CACHE_DIR = path.join(__dirname, '..', '.cache', 'puppeteer');

const express = require('express');
const cors = require('cors');
const { trackResi } = require('./middleware/resiTracker');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Detailed Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleString();
  console.log(`\n==================================================`);
  console.log(`[${timestamp}] INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
  console.log(`[${timestamp}] Query Params:`, JSON.stringify(req.query, null, 2));
  console.log(`[${timestamp}] Headers:`, JSON.stringify(req.headers, null, 2));
  if (req.method === 'POST') {
    console.log(`[${timestamp}] Body:`, JSON.stringify(req.body, null, 2));
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] RESPONSE SENT: Status ${res.statusCode} (${duration}ms)`);
    console.log(`==================================================`);
  });
  next();
});

// API route for tracking
app.get('/api/track', trackResi);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MBRESI',
    supportedCouriers: ['jne', 'jnt', 'lion', 'sicepat'],
    usage: {
      jne: '/api/track?courier=jne&resi=YOUR_RESI_NUMBER&verify=LAST_5_DIGITS_OF_RECEIVER_PHONE',
      jnt: '/api/track?courier=jnt&resi=YOUR_RESI_NUMBER&verify=LAST_4_DIGITS_OF_RECEIVER_PHONE',
      sicepat: '/api/track?courier=sicepat&resi=YOUR_RESI_NUMBER&verify=LAST_5_DIGITS_OF_RECEIVER_PHONE',
      lion: '/api/track?courier=lion&resi=YOUR_RESI_NUMBER'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
