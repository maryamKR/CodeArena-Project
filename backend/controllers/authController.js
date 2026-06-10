const authService = require('../services/authService');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

exports.registerUser = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    res.cookie("token", token, cookieOptions);
    res.status(201).json(user);
  } catch (err) { next(err); }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body.email, req.body.password);
    res.cookie("token", token, cookieOptions);
    res.json(user);
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      totalXP: req.user.totalXP,
      badges: req.user.badges,
      rank: req.user.rank,
      isOnline: req.user.isOnline,
      createdAt: req.user.createdAt,
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
    await authService.forgotPassword(req.body.email, frontendUrl);
    res.status(200).json({ success: true, message: "Email sent" });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { user, token } = await authService.resetPassword(req.params.resetToken, req.body.password);
    res.cookie("token", token, cookieOptions);
    res.status(200).json(user);
  } catch (err) { next(err); }
};
