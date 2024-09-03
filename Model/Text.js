const mongoose = require('mongoose');

// Define the schema for label data
const textSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  labelData: {
    type: mongoose.Schema.Types.Mixed, // Allows any data structure
    required: true,
  }
}, { timestamps: true });

const Text = mongoose.model('Text', textSchema);

module.exports = Text;
