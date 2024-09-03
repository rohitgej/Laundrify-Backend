const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'UserModel', 
        required: true 
    },
    notification_date: { 
        type: Date, 
        required: true 
    },
    notification_title: { 
        type: String, 
        required: true 
    },
    notification_message: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
