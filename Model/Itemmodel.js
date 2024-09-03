const mongoose = require('mongoose');

const laundryTypeSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Laundrytypemodel', required: true },
    price: { type: Number, required: true }
});

const itemSchema = new mongoose.Schema({
    item_name: { type: String, required: true,unique: true },
    item_image: { type: String, required: false },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'categoryModel', required: true },
    item_weight: { type: String, required: true },
    id_laundrytype: [laundryTypeSchema] // Array of laundry types with prices
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
