const express = require('express');
const jwt = require('jsonwebtoken');
const Notificationmodel = require('../Model/Notificationmodel');
const UserModel = require('../Model/Usermodel');
const mongoose = require('mongoose');
const router = express.Router();

// < ------------------  token verification  ------------ >
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
  
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }
  
    const token = authHeader.split(' ')[1];
  
    jwt.verify(token, 'secret', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Failed to authenticate token' });
      }
      req.user = decoded; // Store the decoded token in the request object
      next(); // Proceed to the next middleware/route handler
    });
  }
// Sending notification by Admin -->'/sendNotification'
router.post('/sendNotification', verifyToken , async (req, res) => {
    const { user_id, notification_title, notification_message } = req.body;

    if (!user_id || !notification_title || !notification_message) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }
    try {
        // Check if the user exists
        const user = await UserModel.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create the notification
        const notification = new Notificationmodel({
            user_id,
            notification_date: new Date().toISOString(),  // Store the current date and time
            notification_title,
            notification_message,
        });

        await notification.save();

        res.status(201).json({
            message: 'Notification sent successfully',
            notification,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error sending notification', error: error.message });
    }
});

// Deleting Notification By admin --> '/deleteNotification'
router.delete('/deleteNotification', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Notification ID is required' });
    }

    try {
        // Find and delete the notification by ID
        const result = await Notificationmodel.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }


});


router.post('/getnotifications', async (req, res) => {
    try {
        const { user_id } = req.body;

        // Validate the userId if necessary (e.g., check if it's a valid ObjectId)
        if (!mongoose.Types.ObjectId.isValid(user_id )) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Find notifications for the given user
        const notifications = await Notificationmodel.find({ user_id: user_id  });

        // Check if any notifications were found
        if (!notifications.length) {
            return res.status(404).json({ 
                message: 'No notifications found',
                data: [] 
            });
        }

        // Return the notifications with a custom message
        res.status(200).json({ 
            message: 'Notifications retrieved successfully', 
            data: notifications 
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});
module.exports = router;