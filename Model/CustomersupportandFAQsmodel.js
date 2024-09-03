const mongoose = require('mongoose');

const FQAsSchema = new mongoose.Schema({
    query: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
});

const FQAs = mongoose.model('FQAs', FQAsSchema);

module.exports =FQAs;