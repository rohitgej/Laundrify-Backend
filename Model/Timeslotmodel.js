const mongoose = require('mongoose');

const TimeslotSchema = new mongoose.Schema({
    Timeslot_name: { type: String, required: true },
    Timeslot: { type: String, required: true },

});

const Timeslot = mongoose.model('Timeslot', TimeslotSchema);

module.exports = Timeslot;
