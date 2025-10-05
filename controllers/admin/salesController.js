const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const loadSalesReport = async (req, res) => {
  try {
    // === 1. Overall Totals ===
    const totalSalesCount = await Order.countDocuments({ status: 'Delivered' });

    const revenueResult = await Order.aggregate([
      { $match: { status: 'Delivered' } }, { $unwind: '$orderItems' },
      {
        $group: {
          _id: null, totalOrderAmount:
          {
            $sum: { $multiply: [{ $add: ['$orderItems.price', '$orderItems.discount'] }, '$orderItems.stock'] }
          },
          discountResult:{
            $sum:{$multiply:['$orderItems.discount','$orderItems.stock']}
          },
          itemsSold:{$sum:'$orderItems.stock'}
        }
      }

    ]);
    const totalDiscount = revenueResult[0]?.discountResult || 0;
    console.log('total discount value', totalDiscount)

    const totalOrderAmount = revenueResult[0]?.totalOrderAmount || 0;
    console.log('totalamount value', totalOrderAmount)
    
    const totalItemsSold=revenueResult[0]?.itemsSold ||0;
    console.log('total item sold', totalItemsSold)

    



    // === 2. Order-wise Details ===
    const orderList = await Order.find({ status: 'Delivered' })
      .populate("userId", "firstName lastName email ")
      .sort({ createdAt: -1 })
      .select("orderId userId createdOn totalPrice totalAmount finalAmount couponCode couponDiscount paymentMethod orderItems");

    console.log('customer name', orderList)

    // Format data for report
    const formattedOrders = orderList.map(order => ({
      orderId: order.orderId.slice(1, 8),
      customer: order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : "Guest",
      date: order.createdOn ? order.createdOn.toLocaleDateString("en-IN") : "N/A",
      orderAmount: order.orderItems.reduce((a, b) => a + ((b.price + b.discount) * b.stock), 0),
      discount: order.orderItems.reduce((a, b) => {
        return a + (b.discount * b.stock)
      }, 0),
      paymentMethod: order.paymentMethod.toUpperCase(),
      couponDiscount: order.couponDiscount || 0,
      finalAmount: order.finalAmount || 0
    }));

    console.log('all data from formattdOrders', formattedOrders)

    // === 3. Prepare Sales Data ===
    const salesData = {
      totalSalesCount,
      totalOrderAmount,
      totalDiscount,
      totalItemsSold,
      orders: formattedOrders
    };

    res.render("salesReport", { salesData });

  } catch (error) {
    console.log("loading sales report error:", error);
    res.status(500).send("Error loading sales report");
  }
};

const filterSalesReport=async (req,res) => {
   try {
        
     const { period, startDate, endDate } = req.query;
     console.log('type',req.query)

    // Build query
   const matchQuery = { status: 'Delivered' };

const now = new Date();

if (period === 'custom' && startDate && endDate) {
  matchQuery.createdOn = {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };

} else if (period === 'daily') {
  const start = new Date(now.setHours(0, 0, 0, 0)); // start of today
  const end = new Date(now.setHours(23, 59, 59, 999)); // end of today
  matchQuery.createdOn = { $gte: start, $lte: end };

} else if (period === 'weekly') {
  const start = new Date();
  start.setDate(now.getDate() - now.getDay()); // start of week (Sunday)
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(start.getDate() + 6); // end of week (Saturday)
  end.setHours(23, 59, 59, 999);
  matchQuery.createdOn = { $gte: start, $lte: end };

} else if (period === 'monthly') {
  const start = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of month
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // last day of month
  matchQuery.createdOn = { $gte: start, $lte: end };

} else if (period === 'yearly') {
  const start = new Date(now.getFullYear(), 0, 1); // Jan 1
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31
  matchQuery.createdOn = { $gte: start, $lte: end };
}


    // Fetch orders
    const orders = await Order.find(matchQuery)
      .populate('userId')
      .lean();

    // Calculate summary
    const totalSalesCount = orders.length;
    const totalItemsSold = orders.reduce((sum, order) => {
      return sum + order.orderItems.reduce((a, b) => a + b.stock, 0);
    }, 0);
    const totalOrderAmount = orders.reduce((sum, order) => {
      return sum + order.orderItems.reduce((a, b) => a + (b.price + b.discount) * b.stock, 0);
    }, 0);
    const totalDiscount = orders.reduce((sum, order) => {
      return sum + order.orderItems.reduce((a, b) => a + b.discount * b.stock, 0) + (order.couponDiscount || 0);
    }, 0);

    // Format orders for table
    const salesData = orders.map(order => ({
      orderId: order.orderId,
      customerName: order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'Guest',
      date: order.createdOn.toLocaleDateString(),
      orderAmount: order.orderItems.reduce((a, b) => a + b.price * b.stock, 0),
      discount: order.orderItems.reduce((a, b) => a + b.discount * b.stock, 0),
      paymentMethod: order.paymentMethod.toUpperCase(),
      couponDiscount: order.couponDiscount || 0,
      finalAmount: order.finalAmount || 0
    }));
    console.log('sales data',salesData)

    res.json({
      totalSalesCount,
      totalItemsSold,
      totalOrderAmount,
      totalDiscount,
      salesData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
  
}

const downloadSalesReport = async (req, res) => {
  try {
    const { type } = req.params;   
    const { period, startDate, endDate } = req.query;
    const matchQuery = { status: 'Delivered' };

const now = new Date();

if (period === 'custom' && startDate && endDate) {
  matchQuery.createdOn = {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };

} else if (period === 'daily') {
  const start = new Date(now.setHours(0, 0, 0, 0)); // start of today
  const end = new Date(now.setHours(23, 59, 59, 999)); // end of today
  matchQuery.createdOn = { $gte: start, $lte: end };

} else if (period === 'weekly') {
  const start = new Date();
  start.setDate(now.getDate() - now.getDay()); // start of week (Sunday)
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(start.getDate() + 6); // end of week (Saturday)
  end.setHours(23, 59, 59, 999);
  matchQuery.createdOn = { $gte: start, $lte: end };

} else if (period === 'monthly') {
  const start = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of month
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // last day of month
  matchQuery.createdOn = { $gte: start, $lte: end };

} else if (period === 'yearly') {
  const start = new Date(now.getFullYear(), 0, 1); // Jan 1
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31
  matchQuery.createdOn = { $gte: start, $lte: end };
}

    // Fetch orders
    const orders = await Order.find(matchQuery).populate('userId').lean();

    // Format data
    const salesData = orders.map(order => ({
      orderId: order.orderId,
      customerName: order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'Guest',
      date: order.createdOn.toLocaleDateString(),
      orderAmount: order.orderItems.reduce((a, b) => a + b.price * b.stock, 0),
      discount: order.orderItems.reduce((a, b) => a + b.discount * b.stock, 0),
      couponCode: order.couponCode || 'N/A',
      finalAmount: order.orderItems.reduce((a, b) => a + (b.price - b.discount) * b.stock, 0),
      paymentMethod: order.paymentMethod || 'N/A'
    }));

    if (type === 'pdf') {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  // Title
  doc.fontSize(20).text('Sales Report', { align: 'center' });
  doc.moveDown(2);

  // Table setup
  const tableTop = 120;
  let y = tableTop;

  const headers = [
    'Order ID',
    'Customer',
    'Date',
    'Order\nAmount',
    'Discount',
    'Coupon',
    'Final\nAmount',
    'Payment\n Method'
  ];

  const columnWidths = [120, 80, 60, 60, 60, 50, 60, 60];

  // Draw header row
  let x = doc.page.margins.left;
  doc.fontSize(10).font('Helvetica-Bold');

  headers.forEach((header, i) => {
    doc.text(header, x + 5, y + 5, { width: columnWidths[i], align: 'left' });
    doc.rect(x, y, columnWidths[i], 25).stroke(); // draw cell border
    x += columnWidths[i];
  });

  y += 25;

  // Draw data rows
  doc.fontSize(9).font('Helvetica');

  salesData.forEach(sale => {
    x = doc.page.margins.left;
    const row = [
      sale.orderId,
      sale.customerName,
      new Date(sale.date).toLocaleDateString("en-IN"),
      `₹${sale.orderAmount.toFixed(2)}`,
      `₹${sale.discount.toFixed(2)}`,
      sale.couponCode || '—',
      `₹${sale.finalAmount.toFixed(2)}`,
      sale.paymentMethod
    ];

    row.forEach((data, i) => {
      doc.text(data.toString(), x + 5, y + 5, {
        width: columnWidths[i] - 10, // padding inside cell
        ellipsis: true               // prevent wrapping
      });
      doc.rect(x, y, columnWidths[i], 25).stroke();
      x += columnWidths[i];
    });

    y += 25;

    // Add new page if needed
    if (y > doc.page.height - 50) {
      doc.addPage();
      y = tableTop;
    }
  });

  doc.end();
}else if (type === 'excel') {
      // Excel generation
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'Customer', key: 'customerName', width: 25 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Order Amount', key: 'orderAmount', width: 15 },
        { header: 'Discount', key: 'discount', width: 15 },
        { header: 'Coupon', key: 'couponCode', width: 15 },
        { header: 'Final Amount', key: 'finalAmount', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      ];

      salesData.forEach(sale => worksheet.addRow(sale));

      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ error: 'Invalid type parameter' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
};

module.exports = {
  loadSalesReport,
  filterSalesReport,
  downloadSalesReport
};
