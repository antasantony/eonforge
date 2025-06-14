const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    address: [
        {
            type: {
                type: String,
                enum: ['home', 'work', 'other'],
                required: true,
            },
            street: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                required: true,
            },
            pin: {
                type: String,
                required: true,
            },
            country: {
                type: String,
                required: true,
            },
            phone: {
                type: String,
                required: true,
                match: /^[0-9]{10}$/ // Exactly 10 digits
            },
            isDefault: {
                type: Boolean,
                default: false,
            }
        }
    ]
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;