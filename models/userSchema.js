const mongoose=require('mongoose')
const {Schema}= mongoose;


const userSchema = new Schema({
    firstName: {
        type:String,
        required: true
    },
    lastName:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required:true,
        unique :true,
    },
    // phone: {
    //     type:String,
    //     required:false,
    //     unique :false,
    //     sparse :true,
    //     default:null
    // },
    googleId:{
        type:String,
        unique:true,
        sparse: true
    },
    password :{
        type: String,
        required:false,
        unique:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin : {
        type:Boolean,
        default: false
    },
    cart : [{
        type: Schema.Types.ObjectId,
        ref : 'cart',
    }],
    // wallet : {
    //     type : Schema.Types.ObjectId,
    //     default : 0,
    // },
    wallet : [{
        type : Schema.Types.ObjectId,
        ref: "wishlist"
    }],
    orderHistory:[{
        type: Schema.Types.ObjectId,
        ref: 'Order'
    }],
    createdOn: {
        type : Date,
        default:Date.now,
    },
    referalCode : {
        type: String,
    },
    redeemed:{
        type:Boolean
    },
    redeemedUsers:[{
        type : Schema.Types.ObjectId,
        // ref :"user"
    }],
    searchHistory: [{
        category: {
            type:Schema.Types.ObjectId,
            ref: 'category',
        },
        brand: {
            type: String,
        },
        searchOn: {
            type :Date,
            default:Date.now
        }
    }]
})



const User = mongoose.model('User',userSchema);

module.exports = User;