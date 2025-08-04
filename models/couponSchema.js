const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ["Percentage", "Flat"],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minimumPurchaseAmount: {
        type: Number,
        required: false,
        min: 0
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        required: true,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        required: false
    },
    userId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }]
});

const Coupon = mongoose.model("coupon", couponSchema);
module.exports = Coupon;