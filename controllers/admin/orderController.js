const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');


const loadOrders = async (req, res) => {
    try {

        const { search = '', status = '', sort = 'desc', page = 1, limit = 10 } = req.query;

        // Build query
        let query = {};
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },

            ];
        }
        if (status) {
            query.status = status;
        }
                const pendingOrders = await Order.countDocuments({ status: 'Pending' });
        const returnRequests = await Order.countDocuments({ status: 'Return Requested' });
// const totalRevenueResult = await Order.aggregate([
//   { $match: { status: 'Delivered' } }, // only successful orders
//   { $group: { _id: null, total: { $sum: "$totalAmount" } } }
// ]);

// const totalRevenue = totalRevenueResult[0]?.total || 0;

        // Sort by orderDate
        const sortOption = sort === 'asc' ? { orderDate: 1 } : { orderDate: -1 };

        // Fetch orders with pagination
        const orders = await Order.find(query)
            .populate('userId')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

            
        // Count total orders for pagination
        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);
       const totalRevenue=orders.totalPrice
       console.log('cash evnue',totalRevenue)
        // Render the view with all required variables
        res.render('orders', {
            orders,
            currentPage: parseInt(page),
            totalPages,
            totalOrders,
            pendingOrders,
            totalRevenue,
            returnRequests,
            search,
            status,
            sort,
            limit
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const loadOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate('userId') // optional
      .populate('orderItems.product') // needed
      .lean();

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Prepare variant data: convert ObjectIds to strings for EJS matching
    order.orderItems.forEach(item => {
      item.variantId = item.variantId?.toString();
      item.product?.colorVariants?.forEach(variant => {
        variant._id = variant._id.toString();
      });
    });

    console.log('order is have color',order)

    res.render('order-list', { order });
  } catch (err) {
    console.log('Error loading order details:', err);
    res.status(500).send('Server Error');
  }
};



const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;


  console.log(orderId)
  console.log(status)

  try {
    const order = await Order.findById(orderId);

       console.log('update status order',order)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
const verifyReturnRequest = async (req, res) => {
  const { orderId } = req.params;
  const { approved } = req.body;

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (approved) {
      order.status = 'Returned';
      order.refunded = true;
      // Optionally: trigger refund logic here
    } else {
      order.returnRejected = true;
    }

    await order.save();

    res.json({ success: true, message: approved ? 'Return approved' : 'Return rejected' });
  } catch (err) {
    console.error('Return verification error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



module.exports = {
    loadOrders,
    loadOrderDetail,
    updateOrderStatus,
    verifyReturnRequest

}