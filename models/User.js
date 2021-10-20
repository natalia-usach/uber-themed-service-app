const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    sparse: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  created_date: {
    type: Date,
    default: new Date().toISOString()
  }
}, {versionKey: false});

const User = mongoose.model('User', userSchema);

module.exports = User;
