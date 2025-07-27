const User = require('../../models/userSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async (req, res) => {
    try {
        const { totalAmount } = req.body;
        console.log('Received in createRazorpayOrder:', { totalAmount });

        // Validate totalAmount
        if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid totalAmount. Must be a positive number.' 
            });
        }

        const options = {
            amount: Math.round(totalAmount * 100), // Convert to paise, ensure integer
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);
        console.log('Razorpay Order Created:', order);

        res.json({ 
            success: true, 
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            }
        });
    } catch (error) {
        console.error('Error in createRazorpayOrder:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Unable to create Razorpay order' 
        });
    }
};

const verifyAndPlaceOrder = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            cartItems,
            address,
            paymentMethod,
            subtotal,
            deliveryFee,
            totalAmount
        } = req.body;
        console.log('Received in verifyAndPlaceOrder:', req.body);

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing Razorpay payment details' 
            });
        }

        if (!cartItems || !address || !paymentMethod || !totalAmount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required order details' 
            });
        }

        // Verify Razorpay signature
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Signature verification failed' 
            });
        }

        // Validate cart items and update product stock
        for (const item of cartItems) {
            const product = await Product.findOne({ 
                _id: item.productId, 
                'colorVariants._id': item.variantId 
            });
            
            if (!product) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Product ${item.productName} not found` 
                });
            }

            const variant = product.colorVariants.find(v => v._id.toString() === item.variantId);
            if (!variant || variant.stock < item.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Product ${item.productName} is out of stock or insufficient quantity` 
                });
            }

            // Update variant stock
            variant.stock -= item.quantity;
            await product.save();
        }

        // Transform cartItems to match Order schema
        const orderItems = cartItems.map(item => ({
            product: item.productId, // Map to product field (required by Order schema)
            variantId: item.variantId,
            stock: item.quantity, // Use quantity as stock for the order
            price: item.price,
            status: 'Pending' // Set valid enum value
        }));

        // Transform address to match Order schema
        const orderAddress = {
            addressType: address.type,
            street: address.street,
            city: address.city,
            state: address.state,
            pin: address.pin,
            country: address.country,
            phone: address.phone,
            isDefault: address.isDefault
        };

        // Create order
        const newOrder = new Order({
            userId: req.session.userId,
            orderItems,
            address: orderAddress,
            paymentMethod,
            paymentStatus: 'paid',
            subtotal,
            deliveryFee,
            totalPrice: subtotal, // Map subtotal to totalPrice
            finalAmount: totalAmount, // Map totalAmount to finalAmount
            discount: 0, // Set default if no discount applied
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            orderStatus: 'Pending'
        });

        await newOrder.save();

        // Clear cart after successful order
        await Cart.findOneAndUpdate(
            { userId: req.session.userId },
            { $set: { items: [] } }
        );

        res.json({ 
            success: true, 
            orderId: newOrder._id 
        });
    } catch (error) {
        console.error('Error in verifyAndPlaceOrder:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error while verifying payment' 
        });
    }
};

module.exports = {
    createRazorpayOrder,
    verifyAndPlaceOrder
};