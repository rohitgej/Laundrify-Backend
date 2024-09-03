const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const ItemModel = require('../Model/Itemmodel'); // Ensure correct path

require('dotenv').config();
// const router = express.Router();
// // Adding a new  Item -->  '/additem' 

// // Set up storage engine for Multer
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'itemImage');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//       console.log(`Created directory: ${uploadDir}`);
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const tempFileName = `temp_${Date.now()}${ext}`;
//     cb(null, tempFileName);
//   }
// });

// // Initialize Multer middleware
// const upload = multer({ storage: storage });

// //Route to add a new item with image upload

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'itemImage'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

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


// router.post('/additem', upload.single('item_image'), async (req, res) => {
//   const { item_name, category_id, item_weight } = req.body;
//   let id_laundrytype = req.body['id_laundrytype'] || [];

//   // Validate id_laundrytype if it's a string
//   if (typeof id_laundrytype === 'string') {
//     try {
//       id_laundrytype = JSON.parse(id_laundrytype);
//       if (!Array.isArray(id_laundrytype)) {
//         throw new Error('Invalid format for id_laundrytype');
//       }
//     } catch (e) {
//       return res.status(400).json({ message: 'Invalid format for id_laundrytype', error: e.message });
//     }
//   }
//   // Validate the input
//   if (!item_name || !category_id || !item_weight || !Array.isArray(id_laundrytype) || id_laundrytype.length < 1 || !req.file) {
//     return res.status(400).json({ message: 'Item name, category ID, weight, laundry types, and an image are required' });
//   }
//   try {
//     // Create a new item document with an empty image field
//     const newItem = new ItemModel({
//       item_name,
//       item_image: '', // Set this initially to an empty string
//       category_id,
//       item_weight,
//       id_laundrytype
//     });

//     // Save the new item to get its MongoDB _id
//     await newItem.save();

//     const item_id = newItem._id;
//     const originalFilePath = req.file.path;
//     const itemImageDir = path.join(__dirname, '..', 'public', 'uploads', 'itemImage');

//     const webpFileName = `${item_id}.webp`;
//     const webpFilePath = path.join(itemImageDir, webpFileName);

//     // Convert the uploaded image to WebP format
//     await sharp(originalFilePath)
//       .webp({ quality: 80 })
//       .toFile(webpFilePath);

//     console.log(`Converted ${originalFilePath} to ${webpFilePath}`);

//     // Remove the original uploaded file to save space
//     try {
//       fs.unlinkSync(originalFilePath);
//       console.log(`Deleted original file: ${originalFilePath}`);
//     } catch (unlinkErr) {
//       console.error(`Failed to delete original file: ${originalFilePath}`, unlinkErr);
//     }

//     // Update the item document with the image URL
//     const baseUrl =  process.env.BASE_URL; // Base URL of your server
//     const relativeImageUrl = `/uploads/itemImage/${webpFileName}`;
//     const absoluteImageUrl = `${baseUrl}${relativeImageUrl}`;

//     newItem.item_image = absoluteImageUrl;
//     await newItem.save();

//     res.status(201).json({
//       message: 'Item added successfully',
//       _id: newItem._id,
//       item_name: newItem.item_name,
//       item_image: newItem.item_image,
//       category_id: newItem.category_id,
//       item_weight: newItem.item_weight,
//       id_laundrytype: newItem.id_laundrytype
//     });
//   } catch (error) {
//     console.error('Error adding new item:', error.message);
//     res.status(500).json({ message: 'Error adding new item', error: error.message });
//   }
// });

router.post('/additem', upload.single('item_image'), verifyToken, async (req, res) => {
  const { item_name, category_id, item_weight } = req.body;
  let id_laundrytype = req.body['id_laundrytype'] || [];

  // Validate id_laundrytype if it's a string
  if (typeof id_laundrytype === 'string') {
    try {
      id_laundrytype = JSON.parse(id_laundrytype);
      if (!Array.isArray(id_laundrytype)) {
        throw new Error('Invalid format for id_laundrytype');
      }
    } catch (e) {
      return res.status(400).json({ message: 'Invalid format for id_laundrytype', error: e.message });
    }
  }

  // Validate the input
  if (!item_name || !category_id || !item_weight || !Array.isArray(id_laundrytype) || id_laundrytype.length < 1 || !req.file) {
    return res.status(400).json({ message: 'Item name, category ID, weight, laundry types, and an image are required' });
  }

  try {
    // Check if the item name already exists (case-sensitive)
    const existingItem = await ItemModel.findOne({ item_name })
      .collation({ locale: 'en', strength: 2 });

    if (existingItem) {
      return res.status(400).json({ message: 'Item name already exists' });
    }

    // Create a new item document with an empty image field
    const newItem = new ItemModel({
      item_name,
      item_image: '', // Set this initially to an empty string
      category_id,
      item_weight,
      id_laundrytype
    });

    // Save the new item to get its MongoDB _id
    await newItem.save();

    const item_id = newItem._id;
    const originalFilePath = req.file.path;
    const itemImageDir = path.join(__dirname, '..', 'public', 'uploads', 'itemImage');

    const webpFileName = `${item_id}.webp`;
    const webpFilePath = path.join(itemImageDir, webpFileName);

    // Convert the uploaded image to WebP format
    await sharp(originalFilePath)
      .webp({ quality: 80 })
      .toFile(webpFilePath);

    console.log(`Converted ${originalFilePath} to ${webpFilePath}`);

    // Remove the original uploaded file to save space
    try {
      fs.unlinkSync(originalFilePath);
      console.log(`Deleted original file: ${originalFilePath}`);
    } catch (unlinkErr) {
      console.error(`Failed to delete original file: ${originalFilePath}`, unlinkErr);
    }

    // Update the item document with the image URL
    const baseUrl = process.env.BASE_URL; // Base URL of your server
    const relativeImageUrl = `/uploads/itemImage/${webpFileName}`;
    const absoluteImageUrl = `${baseUrl}${relativeImageUrl}`;

    newItem.item_image = absoluteImageUrl;
    await newItem.save();

    res.status(201).json({
      message: 'Item added successfully',
      _id: newItem._id,
      item_name: newItem.item_name,
      item_image: newItem.item_image,
      category_id: newItem.category_id,
      item_weight: newItem.item_weight,
      id_laundrytype: newItem.id_laundrytype
    });
  } catch (error) {
    console.error('Error adding new item:', error.message);
    res.status(500).json({ message: 'Error adding new item', error: error.message });
  }
});

// update the existing Item -->  '/updateitem'
// router.put('/updateitem', upload.single('item_image'), async (req, res) => {
//   const { _id, item_name, category_id, item_weight, id_laundrytype } = req.body;
//   const item_image = req.file ? req.file.path : null; // Get file path if an image is uploaded

//   // Convert item_weight to Number
//   const itemWeight = Number(item_weight);

//   // Validate required fields
//   if (!_id) {
//     return res.status(400).json({ message: 'Item ID (_id) is required' });
//   }

//   // Parse id_laundrytype if it's a string
//   let idLaundrytypeArray = id_laundrytype;
//   if (typeof id_laundrytype === 'string') {
//     try {
//       idLaundrytypeArray = JSON.parse(id_laundrytype);
//     } catch (err) {
//       return res.status(400).json({ message: 'Invalid format for id_laundrytype' });
//     }
//   }

//   // Validate and convert id_laundrytypeArray
//   if (!Array.isArray(idLaundrytypeArray)) {
//     return res.status(400).json({ message: 'id_laundrytype must be an array' });
//   }

//   const parsedIdLaundrytypeArray = idLaundrytypeArray.map(item => {
//     if (item && item.id && item.price && mongoose.Types.ObjectId.isValid(item.id)) {
//       return {
//         id: new mongoose.Types.ObjectId(item.id),
//         price: item.price
//       };
//     } else {
//       return null;
//     }
//   }).filter(item => item !== null);

//   try {
//     const updatedItem = await ItemModel.findById(_id);
//     if (!updatedItem) {
//       return res.status(404).json({ message: 'Item not found' });
//     }

//     // Update fields if provided
//     if (item_name) updatedItem.item_name = item_name;
//     if (category_id) updatedItem.category_id = category_id;
//     if (!isNaN(itemWeight)) updatedItem.item_weight = itemWeight;
//     if (parsedIdLaundrytypeArray.length > 0) updatedItem.id_laundrytype = parsedIdLaundrytypeArray;

//     // Handle image update
//     if (item_image) {
//       const webpFileName = `${_id}.webp`; // Use ID for consistency
//       const webpFilePath = path.join(__dirname, '..', 'public', 'uploads', 'itemImage', webpFileName);

//       await sharp(item_image)
//         .webp({ quality: 80 })
//         .toFile(webpFilePath);

//       console.log(`Converted ${item_image} to ${webpFilePath}`);


//       try {
//         fs.unlinkSync(item_image); // Delete original file
//         console.log(`Deleted original file: ${item_image}`);
//       } catch (unlinkErr) {
//         console.error(`Failed to delete original file: ${item_image}`, unlinkErr);
//       }

//       updatedItem.item_image = `/uploads/itemImage/${webpFileName}`;
//     }

//     // Save updated item
//     await updatedItem.save();

//     res.status(200).json({
//       message: 'Item updated successfully',
//       _id: updatedItem._id,
//       item_name: updatedItem.item_name,
//       item_image: updatedItem.item_image,
//       category_id: updatedItem.category_id,
//       id_laundrytype: updatedItem.id_laundrytype,
//       item_weight: updatedItem.item_weight
//     });

//   } catch (error) {
//     console.error('Error updating item:', error.message);
//     res.status(500).json({ message: 'Error updating item', error: error.message });
//   }
// });


router.put('/updateitem', upload.single('item_image'), verifyToken,async (req, res) => {
  const { _id, item_name, category_id, item_weight, id_laundrytype } = req.body;
  const item_image = req.file ? req.file.path : null; // Get file path if an image is uploaded

  // Convert item_weight to Number
  const itemWeight = Number(item_weight);

  // Validate required fields
  if (!_id) {
    return res.status(400).json({ message: 'Item ID (_id) is required' });
  }

  // Parse id_laundrytype if it's a string
  let idLaundrytypeArray = id_laundrytype;
  if (typeof id_laundrytype === 'string') {
    try {
      idLaundrytypeArray = JSON.parse(id_laundrytype);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid format for id_laundrytype' });
    }
  }

  // Validate and convert id_laundrytypeArray
  if (!Array.isArray(idLaundrytypeArray)) {
    return res.status(400).json({ message: 'id_laundrytype must be an array' });
  }

  const parsedIdLaundrytypeArray = idLaundrytypeArray.map(item => {
    if (item && item.id && item.price && mongoose.Types.ObjectId.isValid(item.id)) {
      return {
        id: new mongoose.Types.ObjectId(item.id),
        price: item.price
      };
    } else {
      return null;
    }
  }).filter(item => item !== null);

  try {
    const updatedItem = await ItemModel.findById(_id);
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update fields if provided
    if (item_name) updatedItem.item_name = item_name;
    if (category_id) updatedItem.category_id = category_id;
    if (!isNaN(itemWeight)) updatedItem.item_weight = itemWeight;
    if (parsedIdLaundrytypeArray.length > 0) updatedItem.id_laundrytype = parsedIdLaundrytypeArray;

    // Handle image update
    if (item_image) {
      const webpFileName = `${_id}.webp`; // Use ID for consistency
      const webpFilePath = path.join(__dirname, '..', 'public', 'uploads', 'itemImage', webpFileName);

      await sharp(item_image)
        .webp({ quality: 80 })
        .toFile(webpFilePath);

      console.log(`Converted ${item_image} to ${webpFilePath}`);

      try {
        fs.unlinkSync(item_image); // Delete original file
        console.log(`Deleted original file: ${item_image}`);
      } catch (unlinkErr) {
        console.error(`Failed to delete original file: ${item_image}`, unlinkErr);
      }

      // Construct the full URL for the image
      const baseUrl =  process.env.BASE_URL; // Base URL of your server
      const relativeImageUrl = `/uploads/itemImage/${webpFileName}`;
      const absoluteImageUrl = `${baseUrl}${relativeImageUrl}`;

      updatedItem.item_image = absoluteImageUrl;
    }

    // Save updated item
    await updatedItem.save();

    res.status(200).json({
      message: 'Item updated successfully',
      _id: updatedItem._id,
      item_name: updatedItem.item_name,
      item_image: updatedItem.item_image,
      category_id: updatedItem.category_id,
      item_weight: updatedItem.item_weight,
      id_laundrytype: updatedItem.id_laundrytype
    });

  } catch (error) {
    console.error('Error updating item:', error.message);
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
});

//view existing items --> '/viewitem'
router.post('/viewitem', async (req, res) => {
  try {
    const { _id } = req.body; // Get _id from request body
    if (_id) {
      // If _id is provided, find a specific category
      const item = await ItemModel.findById(_id);

      if (item) {
        return res.status(200).json({ message: 'item found', item });
      } else {
        return res.status(404).json({ message: 'item not found' });
      }
    } else {
      // If no _id is provided, return all item
      const item = await ItemModel.find();
      return res.status(200).json({ message: 'All item', item });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error });
  }
});

// delete existing item --> '/deleteitem'

router.delete('/deleteitem', verifyToken, async (req, res) => {
  const { _id } = req.body;

  if (!_id) {
    return res.status(400).json({ message: 'Please provide item name in the request body' });
  }
  try {
    const deleteitem = await ItemModel.findOneAndDelete({ _id });
    if (!deleteitem) {
      return res.status(404).json({ message: 'item not found or already deleted' });
    }

    res.status(200).json({ message: 'item  deleted successfully', item: deleteitem });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Error deleting item', error });
  }
});

module.exports = router;