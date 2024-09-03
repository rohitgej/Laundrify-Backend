const express=require('express')
const FAQsmodel=require('../Model/CustomersupportandFAQsmodel')
const router= express.Router()

// 1. Get All FAQs 
router.post('/getFAQs', async (req, res) => {
    try {
        // Check if an _id is provided in the request body
        const { _id } = req.body;
        if (_id) {
            // Fetch FAQ by ID
            const faq = await FAQsmodel.findById(_id);
            
            if (!faq) {
                return res.status(404).json({ message: 'FAQ not found' });
            }
            
            return res.json(faq);
        } else {
            // If no _id is provided, fetch all FAQs
            const faqs = await FAQsmodel.find();
            res.json(faqs);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Create a New FAQ
router.post('/createFAQs', async (req, res) => {
    const faq = new FAQsmodel({
        query: req.body.query,  // Change to 'query'
        answer: req.body.answer,
    });

    try {
        const newFaq = await faq.save();
        res.status(201).json(newFaq);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. Update an FAQ
router.put('/updateFAQs', async (req, res) => {
    try {
        // Extract _id and fields to update from request body
        const { _id, query, answer } = req.body;

        // Ensure _id is provided
        if (!_id) {
            return res.status(400).json({ message: 'FAQ ID is required' });
        }
        // Create an object with fields to update
        const updateFields = {};
        if (query !== undefined) updateFields.query = query;
        if (answer !== undefined) updateFields.answer = answer;

        // Update the FAQ
        const updatedFaq = await FAQsmodel.findByIdAndUpdate(
            _id,
            updateFields,
            { new: true }  // Return the updated document
        );

        // Handle case where FAQ is not found
        if (!updatedFaq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }

        res.json(updatedFaq);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 4. Delete an FAQ
router.delete('/deleteFAQs', async (req, res) => {
    try {
        // Extract _id from request body
        const { _id } = req.body;

        // Ensure _id is provided
        if (!_id) {
            return res.status(400).json({ message: 'FAQ ID is required' });
        }

        // Find and delete the FAQ
        const deletedFaq = await FAQsmodel.findByIdAndDelete(_id);

        // Handle case where FAQ is not found
        if (!deletedFaq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }

        res.json({ message: 'FAQ deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;