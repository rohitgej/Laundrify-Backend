const express = require('express');
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Laundrytypemodel = require('../Model/Laundrytypemodel');

require('dotenv').config();

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'laundrytypeImage');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const tempFileName = `temp_${Date.now()}${ext}`;
    cb(null, tempFileName);
  }
});
// Initialize Multer middleware
const upload = multer({ storage: storage });

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




// router.post('/addlaundrytype', upload.single('Laundrytype_image'), async (req, res) => {
//   const { Laundrytype_name } = req.body;

//   if (!Laundrytype_name || !req.file) {
//     return res.status(400).json({ message: 'Laundry type name and image are required' });
//   }
//   try {
//     // Check for case-sensitive uniqueness
//     const existingLaundrytype = await Laundrytypemodel.findOne({ 
//       Laundrytype_name 
//     }).collation({ locale: 'en', strength: 2 });

//     if (existingLaundrytype) {
//       return res.status(400).json({ message: 'Laundry type with this name already exists' });
//     }
//     // Create a new laundry type document
//     const newLaundrytype = new Laundrytypemodel({
//       Laundrytype_name, // Use the name as provided
//       Laundrytype_image: '', // Set this initially to an empty string
//       laundrytype_id: new mongoose.Types.ObjectId() // Generate ID
//     });

//     // Save the new laundry type to get its MongoDB _id
//     await newLaundrytype.save();

//     const laundrytype_id = newLaundrytype._id;
//     const originalFilePath = req.file.path;
//     const laundrytypeImageDir = path.join(__dirname, '..', 'public', 'uploads', 'laundrytypeImage');

//     const webpFileName = `${laundrytype_id}.webp`;
//     const webpFilePath = path.join(laundrytypeImageDir, webpFileName);

//     // Convert the uploaded image to WebP format
//     await sharp(originalFilePath)
//       .webp({ quality: 80 })
//       .toFile(webpFilePath);

//     console.log(`Converted ${originalFilePath} to ${webpFilePath}`);

//     // Ensure the file exists before trying to delete it
//     if (fs.existsSync(originalFilePath)) {
//       // Remove the original uploaded file to save space
//       try {
//         fs.unlinkSync(originalFilePath);
//         console.log(`Deleted original file: ${originalFilePath}`);
//       } catch (unlinkErr) {
//         console.error(`Failed to delete original file: ${originalFilePath}`, unlinkErr);
//       }
//     } else {
//       console.error(`File not found for deletion: ${originalFilePath}`);
//     }

//     // Update the laundry type document with the image URL
//     const baseUrl = process.env.BASE_URL; // Base URL of your server
//     const relativeImageUrl = `/uploads/laundrytypeImage/${webpFileName}`;
//     const absoluteImageUrl = `${baseUrl}${relativeImageUrl}`;

//     newLaundrytype.Laundrytype_image = absoluteImageUrl;
//     await newLaundrytype.save();

//     res.status(201).json({
//       message: 'Laundry type added successfully',
//       _id: newLaundrytype._id,
//       Laundrytype_name: newLaundrytype.Laundrytype_name,
//       Laundrytype_image: newLaundrytype.Laundrytype_image,
//     });
//   } catch (error) {
//     console.error('Error adding laundry type:', error.message);
//     res.status(500).json({ message: 'Error adding laundry type', error: error.message });
//   }
// });


// router.post('/addlaundrytype', upload.single('Laundrytype_image'), async (req, res) => {
//   const { Laundrytype_name } = req.body;

//   if (!Laundrytype_name || !req.file) {
//     return res.status(400).json({ message: 'Laundry type name and image are required' });
//   }

//   try {
//     // Check for case-sensitive uniqueness
//     const existingLaundrytype = await Laundrytypemodel.findOne({
//       Laundrytype_name
//     }).collation({ locale: 'en', strength: 2 });

//     if (existingLaundrytype) {
//       return res.status(400).json({ message: 'Laundry type with this name already exists' });
//     }

//     // Create a new laundry type document
//     const newLaundrytype = new Laundrytypemodel({
//       Laundrytype_name, // Use the name as provided
//       Laundrytype_image: '', // Set this initially to an empty string
//       laundrytype_id: new mongoose.Types.ObjectId() // Generate ID
//     });

//     // Save the new laundry type to get its MongoDB _id
//     await newLaundrytype.save();

//     const laundrytype_id = newLaundrytype._id;
//     const originalFilePath = req.file.path;
//     const laundrytypeImageDir = path.join(__dirname, '..', 'public', 'uploads', 'laundrytypeImage');

//     const webpFileName = `${laundrytype_id}.webp`;
//     const webpFilePath = path.join(laundrytypeImageDir, webpFileName);

//     // Convert the uploaded image to WebP format
//     await sharp(originalFilePath)
//       .webp({ quality: 80 })
//       .toFile(webpFilePath);

//     console.log(`Converted ${originalFilePath} to ${webpFilePath}`);

//     // Check if the file has a 'temp_' prefix and delete it
//     if (originalFilePath.includes('temp_')) {
//       try {
//         fs.unlinkSync(originalFilePath);
//         console.log(`Deleted temporary file: ${originalFilePath}`);
//       } catch (unlinkErr) {
//         console.error(`Failed to delete temporary file: ${originalFilePath}`, unlinkErr);
//       }
//     } else {
//       console.log('No temporary file to delete.');
//     }

//     // Update the laundry type document with the image URL
//     const baseUrl = process.env.BASE_URL; // Base URL of your server
//     const relativeImageUrl = `/uploads/laundrytypeImage/${webpFileName}`;
//     const absoluteImageUrl = `${baseUrl}${relativeImageUrl}`;

//     newLaundrytype.Laundrytype_image = absoluteImageUrl;
//     await newLaundrytype.save();

//     res.status(201).json({
//       message: 'Laundry type added successfully',
//       _id: newLaundrytype._id,
//       Laundrytype_name: newLaundrytype.Laundrytype_name,
//       Laundrytype_image: newLaundrytype.Laundrytype_image,
//     });
//   } catch (error) {
//     console.error('Error adding laundry type:', error.message);
//     res.status(500).json({ message: 'Error adding laundry type', error: error.message });
//   }
// });

router.post('/addlaundrytype', upload.single('Laundrytype_image'),verifyToken, async (req, res) => {
  const { Laundrytype_name } = req.body;

  if (!Laundrytype_name || !req.file) {
    return res.status(400).json({ message: 'Laundry type name and image are required' });
  }

  try {
    const existingLaundrytype = await Laundrytypemodel.findOne({
      Laundrytype_name
    }).collation({ locale: 'en', strength: 2 });

    if (existingLaundrytype) {
      return res.status(400).json({ message: 'Laundry type with this name already exists' });
    }

    const newLaundrytype = new Laundrytypemodel({
      Laundrytype_name,
      Laundrytype_image: '',
      laundrytype_id: new mongoose.Types.ObjectId()
    });

    await newLaundrytype.save();

    const laundrytype_id = newLaundrytype._id;
    const originalFilePath = req.file.path;
    const laundrytypeImageDir = path.join(__dirname, '..', 'public', 'uploads', 'laundrytypeImage');

    const webpFileName = `${laundrytype_id}.webp`;
    const webpFilePath = path.join(laundrytypeImageDir, webpFileName);

    await sharp(originalFilePath)
      .webp({ quality: 80 })
      .toFile(webpFilePath);

    console.log(`Converted ${originalFilePath} to ${webpFilePath}`);

    // Close file descriptor if necessary
    fs.closeSync(fs.openSync(originalFilePath, 'r'));

    // Asynchronous file deletion with error handling
    fs.unlink(originalFilePath, (err) => {
      if (err) {
        console.error(`Failed to delete temporary file: ${originalFilePath}`, err);
      } else {
        console.log(`Deleted temporary file: ${originalFilePath}`);
      }
    });

    const baseUrl = process.env.BASE_URL;
    const relativeImageUrl = `/uploads/laundrytypeImage/${webpFileName}`;
    const absoluteImageUrl = `${baseUrl}${relativeImageUrl}`;

    newLaundrytype.Laundrytype_image = absoluteImageUrl;
    await newLaundrytype.save();

    res.status(201).json({
      message: 'Laundry type added successfully',
      _id: newLaundrytype._id,
      Laundrytype_name: newLaundrytype.Laundrytype_name,
      Laundrytype_image: newLaundrytype.Laundrytype_image,
    });
  } catch (error) {
    console.error('Error adding laundry type:', error.message);
    res.status(500).json({ message: 'Error adding laundry type', error: error.message });
  }
});

// View all the laundry type or A perticulat Laudry type --> /viewlaundrytype
router.get('/viewlaundrytype', async (req, res) => {
  const { _id } = req.query; // Using req.query to get _id

  try {
    if (_id) {
      // If _id is provided, find the specific laundry type by _id
      const laundrytype = await Laundrytypemodel.findById(_id);

      if (laundrytype) {
        return res.status(200).json({ message: 'Laundry type found', laundrytype });
      } else {
        return res.status(404).json({ message: 'Laundry type not found' });
      }
    } else {
      // If _id is not provided, return all laundry types
      const laundrytypes = await Laundrytypemodel.find();
      return res.status(200).json({ message: 'All laundry types', laundrytypes });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error });
  }
});

// Update Existing Laundry type --> '/updatelaundrytype'

router.put('/updatelaundrytype', upload.single('Laundrytype_image'), verifyToken,async (req, res) => {
  const { laundrytype_id, Laundrytype_name } = req.body;

  if (!laundrytype_id) {
    return res.status(400).json({ message: 'Laundrytype_id is a mandatory field' });
  }

  try {
    // Find the laundry type by ID
    const laundrytype = await Laundrytypemodel.findById(laundrytype_id);
    if (!laundrytype) {
      return res.status(404).json({ message: 'Laundry type not found' });
    }

    // Update the laundry type name if provided
    if (Laundrytype_name) {
      laundrytype.Laundrytype_name = Laundrytype_name;
    }

    // Update the laundry type image if a new image is uploaded
    if (req.file) {
      const originalFilePath = req.file.path;
      const laundrytypeImageDir = path.join(__dirname, '..', 'public', 'uploads', 'laundrytypeImage');

      const webpFileName = `${laundrytype_id}.webp`; // Use ID for consistency
      const webpFilePath = path.join(laundrytypeImageDir, webpFileName);

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

      // Construct the absolute URL for the WebP image and update the image field
      const baseUrl = process.env.BASE_URL; // Base URL of your server
      const relativeImageUrl = `/uploads/laundrytypeImage/${webpFileName}`;
      const absoluteImageUrl = `${baseUrl}${relativeImageUrl}`;
      laundrytype.Laundrytype_image = absoluteImageUrl;
    }

    // Save the updated laundry type
    await laundrytype.save();

    res.status(200).json({
      message: 'Laundry type updated successfully',
      _id: laundrytype._id,
      Laundrytype_name: laundrytype.Laundrytype_name,
      Laundrytype_image: laundrytype.Laundrytype_image,
    });
  } catch (error) {
    console.error('Error updating laundry type:', error.message);
    res.status(500).json({ message: 'Error updating laundry type', error: error.message });
  }
});







// router.put('/updatelaundrytype', upload.single('Laundrytype_image'), async (req, res) => {
//   const { laundrytype_id, Laundrytype_name } = req.body;

//   if (!laundrytype_id) {
//     return res.status(400).json({ message: 'Laundrytype_id is a mandatory field' });
//   }

//   try {
//     // Find the laundry type by ID
//     const laundrytype = await Laundrytypemodel.findById(laundrytype_id);
//     if (!laundrytype) {
//       return res.status(404).json({ message: 'Laundry type not found' });
//     }

//     // Update the laundry type name if provided
//     if (Laundrytype_name) {
//       laundrytype.Laundrytype_name = Laundrytype_name;
//     }

//     // Update the laundry type image if a new image is uploaded
//     if (req.file) {
//       const laundrytypeName = Laundrytype_name ? Laundrytype_name.toLowerCase().replace(/\s+/g, '_') : laundrytype.Laundrytype_name.toLowerCase().replace(/\s+/g, '_');
//       const originalFilePath = req.file.path;
//       const laundrytypeImageDir = path.join(__dirname, '..', 'public', 'uploads', 'laundrytypeImage');

//       const webpFileName = `${laundrytype_id}.webp`; // Use ID for consistency
//       const webpFilePath = path.join(laundrytypeImageDir, webpFileName);

//       // Convert the uploaded image to WebP format
//       await sharp(originalFilePath)
//         .webp({ quality: 80 })
//         .toFile(webpFilePath);

//       console.log(`Converted ${originalFilePath} to ${webpFilePath}`);

//       // Remove the original uploaded file to save space
//       try {
//         fs.unlinkSync(originalFilePath);
//         console.log(`Deleted original file: ${originalFilePath}`);
//       } catch (unlinkErr) {
//         console.error(`Failed to delete original file: ${originalFilePath}`, unlinkErr);
//       }

//       // Construct the relative URL for the WebP image and update the image field
//       const relativeImageUrl = `/uploads/laundrytypeImage/${webpFileName}`;
//       laundrytype.Laundrytype_image = relativeImageUrl;
//     }

//     // Save the updated laundry type
//     await laundrytype.save();

//     res.status(200).json({
//       message: 'Laundry type updated successfully',
//       _id: laundrytype._id,
//       Laundrytype_name: laundrytype.Laundrytype_name,
//       Laundrytype_image: laundrytype.Laundrytype_image,
//     });
//   } catch (error) {
//     console.error('Error updating laundry type:', error.message);
//     res.status(500).json({ message: 'Error updating laundry type', error: error.message });
//   }
// });


// Delete existing  Laundry type --> '/deletelaundrytype'
router.delete('/deletelaundrytype', verifyToken,async (req, res) => {
  const { _id } = req.body;

  if (!_id) {
    return res.status(400).json({ message: 'Please provide Laundrytyp ID ' });
  }
  try {
    const deletedlaundrytype = await Laundrytypemodel.findOneAndDelete({ _id });
    if (!deletedlaundrytype) {
      return res.status(404).json({ message: 'laundry type not found or already deleted' });
    }

    res.status(200).json({ message: 'laundry type deleted successfully', category: deletedlaundrytype });
  } catch (error) {
    console.error('Error deleting laundry type:', error);
    res.status(500).json({ message: 'Error deleting laundry type', error });
  }
});

module.exports = router;
