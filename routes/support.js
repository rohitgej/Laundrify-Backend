const express = require('express');
const SupportModel = require('../Model/Supportmodel');
const OrderModel = require('../Model/Ordermodel');
const UserModel = require('../Model/Usermodel');
const { getNextSequenceValue } = require('../Model/util/counterUtil'); // Ensure this path is correct

const router = express.Router();

router.post('/post-support', async (req, res) => {
    try {
        const { email_id, order_id, subject, message } = req.body;

        if (!email_id || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists with provided email_id
        const user = await UserModel.findOne({ email_id });
        if (!user) {
            return res.status(404).json({ error: 'User not found or email does not match' });
        }

        // Generate a new support ID
        const nextId = await getNextSequenceValue('support_id');
        const supportId = `SPRT${nextId.toString().padStart(3, '0')}`; // Correct template literal syntax

        // Create and save the new support request
        const newSupportRequest = new SupportModel({
            support_id: supportId,
            email_id,
            order_id,
            subject,
            message
        });

        await newSupportRequest.save();

        res.status(201).json({
            message: 'Support request created successfully',
            supportId: newSupportRequest.support_id,
            created_at: newSupportRequest.created_at,
            updated_at: newSupportRequest.updated_at
        });
    } catch (error) {
        console.error('Error creating support request:', error);
        res.status(500).json({ error: 'Failed to create support request' });
    }
});

// Admin Updating the support status or response to user  '/update-supportstatus'
router.put('/update-supportstatus', async (req, res) => {
    try {
        const { support_id, status } = req.body;

        // Validate that the id and status are provided
        if (!support_id || !status) {
            return res.status(400).json({ error: 'Support request ID and status are required' });
        }
        // Validate the status value
        if (!['pending', 'in progress', 'resolved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Find and update the support request using support_id
        const supportRequest = await SupportModel.findOneAndUpdate(
            { support_id: support_id }, // Use support_id for querying
            { 
                status, 
                $push: { status_history: { status, date: new Date() } }, 
                updated_at: new Date() 
            },
            { new: true }
        );

        // Check if the support request was found
        if (!supportRequest) {
            return res.status(404).json({ error: 'Support request not found' });
        }

        // Respond with the updated support request
        res.json({
            message: 'Support request status updated successfully',
            supportRequest
        });
    } catch (error) {
        console.error('Error updating support request status:', error);
        res.status(500).json({ error: 'Failed to update support request status' });
    }
});

// // All Support request from admin -->'/viewsupports
// router.get('/viewsupports', async (req, res) => {
//     try {
//         const { support_id } = req.body;

//         // If support_id is provided, fetch the specific support request
//         if (support_id) {
//             const supportRequest = await SupportModel.findOne({ support_id });

//             if (!supportRequest) {
//                 return res.status(404).json({ error: 'Support request not found' });
//             }

//             return res.json(supportRequest);
//         }

//         // If no support_id is provided, fetch all support requests
//         const supportRequests = await SupportModel.find();

//         res.json(supportRequests);
//     } catch (error) {
//         console.error('Error fetching support requests:', error);
//         res.status(500).json({ error: 'Failed to fetch support requests' });
//     }
// });


router.get('/viewsupports', async (req, res) => {
    try {
        const { support_id } = req.query; // Use req.query for GET parameters

        // If support_id is provided, fetch the specific support request
        if (support_id) {
            const supportRequest = await SupportModel.findOne({ support_id });

            if (!supportRequest) {
                return res.status(404).json({ error: 'Support request not found' });
            }

            return res.json(supportRequest);
        }

        // If no support_id is provided, fetch all support requests
        const supportRequests = await SupportModel.find();

        res.json(supportRequests);
    } catch (error) {
        console.error('Error fetching support requests:', error);
        res.status(500).json({ error: 'Failed to fetch support requests' });
    }
});

module.exports = router;