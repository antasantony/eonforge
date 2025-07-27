const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['Percentage', 'Flat'],
    required: true
  },

  discountValue: {
    type: Number,
    required: true
  },

  targetType: {
    type: String,
    enum: ['Product', 'Category'],
    required: true
  },

  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType' // Dynamic reference (to Product or Category)
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: Date
});
const Offer = mongoose.model('Offer', offerSchema);
module.exports = Offer;
