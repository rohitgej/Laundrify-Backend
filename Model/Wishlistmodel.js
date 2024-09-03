const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
    item_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    id_laundrytype: { type: mongoose.Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: false }
});

const wishlistSchema = new mongoose.Schema({
    token: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    items: [wishlistItemSchema]
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
