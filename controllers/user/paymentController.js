const User = require('../../models/userSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Coupon = require('../../models/couponSchema');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { cartItems, address, paymentMethod, subtotal, deliveryFee, totalAmount, coupon } = req.body;
        console.log('create order reqbody', req.body)
        if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid totalAmount' });
        }

        if (totalAmount > 500000) {
            return res.status(400).json({
                success: false,
                message: "Order amount exceeds Razorpay limit of ₹5,00,000"
            });
        }

        // Razorpay order creation
        const options = {
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };
        const razorpayOrder = await razorpayInstance.orders.create(options);

        // Apply coupon
        let couponApplied = false;
        let couponDiscount = 0;
        let couponCode=null;
        if (coupon && coupon.isActive && subtotal >= coupon.minimumPurchaseAmount) {
            couponApplied = true;
            couponCode=coupon.code;
            couponDiscount = coupon.discountType === 'Percentage'
                ? (subtotal * coupon.discountValue) / 100
                : coupon.discountValue;

                const couponDoc=await Coupon.findOne({code:coupon.code})
               console.log('couponDoc',couponDoc)

               if(couponDoc){
        
               const existUser= couponDoc.usedBy.find(u=>u.user.toString()==userId.toString())
               console.log('existing user',existUser)
                console.log("Coupon not found:", coupon.code);
                
        
               if(existUser){
                await Coupon.findOneAndUpdate({code:coupon.code,'usedBy.user':userId},{$inc:{'usedBy.$.count':1}},{new:true})
               }else{
                await Coupon.findOneAndUpdate({code:coupon.code},{$push:{usedBy:{user:userId,count:1}}},{new:true})
               }
            }else{
                console.log('Coupon not found in DB:', coupon.code);
            }

        }

          

        const orderItems = [];
        for (const item of cartItems) {
            const product = await Product.findOne({
                _id: item.productId,
                'colorVariants._id': item.variantId
            });
            if (!product) throw new Error(`Product ${item.productName} not found`);

            const variant = product.colorVariants.find(v => v._id.toString() === item.variantId);
            const regularPrice = variant.regularPrice || 0;
            const sellingPrice = item.price;
            const discount = regularPrice > 0 ? (regularPrice - sellingPrice) : 0;
            if (!variant || variant.stock < item.quantity) {
                throw new Error(`Product ${item.productName} is out of stock or insufficient quantity`);
            }



            orderItems.push({
                product: item.productId,
                variantId: item.variantId,
                stock: item.quantity,
                price: item.price,
                status: 'Pending',
                discount
            });
        }

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

        let existingOrder = await Order.findOne({
            userId: req.session.userId,
            status: { $in: ["Failed", "Cancelled"] },
            paymentStatus: "Failed"
        }).sort({ createdOn: -1 }); // get latest

        if (existingOrder) {
            existingOrder.razorpayOrderId = razorpayOrder.id;
            existingOrder.paymentMethod = paymentMethod;
            existingOrder.paymentStatus = "Failed";
            existingOrder.status = "Cancelled";
            existingOrder.orderItems = orderItems;
            existingOrder.address = orderAddress;
            existingOrder.subtotal = subtotal;
            existingOrder.deliveryFee = deliveryFee;
            existingOrder.totalPrice = subtotal;
            existingOrder.finalAmount = totalAmount;
            existingOrder.couponCode = couponCode;
            existingOrder.couponApplied = couponApplied;
            existingOrder.couponDiscount = couponDiscount;

            await existingOrder.save();

            return res.json({
                success: true,
                order: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    orderId: existingOrder.orderId
                }
            });
        }
        const newOrder = new Order({
            userId: req.session.userId,
            orderItems,
            address: orderAddress,
            paymentMethod,
            paymentStatus: 'Pending',
            subtotal,
            deliveryFee,
            totalPrice: subtotal,
            finalAmount: totalAmount,
            razorpayOrderId: razorpayOrder.id,
            status: 'Pending',
            couponCode,
            couponApplied,
            couponDiscount
        });

        await newOrder.save();

        for (const item of cartItems) {
                   await Product.updateOne(
                       { _id: item.productId, 'colorVariants._id': item.variantId },
                       { $inc: { 'colorVariants.$.stock': -item.quantity } }
                   );
               }

        res.json({
            success: true,
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderId: newOrder.orderId
            }
        });

    } catch (error) {
        console.error('Error in createRazorpayOrder:', error);
        res.status(500).json({ success: false, message: 'Unable to create Razorpay order' });
    }
};

const verifyAndPlaceOrder = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
        console.log('verifyplaceorder body:', req.body);
        console.log('verifyplaceorder db orderId:', orderId);

        // Verify signature
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== razorpay_signature) {
            await Order.findOneAndUpdate(
                { orderId },
                { paymentStatus: 'Failed', status: 'Cancelled' }
            );
            return res.status(400).json({ success: false, message: 'Signature verification failed' });
        }
        await Order.findOneAndUpdate(
            { orderId },  // custom UUID
            {
                paymentStatus: 'Paid',
                status: 'Processing',
                razorpayPaymentId: razorpay_payment_id
            }
        );

        
        await Cart.findOneAndUpdate(
            { userId: req.session.userId },
            { $set: { items: [] } }
        );
        
        
        res.json({ success: true, message: 'Payment verified and order placed' });

    } catch (error) {
        console.error('Error in verifyAndPlaceOrder:', error);
        res.status(500).json({ success: false, message: 'Server error while verifying payment' });
    }
};



module.exports = {
    createRazorpayOrder,
    verifyAndPlaceOrder
};
