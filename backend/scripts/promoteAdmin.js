require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const promoteToAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const result = await User.updateOne(
      { email: "CodeArena.pfa@gmail.com" }, 
      { $set: { role: "admin" } }
    );

    if (result.modifiedCount > 0) {
      console.log('User successfully promoted to admin!');
    } else {
      console.log('User not found or already admin.');
    }
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

promoteToAdmin();