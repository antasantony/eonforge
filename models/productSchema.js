const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  status: {
    type: String,
    enum: ['Available', 'Out of Stock'],
    default: 'Available',
    required: true,
  },
  hasOffer: {
    type: Boolean,
    default: false,
  },
  isBlocked:{
        type:Boolean,
        default:false
    },
  colorVariants: [
    {
      colorName: {
        type: String,
        required: true,
      },
      colorValue: {
        type: String,
        required: true,
      },
      regularPrice: {
        type: Number,
        required: true,
      },
      offerPrice: {
        type: Number,
        required: true,
      },
      hasOffer: {
        type: Boolean,
        default: false,
      },
      stock: {
        type: Number,
        default: 1,
        min: 0,
      },
      productImage: {
        type: [String],
        required: true,
      },
      isActive: {
        type: String,
        enum: ['Available', 'Out of Stock'],
        default: 'Available',
      },
     
      _id: {
        type: Schema.Types.ObjectId,
        auto: true,
      },
      isBlocked:{
        type:Boolean,
        default:false
    },
    },
  ],
  
}, { timestamps: true });



const Product = mongoose.model('Product', productSchema);
module.exports = Product;