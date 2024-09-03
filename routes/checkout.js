const express = require('express');
const OrderModel = require('../Model/Ordermodel');
const CartModel = require('../Model/Cartmodel');
const mongoose = require('mongoose');
const Transaction = require('../Model/Transactionmodel');
const UserModel = require('../Model/Usermodel');
const Timeslot = require('../Model/Timeslotmodel');
const getNextOrderNumber = require('../Model/util/orderUtils');

const router = express.Router();
// Checkout product from cart
router.post('/checkout', async (req, res) => {
  const { user_id, token, mobile_no, name, address, payment, remark, pickup_date, timeslot } = req.body; // Payment is the transaction ID

  // Validate required fields
  if (!user_id || !token || !mobile_no || !name || !address || !payment || !timeslot) {
      return res.status(400).json({ message: 'Please provide all required fields' });
  }
  try {
      // Find the user's cart
      const cart = await CartModel.findOne({ user_id });

      if (!cart || cart.items.length === 0) {
          return res.status(400).json({ message: 'Cart is empty or not found' });
      }

      // Validate the transaction method (payment)
      const transactionMethod = await Transaction.findById(payment);
      if (!transactionMethod) {
          return res.status(400).json({ message: 'Invalid payment method' });
      }

      // Fetch the user and ensure the address exists
      const user = await UserModel.findById(user_id);
      if (!user) {
          return res.status(400).json({ message: 'User not found' });
      }

      // Convert address to ObjectId
      const addressId = new mongoose.Types.ObjectId(address);

      // Check if the address ID exists in the user's addresses array
      const userAddress = user.addresses.find(addr => addr._id.toString() === addressId.toString());
      if (!userAddress) {
          return res.status(400).json({ message: 'Invalid address' });
      }

      // Validate the timeslot using _id
      const timeslotId = new mongoose.Types.ObjectId(timeslot);
      const validTimeslot = await Timeslot.findById(timeslotId);
      if (!validTimeslot) {
          return res.status(400).json({ message: 'Invalid timeslot' });
      }

      const order_id = new mongoose.Types.ObjectId(); // Create a new ObjectId
      const order_date = new Date();

      // Use the total price directly from the cart
      const total = cart.total_price; // Use the stored total price

      // Get the next customer order number
      const customerOrderNumber = await getNextOrderNumber();

      // Create a new order
      const order = new OrderModel({
          order_id,
          Customer_OrderNumber: customerOrderNumber, // Set the customer order number
          user_id,
          mobile_no,
          name,
          address: addressId, // Store address as ObjectId
          items: cart.items,
          order_date,
          total,
          payment, // Store payment as transaction_id
          delivery_status: 1, // Set to 1 for "Ordered"
          remark,
          pickup_date,
          timeslot: timeslotId // Store the timeslot as an ObjectId
      });

      // Save the order
      await order.save();

      // Clear the cart after checkout
      await CartModel.findOneAndUpdate(
          { user_id },
          {
              $set: {
                  items: [],
                  discount: 0,
                  total_price: 0,
                  total_weight: 0,
                  pay_after_discount: 0,
                  delivery_charge: 0,
                  couponApplied: false,
              },
          }
      );

      // Respond with success message and order details
      res.status(201).json({
          message: 'Order placed successfully',
          order: {
              order_id: order.order_id,
              Customer_OrderNumber: order.Customer_OrderNumber, // Include customer order number in response
              user_id: order.user_id,
              mobile_no: order.mobile_no,
              name: order.name,
              address: order.address,
              payment: order.payment,
              pickup_date: order.pickup_date,
              timeslot: order.timeslot,
              delivery_status: OrderModel.getDeliveryStatusMap()[order.delivery_status] // Include readable delivery status
          },
      });
  } catch (error) {
      console.error('Error during checkout:', error.message);
      res.status(500).json({ message: 'Error during checkout', error: error.message });
  }
});

// Fetching a perticular Order 

router.post('/getcheckout', async (req, res) => {
  const { order_id } = req.body;

  try {
      if (order_id) {
          const order = await OrderModel.findOne({ order_id });

          if (!order) {
              return res.status(404).json({ message: 'Order not found' });
          }

          // Fetch user details to get the address coordinates
          const user = await UserModel.findById(order.user_id);

          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }

          // Find the specific address by ID
          const address = user.addresses.find(address => address._id.toString() === order.address.toString());

          if (!address) {
              return res.status(404).json({ message: 'Address not found' });
          }

          // Include coordinates in the order response
          const orderWithAddress = {
              ...order.toObject(),
              address: {
                  id: order.address,
                  fullAddress: address.address,
                  coordinates: address.coordinates
              }
          };

          return res.status(200).json({ order: orderWithAddress });
      } else {
          const orders = await OrderModel.find();
          return res.status(200).json({ orders });
      }
  } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// router.get('/getcheckout', async (req, res) => {
//   const { order_id } = req.query; // Use req.query for GET requests

//   try {
//     if (order_id) {
//       const order = await OrderModel.findOne({ order_id });

//       if (!order) {
//         return res.status(404).json({ message: 'Order not found' });
//       }

//       const user = await UserModel.findById(order.user_id);

//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }

//       const address = user.addresses.find(address => address._id.toString() === order.address.toString());

//       if (!address) {
//         return res.status(404).json({ message: 'Address not found' });
//       }

//       const orderWithAddress = {
//         ...order.toObject(),
//         address: {
//           id: order.address,
//           fullAddress: address.address,
//           coordinates: address.coordinates
//         }
//       };

//       return res.status(200).json({ order: orderWithAddress });
//     } else {
//       const orders = await OrderModel.find();
//       return res.status(200).json({ orders });
//     }
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     return res.status(500).json({ message: 'Error fetching orders', error: error.message });
//   }
// });


// Deleting an order from user side 
router.delete('/deleteOrder', async (req, res) => {
    const { order_id } = req.body;
    if (!order_id) {
        return res.status(400).json({ message: 'Please provide order_id' });
    }
    try {
        const order = await OrderModel.findOneAndDelete({ order_id: new mongoose.Types.ObjectId(order_id) });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order deleted successfully', order });
    } catch (error) {
        console.error('Error deleting order:', error.message); // Log the specific error message
        res.status(500).json({ message: 'Error deleting order', error: error.message });
    }
});

// Creating a path between user and runner in map to trac the location
router.post('/getrunner-userlocation', async (req, res) => {
    try {
      // Extract the order ID and user ID from the request body
      const { orderId, userId } = req.body;
  
      // Validate that both orderId and userId are provided
      if (!orderId || !userId) {
        return res.status(400).json({ message: 'Order ID and User ID are required' });
      }
  
      // Convert orderId and userId to mongoose ObjectIds if they aren't already
      const orderObjectId = new mongoose.Types.ObjectId(orderId);
      const userObjectId = new mongoose.Types.ObjectId(userId);
  
      // Find the order by order_id and ensure the user_id matches
      const order = await OrderModel.findOne({ order_id: orderObjectId, user_id: userObjectId }, 'runner_location address');
  
      // Check if the order exists
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      // Fetch the user to get the address coordinates
      const user = await UserModel.findById(userObjectId, 'addresses');
  
      // Check if the user exists
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Find the address coordinates using the order's address field
      const userAddress = user.addresses.find(address => address._id.equals(order.address));
  
      // Check if the address is found
      if (!userAddress) {
        return res.status(404).json({ message: 'User address not found' });
      }
  
      // Prepare the response with both runner and user location coordinates
      const response = {
        runner_location: order.runner_location,
        user_address_coordinates: {
          latitude: userAddress.coordinates.latitude,
          longitude: userAddress.coordinates.longitude,
          latitudeDelta: userAddress.coordinates.latitudeDelta,
          longitudeDelta: userAddress.coordinates.longitudeDelta,
        },
      };
  
      // Return the response
      res.json(response);
    } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// Fetching all the orders   
router.post('/allorder', async (req, res) => {
  try {
    const userId = req.body.user_id;

    // Validate user_id
    if (!userId) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    // Debugging output
    console.log('Searching for orders with userId:', userId);

    // Fetch orders for the user and populate items
    const orders = await OrderModel.find({ user_id: userId }).populate('items', 'item_id');

    // Debugging output
    console.log('Fetched orders:', orders);

    const formattedOrders = orders.map((order) => {
      const itemIds = order.items.map((item) => item.item_id);
      const firstItemId = itemIds[0] || null;

      return {
        order_id: order.order_id,
        items: [firstItemId], 
        number_of_items: itemIds.length,
        delivery_status: order.delivery_status, 
        order_date: order.order_date,
        customer_order_number: order.Customer_OrderNumber,
      };
    });

    res.status(200).json({
      message: 'Orders fetched successfully',
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching user orders' });
  }
});

module.exports = router;