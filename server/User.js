// User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  gameId: String,
  status: { type: String, default: 'active' },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
