const Product = require("./productSchema");

const mongoose = required("mongoose");
const {Schema} = mongoose;

const wishlistSchema = new Schema({
    userId:{
        type:Schema.types.ObjectId,
        ref:"User",
        required:true,
    },
    products:[{
        productId:{
            type:Schema.types.ObjectId,
            ref:'Product',
            required:true
        },
        addedOn:{
            type:Date,
            default:Date.now
        }
    }]
})



const Wishlist = mongoose.model('Wishlist',wishlistSchema);
module.exports = Wishlist