const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');


const loadOrders = async (req, res) => {
  try {
    const { search = '', status = '', sort = 'desc', page = 1, limit = 10 } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;

    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const returnRequests = await Order.countDocuments({ status: 'Return Request' });

    const sortOption = sort === 'asc' ? { createdOn: 1 } : { createdOn: -1 };

    const orders = await Order.find(query)
      .populate('userId')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const revenueData = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

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

    // Fetch order and populate required fields
    const order = await Order.findById(orderId)
      .populate('userId')
      .populate('orderItems.product')
      .lean();

    if (!order) return res.status(404).send('Order not found');

    // Convert variantId and colorVariants._id to strings for EJS matching
    order.orderItems.forEach(item => {
      item.variantId = item.variantId?.toString();
      item.product?.colorVariants?.forEach(variant => {
        variant._id = variant._id.toString();
      });
    });

    // Determine final status based on priority
    const priority = ["Pending","Processing", "Shipped", "Delivered", "Return Request", "Returned", "Cancelled", "Rejected"];
    const statusRank = {};
    priority.forEach((s, i) => statusRank[s] = i);

    let finalStatus = order.orderItems[0]?.status || "Processing";
    order.orderItems.forEach(item => {
      if (statusRank[item.status] < statusRank[finalStatus]) {
        finalStatus = item.status;
      }
    });

    // Update the order.status in DB only if it's not already set and not in terminal states
    const terminalStatuses = ["Return Request", "Returned", "Rejected", "Cancelled", "Delivered"];
    if (!terminalStatuses.includes(order.status) && finalStatus !== order.status) {
      await Order.findByIdAndUpdate(order._id, { status: finalStatus });
      order.status = finalStatus; // Update local copy too for rendering
    }
order.paymentStatus = order.paymentStatus || 'pending';

    console.log('Order after status check:', order);

    res.render('order-list', { order });
  } catch (err) {
    console.log('Error loading order details:', err);
    res.status(500).send('Server Error');
  }
};




const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  console.log('Order ID:', orderId);
  console.log('New Status:', status);

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log('Old Order Status:', order.status);
    order.status = status;

    if (Array.isArray(order.orderItems)) {
      order.orderItems.forEach((item, index) => {
        console.log(`Item ${index + 1} - Current Status: ${item.status}`);
        if (item.status !== 'Cancelled'&& item.status !=='Returned'&& item.status !=='Rejected') {
          item.status = status;
          console.log(`Item ${index + 1} - Updated to: ${item.status}`);
        }
      });
    }

    await order.save(); 

    res.json({ success: true, message: 'Order status updated successfully' });

  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const verifyReturnRequest = async (req, res) => {
  const { orderId } = req.params;
  const { approved } = req.body;

  console.log('verify return',req.body)
  console.log('verify return',req.params)

  try {
    const order = await Order.findOne({ orderId });
console.log('order getting',order)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (approved) {
      order.status = 'Returned';
      order.refunded = true;
      // Optionally: trigger refund logic here
    } else {
      order.returnRejected = true;
      order.status='Rejected'
    }

    await order.save();

    res.json({ success: true, message: approved ? 'Return approved' : 'Return rejected' });
  } catch (err) {
    console.error('Return verification error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
const verifyItemReturnRequest = async (req, res) => {
  const {orderId,itemId } = req.params;
  const { approved } = req.body;
console.log('approved:', approved, typeof approved);

  console.log('verify return',req.body)
  console.log('verify return',req.params)

  try {
    const order = await Order.findOne({ orderId });
    const item=order.orderItems.find(i=>i.variantId.toString()==itemId.toString())
console.log('order getting',item)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (approved) {
      item.status = 'Returned';
      item.refunded = true;
      // Optionally: trigger refund logic here
    } else {
     console.log('Setting item to Rejected');
      item.status='Rejected'
    }
console.log('Before save:', item.status);
await order.save();
console.log('After save:', item.status);


    res.json({ success: true, message: approved ? 'Return approved' : 'Return rejected' });
  } catch (err) {
    console.error('Return verification error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const updatePaymentStatus = async (req, res) => {
  const { orderId } = req.params;
  const { paymentStatus } = req.body;
   console.log('paystatus is getting in this page',req.body)
   console.log('Incoming payment status update:', orderId, paymentStatus); 
  try {
    const validStatuses = ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled', 'partial'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }


    const order = await Order.findOne({orderId})
    console.log('why not gettying order id',order)

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
       order.paymentStatus=paymentStatus;
       await order.save()
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating payment status:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};



module.exports = {
    loadOrders,
    loadOrderDetail,
    updateOrderStatus,
    verifyReturnRequest,
    verifyItemReturnRequest,
    updatePaymentStatus

}