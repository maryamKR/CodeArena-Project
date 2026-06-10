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

  return {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
    token: generateToken(user._id),
  };
};



exports.forgotPassword = async (email, frontendUrl) => {
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
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
  const message = `
  <div style="font-family: 'Space Mono', monospace; background: #272822; color: #f8f8f2; padding: 24px; border: 3px solid #75715e;">
    <h2 style="color: #a6e22e; border-bottom: 2px solid #75715e; padding-bottom: 10px;">
      [CODE] ARENA: Password Reset
    </h2>
    <p>You requested a password reset for your account.</p>
    <p>Click the button below to reset your password. This link expires in 10 minutes.</p>
    
    <a href="${resetUrl}" style="
      display: inline-block;
      background: #a6e22e; 
      color: #272822; 
      padding: 12px 32px; 
      text-decoration: none; 
      font-weight: 700; 
      text-transform: uppercase; 
      border: 3px solid #a6e22e;
      letter-spacing: 2px;
    ">
      Reset Password
    </a>
    
    <p style="margin-top: 24px; font-size: 12px; color: #75715e;">
      // If you didn't request this, you can safely ignore this email.
    </p>
  </div>
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

  return {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
    token: generateToken(user._id),
  };
};
