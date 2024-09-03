// models/RunnerIdSequence.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const runnerIdSequenceSchema = new Schema({
  _id: {
    type: String, // Identifier for the sequence (e.g., 'runner_id')
    required: true,
  },
  sequence_value: {
    type: Number,
    default: 0,
  },
});

const RunnerIdSequence = mongoose.model('RunnerIdSequence', runnerIdSequenceSchema);
module.exports = RunnerIdSequence;
