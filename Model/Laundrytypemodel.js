// const mongoose = require('mongoose');

// const LaundrytypeSchema = new mongoose.Schema({
//   Laundrytype_name: { type: String, required: true, unique: true, index: { unique: true, collation: { locale: 'en', strength: 2 } } },
//   Laundrytype_image: { type: String, required: false }
// });

// const Laundrytype = mongoose.model('Laundrytype', LaundrytypeSchema);

// module.exports = Laundrytype;

const mongoose = require('mongoose');
const LaundrytypeSchema = new mongoose.Schema({
  Laundrytype_name: { 
    type: String, 
    required: true, 
    unique: true, 
    index: { unique: true, collation: { locale: 'en', strength: 3 } } 
  },
  Laundrytype_image: { type: String, required: false }
});

// Ensure index is created with the desired collation
LaundrytypeSchema.index({ Laundrytype_name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const Laundrytype = mongoose.model('Laundrytype', LaundrytypeSchema);
module.exports = Laundrytype;