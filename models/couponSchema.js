const mongoose = require("mongoose");
const{Schema}= mongoose;


const couponSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expareOn:{
        type:Date,
        required:true
    },
    offerPrice:{
        type:Number,
        required:true
    },
    minimumPrice:{
        type:String,
        required:true
    },
    isList:{
        type:Boolean,
        default:true
    },
    userId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }]
})



const Coupon = mongoose.model("couon",couponSchema);
module.exports=Coupon;