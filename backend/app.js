const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const questionRoutes = require("./routes/questionRoutes");
const categoryRoutes = require('./routes/categoryRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const hallOfFameRoutes = require('./routes/hallOfFameRoutes');
const historyRoutes = require('./routes/historyRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const dailyChallengeRoutes = require('./routes/dailyChallengeRoutes');
const matchmakingRoutes = require('./routes/matchmakingRoutes');
const userRoutes = require('./routes/userRoutes');

const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Trust the first proxy (e.g. Railway, Heroku, Nginx)
// Required for accurate IP-based rate limiting and secure cookie headers
app.set('trust proxy', 1);

// Parse allowed origins from env (comma-separated) with dev defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"];


// Secure backend HTTP headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Allow connections to self and any allowed origins
        "connect-src": ["'self'", ...allowedOrigins],
      },
    },
  }),
);

// Strict CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    maxAge: 86400, 
  }),
);

app.use(express.json());
app.use(cookieParser());

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/hall-of-fame", hallOfFameRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/daily-challenge", dailyChallengeRoutes);
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/users", userRoutes);

// Test Route
app.get("/api/test", (req, res) => {
  res.json({ message: "codeArena Backend API is running smoothly!" });
});

// Error Handler Middleware (Should be last)
app.use(errorHandler);

module.exports = app;
