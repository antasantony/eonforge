const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        variantId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        stock: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned", "Rejected"],
            default: 'Pending'
        },
        cancelReason: {
            type: String,
            default: null
        },
        returnStatus: {
            type: String,
            enum: ['None', "Requested", 'Approved', 'Rejected'],
            default: 'None'
        },
        returnReason: {
            type: String,
            default: null
        }
    }],

    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
        addressType: {
            type: String,
            enum: ['home', 'work', 'other'],
            required: true
        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pin: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true,
            match: /^[0-9]{10}$/
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partial'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'upi', 'netbanking', 'card'],
        required: true
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned", "Rejected"],
        default: "Pending"
    },
    returnStatus: {
        type: String,
        enum: ['None', 'Requested', 'Approved', 'Rejected'],
        default: 'None'
    },
    returnReason: {
        type: String,
        default: null
    },
    cancelReason: {
        type: String,
        default: null,
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied: {
        type: Boolean,
        default: false
    },
    couponId:{
        
    }
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;