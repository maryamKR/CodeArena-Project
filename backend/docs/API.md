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

## Security Notes

- Passwords are hashed with bcrypt (salt rounds: 10)
- JWT tokens expire after 30 days
- Cookies are `httpOnly`, `secure` in production, and `sameSite=none` in production / `strict` in development
- Reset tokens are SHA-256 hashed before storage — only the raw token is sent to the user
- All inputs are validated and sanitized via Zod before reaching controllers