require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { rateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// ── Security & Core Middleware ──────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// CLIENT_ORIGIN can be a comma-separated list, e.g.:
// https://homex.vercel.app,https://homex.up.railway.app
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map(o => o.trim());
    if (!origin || allowed.includes('*') || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimiter);

// ── Socket.io ───────────────────────────────────────────────────────────────
const { initSocket } = require('./config/socket');
initSocket(server);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/riders', require('./routes/riders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/cart', require('./routes/cart'));

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
}));

app.use(errorHandler);

// ── Vercel Serverless vs Railway/Local ──────────────────────────────────────
if (process.env.VERCEL) {
  // On Vercel: Vercel handles the HTTP server and static frontend.
  // Just connect to DB on cold start and export the Express app.
  connectDB().catch((err) => console.error('DB connection error:', err));
  module.exports = app;
} else {
  // On Railway / local: serve the React build and start listening.
  const path = require('path');
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  } else {
    app.use('*', (req, res) => {
      res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
    });
  }

  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 HomeX API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  });

  module.exports = { app, server };
}
