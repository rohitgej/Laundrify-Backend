const mongoose = require('mongoose');

// Define the coupon code schema
const couponCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 50 },
    isActive: { type: Boolean, default: true }
});

// Check if the model already exists before defining it
const CouponCode = mongoose.models.CouponCode || mongoose.model('CouponCode', couponCodeSchema);

module.exports = CouponCode;
