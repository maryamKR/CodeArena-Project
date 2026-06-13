const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { USER_ROLES, USER_RANKS } = require("../utils/constants");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add a username"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, 
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user'
    },
    isOnline: {
      type: Boolean,
      default: false,
    },

    totalXP: {
      type: Number,
      default: 0,
    },
    quizzesPlayed: {
      type: Number,
      default: 0,
    },
    categoryXP: {
      type: Map,
      of: Number,
      default: {},
    },
    badges: {
      type: [String],
      default: [],
    },
    rank: {
      type: String,
      enum: USER_RANKS,
      default: "Beginner",
    },
    streak: {
      type: Number,
      default: 0,
    },
    // Stores the UTC date (YYYY-MM-DD) when the user last completed any quiz.
    lastQuizDate: {
      type: String,
      default: null,
    },
    // Stores the UTC date (YYYY-MM-DD) when the user last completed the daily challenge.
    // Compared against today's date to prevent re-submission on the same day.
    lastDailyChallengeDate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Encrypt password using bcrypt before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
