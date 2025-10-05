const User = require('../../models/userSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Coupon = require('../../models/couponSchema');
const Wallet = require('../../models/walletSchema');
const env = require("dotenv").config();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require("fs");
const path = require('path');
const logoPath = path.join(__dirname, "../../public/assets/others/watch_logo.png")

const logoBase64 = fs.readFileSync(logoPath).toString("base64");



const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});



const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');
        console.log('userid from checkout', userId)



        //   user data getting
        const user = await User.findById(userId).lean();

        const userName = `${user.firstName} ${user.lastName}`;
        console.log('user details in checkout', userName)


        //  cart data getting
        const cartData = await Cart.findOne({ userId })
            .populate({
                path: 'items.productId',
                populate: [
                    { path: 'brand', select: 'brandName' },
                    { path: 'category', select: 'name offerPrice hasOffer isListed' }
                ]
            });


        if (!cartData || !cartData.items || cartData.items.length === 0) {
            return res.redirect('/cart');
        }
        const cartItems = cartData.items.map(item => {
            const product = item.productId;
            const variant = product?.colorVariants.find(
                v => v._id.toString() === item.variantId.toString()
            );

            if (!product || !variant) {
                console.error(`Invalid product or variant for item: ${item._id}`);
                return null;
            }


            const isBlocked = product.isBlocked || variant.isBlocked;
            if (isBlocked) {
                return null

            }
            let variantPrice = variant.regularPrice;

            if (variant.hasOffer && !isBlocked) {
                if (variant.offerPrice !== null) {
                    variantPrice = variant.offerPrice;
                }
            }

            let categoryDiscountPrice = null;
            if (product.category?.hasOffer && product.category?.isListed && !isBlocked) {
                const discountPercent = product.category.offerPrice;
                categoryDiscountPrice = variant.regularPrice - (variant.regularPrice * discountPercent / 100);
            }

            const latestPrice = categoryDiscountPrice
                ? Math.min(categoryDiscountPrice, variantPrice)
                : variantPrice;

            const quantity = item.quantity ?? item.stock ?? 1;

            return {
                id: item._id.toString(),
                productId: product._id.toString(),
                variantId: item.variantId.toString(),
                productName: product.productName || 'N/A',
                productImage: variant.productImage?.[0] || '/placeholder.svg',
                color: variant.colorName || 'N/A',
                price: latestPrice,
                quantity,
                total: (product.isBlocked || variant.isBlocked) ? 0 : latestPrice * quantity,
                brandName: product.brand?.brandName || 'N/A',
                categoryName: product.category?.name || 'N/A',
                stock: variant.stock,
                status: isBlocked
                    ? 'Blocked'
                    : variant.stock > 0
                        ? 'Available'
                        : 'Out of Stock'
            };
        }).filter(Boolean);

        console.log('cartitem for blocked item', cartItems)

        // address getting
        const addressDoc = await Address.findOne({ userId });
        console.log('address data in cart', addressDoc);

        let defaultAddress = null;
        let otherAddresses = [];

        if (addressDoc?.address?.length > 0) {
            const defaults = addressDoc.address.filter(addr => addr.isDefault);
            defaultAddress = defaults.length > 0 ? defaults[0] : addressDoc.address[0];
            otherAddresses = addressDoc.address.filter(addr => addr._id.toString() !== defaultAddress._id.toString());

        }


        console.log('checkout username', defaultAddress)

        const coupons = await Coupon.find()
        console.log('coupon arrangement', coupons)

        let subtotal = 0;
        if (cartItems.length > 0) {
            subtotal = cartItems.reduce((sum, item) => sum + (item.total || 0), 0);
        }
        console.log('subtotla needed', subtotal);

        const deliveryFee = 50;
        const totalAmount = subtotal + deliveryFee;
        console.log('checkout page total', totalAmount);
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        res.render('checkout', {
            userId,
            razorpayKeyId,
            userName,
            cartItems,
            defaultAddress,
            otherAddresses,
            subtotal,
            deliveryFee,
            totalAmount,
            coupons
        });

    } catch (error) {
        console.log('Error in load checkout:', error);
        res.status(500).send('Internal Server Error');
    }
};




const addAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        console.log('userid in checkout page', userId);
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { type, fullName, phone, street, city, state, pinCode, country, isDefault } = req.body;

        // Validate all required fields
        if (!type || !fullName || !phone || !street || !city || !state || !pinCode || !country) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }


        const newAddress = {
            type,
            fullName,
            phone,
            street,
            city,
            state,
            pin: pinCode,
            country,
            isDefault: isDefault === true || isDefault === 'true'
        };

        let addressDoc = await Address.findOne({ userId });

        if (!addressDoc) {
            // Create new document
            addressDoc = new Address({
                userId,
                address: [newAddress]
            });
        } else {
            // If isDefault is true, unset other default addresses
            if (newAddress.isDefault) {
                addressDoc.address.forEach(addr => {
                    addr.isDefault = false;
                });
            }
            addressDoc.address.push(newAddress);
        }

        await addressDoc.save();
        res.status(200).json({ message: 'Address added successfully' });

    } catch (error) {
        console.error('checkout page add address error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};


const editAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const {
            type, fullName, phone,
            street, city, state, pinCode, country, isDefault
        } = req.body;

        console.log('Edit address by type:', type);

        const updateAddress = await Address.findOneAndUpdate(
            { userId: userId, "address.type": type },
            {
                $set: {
                    "address.$.fullName": fullName,
                    "address.$.phone": phone,
                    "address.$.street": street,
                    "address.$.city": city,
                    "address.$.state": state,
                    "address.$.pin": pinCode,
                    "address.$.country": country,
                    "address.$.isDefault": isDefault
                }
            },
            { new: true }
        );

        console.log("Updated Address:", updateAddress);

        if (!updateAddress) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        res.status(200).json({ success: true, message: "Address updated successfully" });

    } catch (error) {
        console.log('Edit address error:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.body;
        const userId = req.session.userId;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        console.log('Deleting address:', addressId);



        const deletedAddress = await Address.findOneAndUpdate(
            { userId: userId },
            { $pull: { address: { _id: addressId } } },
            { new: true }
        );

        if (!deletedAddress) {
            return res.status(404).json({ success: false, message: 'Address not found or already deleted' });
        }

        res.status(200).json({ success: true, message: 'Address deleted successfully' });

    } catch (error) {
        console.log('Checkout page delete address error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { cartItems, address, paymentMethod, subtotal, deliveryFee, totalAmount, coupon } = req.body;
        const product = await Promise.all(
            cartItems.map(async (item) => {
                const product = await Product.findById(item.productId)
                const variant = product.colorVariants.id(item.variantId)
                return { ...item, regularPrice: variant.regularPrice }
            })
        )
        console.log('antas what is this', product.regularPrice)




        let couponApplied = false;
        let couponDiscount = 0;
        console.log('request body from place order:', req.body);
        console.log('coupon status chsangeing', req.body.coupon)
        if (coupon && coupon.isActive) {
            couponApplied = true

            if (subtotal >= coupon.minimumPurchaseAmount) {
                if (coupon.discountType === 'Percentage') {
                    couponDiscount = (subtotal * coupon.discountValue) / 100;
                } else if (coupon.discountType === 'Flat') {
                    couponDiscount = coupon.discountValue;
                }
            }

            const couponDoc = await Coupon.findOne({ code: coupon.code })
            console.log('couponDoc', couponDoc)
            if (couponDoc) {
                const existUser = couponDoc.usedBy.find(u => u.user.toString() == userId.toString())
                console.log('existing user', existUser)
                console.log("Coupon not found:", coupon.code);


                if (existUser) {
                    await Coupon.findOneAndUpdate({ code: coupon.code, 'usedBy.user': userId }, { $inc: { 'usedBy.$.count': 1 } }, { new: true })
                } else {
                    await Coupon.findOneAndUpdate({ code: coupon.code }, { $push: { usedBy: { user: userId, count: 1 } } }, { new: true })
                }
            } else {
                console.log('Coupon not found in DB:', coupon.code);
            }

        }







        if (!userId || !cartItems || !address || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Validate and map address fields
        const addressFields = {
            addressType: address.addressType || address.type,
            street: address.street,
            city: address.city,
            state: address.state,
            pin: address.pin,
            country: address.country,
            phone: address.phone,
            isDefault: address.isDefault || false
        };


        if (!addressFields.addressType || !addressFields.street || !addressFields.city ||
            !addressFields.state || !addressFields.pin || !addressFields.country || !addressFields.phone) {
            return res.status(400).json({ success: false, message: 'Missing required address fields' });
        };
        let orderItems = [];
        for (const item of cartItems) {
            const product = await Product.findOne(
                { _id: item.productId, 'colorVariants._id': item.variantId },
                { 'colorVariants.$': 1 }
            );
            console.log('for of method product', product)
            if (!product || product.colorVariants.length === 0) {
                return res.status(404).json({ success: false, message: 'Product or variant not found.' });
            }

            const variant = product.colorVariants[0];
            console.log('for of method variat', variant)
            const regularPrice = variant.regularPrice || 0;
            const sellingPrice = item.price;
            const discount = regularPrice > 0 ? (regularPrice - sellingPrice) : 0;
            if (variant.stock < item.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${variant.stock} unit(s) left of "${variant.colorName}" variant.`,
                });
            }
            orderItems.push({
                product: item.productId,
                variantId: item.variantId,
                stock: item.quantity,
                price: sellingPrice,
                regularPrice,
                discount
            });
        }


        const newOrder = new Order({
            userId,
            paymentMethod,
            orderItems,
            totalPrice: subtotal,
            finalAmount: totalAmount,
            address: addressFields,
            status: "Pending",
            invoiceDate: new Date(),
            couponApplied,
            couponDiscount
        });

        console.log('new order to save:', newOrder);

        await newOrder.save();


        for (const item of cartItems) {
            await Product.updateOne(
                { _id: item.productId, 'colorVariants._id': item.variantId },
                { $inc: { 'colorVariants.$.stock': -item.quantity } }
            );
        }

        await Cart.findOneAndDelete({ userId })

        res.status(200).json({
            success: true,
            orderId: newOrder.orderId,
            redirecturl: '/place-order'
        });


    } catch (error) {
        console.error('Place order error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ success: false, message: 'Validation error', errors });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const loadPlaceOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');
        const order = await Order.findOne({ userId })
            .sort({ createdOn: -1 })
            .populate({
                path: 'orderItems.product',
                populate: { path: 'brand' }
            })
            .lean();

        if (!order) {
            return res.redirect('/cart');
        }

        const user = await User.findById(userId);

        // Process order items
        const orderItems = order.orderItems.map(item => {
            const product = item.product;
            const variant = product?.colorVariants?.find(
                v => v._id.toString() === item.variantId.toString()
            ) || {};

            return {
                id: item._id.toString(),
                productId: product?._id.toString(),
                variantId: item.variantId.toString(),
                productName: product?.productName || 'N/A',
                productImage: variant.productImage?.[0] || '/placeholder.svg',
                color: variant.colorName || 'N/A',
                price: item.price,
                quantity: item.stock, // Quantity ordered
                total: item.price * item.stock,
                brandName: product?.brand?.brandName || 'N/A',
                status: item.status || 'Ordered'
            };
        }).filter(Boolean);

        const addresses = [{
            _id: 'order-address',
            address: order.address.street || 'N/A',
            city: order.address.city || 'N/A',
            state: order.address.state || 'N/A',
            pinCode: order.address.pin || 'N/A',
            country: order.address.country || 'N/A',
            phone: order.address.phone || 'N/A',
            isDefault: order.address.isDefault || false
        }];

        // Calculate delivery fee if not stored separately
        const deliveryFee = 50;
        console.log('find delivery features', deliveryFee)
        res.render('place-order', {
            paymentMethod: order.paymentMethod,
            orderId: order.orderId,
            cartItems: orderItems,
            addresses: addresses,
            subtotal: order.totalPrice,
            deliveryFee: deliveryFee > 0 ? deliveryFee : 0, // Ensure non-negative
            order: order,
            fullName: user?.firstName || 'Customer',
            email: user?.email || '',
            discount: order.discount || 0,
            tax: 0 // Add if applicable
        });

    } catch (error) {
        console.error('Error loading order confirmation:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const paymentFailure = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const reason = req.query.error || "Payment failed";
        console.log('payment fail finding', orderId);

        if (orderId) {
            const updatedOrder = await Order.findOneAndUpdate(
                { orderId, paymentStatus: 'Pending' },
                { paymentStatus: 'Failed', status: 'Cancelled' },
                { new: true }
            );
            console.log('Updated order:', updatedOrder || 'No order found');
        } else {
            console.log('No orderId provided');
        }

        res.render('payment-failure', { errorMessage: reason });

    } catch (error) {
        console.error('Payment failure error:', error);
        res.status(500).render('error', {
            message: 'An unexpected error occurred. Please contact support or try again later.'
        });
    }
};

const orderDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');
        const { orderId } = req.query
        console.log('order details page again same product', orderId)

        // Find the most recent order for the user
        const order = await Order.findOne({ userId, orderId })
            .sort({ createdOn: -1 })
            .populate({
                path: 'orderItems.product',
                populate: { path: 'brand' } // Populate brand if needed
            })
            .lean();

        if (!order) {
            return res.redirect('/orders'); // Redirect to orders page if no order found
        }

        const user = await User.findById(userId);
        console.log('User data for order details:', user.firstName);

        // Process order items for display
        let orderItems = [];
        let subtotal = 0;

        if (order.orderItems && order.orderItems.length > 0) {
            orderItems = order.orderItems.map(item => {
                const product = item.product;
                if (!product) {
                    console.error(`Product not found for order item: ${item._id}`);
                    return null;
                }

                // Find the variant in the product
                const variant = product.colorVariants?.find(
                    v => v._id.toString() === item.variantId.toString()
                ) || {};

                return {
                    id: item._id.toString(),
                    productId: product._id.toString(),
                    variantId: item.variantId.toString(),
                    productName: product.productName || 'N/A',
                    productImage: variant.productImage?.[0] || '/placeholder.svg',
                    color: variant.colorName || 'N/A',
                    price: item.price,
                    quantity: item.stock, // Quantity ordered
                    total: item.price * item.stock,
                    brandName: product.brand?.brandName || 'N/A',
                    status: item.status || 'Ordered' // Use order item status
                };
            }).filter(Boolean); // Remove any null items

            subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
        }

        console.log('itemid get needed thats why this', order)

        // Prepare address data from order
        const addresses = [{
            _id: 'order-address',
            address: order.address.street || 'N/A',
            city: order.address.city || 'N/A',
            state: order.address.state || 'N/A',
            pinCode: order.address.pin || 'N/A',
            country: order.address.country || 'N/A',
            phone: order.address.phone || 'N/A',
            isDefault: order.address.isDefault || false
        }];

        // Calculate delivery fee if not stored separately
        const deliveryFee = 50

        res.render('order-details', {
            paymentMethod: order.paymentMethod,
            orderId: order.orderId,
            cartItems: orderItems, // Note: Still called cartItems for template compatibility
            addresses: addresses,
            subtotal: order.totalPrice,
            deliveryFee: deliveryFee > 0 ? deliveryFee : 0,
            order: order,
            fullName: user?.firstName || 'Customer',
            email: user?.email || '',
            discount: order.discount || 0,
            tax: 0, // Add if applicable
            orderDate: order.createdOn || new Date(),
            orderStatus: order.status || 'Pending'
        });

    } catch (error) {
        console.error('Error loading order details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const orders = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');

        const search = req.query.search?.trim() || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const query = { userId };
        if (search) {
            query.orderId = { $regex: search, $options: 'i' };
        }

        const orders = await Order.find(query)
            .populate({
                path: 'orderItems.product',
                select: 'productName colorVariants'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();


        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const product = item.product;
                if (product && product.colorVariants) {
                    const variant = product.colorVariants.find(
                        v => v._id.toString() === item.variantId.toString()
                    );
                    item.variantData = variant || null;
                } else {
                    item.variantData = null;
                }
            });
        });

        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                console.log('Variant image:', item.variantData?.productImage?.[0]);
            });
        });

        res.render('orders-list', {
            orders,
            search,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Order listing page error:', error);
        res.status(500).send("Something went wrong.");
    }
};





const mongoose = require('mongoose');
const { features } = require('process');
const ObjectId = mongoose.Types.ObjectId;



const cancelOrderItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason } = req.body;

        const order = await Order.findOne({ orderId });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const item = order.orderItems.find(i => i._id.toString() === itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found in order' });
        if (item.status === 'Cancelled') return res.json({ success: false, message: 'Item already cancelled' });

        // Mark item as cancelled
        item.status = 'Cancelled';
        item.cancelReason = reason || null;
        item.refunded = true;

        // Refund amount for this item
       const refundAmount = item.price * item.stock;

      // Always refund to wallet
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = new Wallet({ userId: order.userId, balance: 0, transactions: [] });
      }
  if (order.paymentMethod !=='cod'){
      wallet.balance += refundAmount;
      wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        reason: `Refund for returned item ${item._id} in order ${order.orderId}`,
        status: 'success',
        orderId: order._id,
        itemId: item._id,
        date: new Date()
      });
      await wallet.save();
    }
        // Update order final amount
        order.finalAmount -= refundAmount;
        if (order.finalAmount <= 0) {
            order.paymentStatus = 'Refunded';
        }

        // Restore product stock
        await Product.updateOne(
            { _id: item.product, 'colorVariants._id': item.variantId },
            { $inc: { 'colorVariants.$.stock': item.stock } }
        );

        // If all items cancelled, mark order cancelled
        const allCancelled = order.orderItems.every(i => i.status === 'Cancelled');
        if (allCancelled) {
            order.status = 'Cancelled';
            order.cancelReason = 'All items cancelled';
        }

        await order.save();

        return res.json({ success: true, message: 'Item cancelled and stock restored' });

    } catch (err) {
        console.error('Cancel item error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


// return order item
const returnOrderItem = async (req, res) => {
    try {
        const { orderId, itemId, reason } = req.body;
        console.log('return item order data', req.body);

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Return reason is required' });
        }

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Find the item in orderItems
        const item = order.orderItems.find(i => i._id.toString() === itemId);
        console.log('item find confirming', item)
        if (!item) {
            return res.status(404).json({ success: false, message: 'Order item not found' });
        }

        // if (item.status !== 'Delivered') {
        //   return res.status(400).json({ success: false, message: 'Only delivered items can be returned' });
        // }

        // Update item status only
        item.status = 'Return Request';
        item.returnReason = reason;

        await order.save();

        res.json({ success: true, message: 'Return request submitted successfully' });

    } catch (err) {
        console.error('Return order error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};







// Cancel Order
const cancelOrder = async (req, res) => {
    try {
        const { orderId, reason } = req.body;

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status === 'Cancelled') {
            return res.json({ success: false, message: 'Order is already cancelled' });
        }

        for (const item of order.orderItems) {
            item.status = 'Cancelled';
            item.cancelReason = reason || null;

            // Return stock to inventory
            await Product.updateOne(
                { _id: item.product, 'colorVariants._id': item.variantId },
                { $inc: { 'colorVariants.$.stock': item.stock } }
            );
        }

        // Update order-level status
        order.status = 'Cancelled';
        order.cancelReason = reason || null;
        
        
        let wallet = await Wallet.findOne({ userId: order.userId });
          if (!wallet) {
            wallet = new Wallet({ userId: order.userId, balance: 0, transactions: [] });
          }
        
          // Refund logic
          const refundAmount = order.finalAmount; // Amount to refund
          let refundStatus = 'success';
        
          if (order.paymentMethod !== 'cod' && order.razorpayPaymentId) {
            // Check Razorpay refund status before attempting refund
            try {
              const payment = await razorpayInstance.payments.fetch(order.razorpayPaymentId);
              if (payment.status === 'refunded' || payment.amount_refunded >= payment.amount) {
                // Update database to reflect Razorpay's state
                order.refunded = true;
                order.paymentStatus = 'Refunded';
                await order.save();
                return res.status(400).json({ success: false, message: 'Payment already fully refunded according to Razorpay' });
              }
        
              // Process Razorpay refund
              const refund = await razorpayInstance.payments.refund(order.razorpayPaymentId, {
                amount: Math.round(refundAmount * 100), // Convert to paise
                speed: 'normal',
                receipt: `refund_${order.orderId}_${Date.now()}`
              });
              console.log('Razorpay refund processed:', refund);
            } catch (refundError) {
              console.error('Razorpay refund error:', refundError);
              if (refundError.statusCode === 400 && refundError.error.description.includes('fully refunded already')) {
                // Handle case where Razorpay indicates the payment is already refunded
                order.refunded = true;
                await order.save();
                return res.status(400).json({ success: false, message: 'Payment already fully refunded' });
              }
              refundStatus = 'failed';
              return res.status(500).json({ success: false, message: 'Failed to process Razorpay refund', error: refundError });
            }
          }
        
          // Update wallet balance and add transaction
          if(order.paymentMethod !=='cod'){
          wallet.balance += refundAmount;
          wallet.transactions.push({
            type: 'credit',
            amount: refundAmount,
            reason: `Refund for order ${order.orderId}`,
            status: refundStatus,
            orderId: order._id,
            date: new Date()
          });
        
          await wallet.save();
          order.paymentStatus = 'Refunded';
          
        }
        await order.save();
        

        return res.json({ success: true, message: 'Order cancelled and stock restored' });

    } catch (error) {
        console.error('Cancel order error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



//     Return Order
const returnOrder = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        console.log('why it is not working', orderId, reason)

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Return reason is required' });
        }


        const order = await Order.findOne({ orderId });
        console.log('order upadating for return', order)
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Allow return only if the order status is 'Delivered'
        // if (order.status !== 'Delivered') {
        //     return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
        // }

        // Update overall order status
        order.status = 'Return Request';
        order.returnStatus = "Requested"
        order.returnReason = reason

        // Update each item's return status and reason
        order.orderItems.forEach(item => {
            item.returnStatus = 'Requested';
            item.returnReason = reason;
        });


        await order.save();

        res.json({ success: true, message: 'Return request submitted successfully' });

    } catch (err) {
        console.error('Return order error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const loadInvoice = async (req, res) => {
    try {
        const { orderId } = req.query; // /order/:orderId/invoice
        console.log('Invoice order ID:', orderId);

        // Find order and populate user and product details
        const order = await Order.findOne({ orderId })
            .populate("userId") // Populate user details (e.g., name)
            .populate("orderItems.product") // Correct path for product details
            .lean();

        if (!order) {
            return res.status(404).render('error', {
                message: 'Order not found',
                statusCode: 404,
                link: '/orders',
                linkText: 'View Orders'
            });
        }

        // Extract userFullName from populated userId
        const userFullName = order.userId?.name || 'Customer'; // Adjust based on User schema

        // Define deliveryFee (customize based on business logic)
        const deliveryFee = order.finalAmount > 50000 ? 0 : 100; // Example: Free delivery for orders above ₹50,000

        // Enhance orderItems with product details (if not already included)
        order.orderItems = order.orderItems.map(item => ({
            ...item,
            productName: item.product?.name || 'Product', // Adjust based on Product schema
            brandName: item.product?.brand || 'Eon Forge',
            color: item.product?.color || null // Optional: Include if Product schema has color
        }));

        // Pass order details to EJS
        res.render("invoice", {
            order,
            userFullName,
            deliveryFee
        });
    } catch (error) {
        console.error("Invoice error:", error);
        res.status(500).render('error', {
            message: 'An error occurred while generating the invoice',
            statusCode: 500,
            link: '/orders',
            linkText: 'View Orders'
        });
    }
};

const PdfPrinter = require("pdfmake");

const fonts = {
    Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
    },
};
const printer = new PdfPrinter(fonts);



const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.query;

        const order = await Order.findOne({ orderId })
            .populate("userId")
            .populate("orderItems.product")
            .lean();

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        const userFullName = (order.userId?.firstName || "") + " " + (order.userId?.lastName || "");
        const deliveryFee = order.finalAmount > 50000 ? 0 : 100;

        // Build invoice definition
        const docDefinition = {
            pageSize: "A4",
            pageMargins: [40, 40, 40, 40],
            content: [
                {
                    image: `data:image/png;base64,${logoBase64}`,
                    width: 120,
                    alignment: "center",
                    margin: [0, 0, 0, 20]
                },
                { text: "Eon Forge - Invoice", style: "header", alignment: "center" },

                { text: `Order #${order.orderId}`, style: "subheader", margin: [0, 10, 0, 20], alignment: "center" },

                {
                    columns: [
                        [
                            { text: "From", style: "sectionHeader" },
                            { text: "Eon Forge", bold: true },
                            { text: "123 Luxury Lane, Mumbai" },
                            { text: "Maharashtra, India 400001" },
                            { text: "support@eonforge.com" },
                            { text: "+1 (800) 555-1234" },
                        ],
                        [
                            { text: "To", style: "sectionHeader" },
                            { text: userFullName, bold: true },
                            { text: order.address?.street || "" },
                            { text: `${order.address?.city || ""}, ${order.address?.state || ""} ${order.address?.pin || ""}` },
                            { text: order.address?.country || "India" },
                            { text: `Phone: ${order.address?.phone || "N/A"}` },
                        ],
                    ],
                    columnGap: 40,
                    margin: [0, 0, 0, 20],
                },

                { text: "Order Details", style: "sectionHeader" },
                {
                    table: {
                        widths: ["*", "auto", "auto", "auto", "auto"],
                        body: [
                            ["Item", "Qty", "Unit Price", "Discount", "Total"],
                            ...order.orderItems.map((item) => [
                                item.productName || "Product",
                                item.stock || 1,
                                `₹${(item.price || 0).toLocaleString()}`,
                                item.discount > 0 ? `-₹${(item.discount).toLocaleString()}` : "–",
                                `₹${(
                                    (item.price - (item.discount || 0)) * (item.stock || 1)
                                ).toLocaleString()}`,
                            ]),
                        ],
                    },
                    layout: "lightHorizontalLines",
                    margin: [0, 0, 0, 20],
                },
                { text: "Order Summary", style: "sectionHeader" },
                {
                    columns: [
                        { width: "*", text: "" },
                        {
                            width: "auto",

                            table: {
                                body: [
                                    ["Subtotal", `₹${(order.totalPrice || 0).toLocaleString()}`],
                                    ["Coupon discount", `₹${(order.couponDiscount || 0).toLocaleString()}`],
                                    ["Delivery Fee", deliveryFee === 0 ? "Free" : `₹${deliveryFee}`],
                                    order.paymentMethod === "cod" ? ["COD Fee", "₹50"] : null,
                                    ["Total", `₹${(order.finalAmount || 0).toLocaleString()}`],
                                ].filter(Boolean),
                            },
                            layout: "noBorders",
                        },
                    ],
                },

                { text: "Payment Details", style: "sectionHeader", margin: [0, 20, 0, 10] },
                {
                    text: `${order.paymentMethod.toUpperCase()} - Status: ${order.paymentStatus}`,
                },
            ],
            styles: {
                header: { fontSize: 22, bold: true, margin: [0, 0, 0, 15] },
                subheader: { fontSize: 14, margin: [0, 5, 0, 15] },
                sectionHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
            },
            defaultStyle: { font: "Helvetica" },
        };


        // Generate PDF
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks = [];
        pdfDoc.on("data", (chunk) => chunks.push(chunk));
        pdfDoc.on("end", () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=invoice-${orderId}.pdf`,
            });
            res.end(pdfBuffer);
        });
        pdfDoc.end();
    } catch (err) {
        console.error("Download invoice error:", err);
        res.status(500).send("Failed to generate invoice PDF");
    }
};










module.exports = {
    loadCheckout,
    addAddress,
    editAddress,
    deleteAddress,
    placeOrder,
    paymentFailure,
    loadPlaceOrder,
    orderDetails,
    orders,
    cancelOrderItem,
    cancelOrder,
    returnOrder,
    returnOrderItem,
    loadInvoice,
    downloadInvoice
}