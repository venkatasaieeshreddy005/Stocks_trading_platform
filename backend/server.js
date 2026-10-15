const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config();

const { startSimulationLoop, getMarketInstrumentsSnapshot, getMarketSentiment, getTopMovers, getSectorHeatmap } = require('./engine/simulation');
const { verifyTokenToUserId, COOKIE_NAME } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const tradesRoutes = require('./routes/trades');
const portfolioRoutes = require('./routes/portfolio');
const marketsRoutes = require('./routes/markets');
const watchlistRoutes = require('./routes/watchlist');
const fundsRoutes = require('./routes/funds');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

const isProd = process.env.NODE_ENV === 'production';

// Behind a hosting proxy (Render, Railway, Heroku...) the real client IP comes from X-Forwarded-For.
// Needed so the login rate limiter counts per user instead of per proxy.
if (isProd) {
  app.set('trust proxy', 1);
}

/**
 * CORS
 * - Development: allow any origin (Vite dev server proxies /api anyway).
 * - Production : allow only FRONTEND_URL (plus requests with no Origin header, e.g. health checks).
 */
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
  .filter(Boolean)
  .map((o) => o.replace(/\/$/, ''));

app.use(cors({
  origin: function (origin, callback) {
    if (!isProd || !origin) return callback(null, true);
    if (allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/funds', fundsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'TradeZen Paper Trading Engine',
    timestamp: new Date().toISOString()
  });
});

// Unknown API routes -> JSON 404 instead of an HTML error page
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Last-resort error handler (bad JSON body, etc.)
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body.' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: isProd ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: isProd
  }
});

/**
 * Socket authentication.
 * Market data is public, so anonymous sockets are allowed. But a private room
 * (`user_<id>`) is only joined when the socket presents a VALID session token,
 * so nobody can listen to another user's order notifications.
 */
function readCookie(header, name) {
  if (!header) return null;
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

io.use((socket, next) => {
  try {
    const token =
      (socket.handshake.auth && socket.handshake.auth.token) ||
      readCookie(socket.handshake.headers.cookie, COOKIE_NAME);

    if (token && token !== 'undefined' && token !== 'null') {
      const userId = verifyTokenToUserId(token);
      if (userId) socket.data.userId = String(userId);
    }
  } catch (err) {
    // Invalid / expired token: continue as an anonymous (market-data only) socket
  }
  next();
});

io.on('connection', (socket) => {
  if (socket.data.userId) {
    socket.join(`user_${socket.data.userId}`);
  }

  // Push immediate initial state on connect
  socket.emit('MARKET_TICK_STREAM', getMarketInstrumentsSnapshot());
  socket.emit('SENTIMENT_STREAM', getMarketSentiment());
  socket.emit('MOVERS_STREAM', getTopMovers());
  socket.emit('SECTOR_STREAM', getSectorHeatmap());
});

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing. Add it to backend/.env and restart.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas successfully.');

    // Start autonomous price simulation engine and Socket.io broadcasts
    startSimulationLoop(io);

    server.listen(PORT, () => {
      console.log(`TradeZen Backend Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failure:', err.message);
    process.exit(1);
  });

// Never let a stray rejected promise (e.g. a failed email) crash the whole server
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// Handle graceful shutdown to avoid EADDRINUSE
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server closed gracefully.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated gracefully.');
    process.exit(0);
  });
});