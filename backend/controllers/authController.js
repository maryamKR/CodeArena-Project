const authService = require('../services/authService');
const { TOKEN_EXPIRY_DAYS } = require('../utils/constants');
const User = require('../models/User');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
};

exports.registerUser = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.validated.body);
    res.cookie("token", token, cookieOptions);
    res.status(201).json(user);
  } catch (err) { next(err); }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.validated.body.email, req.validated.body.password);
    res.cookie("token", token, cookieOptions);
    res.json(user);
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const now = new Date();
    const todayUTC = now.toISOString().slice(0, 10);
    const yesterday = new Date(now);
    yesterday.setUTCDate(now.getUTCDate() - 1);
    const yesterdayUTC = yesterday.toISOString().slice(0, 10);

    // Reset streak if user missed yesterday and today (so far)
    if (user.lastQuizDate !== todayUTC && user.lastQuizDate !== yesterdayUTC && user.streak > 0) {
      user.streak = 0;
      await User.findByIdAndUpdate(user._id, { streak: 0 });
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      totalXP: user.totalXP,
      quizzesPlayed: user.quizzesPlayed,
      badges: user.badges,
      rank: user.rank,
      streak: user.streak,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
    });
  } catch (err) { next(err); }
};

exports.logoutUser = (req, res) => {
  res.clearCookie("token", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
});
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    await authService.forgotPassword(req.validated.body.email, frontendUrl);
    res.status(200).json({ success: true, message: "Email sent" });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { user, token } = await authService.resetPassword(req.validated.params.resetToken, req.validated.body.password);
    res.cookie("token", token, cookieOptions);
    res.status(200).json(user);
  } catch (err) { next(err); }
};
