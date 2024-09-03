const express = require('express');
const RunnerModel = require('../Model/Runner');
const RunnerIdSequence = require('../Model/util/runnerutil');
const router = express.Router();

// Runner Registration --> '/runner-registration'
// Function to generate a 4-digit OTP
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Function to get the next runner ID sequence value and format it as D0001, D0002, etc.
const getNextRunnerSequenceValue = async () => {
  const sequence = await RunnerIdSequence.findOneAndUpdate(
    { _id: 'runner_id' }, // Identifier for the runner ID sequence
    { $inc: { sequence_value: 1 } }, // Increment the sequence value
    { new: true, upsert: true } // Return the updated document, create if not exists
  );
  
  const runnerId = `D${sequence.sequence_value.toString().padStart(4, '0')}`; // Format as D0001, D0002, etc.
  return runnerId;
};


router.post('/runner-registration', async (req, res) => {
  const { runner_mobile_no } = req.body;

  if (!runner_mobile_no) {
    return res.status(400).json({ message: 'Please provide Mobile number' });
  }

  try {
    const otp = generateOtp();
    let runner = await RunnerModel.findOne({ runner_mobile_no });

    if (runner) {
      // Runner already exists, update the OTP
      runner.otp = otp;
      await runner.save();
    } else {
      // Generate a unique runner_id
      const runner_id = await getNextRunnerSequenceValue();

      // Create a new runner with the generated OTP and runner_id
      runner = new RunnerModel({ runner_mobile_no, otp, runner_id });
      await runner.save();
    }

    // Optionally send OTP to the mobile number here

    res.status(201).json({
      message: 'Runner registered successfully, OTP sent',
      otp
    });
  } catch (error) {
    console.error('Error registering runner:', error);
    res.status(500).json({ message: 'Failed to register runner', error });
  }
});

// Runner Login Endpoint -->  '/runner-login'
router.post('/runner-login', async (req, res) => {
  const { runner_mobile_no, otp } = req.body;

  if (!runner_mobile_no || !otp) {
    return res.status(400).json({ message: 'Please provide Mobile number and OTP' });
  }

  try {
    let runner = await RunnerModel.findOne({ runner_mobile_no, otp });

    if (runner) {
      if (!runner.runner_id) {
        // Generate a new runner_id if it doesn't exist
        runner.runner_id = await getNextRunnerSequenceValue();
      }

      // Remove the OTP after successful login
      runner.otp = null; // Set OTP to null
      await runner.save();

      return res.status(200).json({
        message: 'Valid runner',
        runner_id: runner.runner_id
      });
    } else {
      return res.status(401).json({ message: 'Invalid mobile number or OTP' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error });
  }
});

// Update runner profile --> /update-runner

router.put('/update-runner', async (req, res) => {
  const { runner_id, runner_name, runner_mobile_no, runner_email_id } = req.body;

  if (!runner_id) {
    return res.status(400).json({ message: 'Please provide the runner ID to update runner details' });
  }

  try {
    const updatedFields = {};
    if (runner_mobile_no) updatedFields.runner_mobile_no = runner_mobile_no;
    if (runner_email_id) updatedFields.runner_email_id = runner_email_id;
    if (runner_name) updatedFields.runner_name = runner_name;

    // Validate if runner_id exists in the database
    const updatedRunner = await RunnerModel.findOneAndUpdate(
      { runner_id },
      updatedFields,
      { new: true }
    );

    if (!updatedRunner) {
      return res.status(404).json({ message: 'Runner not found' });
    }

    res.status(200).json({ message: 'Runner details are updated successfully', runner: updatedRunner });
  } catch (error) {
    console.error('Error updating runner:', error);
    res.status(500).json({ message: 'Error updating runner details', error });
  }
});

//fetching pickup orders of -->   '/fetchPickupOrders'
router.post('/fetchPickupOrders', async (req, res) => {
  const { runner_id } = req.body;

  if (!runner_id) {
      return res.status(400).json({ message: 'Please provide runner_id' });
  }

  try {
      // Ensure runner_id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(runner_id)) {
          return res.status(400).json({ message: 'Invalid runner_id' });
      }

      // Convert runner_id to ObjectId using new
      const objectId = new mongoose.Types.ObjectId(runner_id);

      // Fetch orders
      const pickupOrders = await OrderModel.find({
          runner_id: objectId,
          delivery_type: 'pickup'
      }).select('_id order_id user_id mobile_no name address remark items order_date pickup_date timeslot Customer_OrderNumber');

      if (pickupOrders.length === 0) {
          return res.status(404).json({ message: 'No pickup orders found for this runner' });
      }

      // Fetch timeslot details
      const timeslotIds = pickupOrders.map(order => order.timeslot);
      const timeslots = await TimeslotModel.find({ _id: { $in: timeslotIds } });

      // Create a map for quick lookup
      const timeslotMap = timeslots.reduce((acc, timeslot) => {
          acc[timeslot._id.toString()] = timeslot.Timeslot;
          return acc;
      }, {});

      // Format the response to include Timeslot and Customer_OrderNumber
      const formattedOrders = pickupOrders.map(order => ({
          _id: order._id,
          order_id: order.order_id,
          user_id: order.user_id,
          mobile_no: order.mobile_no,
          name: order.name,
          address: order.address,
          remark: order.remark,
          items: order.items.map(item => ({
              item_id: item.item_id,
              category_id: item.category_id,
              id_laundrytype: item.id_laundrytype,
              quantity: item.quantity,
              price: item.price,
              weight: item.weight,
              _id: item._id
          })),
          order_date: order.order_date,
          pickup_date: order.pickup_date,
          timeslot: timeslotMap[order.timeslot.toString()], // Include Timeslot field instead of Timeslot_name
          Customer_OrderNumber: order.Customer_OrderNumber // Ensure this field is included
      }));

      res.status(200).json({ pickupOrders: formattedOrders });
  } catch (error) {
      console.error('Error fetching pickup orders:', error.message);
      res.status(500).json({ message: 'Error fetching pickup orders', error: error.message });
  }
});

// fetching delivery order of runner '/fetchDeliveryOrders'
router.post('/fetchDeliveryOrders', async (req, res) => {
  const { runner_id } = req.body;

  if (!runner_id) {
    return res.status(400).json({ message: 'Please provide runner_id' });
  }

  try {
    // Ensure runner_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(runner_id)) {
      return res.status(400).json({ message: 'Invalid runner_id' });
    }

    // Convert runner_id to ObjectId using new
    const objectId = new mongoose.Types.ObjectId(runner_id);

    // Fetch delivery orders
    const deliveryOrders = await OrderModel.find({
      runner_id: objectId,
      delivery_type: 'delivery'
    }).select('_id order_id user_id mobile_no name address remark items order_date delivery_date timeslot Customer_OrderNumber');

    if (deliveryOrders.length === 0) {
      return res.status(404).json({ message: 'No delivery orders found for this runner' });
    }

    // Fetch timeslot details
    const timeslotIds = deliveryOrders.map(order => order.timeslot);
    const timeslots = await TimeslotModel.find({ _id: { $in: timeslotIds } });

    // Create a map for quick lookup
    const timeslotMap = timeslots.reduce((acc, timeslot) => {
      acc[timeslot._id.toString()] = timeslot.Timeslot;
      return acc;
    }, {});

    // Format the response to include Timeslot and Customer_OrderNumber
    const formattedOrders = deliveryOrders.map(order => ({
      _id: order._id,
      order_id: order.order_id,
      user_id: order.user_id,
      mobile_no: order.mobile_no,
      name: order.name,
      address: order.address,
      remark: order.remark,
      items: order.items.map(item => ({
        item_id: item.item_id,
        category_id: item.category_id,
        id_laundrytype: item.id_laundrytype,
        quantity: item.quantity,
        price: item.price,
        weight: item.weight,
        _id: item._id
      })),
      order_date: order.order_date,
      delivery_date: order.delivery_date,
      timeslot: timeslotMap[order.timeslot.toString()], // Include Timeslot field
      Customer_OrderNumber: order.Customer_OrderNumber // Ensure this field is included
    }));

    res.status(200).json({ deliveryOrders: formattedOrders });
  } catch (error) {
    console.error('Error fetching delivery orders:', error.message);
    res.status(500).json({ message: 'Error fetching delivery orders', error: error.message });
  }
});

// delete runner profile ---> '/deleterunner'

  router.delete('/deleterunner', async (req, res) => {
    const { runner_id } = req.body;
  
    if (!runner_id) {
      return res.status(400).json({ message: 'Please provide mobile_no  in the request body' });
    }
    try {
      const deleterunner = await RunnerModel.findOneAndDelete({ runner_id}); 
      if (!deleterunner) {
        return res.status(404).json({ message: 'Runner not found or already deleted' });
      }
  
      res.status(200).json({ message: 'Runner deleted successfully', Runner: deleterunner });
    } catch (error) {
      console.error('Error deleting Runner:', error);
      res.status(500).json({ message: 'Error deleting Runner', error });
    }
  });

// View runner -->  '/view-runners'
// router.post('/view-runners', async (req, res) => {
//   const { runner_id } = req.body; // Retrieve runner_id from the request body

//   try {
//     if (runner_id) {
//       // If runner_id is provided, fetch details for that specific runner
//       const runner = await RunnerModel.findOne({ runner_id });

//       if (!runner) {
//         return res.status(404).json({ message: 'Runner not found' });
//       }

//       return res.status(200).json({ runner });
//     } else {
//       // If no runner_id is provided, fetch all runners
//       const runners = await RunnerModel.find({});
      
//       return res.status(200).json({ runners });
//     }
//   } catch (error) {
//     console.error('Error fetching runners:', error.message);
//     res.status(500).json({ message: 'Error fetching runners', error: error.message });
//   }
// });

router.post('/view-runners', async (req, res) => {
  const { runner_id } = req.body; // Retrieve runner_id from the request body

  try {
    if (runner_id) {
      // If runner_id is provided, fetch details for that specific runner
      const runner = await RunnerModel.findOne({ runner_id });

      if (!runner) {
        return res.status(404).json({ message: 'Runner not found' });
      }

      return res.status(200).json({ runner });
    } else {
      // If no runner_id is provided, fetch all runners
      const runners = await RunnerModel.find({});
      
      return res.status(200).json({ runners });
    }
  } catch (error) {
    console.error('Error fetching runners:', error.message);
    res.status(500).json({ message: 'Error fetching runners', error: error.message });
  }
});


module.exports = router;
