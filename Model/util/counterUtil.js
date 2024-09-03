// // counters.js
// const mongoose = require('mongoose');

// const counterSchema = new mongoose.Schema({
//     _id: { type: String, required: true },
//     sequence_value: { type: Number, default: 0 }
// });

// const Counter = mongoose.model('Counter', counterSchema);

// async function getNextSequenceValue(sequenceName) {
//     const sequenceDocument = await Counter.findByIdAndUpdate(
//         sequenceName,
//         { $inc: { sequence_value: 1 } },
//         { new: true, upsert: true }
//     );
//     return sequenceDocument.sequence_value;
// }

// module.exports = { getNextSequenceValue };

// counterUtil.js
const mongoose = require('mongoose');

// Define a schema for sequence counters
const CounterSchema = new mongoose.Schema({
    _id: String,
    sequence_value: Number
});

const Counter = mongoose.model('Counter', CounterSchema);

// Function to get the next sequence value
async function getNextSequenceValue(sequenceName) {
    const sequence = await Counter.findByIdAndUpdate(
        sequenceName,
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true } // Create the document if it doesn't exist
    );
    return sequence.sequence_value;
}

module.exports = { getNextSequenceValue };
