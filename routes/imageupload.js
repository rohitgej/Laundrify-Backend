// // const express = require('express');
// // const fs=require('fs');
// // const router = express.Router();
// // const sharp = require('sharp');
// // const path = require('path');
// // const multer = require('multer');
// // const OrderModel = require('../Model/Ordermodel'); // Ensure this path is correct
// // const { deleteFileSync } = require('../Model/util/fileUtils'); // Import the utility function

// // // Directory where your input images are stored inside public
// // const inputDir = path.join(__dirname, '..', 'public', 'uploads');
// // // Directory where your converted images are stored inside public
// // const outputDir = path.join(__dirname, '..', 'public', 'laundryimage');

// // // Ensure directories exist
// // const ensureDirExists = (dir) => {
// //     if (!fs.existsSync(dir)) {
// //         fs.mkdirSync(dir, { recursive: true });
// //     }
// // };
// // ensureDirExists(inputDir);
// // ensureDirExists(outputDir);

// // // Set up multer for file uploads
// // const upload = multer({ dest: inputDir });

// // router.post('/pickup-uploadImage', upload.single('image'), async (req, res) => {
// //     try {
// //         if (!req.file) {
// //             console.error('No image uploaded');
// //             return res.status(400).json({ message: 'No image uploaded' });
// //         }
// //         const { order_id, field } = req.body;
// //         const imagePath = req.file.path;

// //         // Get the current timestamp
// //         const timestamp = Date.now();

// //         // Query the database to determine the next sequence number for the image
// //         const order = await OrderModel.findOne({ order_id: order_id });
// //         if (!order) {
// //             console.error('Order not found');
// //             return res.status(404).json({ message: 'Order not found' });
// //         }
// //         let sequence = 1;
// //         const images = field === 'pick' ? order.collection_image_url : order.delivery_image_url;
// //         if (images) {
// //             const imageCount = Array.isArray(images) ? images.length : 0;
// //             sequence = imageCount + 1;
// //         }

// //         // Generate the filename using the timestamp, order_id, field, and sequence number
// //         const filename = `${timestamp}_${order_id}_${field}_${sequence}.webp`;
// //         const outputImagePath = path.join(outputDir, filename);

// //         console.log('Output Image Path:', outputImagePath); // Log the path for debugging

// //         // Convert the image to WebP format
// //         try {
// //             await sharp(imagePath)
// //                 .webp({ quality: 80 })
// //                 .toFile(outputImagePath);
// //         } catch (sharpError) {
// //             console.error('Sharp error:', sharpError.message);
// //             throw sharpError; // Rethrow to be caught in the outer catch block
// //         }

// //         // Update the order with the new image URL
// //         const imageUrl = `http://20.20.20.232:3000/laundryimage/${filename}`;
// //         const updateData = {};
// //         if (field === 'pick') {
// //             if (!order.collection_image_url) {
// //                 updateData.collection_image_url = [imageUrl];
// //             } else {
// //                 order.collection_image_url.push(imageUrl);
// //                 updateData.collection_image_url = order.collection_image_url;
// //             }
// //         } else if (field === 'delivery') {
// //             if (!order.delivery_image_url) {
// //                 updateData.delivery_image_url = [imageUrl];
// //             } else {
// //                 order.delivery_image_url.push(imageUrl);
// //                 updateData.delivery_image_url = order.delivery_image_url;
// //             }
// //         }

// //         // Update the order and return the updated order details
// //         const updatedOrder = await OrderModel.findByIdAndUpdate(order._id, updateData, { new: true });
// //         if (!updatedOrder) {
// //             console.error('Failed to update order');
// //             return res.status(500).json({ message: 'Failed to update order' });
// //         }

// //         // Delete the original image file
// //         deleteFileSync(imagePath);

// //         res.status(200).json({
// //             message: 'Image uploaded and converted to WebP format',
// //             imageUrl,
// //             updatedOrder
// //         });
// //     } catch (error) {
// //         console.error('Error uploading and converting image:', error.message);
// //         res.status(500).json({ message: 'Error uploading and converting image', error: error.message });
// //     }
// // });

// // module.exports = router;

// /////////////////////////////////////////////////////////////////////////////////////////

// // const express = require('express');
// // const router = express.Router();
// // const sharp = require('sharp');
// // const path = require('path');
// // const fs = require('fs');
// // const multer = require('multer');
// // const { deleteFile } = require('../Model/util/fileUtils'); // Ensure this path is correct


// // require('dotenv').config();
// // const BASE_URL = process.env.BASE_URL;
// // const inputDir = path.join(__dirname, '..', 'public', 'uploads');
// // const outputDir = path.join(__dirname, '..', 'public', 'laundryimage');

// // // Ensure directories exist
// // const ensureDirExists = (dir) => {
// //     if (!fs.existsSync(dir)) {
// //         fs.mkdirSync(dir, { recursive: true });
// //     }
// // };
// // ensureDirExists(inputDir);
// // ensureDirExists(outputDir);

// // const upload = multer({ dest: inputDir });

// // router.post('/pickup-uploadImage', upload.single('image'), async (req, res) => {
// //     try {
// //         if (!req.file) {
// //             console.error('No image uploaded');
// //             return res.status(400).json({ message: 'No image uploaded' });
// //         }
// //         const { order_id, field } = req.body;
// //         const imagePath = req.file.path;

// //         const timestamp = Date.now();
// //         const filename = `${timestamp}_${order_id}_${field}.webp`;
// //         const outputImagePath = path.join(outputDir, filename);

// //         console.log('Output Image Path:', outputImagePath);

// //         await sharp(imagePath)
// //             .webp({ quality: 80 })
// //             .toFile(outputImagePath);

// //         const imageUrl = `${BASE_URL}/converted/${filename}`; // Update URL to match your setup

// //         // Example code to update database here
// //         // const updatedOrder = await OrderModel.findByIdAndUpdate(order_id, { [`${field}_image_url`]: imageUrl }, { new: true });

// //         deleteFile(imagePath);

// //         res.status(200).json({
// //             message: 'Image uploaded and converted to WebP format',
// //             imageUrl,
// //             // updatedOrder
// //         });
// //     } catch (error) {
// //         console.error('Error uploading and converting image:', error.message);
// //         res.status(500).json({ message: 'Error uploading and converting image', error: error.message });
// //     }
// // });

// // module.exports = router;

// ////////////////////////////////////
// const express = require('express');
// const fs = require('fs');
// const router = express.Router();
// const sharp = require('sharp');
// const path = require('path');
// const multer = require('multer');
// const OrderModel = require('../Model/Ordermodel'); // Ensure this path is correct
// const { deleteFileSync } = require('../Model/util/fileUtils'); // Import the utility function

// // Directory where your input images are stored inside public
// const inputDir = path.join(__dirname, '..', 'public', 'uploads');
// // Directory where your converted images are stored inside public
// const outputDir = path.join(__dirname, '..', 'public', 'laundryimage');

// // Ensure directories exist
// const ensureDirExists = (dir) => {
//     if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//     }
// };
// ensureDirExists(inputDir);
// ensureDirExists(outputDir);

// // Set up multer for file uploads
// const upload = multer({ dest: inputDir });

// router.post('/pickup-uploadImage', upload.single('image'), async (req, res) => {
//     try {
//         if (!req.file) {
//             console.error('No image uploaded');
//             return res.status(400).json({ message: 'No image uploaded' });
//         }
//         const { order_id, field } = req.body;
//         const imagePath = req.file.path;

//         // Get the current timestamp
//         const timestamp = Date.now();

//         // Query the database to determine the next sequence number for the image
//         const order = await OrderModel.findOne({ order_id: order_id });
//         if (!order) {
//             console.error('Order not found');
//             return res.status(404).json({ message: 'Order not found' });
//         }
//         let sequence = 1;
//         const images = field === 'collection' ? order.collection_image_url : order.delivery_image_url;
//         if (images) {
//             const imageCount = Array.isArray(images) ? images.length : 0;
//             sequence = imageCount + 1;
//         }

//         // Generate the filename using the timestamp, order_id, field, and sequence number
//         const filename = `${timestamp}_${order_id}_${field}_${sequence}.webp`;
//         const outputImagePath = path.join(outputDir, filename);

//         console.log('Output Image Path:', outputImagePath); // Log the path for debugging

//         // Convert the image to WebP format
//         try {
//             await sharp(imagePath)
//                 .webp({ quality: 80 })
//                 .toFile(outputImagePath);
//         } catch (sharpError) {
//             console.error('Sharp error:', sharpError.message);
//             throw sharpError; // Rethrow to be caught in the outer catch block
//         }

//         // Update the order with the new image URL
//         const imageUrl = `${process.env.BASE_URL}/laundryimage/${filename}`; // Keep the URL unchanged
//         const updateData = {};
//         if (field === 'collection') {
//             if (!order.collection_image_url) {
//                 updateData.collection_image_url = [imageUrl];
//             } else {
//                 order.collection_image_url.push(imageUrl);
//                 updateData.collection_image_url = order.collection_image_url;
//             }
//         } else if (field === 'delivery') {
//             if (!order.delivery_image_url) {
//                 updateData.delivery_image_url = [imageUrl];
//             } else {
//                 order.delivery_image_url.push(imageUrl);
//                 updateData.delivery_image_url = order.delivery_image_url;
//             }
//         }

//         // Update the order and return the updated order details
//         const updatedOrder = await OrderModel.findByIdAndUpdate(order._id, updateData, { new: true });
//         if (!updatedOrder) {
//             console.error('Failed to update order');
//             return res.status(500).json({ message: 'Failed to update order' });
//         }

//         // Delete the original image file
//         deleteFileSync(imagePath);

//         res.status(200).json({
//             message: 'Image uploaded and converted to WebP format',
//             imageUrl,
//             updatedOrder
//         });
//     } catch (error) {
//         console.error('Error uploading and converting image:', error.message);
//         res.status(500).json({ message: 'Error uploading and converting image', error: error.message });
//     }
// });

// module.exports = router;

//<--------------------------------

const express = require('express');
const fs = require('fs');
const router = express.Router();
const sharp = require('sharp');
const path = require('path');
const multer = require('multer');
const OrderModel = require('../Model/Ordermodel'); // Ensure this path is correct
const { deleteFile } = require('../Model/util/fileUtils'); // Import the utility function

// Directory where your input images are stored inside public
const inputDir = path.join(__dirname, '..', 'public', 'uploads');
// Directory where your converted images are stored inside public
const outputDir = path.join(__dirname, '..', 'public', 'laundryimage');

// Ensure directories exist
const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
ensureDirExists(inputDir);
ensureDirExists(outputDir);

// Set up multer for file uploads
const upload = multer({ dest: inputDir });

router.post('/pickup-uploadImage', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            console.error('No image uploaded');
            return res.status(400).json({ message: 'No image uploaded' });
        }
        const { order_id, field } = req.body;
        const imagePath = req.file.path;

        // Get the current timestamp
        const timestamp = Date.now();

        // Query the database to determine the next sequence number for the image
        const order = await OrderModel.findOne({ order_id: order_id });
        if (!order) {
            console.error('Order not found');
            return res.status(404).json({ message: 'Order not found' });
        }
        let sequence = 1;
        const images = field === 'collection' ? order.collection_image_url : order.delivery_image_url;
        if (images) {
            const imageCount = Array.isArray(images) ? images.length : 0;
            sequence = imageCount + 1;
        }

        // Generate the filename using the timestamp, order_id, field, and sequence number
        const filename = `${timestamp}_${order_id}_${field}_${sequence}.webp`;
        const outputImagePath = path.join(outputDir, filename);

        console.log('Output Image Path:', outputImagePath); // Log the path for debugging

        // Convert the image to WebP format
        try {
            await sharp(imagePath)
                .webp({ quality: 80 })
                .toFile(outputImagePath);
        } catch (sharpError) {
            console.error('Sharp error:', sharpError.message);
            throw sharpError; // Rethrow to be caught in the outer catch block
        }

        // Update the order with the new image URL
        const imageUrl = `${process.env.BASE_URL}/laundryimage/${filename}`; // Keep the URL unchanged
        const updateData = {};
        if (field === 'collection') {
            if (!order.collection_image_url) {
                updateData.collection_image_url = [imageUrl];
            } else {
                order.collection_image_url.push(imageUrl);
                updateData.collection_image_url = order.collection_image_url;
            }
        } else if (field === 'delivery') {
            if (!order.delivery_image_url) {
                updateData.delivery_image_url = [imageUrl];
            } else {
                order.delivery_image_url.push(imageUrl);
                updateData.delivery_image_url = order.delivery_image_url;
            }
        }

        // Update the order and return the updated order details
        const updatedOrder = await OrderModel.findByIdAndUpdate(order._id, updateData, { new: true });
        if (!updatedOrder) {
            console.error('Failed to update order');
            return res.status(500).json({ message: 'Failed to update order' });
        }

        // Delete the original image file
        deleteFile(imagePath);

        res.status(200).json({
            message: 'Image uploaded and converted to WebP format',
            imageUrl,
            updatedOrder
        });
    } catch (error) {
        console.error('Error uploading and converting image:', error.message);
        res.status(500).json({ message: 'Error uploading and converting image', error: error.message });
    }
});

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const sharp = require('sharp');
// const fs = require('fs');
// const path = require('path');
// const { promisify } = require('util');
// const OrderModel = require('../Model/Ordermodel'); // Ensure this path is correct
// const multer = require('multer');
// // Directory where your input images are stored inside public
// const inputDir = path.join(__dirname, '..', 'public', 'uploads');
// // Directory where your converted images are stored inside public
// const outputDir = path.join(__dirname, '..', 'public', 'laundryimage');

// // Ensure directories exist
// const ensureDirExists = (dir) => {
//     if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//     }
// };

// ensureDirExists(inputDir);
// ensureDirExists(outputDir);

// // Set up multer for file uploads
// const upload = multer({ dest: inputDir });

// // Promisify fs.unlink for easier async/await usage
// const unlinkAsync = promisify(fs.unlink);

// router.post('/pickup-uploadImage', upload.single('image'), async (req, res) => {
//     try {
//         if (!req.file) {
//             console.error('No image uploaded');
//             return res.status(400).json({ message: 'No image uploaded' });
//         }

//         const { order_id, field } = req.body;
//         const imagePath = req.file.path;

//         // Get the current timestamp
//         const timestamp = Date.now();

//         // Query the database to determine the next sequence number for the image
//         const order = await OrderModel.findOne({ order_id: order_id });
//         if (!order) {
//             console.error('Order not found');
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         let sequence = 1;
//         const images = field === 'pick' ? order.collection_image_url : order.delivery_image_url;
//         if (images) {
//             const imageCount = Array.isArray(images) ? images.length : 0;
//             sequence = imageCount + 1;
//         }

//         // Generate the filename using the timestamp, order_id, field, and sequence number
//         const filename = `${timestamp}_${order_id}_${field}_${sequence}.webp`;
//         const outputImagePath = path.join(outputDir, filename);

//         console.log('Output Image Path:', outputImagePath); // Log the path for debugging

//         // Convert the image to WebP format
//         try {
//             await sharp(imagePath)
//                 .webp({ quality: 80 })
//                 .toFile(outputImagePath);
//         } catch (sharpError) {
//             console.error('Sharp error:', sharpError.message);
//             throw sharpError; // Rethrow to be caught in the outer catch block
//         }

//         // Update the order with the new image URL
//         const imageUrl = `https://newlaundryapp.demodev.shop/laundryimage/${filename}`;
//         const updateData = {};
//         if (field === 'pick') {
//             if (!order.collection_image_url) {
//                 updateData.collection_image_url = [imageUrl];
//             } else {
//                 order.collection_image_url.push(imageUrl);
//                 updateData.collection_image_url = order.collection_image_url;
//             }
//         } else if (field === 'delivery') {
//             if (!order.delivery_image_url) {
//                 updateData.delivery_image_url = [imageUrl];
//             } else {
//                 order.delivery_image_url.push(imageUrl);
//                 updateData.delivery_image_url = order.delivery_image_url;
//             }
//         }

//         // Update the order and return the updated order details
//         const updatedOrder = await OrderModel.findByIdAndUpdate(order._id, updateData, { new: true });
//         if (!updatedOrder) {
//             console.error('Failed to update order');
//             return res.status(500).json({ message: 'Failed to update order' });
//         }

//         // Delete the original image file
//         await unlinkAsync(imagePath);

//         res.status(200).json({
//             message: 'Image uploaded and converted to WebP format',
//             imageUrl,
//             updatedOrder
//         });
//     } catch (error) {
//         console.error('Error uploading and converting image:', error.message);
//         res.status(500).json({ message: 'Error uploading and converting image', error: error.message });
//     }
// });
// module.exports = router;