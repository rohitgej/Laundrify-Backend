const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const AdminModel = require('../Model/Adminloginmodel'); // Adjust the path accordingly
const OrderModel = require('../Model/Ordermodel'); // Adjust the path accordingly
const RunnerModel = require('../Model/Runner'); // Adjust the path accordingly

const router = express.Router();
const otpStore = {}; 
// Admin Registration Route
router.post('/admin-register', async (req, res) => {
  const { email_id, username, password, role } = req.body;

  // Check if all required fields are provided
  if (!email_id || !username || !password || !role) {
      return res.status(400).json({ message: 'Email, Username, Password, and role are required' });
  }

  try {
      // Normalize username to lowercase for consistent storage and comparison
      const normalizedUsername = username.toLowerCase();

      // Check if the admin with the given username already exists
      const existingAdmin = await AdminModel.findOne({ username: normalizedUsername });
      
      // Log the result for debugging purposes
      console.log('Existing Admin:', existingAdmin);

      // If an admin with the given username already exists, return an error
      if (existingAdmin) {
          return res.status(400).json({ message: 'Admin with this username already exists' });
      }

      // Hash the password using bcrypt for secure storage
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new admin record with the provided details
      const newAdmin = new AdminModel({
          email_id, // Email ID as per your schema
          username: normalizedUsername,
          password: hashedPassword,
          role, // Include the role in the new admin record
      });

      // Save the new admin record to the database
      await newAdmin.save();

      // Send a success response
      res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
      // Log any errors encountered during the process
      console.error('Error registering admin:', error.message);

      // Send an error response with the error message
      res.status(500).json({ message: 'Error registering admin', error: error.message });
  }
});

// Admin Login Route
// Admin Login Route
router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Check if the admin exists
    const admin = await AdminModel.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { admin_id: admin._id, username: admin.username }, // Payload
      'secret', // Secret key (you should keep this secure and use environment variables)
      { expiresIn: '1h' } // Token expiration time
    );

    // Respond with success message and token
    res.status(200).json({
      message: 'Login successful',
      token: token, // Return the token
      _id: admin._id, // Optionally include the admin_id in the response
      username: admin.username, // Optionally include the username in the response
      role:admin.role   
    });
    
  } catch (error) {
    console.error('Error logging in admin:', error.message);
    res.status(500).json({ message: 'Error logging in admin', error: error.message });
  }
});

//  forgot password section and reset password section 

// const transporter = nodemailer.createTransport({
//   host: 'smtp.hostinger.com',
//   port: 465,
//   secure: true, // true for 465, false for other ports
//   auth: {
//       user: 'raswathy2000@gmail.com', // Your email address
//       pass: 'DpFqdA@sdfdsf9ZSV5kYS'  // Your email password
//   }
// });

// // Function to generate a 6-digit OTP
// const generateOTP = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

// // Function to send OTP via email
// const sendOTP = async (email, otp) => {
//   const html = `
//       <div>
//           <h1>Your OTP Code</h1>
//           <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
//           <p>Please use this code to complete your authentication. This OTP is valid for 5 minutes.</p>
//       </div>
//   `;

//   try {
//       await transporter.sendMail({
//           from: 'mailtool@devdemos.in',
//           to: 'raswathy2000@gmail.com', // Dynamic recipient email
//           subject: "Your OTP Code",
//           html: html,
//       });
//       console.log(`OTP sent successfully to ${email}`);
//       return true;
//   } catch (error) {
//       console.error('Error sending OTP email:', error);
//       return false;
//   }
// };

// // Function to validate OTP
// const validateOTP = (email, otp) => {
//   const storedOTP = otpStore[email];
//   if (!storedOTP || storedOTP.expiresAt < Date.now()) {
//       delete otpStore[email]; // Remove expired OTP
//       return false;
//   }
//   if (storedOTP.otp !== otp) {
//       return false;
//   }
//   delete otpStore[email]; // Remove OTP after successful validation
//   return true;
// };

// API endpoint for handling OTP generation and validation
// Function to generate a 4-digit OTP

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit OTP
};

router.post('/otp-sending-toadmin', async (req, res) => {
  const { email } = req.body;

  if (email) {
    try {
      // Generate OTP
      const newOtp = generateOTP();
      const otpExpires = Date.now() + 300000; // OTP valid for 5 minutes

      // Find admin by email and update OTP and expiration time
      let admin = await AdminModel.findOne({ email_id: email });
      if (admin) {
        admin.otp = newOtp;
        admin.otpExpires = otpExpires;
        await admin.save();
      } else {
        // If admin not found, create a new record
        admin = new AdminModel({
          email_id: email,
          otp: newOtp,
          otpExpires: otpExpires
        });
        await admin.save();
      }

      // Optionally, you could also send the OTP via email or other means here
      // await sendOTP(email, newOtp);

      // Return a success message
      res.status(200).send({ message: 'OTP generated and stored successfully', otp: newOtp });
    } catch (error) {
      res.status(500).send({ message: 'Error generating or storing OTP', error });
    }
  } else {
    res.status(400).send({ message: 'Email is required' });
  }
});

// otp validation
 router.post('/verify-otp', async (req, res) => {
  const { email_id, otp } = req.body;

  try {
    // Find the user by email
    const user = await AdminModel.findOne({ email_id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Check if the OTP matches and is not expired
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }
    // OTP is valid and not expired
    // Proceed with further actions, like activating the account, etc.
    
    // Clear the OTP and its expiration time after successful verification
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});
 // API endpoint to reset password after OTP validation

 router.post('/admin-resetpassword', async (req, res) => {
  const { newPassword, confirmPassword, email } = req.body;

  // Check if newPassword and confirmPassword are the same
  if (newPassword !== confirmPassword) {
    return res.status(400).send({ message: 'Passwords do not match' });
  }

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the admin password in the database
    const admin = await AdminModel.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!admin) {
      return res.status(404).send({ message: 'Admin not found' });
    }

    res.status(200).send({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error resetting password', error });
  }
});
// View Admin profile 

router.post('/view_adminprofile', async (req, res) => {
  try {
    // Extract admin ID from JSON body
    const { _id } = req.body;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: 'Invalid admin ID' });
    }

    // Find the admin profile by ID
    const admin = await AdminModel.findById(_id);

    // Check if the admin was found
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Return the admin profile
    res.status(200).json({
      username: admin.username,
      email_id: admin.email_id,
      role: admin.role,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Assigning the runner for orders 

// router.put('/assignRunner', async (req, res) => {
//   const { order_id, runner_id, runner_mobile_no, delivery_type } = req.body;

//   if (!order_id) {
//     return res.status(400).json({ message: 'Please provide order_id' });
//   }

//   try {
//     // Validate runner_id if provided
//     if (runner_id !== undefined) {
//       const runnerExists = await RunnerModel.findOne({ runner_id });
//       if (!runnerExists) {
//         return res.status(400).json({ message: 'Invalid runner_id' });
//       }
//     }
//     // Construct the update fields based on provided data
//     const updateFields = {};

//     if (runner_id !== undefined) updateFields.runner_id = runner_id;
//     if (runner_mobile_no !== undefined) updateFields.runner_mobile_no = runner_mobile_no;
//     if (delivery_type !== undefined) updateFields.delivery_type = delivery_type;

//     // Update the order based on order_id and return only the specified fields
//     const updatedOrder = await OrderModel.findOneAndUpdate(
//       { order_id },
//       { $set: updateFields },
//       {
//         new: true,
//         fields: 'order_id user_id mobile_no name address pickup_date timeslot delivery_status payment runner_id runner_mobile_no delivery_type' // Project the required fields
//       }
//     );

//     if (!updatedOrder) {
//       return res.status(404).json({ message: 'Order not found' });
//     }
//     res.status(200).json({
//       message: 'Runner assigned successfully',
//       order: updatedOrder
//     });
//   } catch (error) {
//     console.error('Error in assigning runner:', error.message);
//     res.status(500).json({ message: 'Error assigning runner', error: error.message });
//   }
// });

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

router.put('/update_admin', verifyToken, async (req, res) => {
  const { _id, email_id,username } = req.body;

  if (!_id) {
    return res.status(400).json({ message: 'Please provide both _id and email_id' });
  }

  try {
    // Find the user by _id and update the email_id
    const updatedUser = await AdminModel.findByIdAndUpdate(
      _id, // Pass _id directly
      {username:username},
      { email_id: email_id },

      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Email updated successfully',
      _id: updatedUser._id,
      username: updatedUser.username,
      email_id: updatedUser.email_id,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error('Error updating email:', error.message);
    res.status(500).json({ message: 'Error updating email', error: error.message });
  }
});

router.put('/assignRunner', verifyToken, async (req, res) => {
  const { order_id, runner_id, runner_mobile_no, delivery_type } = req.body;

  if (!order_id) {
    return res.status(400).json({ message: 'Please provide order_id' });
  }

  try {
    // Validate runner_id if provided
    if (runner_id !== undefined) {
      const runnerExists = await RunnerModel.findOne({ runner_id });
      if (!runnerExists) {
        return res.status(400).json({ message: 'Invalid runner_id' });
      }
    }

    // Construct the update fields based on provided data
    const updateFields = {};

    if (runner_id !== undefined) updateFields.runner_id = runner_id;
    if (runner_mobile_no !== undefined) updateFields.runner_mobile_no = runner_mobile_no;
    if (delivery_type !== undefined) updateFields.delivery_type = delivery_type;

    // Update the order based on order_id and return only the specified fields
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { order_id },
      { $set: updateFields },
      {
        new: true,
        fields: 'order_id user_id mobile_no name address pickup_date timeslot delivery_status payment runner_id runner_mobile_no delivery_type' // Project the required fields
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json({
      message: 'Runner assigned successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error in assigning runner:', error.message);
    res.status(500).json({ message: 'Error assigning runner', error: error.message });
  }
});

router.put('/updateOrder', verifyToken,async (req, res) => {
  const { order_id, delivery_status } = req.body;

  // Get the valid delivery status values from the schema
  const validDeliveryStatuses = Object.keys(OrderModel.getDeliveryStatusMap()).map(Number);

  if (!order_id || delivery_status === undefined) {
      return res.status(400).json({ message: 'Please provide order_id and delivery_status' });
  }

  // Check if the provided delivery_status is valid
  if (!validDeliveryStatuses.includes(delivery_status)) {
      return res.status(400).json({ 
          message: 'Invalid delivery status. The valid statuses are:',
          validStatuses: validDeliveryStatuses
      });
  }

  try {
      // Find the order by order_id
      const order = await OrderModel.findOne({ order_id });

      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }

      // Check if the new delivery_status is greater than the current one
      if (delivery_status <= order.delivery_status) {
          return res.status(400).json({ 
              message: 'Cannot update to a previous or the same delivery status',
              current_status: order.delivery_status,
              attempted_status: delivery_status
          });
      }

      // Proceed with the update since the new status is valid
      const updatedOrder = await OrderModel.findOneAndUpdate(
          { order_id },

          
          { $set: { delivery_status } },
          {
              new: true,
              select: '_id order_id user_id mobile_no name address pickup_date timeslot delivery_status payment'
          }
      );
      res.status(200).json({
          message: 'Order updated successfully',
          order: updatedOrder
      });
  } catch (error) {
      console.error('Error updating order:', error.message);
      res.status(500).json({ message: 'Error updating order', error: error.message });
  }
});
//updating the runner location automatically 
router.put('/updateRunnerLocation', async (req, res) => {
    const { order_id, coordinates } = req.body;
  
    // Validate input
    if (!order_id || !coordinates || !coordinates.latitude || !coordinates.longitude) {
      return res.status(400).json({ message: 'Please provide order_id and valid coordinates' });
    }
  
    try {
      // Update the runner_location field based on order_id
      const updatedOrder = await OrderModel.findOneAndUpdate(
        { order_id },
        { $set: { 'runner_location.coordinates': coordinates } },
        { new: true } // Return the updated document
      );
  
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      res.status(200).json({
        message: 'Runner location updated successfully',
        order: updatedOrder
      });
  
    } catch (error) {
      console.error('Error updating runner location:', error.message);
      res.status(500).json({ message: 'Error updating runner location', error: error.message });
    }
  });

// fetch all the orders associated with a perticular delivery partner
router.post('/getRunnerOrders', async (req, res) => {
    const { runner_id } = req.body;

    try {
        if (runner_id) {
            // Find all orders associated with the runner's mobile number
            const orders = await OrderModel.find({ runner_id });

            if (!orders || orders.length === 0) {
                return res.status(404).json({ message: 'No orders found for this runner' });
            }

            // Return details of the orders
            return res.status(200).json({ orders });
        } else {
            return res.status(400).json({ message: 'runner_mobile_no is required' });
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// Update Payment status by admin 
router.put('/update_paymentstatus', verifyToken, async (req, res) => {
    const { order_id, payment_status   } = req.body;
  
    if (!order_id || !payment_status) {
        return res.status(400).json({ message: 'Please provide order_id  and payment_status'  });
    }
  
    try {
        // Construct the update fields based on provided data
        const updateFields = {};
  
        if (payment_status !== undefined) updateFields.payment_status = payment_status;
    
        // Update the order based on order_id and return only the specified fields
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { order_id },
            { $set: updateFields },
            {
                new: true,
                select: 'order_id user_id mobile_no name address pickup_date timeslot delivery_status payment runner_id runner_mobile_no delivery_type payment_status ' // Project the required fields
            }
        );
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({
            message: 'Payment status updated  successfully',
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error in updating payment status :', error.message);
        res.status(500).json({ message: 'updating payment status ', error: error.message });
    }
  });
  
module.exports = router;