const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionmethod_name: { type: String, required: true },
  transactionmethod_image: { type: String, required: true }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
