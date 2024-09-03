const express = require("express");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const CategoryModel = require("../Model/Categorymodel"); // Ensure correct path

const router = express.Router();

//<-----------------  verify tokens   ------------------>

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

// router.post('/addcategory', async (req, res) => {
//   console.log('Request Body:', req.body); // Log the received body
//   const { category_name } = req.body;

//   // Validate the input
//   if (!category_name) {
//     return res.status(400).json({ message: 'Category name is required' });
//   }

//   try {
//     // Create a new category document
//     const newCategory = new CategoryModel({
//       category_name
//     });

//     // Save the new category to the database
//     await newCategory.save();

//     res.status(201).json({
//       message: 'Category added successfully',
//       _id: newCategory._id,
//       category_name: newCategory.category_name
//     });
//   } catch (error) {
//     console.error('Error adding new category:', error.message);
//     res.status(500).json({ message: 'Error adding new category', error: error.message });
//   }
// });

router.post('/addcategory',verifyToken, async (req, res) => {
  console.log('Request Body:', req.body); // Log the received body
  const { category_name } = req.body;

  // Validate the input
  if (!category_name) {
    return res.status(400).json({ message: 'Category name is required' });
  }
  try {
    // Check if the category name already exists, considering case sensitivity
    const existingCategory = await CategoryModel.findOne({category_name})
      .collation({ locale: 'en', strength: 2 });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    // Create a new category document
    const newCategory = new CategoryModel({
      category_name
    });

    // Save the new category to the database
    await newCategory.save();

    res.status(201).json({
      message: 'Category added successfully',
      _id: newCategory._id,
      category_name: newCategory.category_name
    });
  } catch (error) {
    console.error('Error adding new category:', error.message);
    res.status(500).json({ message: 'Error adding new category', error: error.message });
  }
});

// Route to update the existing category
router.put('/updatecategory', verifyToken,async (req, res) => {
  const { _id, category_name } = req.body;

  if (!_id) {
    return res.status(400).json({ message: 'Category ID (_id) is required' });
  }

  if (category_name && typeof category_name !== 'string') {
    return res.status(400).json({ message: 'Category name must be a string' });
  }

  try {
    // Find the category by ID
    const category = await CategoryModel.findById(_id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    // Update the category fields
    if (category_name) {
      category.category_name = category_name;
    }

    // Save the updated category
    await category.save();

    res.status(200).json({
      message: 'Category updated successfully',
      _id: category._id,


      category_name: category.category_name
    });
  } catch (error) {
    console.error('Error updating category:', error.message);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// View category -->

router.get('/viewcategory', async (req, res) => {
  const { _id } = req.body; // Use _id from request body

  try {
    if (_id) {
      // If _id is provided, find and return that specific category
      const category = await CategoryModel.findById(_id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.status(200).json({
        message: 'Category retrieved successfully',
        category: {
          _id: category._id,
          category_name: category.category_name
        }
      });
    } else {
      // If _id is not provided, find and return all categories
      const categories = await CategoryModel.find();
      res.status(200).json({
        message: 'Categories retrieved successfully',
        categories
      });
    }
  } catch (error) {
    console.error('Error retrieving categories:', error.message);
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
});

// // delete category(_id)
router.delete('/deletecategory', verifyToken,async (req, res) => {
  const { _id } = req.body; // Use _id from request body

  if (!_id) {
    return res.status(400).json({ message: 'Category ID (_id) is required' });
  }

  try {
    // Find and delete the category by _id
    const result = await CategoryModel.findByIdAndDelete(_id);

    if (!result) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully', _id });
  } catch (error) {
    console.error('Error deleting category:', error.message);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

module.exports = router;
