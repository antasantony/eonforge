const mongoose = require("mongoose")
const {Schema}= new Schema({
    userId:{
        type:Schema.Types.ObectId,
        ref:"User",
        required:true
    },
    items:[{
        productId:{
            type:Schema.Types.ObectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            required:true
        },
        status:{
            type:String,
            default:"placed"
        },
        cancellationReason:{
            type:String,
            default:"none"
        }

    }]

})


const  Cart = mongoose.Model("Cart",CartSchema);
module.exports= Cart;