// const mongoose = require('mongoose');

// const categorySchema = new mongoose.Schema({
//   category_name: { type: String, required: true, unique: true }
// });

// const Category = mongoose.model('Category', categorySchema);

// module.exports = Category;

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category_name: { 
    type: String, 
    required: true, 
    unique: true 
  }
});

// Apply a case-sensitive collation index on the category_name field
categorySchema.index({ category_name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
