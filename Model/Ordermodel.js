const mongoose = require('mongoose');

// Define the schema for items
const itemSchema = new mongoose.Schema({
    item_id: String,
    category_id: String,
    id_laundrytype: String,
    quantity: Number,
    price: Number,
    weight: Number
});

const orderSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    Customer_OrderNumber: {
        type: Number,
        required: true,
        default: 100, 
    },
    user_id: {
        type: String,
        required: true
    },
    mobile_no: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    remark: {
        type: String

    },
    items: [itemSchema],
    order_date: {
        type: Date,
        default: Date.now
    },
    total: {
        type: Number,
        required: true
    },
    pickup_date: {
        type: Date,
        required: true
    },
    timeslot: {
        type: String,
        required: true
    },
    delivery_type: {
        type: String,
        enum: ['pickup', 'delivery'], // Ensure only 'pickup' or 'delivery' are allowed
    },
    payment_status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled', 'return'], // Allowed payment statuses
        default: 'pending' // Default value can be set if needed
    },
    runner_id: {    // New field added
        type: String,
        ref: 'Runner', // Reference to the Runner model
        required: false  // Optional field; set to true if it must always be present
    },
    runner_mobile_no: String,
    runner_location: {
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number },
            latitudeDelta: { type: Number },
            longitudeDelta: { type: Number }
        }
    },
    delivery_status: {
        type: Number,  // Change to Number to store the status code
        default: 1     // Default to 1 (Ordered)
    },
    payment: {
        type: String,
        required: true
    },
    collection_image_url: {
        type: [String],
        required: false
    },
    collection_remark: {
        type: String,
        required: false
    },
    delivery_image_url: {
        type: [String],
        required: false
    },
    delivery_remark: {
        type: String,
        required: false
    },
});

// Add a static method to the schema for delivery status mapping
orderSchema.statics.getDeliveryStatusMap = function() {
    return {
        1: 'Ordered',      // Default
        2: 'Order Accepted',
        3: 'Ready To Picked Up',  
        4: 'Picked Up', 
        5: 'Progress', 
        6: 'Out for Delivery',
        7: 'Delivered',
        8:'Cancelled'

    };
};

const OrderModel = mongoose.model('Order', orderSchema);
module.exports = OrderModel;