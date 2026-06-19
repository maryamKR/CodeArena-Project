<p align="center">
  <h1 align="center">CodeArena</h1>
  <p align="center">A real-time multiplayer quiz platform where developers compete head-to-head in coding knowledge battles.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

##  Overview

**CodeArena** is a full-stack web application where users test their programming knowledge through timed True/False quizzes. Players earn XP, climb a ranked leaderboard, and can challenge friends — or strangers — to real-time 1v1 duels with live progress tracking via WebSockets.

The platform features solo quizzes, daily challenges with streak bonuses, direct 1v1 challenges, random matchmaking, a Hall of Fame, and a full admin panel for managing questions, categories, and daily challenges.

---

##  Features

| Feature | Description |
|---|---|
| **Solo Quizzes** | Pick a category & difficulty, answer 10 timed True/False questions, earn XP |
| **Daily Challenge** | Admin-curated daily quiz with bonus XP and streak tracking |
| **1v1 Arena** | Challenge a friend directly or queue for random matchmaking |
| **Real-Time Duels** | Both players answer the same questions simultaneously with live opponent progress bars |
| **XP & Ranking System** | XP calculated from correct answers × difficulty multiplier × speed bonus → automatic rank progression |
| **Badge System** | Earn performance based achievements during quizzes |
| **Leaderboard** | Global leaderboard filterable by category and difficulty |
| **Hall of Fame** | Top 10 all-time players |
| **User Profiles** | Per-category stats, quiz history, badges, and rank display |
| **Admin Dashboard** | Manage questions, categories, daily challenges, and view global history |
| **Auth & Security** | JWT authentication, Helmet CSP headers, rate limiting, Zod validation |
| **Password Recovery** | Email-based password reset via Brevo (Sendinblue) |

---

##  Tech Stack

### Frontend
- **React 19** with Vite 8
- **React Router 7** for client-side routing
- **Tailwind CSS 4** for styling
- **Axios** for HTTP requests
- **Socket.IO Client** for real-time communication

### Backend
- **Node.js** with **Express 5**
- **Mongoose 9** (MongoDB ODM)
- **Socket.IO 4** for WebSocket-based matchmaking & live match events
- **JWT** (`jsonwebtoken`) for authentication
- **Helmet** for HTTP security headers
- **express-rate-limit** for endpoint rate limiting
- **Zod** for request validation
- **bcryptjs** for password hashing
- **Brevo SDK** (`sib-api-v3-sdk`) for transactional emails
- **Jest** for testing

### Deployment
- **Frontend** → Vercel
- **Backend** → Railway

---

##  Project Structure

```
CodeArena-Project/
├── backend/
│   ├── config/              # DB connection, Socket.IO setup
│   ├── controllers/         # Route handlers
│   ├── middlewares/         # Auth guard, error handler, admin check
│   ├── models/              # Mongoose schemas
│   │   ├── User.js          #   User profile, XP, rank, badges
│   │   ├── Question.js      #   True/False quiz questions
│   │   ├── Category.js      #   Question categories
│   │   ├── History.js       #   Quiz attempt records
│   │   ├── Challenge.js     #   1v1 challenge invitations
│   │   └── DailyChallenge.js#   Admin-set daily quiz config
│   ├── routes/              # Express route definitions
│   ├── services/            # Business logic layer
│   │   ├── matchService.js  #   Live match state machine
│   │   └── matchmakingService.js # Queue & pairing logic
│   ├── validators/          # Zod schemas
│   ├── utils/               # Helpers (email, token, etc.)
│   ├── tests/               # Jest test suites
│   ├── docs/
│   │   └── API.md           # Full API reference
│   ├── app.js               # Express app configuration
│   ├── server.js            # HTTP server + Socket.IO bootstrap
│   └── .env.example         # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── Pages/           # Route-level page components
│   │   │   ├── Home.jsx     #   Landing page
│   │   │   ├── Dashboard.jsx#   User hub
│   │   │   ├── Quiz.jsx     #   Category & difficulty picker
│   │   │   ├── QuizPlay.jsx #   Live quiz gameplay
│   │   │   ├── Results.jsx  #   Score breakdown
│   │   │   ├── Challenge.jsx#   1v1 match gameplay
│   │   │   ├── Matchmaking.jsx # Matchmaking queue UI
│   │   │   ├── Leaderboard.jsx # Global rankings
│   │   │   ├── HallOfFame.jsx  # Top 10 all-time
│   │   │   ├── Profile.jsx  #   User stats & history
│   │   │   ├── Admin.jsx    #   Admin panel
│   │   │   ├── Login.jsx    #   Login form
│   │   │   ├── Register.jsx #   Registration form
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── Components/      # Reusable UI components
│   │   ├── Context/         # React context providers (Auth, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── socket/          # Socket.IO client setup
│   │   ├── API/ & api/      # API client functions
│   │   ├── Constants/       # App-wide constants
│   │   ├── Routes/          # Route configuration
│   │   ├── utils/           # Frontend utilities
│   │   └── assets/          # Static assets
│   ├── index.html
│   └── vite.config.js
│
├── userflow.md              # Detailed user journey documentation
└── README.md
```

---

##  Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm**
- A **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- *(Optional)* A [Brevo](https://www.brevo.com/) account for password-reset emails

### 1. Clone the Repository

```bash
git clone https://github.com/maryamKR/CodeArena-Project.git
cd CodeArena-Project
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create your environment file
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/codearena
JWT_SECRET=your_strong_secret_key

FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional – Brevo email service
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_NAME=CodeArena
BREVO_SENDER_EMAIL=noreply@codearena.com
```

Start the backend:

```bash
npm run dev     # Starts with nodemon on port 5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev     # Starts Vite dev server on port 5173
```

### 4. Open the App

Navigate to **http://localhost:5173** — you're ready to play!

---

##  API Reference

The full API documentation is available at [`backend/docs/API.md`](backend/docs/API.md).

### Endpoint Overview

| Group | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/forgot-password` · `POST /api/auth/reset-password/:token` |
| **Questions** | `GET /api/questions` · `POST /api/questions` · `POST /api/questions/:id/check` · `DELETE /api/questions/:id` |
| **Categories** | `GET /api/categories` · `POST /api/categories` |
| **Scores** | `POST /api/scores` |
| **Leaderboard** | `GET /api/leaderboard` · `GET /api/leaderboard/me` |
| **Hall of Fame** | `GET /api/hall-of-fame` |
| **History** | `GET /api/history` · `GET /api/history/:username` · `GET /api/history/stats/:username` |
| **Challenges** | `POST /api/challenges` · `PUT /api/challenges/:id/accept` · `PUT /api/challenges/:id/decline` · `GET /api/challenges/pending` |
| **Daily Challenge** | `GET /api/daily-challenge` · `POST /api/daily-challenge` |
| **Matchmaking** | `POST /api/matchmaking/queue` |
| **Users** | `GET /api/users/search` · `GET /api/users/:username/category-stats` |

---

## 🎮 How It Works

### Solo Quiz Flow
1. Select a **category** and **difficulty**
2. Answer **10 True/False questions** against a countdown timer
3. The server verifies answers and calculates XP:
   - `XP = correctAnswers × baseXP × difficultyMultiplier × speedBonus`
4. View your results and updated rank

### 1v1 Arena Flow
1. **Direct Challenge** — search for a user and send a challenge invite
2. **Random Matchmaking** — join the queue and get paired automatically
3. Both players answer the **same 10 questions** simultaneously
4. Live **opponent progress bars** update via Socket.IO
5. Winner is determined by score, then by speed — XP awarded accordingly

### Ranking System

| Rank | XP Required |
|---|---|
| Beginner | 0 |
| Intermediate | 500 |
| Advanced | 2,000 |
| Expert | 5,000 |
| Master | 10,000 |

### 🏅 Badge System

Players unlock exclusive profile achievements automatically upon meeting specific gameplay or milestone thresholds verified by the score evaluation engine.

| Badge Name | Unlock Rule / Criteria |
| --- | --- |
| **First Blood** | Completed your very first quiz arena matchup. |
| **Perfect Score** | Answered all 10 questions correctly in a single quiz. |
| **Speed Demon** | Finished a quiz with 70% or more of the total time limit remaining. |
| **10 Wins** | Total accrued quiz count reaches or exceeds 10 games played. |
| **Centurion** | Reached a lifetime milestone of 100 total XP. |
| **XP Master** | Reached a legendary milestone of 1,000 total XP. |
| **Streak 3** | Maintained an active daily quiz streak for 3 consecutive days. |
| **Streak 7** | Maintained an active daily quiz streak for 7 consecutive days. |


##  Testing

```bash
cd backend
npm test        # Runs Jest test suite
```

---

##  Contributing

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a **Pull Request**

Please run `npm run lint` in the frontend before submitting.

---