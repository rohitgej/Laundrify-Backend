
const mongoose = require('mongoose');

const SupportSchema = new mongoose.Schema({
    support_id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    email_id: { 
        type: String, 
        ref: 'UserModel', 
        required: true 
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderModel', 
        required: false
    },
    subject: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    status: {
        type: String,
        enum: ['pending', 'in progress', 'resolved'],
        default: 'pending'
    },
    status_history: [{
        status: String,
        date: Date
    }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Support = mongoose.model('Support', SupportSchema);
module.exports = Support;
