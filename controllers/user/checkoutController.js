const User = require('../../models/userSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema')








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
            .populate('items.productId')
            .populate('items.variantId');
            
            if (!cartData || !cartData.items || cartData.items.length === 0) {
        return res.redirect('/cart');
    }
        const cartItems = cartData.items.map(item => {
            const product = item.productId;
            const variant = product?.colorVariants.find(
                v => v._id.toString() === item.variantId.toString()
            );

            if (!product || !variant) {
                console.error(`Product or variant not found for item: ${item._id}`);
                return null;
            }

            return {
                id: item._id.toString(),
                productId: product._id.toString(),
                variantId: item.variantId.toString(),
                productName: product.productName || 'N/A',
                productImage: variant.productImage?.[0] || '/placeholder.svg?height=160&width=160',
                color: variant.colorName || 'N/A',
                price: item.price,
                quantity: item.quantity !== undefined ? item.quantity : item.stock || 1,
                total: item.totalPrice,
                brandName: product.brand?.brandName || 'N/A',
                stock: variant.stock,
                status: variant.stock > 0 ? 'Available' : 'Out of Stock'
            };
        }).filter(Boolean);

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

        let subtotal = 0;
        if (cartData && cartData.items.length > 0) {
            subtotal = cartData.items.reduce((sum, item) => sum + item.totalPrice, 0);
        }

        const deliveryFee = 50;
        const totalAmount = subtotal + deliveryFee;


        res.render('checkout', {
            userName,
            cartItems,
            defaultAddress,
            otherAddresses,
            subtotal,
            deliveryFee,
            totalAmount
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
        const { cartItems, address, paymentMethod, subtotal, deliveryFee, totalAmount } = req.body;

        console.log('request body from place order:', req.body);

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

        // Check if all required address fields are present
        if (!addressFields.addressType || !addressFields.street || !addressFields.city ||
            !addressFields.state || !addressFields.pin || !addressFields.country || !addressFields.phone) {
            return res.status(400).json({ success: false, message: 'Missing required address fields' });
        };

        // Step 1: Check if product has enough stock
        for (const item of cartItems) {
            const product = await Product.findOne(
                { _id: item.productId, 'colorVariants._id': item.variantId },
                { 'colorVariants.$': 1 }
            );

            if (!product || product.colorVariants.length === 0) {
                return res.status(404).json({ success: false, message: 'Product or variant not found.' });
            }

            const variant = product.colorVariants[0];

            if (variant.stock < item.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${variant.stock} unit(s) left of "${variant.colorName}" variant.`,
                });
            }
        }


        const newOrder = new Order({
            userId,
            paymentMethod,
            orderItems: cartItems.map(item => ({
                product: item.productId,
                variantId: item.variantId,
                stock: item.quantity,
                price: item.price
            })),
            totalPrice: subtotal,
            discount: 0, 
            finalAmount: totalAmount, 
            address: addressFields,
            status: "Pending",
            invoiceDate: new Date(),
            couponApplied: false
        });

        console.log('new order to save:', newOrder);

        await newOrder.save();

        
        for (const item of cartItems) {
            await Product.updateOne(
                { _id: item.productId, 'colorVariants._id': item.variantId },
                { $inc: { 'colorVariants.$.stock': -item.quantity } }
            );
        }

    await Cart.findOneAndDelete({userId})

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
        const deliveryFee = order.finalAmount - order.totalPrice - (order.discount || 0);

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
const orderDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');
   const {orderId}=req.query
console.log('order details page again same product',orderId)
   
        // Find the most recent order for the user
        const order = await Order.findOne({ userId,orderId})
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
        const deliveryFee = order.finalAmount - order.totalPrice - (order.discount || 0);

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
        console.log('order listing search', search)
        const query = { userId };

        if (search) {
            query.orderId = { $regex: search, $options: 'i' };
        }

        const orders = await Order.find(query)
            .sort({ createdOn: -1 })
            .lean();
        console.log('order list page', orders)
        res.render('orders-list', {
            orders,
            search
        });
    } catch (error) {
        console.error('Order listing page error:', error);
        res.status(500).send("Something went wrong.");
    }
};



const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const cancelOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    console.log('cancel single item from order', itemId);
    console.log('reason for cancelling', reason);

    const order = await Order.findOneAndUpdate(
      {
        orderId: orderId, // <-- orderId is a string, no need to cast
        'orderItems._id': new ObjectId(itemId), // <-- Cast itemId to ObjectId
      },
      {
        $set: {
          'orderItems.$.status': 'Cancelled',
          'orderItems.$.cancelReason': reason,
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order or item not found' });
    }

    res.json({ success: true, message: 'Item cancelled successfully' });
  } catch (err) {
    console.error('Cancel item error:', err);
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

    order.status = 'Cancelled';
    order.cancelReason = reason || null;

    // Optionally: cancel each item inside orderItems too
    order.orderItems.forEach(item => {
      item.status = 'Cancelled';
      item.cancelReason = reason || null;
    });

    await order.save();

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Return Order
const returnOrder =  async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Return reason is required' });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Delivered') {
      return res.json({ success: false, message: 'Only delivered orders can be returned' });
    }

    order.status = 'Return Request';
    order.cancelReason = reason; // Reusing cancelReason for return reason if needed

    await order.save();

    res.json({ success: true, message: 'Return request submitted successfully' });
  } catch (err) {
    console.error('Return order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};





module.exports = {
    loadCheckout,
    addAddress,
    editAddress,
    deleteAddress,
    placeOrder,
    loadPlaceOrder,
    orderDetails,
    orders,
    cancelOrderItem,
    cancelOrder,
    returnOrder
}