const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config();

const { startSimulationLoop, getMarketInstrumentsSnapshot, getMarketSentiment, getTopMovers, getSectorHeatmap } = require('./engine/simulation');
const authRoutes = require('./routes/auth');
const tradesRoutes = require('./routes/trades');
const portfolioRoutes = require('./routes/portfolio');
const marketsRoutes = require('./routes/markets');
const watchlistRoutes = require('./routes/watchlist');
const fundsRoutes = require('./routes/funds');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend Vite client with cookie session credentials support
app.use(cors({
  origin: function (origin, callback) {
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('JOIN_USER_ROOM', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Push immediate initial state on connect
  socket.emit('MARKET_TICK_STREAM', getMarketInstrumentsSnapshot());
  socket.emit('SENTIMENT_STREAM', getMarketSentiment());
  socket.emit('MOVERS_STREAM', getTopMovers());
  socket.emit('SECTOR_STREAM', getSectorHeatmap());
});

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

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
