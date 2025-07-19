const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  balance: {
    type: Number,
    default: 0,
    min: 0
  },

  transactions: [
    {
      type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      reason: {
        type: String,
      },
      status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'success'
      },
      date: {
        type: Date,
        default: Date.now
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
      }
    }
  ]
});
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;