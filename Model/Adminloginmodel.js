const mongoose = require('mongoose');

const AdminloginSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true
  },
  role:{
    type: String,
    required: true,
    enum: ['Admin', 'Operational Manager'], 
    message: '{VALUE} is not a valid role' 
  },
  email_id: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  }
}, { timestamps: true });

const AdminModel = mongoose.model('AdminModel', AdminloginSchema);

module.exports = AdminModel;
