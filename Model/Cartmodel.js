const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemModel', required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'categoryModel', required: true },
    id_laundrytype: { type: mongoose.Schema.Types.ObjectId, ref: 'Laundrytypemodel', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0 }

});

const cartSchema = new mongoose.Schema({
    token: { type: Number, required: true },
    user_id: { type: String, required: true }, // Assuming user_id is stored as a string
    items: [cartItemSchema],
    total_price: { type: Number, default: 0 },
    total_weight: { type: Number, default: 0 },
    discount: { type: Number },
    pay_after_discount: { type: Number},
    delivery_charge:{ type: Number  },
     total: { type: Number, default: 0 },
    couponApplied: { type: Boolean, default: false }
});

let CartModel;
if (mongoose.models.Cart) {
    CartModel = mongoose.model('Cart');
} else {
    CartModel = mongoose.model('Cart', cartSchema);
}
module.exports = CartModel;

