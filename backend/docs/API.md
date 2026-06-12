# CodeArena API Documentation

## Authentication

All protected routes require a valid JWT token stored in an `httpOnly` cookie, set automatically on login, register, or password reset.

Base URL: `http://localhost:5000/api`

---

## Auth Endpoints

### Register
`POST /auth/register`

Creates a new user account.

**Rate limit:** 5 requests per hour per IP

**Request body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456"
}
```

**Validation:**
- `username` — 3 to 30 characters
- `email` — valid email format
- `password` — minimum 6 characters

**Response `201`:**
```json
{
  "_id": "...",
  "username": "testuser",
  "email": "test@example.com"
}
```

**Error responses:**
- `400` — username or email already exists
- `429` — rate limit exceeded

---

### Login
`POST /auth/login`

Authenticates a user and sets the JWT cookie.

**Rate limit:** 10 requests per 15 minutes per IP

**Request body:**
```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

**Response `200`:**
```json
{
  "_id": "...",
  "username": "testuser",
  "email": "test@example.com"
}
```

**Error responses:**
- `401` — invalid email or password
- `429` — rate limit exceeded

---

### Logout
`POST /auth/logout`

Clears the JWT cookie.

**Request body:** none

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User
`GET /auth/me`

Returns the authenticated user's profile. Used for session checks and profile pages.

**Auth required:** yes

**Request body:** none

**Response `200`:**
```json
{
  "_id": "...",
  "username": "testuser",
  "email": "test@example.com",
  "totalXP": 0,
  "quizzesPlayed": 0,
  "badges": [],
  "rank": "Beginner",
  "isOnline": false,
  "createdAt": "2026-06-10T12:00:00.000Z"
}
```

**Error responses:**
- `401` — not authenticated or token invalid

---

### Forgot Password
`POST /auth/forgot-password`

Sends a password reset email if the account exists. Always returns the same response regardless of whether the email is registered (prevents user enumeration).

**Rate limit:** 3 requests per hour per IP

**Request body:**
```json
{
  "email": "test@example.com"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "If an account exists with that email, a reset link has been sent"
}
```

**Error responses:**
- `429` — rate limit exceeded
- `500` — email could not be sent

---

### Reset Password
`POST /auth/reset-password/:resetToken`

Resets the user's password using the token from the reset email. Token expires in 10 minutes.

**Rate limit:** 5 requests per hour per IP

**URL params:**
- `resetToken` — token received in the reset email

**Request body:**
```json
{
  "password": "newpassword123"
}
```

**Response `200`:**
```json
{
  "_id": "...",
  "username": "testuser",
  "email": "test@example.com"
}
```

**Error responses:**
- `400` — invalid or expired token
- `429` — rate limit exceeded

---

## Question Endpoints

### Get Quiz Questions
`GET /questions`

Fetches a random sample of up to 10 questions for a quiz.

**Query params (optional):**
- `category` — slug of the category to filter by
- `difficulty` — `Easy`, `Medium`, or `Hard`
- `exclude` — comma-separated list of question ObjectIds to exclude (prevents duplicates)

**Response `200`:**
```json
[
  {
    "_id": "...",
    "text": "What does HTML stand for?",
    "correct_answer": true,
    "category": { "_id": "...", "name": "Frontend", "slug": "frontend", "color": "#ff0000" },
    "difficulty": "Easy"
  }
]
```

---

### Add Question
`POST /questions`

Adds a new question to the database.

**Auth required:** yes (Admin only)

**Request body:**
```json
{
  "text": "Is JavaScript a strongly typed language?",
  "correct_answer": false,
  "category": "60d5ecb8b392d700153c3c12",
  "difficulty": "Medium"
}
```

**Response `201`:**
```json
{
  "_id": "...",
  "text": "Is JavaScript a strongly typed language?",
  "correct_answer": false,
  "category": "60d5ecb8b392d700153c3c12",
  "difficulty": "Medium"
}
```

---

### Delete Question
`DELETE /questions/:id`

Deletes a question by its ID.

**Auth required:** yes (Admin only)

**Response `200`:**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

---

## Category Endpoints

### Get Categories
`GET /categories`

Fetches all available categories.

**Response `200`:**
```json
[
  {
    "_id": "...",
    "name": "Frontend",
    "slug": "frontend",
    "color": "#e34c26"
  }
]
```

---

### Add Category
`POST /categories`

Creates a new category. Fails if the slug is already in use.

**Auth required:** yes (Admin only)

**Request body:**
```json
{
  "name": "Frontend",
  "slug": "frontend",
  "color": "#e34c26"
}
```

**Response `201`:**
```json
{
  "_id": "...",
  "name": "Frontend",
  "slug": "frontend",
  "color": "#e34c26"
}
```

---

## Score Endpoints

### Submit Quiz Score
`POST /scores`

Submits quiz results, calculates XP based on performance, and updates the user's total XP and rank.

**Auth required:** yes

**Request body:**
```json
{
  "correctAnswers": 8,
  "difficulty": "Medium",
  "timeLeft": 45,
  "timeLimit": 120
}
```

**Parameters:**
- `correctAnswers` (required, number): Number of correct answers.
- `difficulty` (optional, string): Quiz difficulty (`Easy`, `Medium`, `Hard`). Defaults to `Easy` multiplier.
- `timeLeft` (optional, number): Seconds remaining when quiz was finished.
- `timeLimit` (optional, number): Total time limit for the quiz in seconds.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "earnedXP": 110,
    "totalXP": 610,
    "quizzesPlayed": 5,
    "rank": "Intermediate",
    "breakdown": {
      "correctAnswers": 8,
      "baseXPPerAnswer": 10,
      "difficultyMultiplier": 2,
      "speedBonus": 1.38
    }
  },
  "message": "Score submitted and XP updated successfully"
}
```

**Error responses:**
- `400` — Invalid or missing `correctAnswers`
- `401` — Not authenticated
- `404` — `isDailyChallenge: true` but no challenge set for today
- `409` — `isDailyChallenge: true` but user already completed today's challenge

**Daily challenge score submission (extended body):**
```json
{
  "correctAnswers": 8,
  "difficulty": "Medium",
  "timeLeft": 45,
  "timeLimit": 120,
  "isDailyChallenge": true
}
```

**Response `200` (with daily challenge bonus):**
```json
{
  "success": true,
  "data": {
    "earnedXP": 160,
    "bonusXP": 50,
    "totalXP": 760,
    "quizzesPlayed": 6,
    "rank": "Intermediate",
    "breakdown": {
      "correctAnswers": 8,
      "baseXPPerAnswer": 10,
      "difficultyMultiplier": 2,
      "speedBonus": 1.38
    }
  },
  "message": "Score submitted and XP updated successfully"
}

---

## Leaderboard Endpoints

### Get Leaderboard
`GET /leaderboard`

Fetches the top users sorted by XP descending.

**Query params (optional):**
- `category` — slug or ObjectId of the category to filter by (sorts by category-specific XP).
- `difficulty` — `Easy`, `Medium`, or `Hard` — ranks users by total XP earned exclusively in quizzes of that difficulty (derived from history).
- `limit` — Maximum number of users to return (default: 10).

**Response `200` (no difficulty filter):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "username": "mastercoder",
      "totalXP": 15000,
      "categoryXP": {
        "60d5ecb8b392d700153c3c12": 5000
      },
      "rank": "Master",
      "badges": ["First Blood"],
      "isOnline": true
    }
  ]
}
```

**Response `200` (with `?difficulty=Hard`):**
```json
{
  "success": true,
  "filters": { "difficulty": "Hard", "category": null },
  "data": [
    {
      "_id": "...",
      "username": "mastercoder",
      "totalEarnedXP": 9000,
      "quizzesPlayed": 15,
      "rank": "Master",
      "badges": ["First Blood"],
      "isOnline": true
    }
  ]
}
```

---

### Get Hall of Fame
`GET /hall-of-fame`

Fetches the top 10 all-time users globally sorted by total XP descending. Returns a condensed profile containing only username, totalXP, badges, and rank.

**Query params (optional):**
- `limit` — Maximum number of users to return (capped at a maximum of 10).

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "username": "mastercoder",
      "totalXP": 15000,
      "rank": "Master",
      "badges": ["First Blood"]
    }
  ]
}
```

---

## History Endpoints

### Get User History
`GET /history/:username`

Fetches a specific user's quiz attempt history.
**Privacy constraint:** A user can only access their own history. Admins can view any user's history.

**Auth required:** yes

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "user": "...",
      "category": {
        "_id": "...",
        "name": "Frontend",
        "slug": "frontend",
        "color": "#e34c26"
      },
      "correctAnswers": 8,
      "difficulty": "Medium",
      "earnedXP": 110,
      "timeLeft": 45,
      "timeLimit": 120,
      "createdAt": "2023-10-10T14:48:00.000Z"
    }
  ]
}
```

**Error responses:**
- `403` — Forbidden: You can only view your own history

---

### Get Global History
`GET /history`

Fetches a global feed of all quiz attempts.

**Auth required:** yes (Admin only)

**Query params (optional):**
- `limit` — Maximum number of records to return (default: 50).

**Response `200`:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "_id": "...",
      "user": {
        "_id": "...",
        "username": "testuser",
        "rank": "Intermediate",
        "badges": []
      },
      "category": {
        "_id": "...",
        "name": "Frontend",
        "slug": "frontend",
        "color": "#e34c26"
      },
      "correctAnswers": 8,
      "difficulty": "Medium",
      "earnedXP": 110,
      "createdAt": "2023-10-10T14:48:00.000Z"
    }
  ]
}
```

---

## Challenge Endpoints

### Send a Challenge
`POST /challenges`

Sends a challenge to another user by username.

**Auth required:** yes

**Rate limit:** 10 requests per 15 minutes per IP

**Request body:**
```json
{
  "receiverUsername": "opponent",
  "category": "60d5ecb8b392d700153c3c12",
  "difficulty": "Hard",
  "message": "Think you can beat me?"
}
```

**Parameters:**
- `receiverUsername` (required, string) — username of the player to challenge (min 3 chars)
- `category` (optional, ObjectId) — category to restrict the quiz to
- `difficulty` (optional, string) — `Easy`, `Medium`, or `Hard` (default: `Easy`)
- `message` (optional, string) — personal note, max 200 characters

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "e2f1f3a2-4a5c-4e89-8d6b-7d1c3a8e9b4d",
    "sender": { "_id": "...", "username": "alice", "rank": "Master", "badges": [] },
    "receiver": { "_id": "...", "username": "opponent", "rank": "Intermediate", "badges": [] },
    "category": { "_id": "...", "name": "Frontend", "slug": "frontend", "color": "#e34c26" },
    "difficulty": "Hard",
    "message": "Think you can beat me?",
    "status": "pending",
    "expiresAt": "2026-06-14T10:00:00.000Z",
    "createdAt": "2026-06-12T10:00:00.000Z"
  },
  "message": "Challenge sent to opponent"
}
```

**Error responses:**
- `400` — cannot challenge yourself
- `404` — receiver username not found
- `409` — a pending challenge already exists with this user
- `429` — rate limit exceeded

---

### Accept a Challenge
`PUT /challenges/:id/accept`

Accepts a pending challenge. Only the challenge receiver can call this.

**Auth required:** yes

**URL params:**
- `id` — UUID of the challenge

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "e2f1f3a2-4a5c-4e89-8d6b-7d1c3a8e9b4d",
    "sender": { "_id": "...", "username": "alice", "rank": "Master", "badges": [] },
    "receiver": { "_id": "...", "username": "opponent", "rank": "Intermediate", "badges": [] },
    "category": { "_id": "...", "name": "Frontend", "slug": "frontend", "color": "#e34c26" },
    "difficulty": "Hard",
    "status": "accepted",
    "expiresAt": "2026-06-14T10:00:00.000Z"
  },
  "message": "Challenge accepted"
}
```

**Error responses:**
- `400` — challenge is not in `pending` state
- `403` — authenticated user is not the receiver
- `404` — challenge not found

---

### Decline a Challenge
`PUT /challenges/:id/decline`

Declines a pending challenge. Only the challenge receiver can call this.

**Auth required:** yes

**URL params:**
- `id` — UUID of the challenge

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "e2f1f3a2-4a5c-4e89-8d6b-7d1c3a8e9b4d",
    "sender": { "_id": "...", "username": "alice", "rank": "Master", "badges": [] },
    "receiver": { "_id": "...", "username": "opponent", "rank": "Intermediate", "badges": [] },
    "category": { "_id": "...", "name": "Frontend", "slug": "frontend", "color": "#e34c26" },
    "difficulty": "Hard",
    "status": "declined",
    "expiresAt": "2026-06-14T10:00:00.000Z"
  },
  "message": "Challenge declined"
}
```

**Error responses:**
- `400` — challenge is not in `pending` state
- `403` — authenticated user is not the receiver
- `404` — challenge not found

---

### Get Pending Challenges
`GET /challenges/pending`

Returns all pending (non-expired) challenges sent to the authenticated user, newest first.

**Auth required:** yes

**Response `200`:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "e2f1f3a2-4a5c-4e89-8d6b-7d1c3a8e9b4d",
      "sender": { "_id": "...", "username": "alice", "rank": "Master", "badges": [], "isOnline": true },
      "category": { "_id": "...", "name": "Frontend", "slug": "frontend", "color": "#e34c26" },
      "difficulty": "Hard",
      "message": "Think you can beat me?",
      "status": "pending",
      "expiresAt": "2026-06-14T10:00:00.000Z",
      "createdAt": "2026-06-12T10:00:00.000Z"
    }
  ]
}
```

---

## Daily Challenge Endpoints

### Get Today's Challenge
`GET /api/daily-challenge`

Returns the daily challenge set by an admin for the current UTC day.
The frontend uses the returned `category.slug` and `difficulty` to call `GET /api/questions` and load 10 matching questions.

**Auth required:** yes — only logged-in users can view and play the daily challenge

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "category": { "_id": "...", "name": "JavaScript", "slug": "js", "color": "#f7df1e" },
    "difficulty": "Medium",
    "bonusXP": 50,
    "activeDate": "2026-06-12",
    "resetsIn": 22364
  }
}
```

**`resetsIn`** — seconds until the challenge resets at UTC midnight.

**Error responses:**
- `404` — no daily challenge has been set for today

---

### Set Today's Challenge
`POST /api/daily-challenge`

Admin-only. Creates or replaces the daily challenge for a given date (defaults to today UTC).
Can be called again to update the challenge for the same day (upsert).

**Auth required:** yes (Admin only)

**Request body:**
```json
{
  "categoryId": "60d5ecb8b392d700153c3c12",
  "difficulty": "Medium",
  "bonusXP": 50,
  "activeDate": "2026-06-12"
}
```

**Parameters:**
- `categoryId` (required, ObjectId) — ID of the category for the quiz
- `difficulty` (required, string) — `Easy`, `Medium`, or `Hard`
- `bonusXP` (required, number) — flat bonus XP awarded on completion (0–10 000)
- `activeDate` (optional, string) — target date in `YYYY-MM-DD` format; defaults to today UTC

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "category": { "_id": "...", "name": "JavaScript", "slug": "js", "color": "#f7df1e" },
    "difficulty": "Medium",
    "bonusXP": 50,
    "activeDate": "2026-06-12",
    "createdBy": "..."
  },
  "message": "Daily challenge set successfully"
}
```

**Error responses:**
- `403` — not an admin
- `404` — categoryId does not match any category

---

## Security Notes

- Passwords are hashed with bcrypt (salt rounds: 10)
- JWT tokens expire after 30 days
- Cookies are `httpOnly`, `secure` in production, and `sameSite=none` in production / `strict` in development
- Reset tokens are SHA-256 hashed before storage — only the raw token is sent to the user
- All inputs are validated and sanitized via Zod before reaching controllers