const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('./db'); 
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const Nexmo = require('nexmo');

// Import routes
const laundrytypeRoute = require('./routes/laundrytype');
const categoryRoute = require('./routes/category');
const itemRoute = require('./routes/item');
const userRoute = require('./routes/user');
const cartRoute = require('./routes/cart');
const runnerRoute = require('./routes/runner');
const checkoutRoute = require('./routes/checkout');
const CouponCodeRoute = require('./routes/couponcode');
const adminRoute = require('./routes/admin');
const ImageuploadRoute = require('./routes/imageupload'); 
const textRoute = require('./routes/text');
const TransactionmethodRoute = require('./routes/transaction');
const TimeslotRoute = require('./routes/timeslot');
const NotificationRoute = require('./routes/notification');
const SupportRoute = require('./routes/support');
const CustomersupportandFAQsRoute = require('./routes/CustomersupportandFAQs');
const WishlistRoute = require('./routes/wishlist');
// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Setup multer for file uploads
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });

// Define routes
app.use('/api', userRoute);
app.use('/api', laundrytypeRoute);
app.use('/api', categoryRoute);
app.use('/api', itemRoute);
app.use('/api', cartRoute);
app.use('/api', checkoutRoute);
app.use('/api', CouponCodeRoute);
app.use('/api', adminRoute);
app.use('/api', runnerRoute);
app.use('/api', ImageuploadRoute); // Ensure this route is correctly set up in `routes/imageupload.js`
app.use('/api', textRoute);
app.use('/api', TransactionmethodRoute);
app.use('/api', TimeslotRoute);
app.use('/api', NotificationRoute);
app.use('/api', SupportRoute);
app.use('/api', CustomersupportandFAQsRoute);
app.use('/api', WishlistRoute);
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve converted images
app.use('/converted', express.static(path.join(__dirname, 'public', 'laundryimage'))); // Update path to correct directory
app.get('/converted/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const options = {
        root: path.join(__dirname, 'public', 'laundryimage'), // Adjust the root to point to the correct directory
    };

    res.sendFile(imageName, options, (err) => {
        if (err) {
            console.error(err);
            res.status(404).send('Image not found');
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
