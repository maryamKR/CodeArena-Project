const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const matchService = require('../services/matchService');
const matchmakingService = require('../services/matchmakingService');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          process.env.CLIENT_URL,
        ];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const cookies = socket.request.headers.cookie;
      if (!cookies) {
        return next(new Error('Authentication error: No cookies provided'));
      }

      const parsedCookies = cookie.parse(cookies);
      const token = parsedCookies.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // 1. Mark user as online (Fire and forget, do not await here to prevent race conditions on listener registration)
    User.findByIdAndUpdate(socket.user._id, { isOnline: true }).catch((err) => {
      console.error('Error updating online status:', err);
    });

    // 2. Listen for matchmaking events
    socket.on('join_match', async ({ challengeId }) => {
      await matchService.joinMatch(challengeId, socket.user._id, socket, io);
    });

    socket.on('submit_answer', async ({ challengeId, questionId, answer, timeTakenSec }) => {
      await matchService.submitAnswer(challengeId, socket.user._id, questionId, answer, timeTakenSec, io);
    });

    // 3. Handle disconnect
    socket.on('disconnect', async () => {
      try {
        await User.findByIdAndUpdate(socket.user._id, { isOnline: false });
        // Remove from matchmaking queue if they were waiting
        matchmakingService.removeBySocketId(socket.id);
        matchService.handleDisconnect(socket, io);
      } catch (err) {
        console.error('Error updating offline status:', err);
      }
    });
  });

  return io;
};

module.exports = initSocket;
