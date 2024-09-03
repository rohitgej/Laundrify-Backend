const express = require('express');
const UserModel = require('../Model/Usermodel');
const OrderModel = require('../Model/Ordermodel')
const mongoose = require('mongoose');
const multer = require('multer');
const fs= require('fs')
const path = require('path');
const sharp = require('sharp');
const router = express.Router();
const Nexmo = require('nexmo');

// // Initialize Nexmo with your API credentials
// const nexmo = new Nexmo({
//   apiKey: process.env.NEXMO_API_KEY,     // Ensure these are set in your .env file
//   apiSecret: process.env.NEXMO_API_SECRET,
// });

// // Function to generate a random OTP
// function generateOtp() {
//   return Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
// }

// // Function to send OTP using Nexmo
// async function sendOtp(mobile_no, otp) {
//   return new Promise((resolve, reject) => {
//     const from = 'Nexmo';  // This can be customized, depends on your Nexmo setup
//     const to = `91${mobile_no}`; // Assuming Indian numbers; adjust the country code as needed
//     const text = `Your OTP is ${otp}`;

//     nexmo.message.sendSms(from, to, text, (err, responseData) => {
//       if (err) {
//         console.error('Error sending SMS:', err);
//         reject(err);
//       } else if (responseData.messages[0].status !== '0') {
//         const errorText = responseData.messages[0]['error-text'];
//         console.error('Error status:', errorText);
//         reject(new Error(errorText));
//       } else {
//         console.log('SMS sent successfully:', responseData);
//         resolve(responseData);
//       }
//     });
//   });
// }

// // Registration endpoint
// router.post('/registration', async (req, res) => {
//   const { mobile_no } = req.body;

//   if (!mobile_no) {
//     return res.status(400).json({ message: 'Please provide a mobile number' });
//   }

//   try {
//     const otp = generateOtp();
//     let user = await UserModel.findOne({ mobile_no });

//     if (user) {
//       user.otp = otp;
//       await user.save();
//     } else {
//       // Create a new user with the generated OTP
//       user = new UserModel({ mobile_no, otp });
//       await user.save();
//     }

//     // Send OTP to user's mobile number using Nexmo
//     await sendOtp(mobile_no, otp);

//     res.status(201).json({
//       message: 'User registered successfully, OTP sent',
//       user_id: user._id, // Include user_id in the response
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ message: 'Error sending OTP', error: error.message });
//   }
// });

//  User Login -->  /login
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
router.post('/registration', async (req, res) => {
  const { mobile_no } = req.body;
  if (!mobile_no) {
    return res.status(400).json({ message: 'Please provide Mobile number' });
  }
  try {
    const otp = generateOtp();
    let user = await UserModel.findOne({ mobile_no });
    if (user) {
      user.otp = otp;
      await user.save();
    } else {
      // Create a new user with the generated OTP
      user = new UserModel({ mobile_no, otp });
      await user.save();
    }
    // Send OTP to user's mobile number
    // await sendOtp(mobile_no, otp);

    res.status(201).json({
      message: 'User registered successfully, OTP sent',
      otp,
      user_id: user._id // Include user_id in the response
    }); 
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error });
  }
});
router.post('/login', async (req, res) => {
  const { mobile_no, otp } = req.body;

  if (!mobile_no || !otp) {
    return res.status(400).json({ message: 'Please provide Mobile numbe, OTP' });
  }

  try {
    // Check if user exists with the provided mobile number and OTP
    const user = await UserModel.findOne({ mobile_no, otp });

    if (user) {
      // User found, valid login

      // Remove the OTP from user model
      user.otp = undefined;
      await user.save();

      return res.status(200).json({ message: 'Valid user', user });
    } else {
      // User not found or invalid OTP
      return res.status(401).json({ message: 'Invalid mobile number or OTP' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error });
  }
});

/// User profile update --> /updateuser
router.put('/updateuser', async (req, res) => {
  const { _id, mobile_no, email_id, name, addresses, postcode, city, state } = req.body;

  if (!_id) {
    return res.status(400).json({ message: 'Please provide the user ID to update user details' });
  }
  try {
    // Find the user by _id
    let user = await UserModel.findById(_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for duplicate mobile_no if it's being updated
    if (mobile_no && mobile_no !== user.mobile_no) {
      const existingUser = await UserModel.findOne({ mobile_no });
      if (existingUser) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
      user.mobile_no = mobile_no;
    }

    // Update other fields
    if (email_id) user.email_id = email_id;
    if (name) user.name = name;

    // Update addresses
    if (addresses) {
      if (!Array.isArray(addresses)) {
        return res.status(400).json({ message: 'Addresses must be an array' });
      }

      // Check if the number of addresses exceeds the limit
      if (user.addresses.length + addresses.length > 5) {
        return res.status(400).json({ message: 'Cannot have more than 5 addresses' });
      }

      // Validate each address
      for (let address of addresses) {
        if (!address.house_no || !address.block_no || !address.address || !address.coordinates) {
          return res.status(400).json({ message: 'Each address must have house_no, block_no, address, and coordinates' });
        }

        if (
          typeof address.coordinates.latitude !== 'number' ||
          typeof address.coordinates.longitude !== 'number' ||
          typeof address.coordinates.latitudeDelta !== 'number' ||
          typeof address.coordinates.longitudeDelta !== 'number'
        ) {
          return res.status(400).json({ message: 'Coordinates must contain valid latitude and longitude numbers' });
        }
      }

      // Append new addresses to existing ones
      user.addresses = [...user.addresses, ...addresses];
    }

    if (postcode) user.postcode = postcode;
    if (city) user.city = city;
    if (state) user.state = state;

    // Save the updated user
    await user.save();

    // Transform the user object to the desired response format
    const transformedUser = {
      mobile_no: user.mobile_no,
      email_id: user.email_id,
      name: user.name,
      addresses: user.addresses,
      city: user.city,
      postcode: user.postcode,
      state: user.state,
    };

    res.status(200).json({
      message: 'User details updated successfully',
      user: transformedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user details', error: error.message });
  }
});

// User dlt address -->  /deleteaddress
router.put('/deleteaddress', async (req, res) => {
  const { userId, addressId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: 'Please provide the user ID to delete the address' });
  }
  if (!addressId) {
    return res.status(400).json({ message: 'Please provide the address ID to delete' });
  }
  try {
    // Find the user by userId and remove the address by addressId
    const user = await UserModel.findOneAndUpdate(
      { _id: userId },
      { $pull: { addresses: { _id: addressId } } },
      { new: true } // Return the modified document
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Optionally, you can return a more detailed response if needed
    res.status(200).json({
      message: 'Address deleted successfully',
      user: {
        _id: user._id,
        mobile_no: user.mobile_no,
        email_id: user.email_id,
        name: user.name,
        addresses: user.addresses,
        city: user.city,
        postcode: user.postcode,
        state: user.state,
      },
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
});

// User :dlt account by user_id  --/deleteaccount
router.delete('/deleteaccount', async (req, res) => {
  const { _id } = req.body;
  if (!_id) {
    return res.status(400).json({ message: 'Please provide user ID ' });
  }
  try {
    const deleteaccount = await UserModel.findOneAndDelete({ _id });
    if (!_id) {
      return res.status(404).json({ message: 'User not found or not exist' });
    }
    res.status(200).json({ message: 'Account deleted successfully', User: deleteaccount });
  } catch (error) {
    console.error('Error deleting User:', error);
    res.status(500).json({ message: 'Error deleting User', error });
  }
});
// View all users or a perticular user -->  /viewuser
router.post('/viewuser', async (req, res) => {
  const {_id } = req.body;

  try {
    if (_id) {
      // Fetch the specific user by user_id
      const user = await UserModel.findById(_id).select('-__v'); // Exclude __v field if needed

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Transform the user object to include all details
      const transformedUser = {
        user_id: user._id.toString(),
        mobile_no: user.mobile_no,
        email_id: user.email_id,
        name: user.name,
        addresses: user.addresses.map(address => ({
          type: address.type,
          house_no: address.house_no,
          block_no: address.block_no,
          address: address.address,
          coordinates: address.coordinates,
          _id: address._id.toString()
        })), // Include all address details here
        city: user.city,
        postcode: user.postcode,
        state: user.state,
        profileImage: user.profileImage
      };

      res.status(200).json({ user: transformedUser });
    } else {
      // Fetch all users
      const users = await UserModel.find().select('-__v'); // Exclude __v field if needed
      const transformedUsers = users.map(user => ({
        user_id: user._id.toString(),
        mobile_no: user.mobile_no,
        email_id: user.email_id,
        name: user.name,
        addresses: user.addresses.map(address => ({
          type: address.type,
          house_no: address.house_no,
          block_no: address.block_no,
          address: address.address,
          coordinates: address.coordinates,
          _id: address._id.toString()
        })), // Include all address details here
        city: user.city,
        postcode: user.postcode,
        state: user.state,
        profileImage: user.profileImage
      }));

      res.status(200).json({ users: transformedUsers });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error fetching user(s)', error });
  }
});

// Delete user profile --> /deleteProfileImage
router.post('/deleteProfileImage', async (req, res) => {
  const { user_id } = req.body; // Extract user_id from the request body

  try {
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find the user by user_id and set the profileImage field to null
    const updatedUser = await UserModel.findByIdAndUpdate(
      user_id,
      { profileImage: null }, // Set profileImage to null
      { new: true } // Return the updated user document
    ).select('-__v'); // Exclude the __v field if needed

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform the updated user object to include relevant details
    const transformedUser = {
      user_id: updatedUser._id.toString(),
      mobile_no: updatedUser.mobile_no,
      email_id: updatedUser.email_id,
      name: updatedUser.name,
      addresses: updatedUser.addresses.map((address) => ({
        type: address.type,
        house_no: address.house_no,
        block_no: address.block_no,
        address: address.address,
        coordinates: address.coordinates,
        _id: address._id.toString(),
      })), // Include all address details here
      city: updatedUser.city,
      postcode: updatedUser.postcode,
      state: updatedUser.state,
      profileImage: updatedUser.profileImage, // Should be null now
    };

    res.status(200).json({
      message: 'Profile image deleted successfully',
      user: transformedUser,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error deleting profile image', error });
  }
});
// upload profile pic---> /uploadProfilePic
// const BASE_URL = 'http://20.20.20.232:3000/profileImage';
// // Set up Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Define the destination folder for uploaded files within the public directory
//     const uploadDir = path.join(__dirname, '..', 'public', 'profileImage');

//     // Create folder if it doesn't exist
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//       console.log(`Created directory: ${uploadDir}`); // Debugging log
//     }

//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const user_id = req.body.user_id;
//     // File name format: user_id_original.ext
//     const ext = path.extname(file.originalname);
//     const fileName = `${user_id}_original${ext}`;
//     console.log(`Generated file name: ${fileName}`); // Debugging log
//     cb(null, fileName);
//   }
// });

// // Initialize Multer middleware
// const upload = multer({ storage: storage });

// // Route to upload profile picture
// router.post('/uploadProfilePic', upload.single('profileImage'), async (req, res) => {
//   const { user_id } = req.body;

//   if (!user_id || !req.file) {
//     return res.status(400).json({ message: 'User ID and profile picture are required' });
//   }
//   try {
//     // Path to the uploaded file
//     const originalFilePath = req.file.path;

//     // Path to save the converted WebP image
//     const webpFilePath = path.join(__dirname, '..', 'public', 'profileImage', `${user_id}_profileImage.webp`);

//     // Convert the uploaded image to WebP format
//     await sharp(originalFilePath)
//       .webp({ quality: 80 }) // Adjust quality as needed
//       .toFile(webpFilePath);

//     console.log(`Converted ${originalFilePath} to ${webpFilePath}`);

//     // Remove the original uploaded file to save space
//     try {
//       fs.unlinkSync(originalFilePath);
//       console.log(`Deleted original file: ${originalFilePath}`);
//     } catch (unlinkErr) {
//       console.error(`Failed to delete original file: ${originalFilePath}`, unlinkErr);
//     }

//     // Construct the full URL for the WebP image
//     const fullImageUrl = `${BASE_URL}/${user_id}_profileImage.webp`;

//     // Update user document with the profile picture URL
//     const user = await UserModel.findByIdAndUpdate(
//       user_id,
//       { profileImage: fullImageUrl }, // Update with full URL
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({ message: 'Profile picture uploaded successfully', user });
//   } catch (error) {
//     console.error('Error uploading profile picture:', error.message);
//     res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
//   }
// });



// const BASE_URL = 'http://20.20.20.232:3000/profileImage';

// // Set up Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = path.join(__dirname, '..', 'public', 'profileImage');

//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//       console.log(`Created directory: ${uploadDir}`);
//     }

//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const user_id = req.body.user_id;
//     const ext = path.extname(file.originalname);
//     const fileName = `${user_id}_original${ext}`;
//     console.log(`Generated file name: ${fileName}`);
//     cb(null, fileName);
//   }
// });

// const upload = multer({ storage: storage });

// // Utility function to delete a file with retries
// async function deleteFileWithRetry(filePath, retries = 3, delay = 500) {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       // Ensure the file is not read-only
//       fs.chmodSync(filePath, 0o666);

//       // Attempt to delete the file
//       await fs.promises.unlink(filePath);
//       console.log(`Deleted original file: ${filePath}`);
//       return;
//     } catch (error) {
//       if (attempt < retries) {
//         console.warn(`Retrying to delete file: ${filePath} (Attempt ${attempt})`);
//         await new Promise(resolve => setTimeout(resolve, delay));
//       } else {
//         console.error(`Failed to delete original file after ${retries} attempts: ${filePath}`, error);
//       }
//     }
//   }
// }

// //Route to upload profile picture
// router.post('/uploadProfilePic', upload.single('profileImage'), async (req, res) => {
//   const { user_id } = req.body;

//   if (!user_id || !req.file) {
//     return res.status(400).json({ message: 'User ID and profile picture are required' });
//   }

//   try {
//     const originalFilePath = req.file.path;
//     const webpFilePath = path.join(__dirname, '..', 'public', 'profileImage', `${user_id}_profileImage.webp`);

//     await sharp(originalFilePath)
//       .webp({ quality: 80 })
//       .toFile(webpFilePath);

//     console.log(`Converted ${originalFilePath} to ${webpFilePath}`);

//     // Delay deletion to ensure file is free
//     await new Promise(resolve => setTimeout(resolve, 1000));

//     // Attempt to delete the original file with retries
//     await deleteFileWithRetry(originalFilePath);

//     const fullImageUrl = `${BASE_URL}/${user_id}_profileImage.webp`;

//     const user = await UserModel.findByIdAndUpdate(
//       user_id,
//       { profileImage: fullImageUrl },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({ message: 'Profile picture uploaded successfully', user });
//   } catch (error) {
//     console.error('Error uploading profile picture:', error.message);
//     res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
//   }
// });
const BASE_URL = `${process.env.BASE_URL}/profileImage`;

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'public', 'profileImage');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const user_id = req.body.user_id;
    const ext = path.extname(file.originalname);
    const fileName = `${user_id}_original${ext}`;
    console.log(`Generated file name: ${fileName}`);
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

// Utility function to delete a file with retries and extended delay
async function deleteFileWithRetry(filePath, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Ensure the file is not read-only
      fs.chmodSync(filePath, 0o666);

      // Attempt to delete the file
      await fs.promises.unlink(filePath);
      console.log(`Deleted original file: ${filePath}`);
      return;
    } catch (error) {
      if (attempt < retries) {
        console.warn(`Retrying to delete file: ${filePath} (Attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`Failed to delete original file after ${retries} attempts: ${filePath}`, error);
      }
    }
  }
}

// Route to upload profile picture
router.post('/uploadProfilePic', upload.single('profileImage'), async (req, res) => {
  const { user_id } = req.body;

  if (!user_id || !req.file) {
    return res.status(400).json({ message: 'User ID and profile picture are required' });
  }

  try {
    const originalFilePath = req.file.path;
    const webpFilePath = path.join(__dirname, '..', 'public', 'profileImage', `${user_id}_profileImage.webp`);

    await sharp(originalFilePath)
      .webp({ quality: 80 })
      .toFile(webpFilePath);

    console.log(`Converted ${originalFilePath} to ${webpFilePath}`);

    // Delay deletion to ensure file is free
    await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay

    // Attempt to delete the original file with retries
    await deleteFileWithRetry(originalFilePath);

    const fullImageUrl = `${BASE_URL}/${user_id}_profileImage.webp`;

    const user = await UserModel.findByIdAndUpdate(
      user_id,
      { profileImage: fullImageUrl },
      { new: true }
    );


    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile picture uploaded successfully', user });
  } catch (error) {
    console.error('Error uploading profile picture:', error.message);
    res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
});

module.exports = router;