const mongoose = require('mongoose');

// Define the Address schema
const addressSchema = new mongoose.Schema({
  house_no: { type: String, required: true },
  block_no: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    latitudeDelta: { type: Number, required: true },
    longitudeDelta: { type: Number, required: true }
  }
});
// Define the User schema
const userSchema = new mongoose.Schema({
  mobile_no: { type: String, required: true, unique: true },
  otp: { type: String },
  email_id: { type: String },
  name: { type: String },
  addresses: {
    type: [addressSchema], // An array of address objects
    validate: [arrayLimit, '{PATH} exceeds the limit of 5'] // Limit the number of addresses
  },
  city: { type: String },
  state: { type: String },
  postcode: { type: String },
  profileImage: { type: String }
});

// Custom validator for address array length
function arrayLimit(val) {
  return val.length <= 5; // Limit to 5 addresses
}

const User = mongoose.model('User', userSchema);
module.exports = User;
