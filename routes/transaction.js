const express = require('express');
const transactionmethodmodel = require('../Model/Transactionmodel');

const router = express.Router();

// add transacton method --->'/addtransactionmethod'
router.post('/addtransactionmethod', async (req, res) => {
    const { transactionmethod_name, transactionmethod_image } = req.body;

    if (!transactionmethod_name || !transactionmethod_image) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }
    try {
        const newtransactionmethod = new transactionmethodmodel({ transactionmethod_name, transactionmethod_image });
        await newtransactionmethod.save();
        res.status(201).json({
            message: 'transaction method added successfully',
            _id: newtransactionmethod._id,
            transactionmethod_name: newtransactionmethod.transactionmethod_name,
            transactionmethod_image: newtransactionmethod.transactionmethod_image
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Error adding transaction method', error });
    }
});

// view transaction method  --> '/viewtransactionmethod'
router.get('/viewtransactionmethod', async (req, res) => {
    const { _id } = req.body; // Using req.body to get _id

    try {
        if (_id) {

            const transactionmethod = await transactionmethodmodel.findById(_id);

            if (transactionmethod) {
                return res.status(200).json({ message: 'transactionmethod found', transactionmethod });
            } else {
                return res.status(404).json({ message: 'transaction method not found' });
            }
        } else {

            const transactionmethod = await transactionmethodmodel.find();
            return res.status(200).json({ message: 'Alltransaction methods', transactionmethod });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error', error });
    }
});
// Update updatetransactionmethod -->'/updatetransactionmethod'
router.put('/updatetransactionmethod', async (req, res) => {
    const { _id, newtransactionmethod_name, newtransactionmethod_image } = req.body;

    // Check if _id is provided for update
    if (!_id) {
        return res.status(400).json({ message: 'Please provide transaction method ID' });
    }

    try {

        const updateFields = {};
        if (newtransactionmethod_name) updateFields.transactionmethod_name = newtransactionmethod_name;
        if (newtransactionmethod_image) updateFields.transactionmethod_image = newtransactionmethod_image;


        const updatedtransactionmethod = await transactionmethodmodel.findByIdAndUpdate(
            _id,
            updateFields,
            { new: true } // Return updated document
        );

        if (!updatedtransactionmethod) {
            return res.status(404).json({ message: 'Laundry type not found' });
        }

        // Return success message and updated document
        res.status(200).json({ message: 'Laundry type updated successfully', transactionmethod: updatedtransactionmethod });
    } catch (error) {
        console.error('Error updating laundry type:', error);
        res.status(500).json({ message: 'Error updating laundry type', error });
    }
});

// delete transaction method -->'/deletetransactionmethod'
router.delete('/deletetransactionmethod', async (req, res) => {
    const { _id } = req.body;
  
    if (!_id) {
      return res.status(400).json({ message: 'Please provide transaction method ID ' });
    }
    try {
      const deletedtransactionmethod = await transactionmethodmodel.findOneAndDelete({ _id}); 
      if (!deletedtransactionmethod) {
        return res.status(404).json({ message: 'transaction method  not found or already deleted' });
      }
  
      res.status(200).json({ message: 'transaction method  deleted successfully', transactionmethod: deletedtransactionmethod });
    } catch (error) {
      console.error('Error deleting transaction method:', error);
      res.status(500).json({ message: 'Error deleting transaction method', error });
    }
  });
module.exports = router;   