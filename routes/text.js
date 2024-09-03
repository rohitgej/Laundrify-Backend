const express = require('express');
const router = express.Router();
const Textmodel = require('../Model/Text');

// Route to add a new text label
router.post('/addtext', async (req, res) => {
  try {
    const { key, labelData } = req.body;

    if (!key || !labelData) {
      return res.status(400).json({ message: 'Key and labelData are required' });
    }

    // Check if the text document with the given key already exists
    let text = await Textmodel.findOne({ key });
    if (text) {
      // Update existing document
      text.labelData = labelData;
      await text.save();
      res.status(200).json({ message: 'Label updated successfully', text });
    } else {
      // Create new document
      text = new Textmodel({ key, labelData });
      await text.save();
      res.status(201).json({ message: 'Label created successfully', text });
    }
  } catch (error) {
    console.error('Error creating or updating label:', error);
    res.status(500).json({ message: 'Error creating or updating label' });
  }
});

// Route to get all text labels

router.post('/gettext', async (req, res) => {
  try {
    const { key, label } = req.body;

    if (key && label) {
      // Fetch specific label data for a given key and label
      const document = await Textmodel.findOne({ key });
      if (document) {
        const labelData = document.labelData[label];
        if (labelData) {
          return res.status(200).json({ [label]: labelData });
        } else {
          return res.status(404).json({ message: `Label '${label}' not found` });
        }
      } else {
        return res.status(404).json({ message: `Key '${key}' not found` });
      }
    } else if (key) {
      // Fetch all data for a given key
      const document = await Textmodel.findOne({ key });
      if (document) {
        return res.status(200).json(document.labelData);
      } else {
        return res.status(404).json({ message: `Key '${key}' not found` });
      }
    } else {
      // Fetch all data
      const documents = await Textmodel.find();
      return res.status(200).json(documents);
    }
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ message: 'Error fetching labels' });
  }
});

// // Route to update a text label by key
router.put('/updatetext', async (req, res) => {
  try {
    const { currentKey, newKey, labelData } = req.body;

    if (!currentKey) {
      return res.status(400).json({ message: 'currentKey is required' });
    }

    // Initialize updateFields with labelData if provided
    const updateFields = {};
    if (labelData) {
      updateFields.labelData = labelData;
    }

    if (newKey) {
      // Update the key if newKey is provided
      updateFields.key = newKey;
    }

    // Find and update the document
    const updatedLabel = await Textmodel.findOneAndUpdate(
      { key: currentKey },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedLabel) {
      return res.status(404).json({ message: 'Label not found' });
    }

    res.status(200).json({ message: 'Label updated successfully', label: updatedLabel });
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({ message: 'Error updating label' });
  }
});

// // Route to delete a text label by key
router.delete('/deletetext', async (req, res) => {
  try {
    const { key, field } = req.body;

    // Ensure that the key and field are provided in the request body
    if (!key || !field) {
      return res.status(400).json({ message: 'Key and field are required' });
    }

    // Find the document with the specified key
    const label = await Textmodel.findOne({ key });

    // If no document is found, respond with a 404 status and an appropriate message
    if (!label) {
      return res.status(404).json({ message: 'Label not found' });
    }

    // Split the field path into parts to handle nested fields
    const fieldParts = field.split('.');
    let currentLevel = label.labelData;

    // Traverse through the nested objects to reach the field to be deleted
    for (let i = 0; i < fieldParts.length - 1; i++) {
      if (currentLevel[fieldParts[i]]) {
        currentLevel = currentLevel[fieldParts[i]];
      } else {
        return res.status(404).json({ message: 'Field path not found' });
      }
    }

    // Delete the field
    const lastField = fieldParts[fieldParts.length - 1];
    if (currentLevel.hasOwnProperty(lastField)) {
      delete currentLevel[lastField];
    } else {
      return res.status(404).json({ message: 'Field not found in labelData' });
    }

    // Mark the document as modified to ensure Mongoose updates it
    label.markModified('labelData');

    // Save the updated document
    await label.save();

    // Respond with a 200 status and a success message
    res.status(200).json({ message: 'Field deleted successfully', label });
  } catch (error) {
    // Log any errors that occur during the deletion process
    console.error('Error deleting field:', error);

    // Respond with a 500 status and an error message
    res.status(500).json({ message: 'Error deleting field' });
  }
});

module.exports = router;
