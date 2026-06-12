const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword, logoutUser, getMe } = require('../controllers/authController');

const validate = require('../middlewares/validate');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidator');
const { passwordResetLimiter, passwordUpdateLimiter, loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerLimiter, validate(registerSchema), registerUser);
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:resetToken', passwordUpdateLimiter, validate(resetPasswordSchema), resetPassword);
module.exports = router;