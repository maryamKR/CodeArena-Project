const User = require("../models/User");
const { generateToken } = require("../utils/tokenHelper");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

exports.register = async (userData) => {
  const { username, email, password } = userData;

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists)
    throw new Error("User with this email or username already exists");

  const user = await User.create({ username, email, password });

  const userObj = user.toObject();
  delete userObj.password;

  return {
  user: {
    _id: user._id,
    username: user.username,
    email: user.email,
  },
  token: generateToken(user._id),
};

};

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    throw new Error("Invalid email or password");
  }

  // Remove password from output
  const userObj = user.toObject();
  delete userObj.password;

  return {
  user: {
    _id: user._id,
    username: user.username,
    email: user.email,
  },
  token: generateToken(user._id),
};
};

exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");
  return user.toObject();
};

exports.forgotPassword = async (email, protocol, host) => {
  const user = await User.findOne({ email });

  const genericMessage =
    "If an account exists with that email, a reset link has been sent";

  if (!user) {
    return { success: true, data: genericMessage };
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${protocol}://${host}/reset-password/${resetToken}`;
  const message = `
  <h2>Password Reset Request</h2>
  <p>You requested a password reset for your CodeArena account.</p>
  <p>Click the button below to reset your password. This link expires in 10 minutes.</p>
  <a href="${resetUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
  <p>If you didn't request this, ignore this email.</p>
`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    return { success: true, data: genericMessage };
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error("Email could not be sent");
  }
};

exports.resetPassword = async (resetToken, password) => {
  // Hash token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Invalid token");
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Remove password from output
  const userObj = user.toObject();
  delete userObj.password;

  return {
  user: {
    _id: user._id,
    username: user.username,
    email: user.email,
  },
  token: generateToken(user._id),
};
};
