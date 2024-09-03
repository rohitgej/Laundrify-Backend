const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const runnerSchema = new Schema({
  runner_id: {
    type: String,
    unique: true, // Ensure that each runner_id is unique if it exists
  },
  runner_mobile_no: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: Number
  },
  runner_name: { 
    type: String 
  },
  runner_email_id: {
    type: String
  },
});

const RunnerModel = mongoose.model('Runner', runnerSchema);
module.exports = RunnerModel;

