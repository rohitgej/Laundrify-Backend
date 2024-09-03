const express = require('express');
const jwt = require('jsonwebtoken');
const Timeslotmodel = require('../Model/Timeslotmodel');

const router = express.Router();

// <------------------token verification------------>
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


// Adding time-slot  --> /addTimeslot
router.post('/addTimeslot', verifyToken, async (req, res) => {
  const { Timeslot_name, Timeslot } = req.body;

  if (!Timeslot_name || !Timeslot) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Check if a time slot with the same name or time range already exists
    const existingTimeslot = await Timeslotmodel.findOne({ Timeslot_name, Timeslot });

    if (existingTimeslot) {
      return res.status(400).json({ message: 'Timeslot already exists' });
    }

    // Create a new time slot if it does not exist
    const newTimeslot = new Timeslotmodel({ Timeslot_name, Timeslot });
    await newTimeslot.save();

    res.status(201).json({
      message: 'Timeslot added successfully',
      _id: newTimeslot._id,
      Timeslot_name: newTimeslot.Timeslot_name,
      Timeslot: newTimeslot.Timeslot
    });
  } catch (error) {
    console.error('Error adding Timeslot:', error.message);
    res.status(500).json({ message: 'Error adding Timeslot', error: error.message });
  }
});
// update timeslot --> /updateTimeslot
router.put('/updateTimeslot', verifyToken, async (req, res) => {
    const { _id } = req.body;
    const updates = {};

    // Check if _id is provided
    if (!_id) {
        return res.status(400).json({ message: 'Please provide the _id of the time slot to update' });
    }

    // Collect update fields from request body
    const { Timeslot_name, Timeslot } = req.body;
    if (Timeslot_name) updates.Timeslot_name = Timeslot_name;
    if (Timeslot) updates.Timeslot = Timeslot;

    // Check if there are any fields to update
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'Please provide at least one field to update' });
    }

    try {
        // Update the time slot by _id
        const updatedTimeslot = await Timeslotmodel.findByIdAndUpdate(
            _id,
            updates,
            { new: true, runValidators: true } // Return the updated document and validate the input
        );

        if (!updatedTimeslot) {
            return res.status(404).json({ message: 'Time slot not found' });
        }

        // Return the updated time slot details
        res.status(200).json({
            message: 'Time slot updated successfully',
            updatedTimeslot
        });
    } catch (error) {
        console.error('Error updating time slot:', error);
        res.status(500).json({ message: 'Error updating time slot', error: error.message });
    }
});

// get all timeslot or a perticular timeslot -->/getTimeslot

router.get('/getTimeslot', async (req, res) => {
    try {
        // Check if _id query parameter is provided
        const { _id } = req.query;

        if (_id) {
            // Fetch the specific time slot by _id
            const timeslot = await Timeslotmodel.findById(_id);
            if (!timeslot) {
                return res.status(404).json({ message: 'Time slot not found' });
            }
            return res.status(200).json(timeslot);
        } else {
            // Fetch all time slots
            const timeslots = await Timeslotmodel.find();
            return res.status(200).json(timeslots);
        }
    } catch (error) {
        console.error('Error fetching time slots:', error);
        return res.status(500).json({ message: 'Error fetching time slots', error: error.message });
    }
});


//  Delete timeslot --> '/deletetimeslot'
router.delete('/deletetimeslot', verifyToken, async (req, res) => {
    const { _id } = req.body;
  
    if (!_id) {
      return res.status(400).json({ message: 'Please provide the _id of the time slot to delete' });
    }
  
    try {
      // Find and delete the time slot by _id
      const deletedTimeslot = await Timeslotmodel.findByIdAndDelete(_id);
  
      // Check if the time slot was found and deleted
      if (!deletedTimeslot) {
        return res.status(404).json({ message: 'Time slot not found' });
      }
  
      // Send a success response
      res.status(200).json({ 
        message: 'Time slot deleted successfully', 
        deletedTimeslot 
      });
    } catch (error) {
      console.error('Error deleting time slot:', error.message);
      res.status(500).json({ message: 'Error deleting time slot', error: error.message });
    }
  });
  


module.exports = router;
