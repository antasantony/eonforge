const Coupon = require('../../models/couponSchema');
const User = require('../../models/userSchema')








const loadCoupon = async (req, res) => {
  try {
    const search = req.query.search || "";
    const currentPage = parseInt(req.query.page) || 1;
     const isActive = req.query.isActive || "";  
     const sort = req.query.sort || 'desc';
    const limit = 6;
    
    const skip = (currentPage - 1) * limit;

    // Search filter
    const searchFilter = search
      ? { code: { $regex: search, $options: 'i' } }
      : {};

    // Fetch coupons with pagination and search
    const coupons = await Coupon.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Optional sorting

    // Stats
    const totalCoupons = await Coupon.countDocuments(searchFilter);
    const activeCoupons = await Coupon.countDocuments({ isActive: true });
    const redeemedCouponsCount = await Coupon.aggregate([{$unwind:'$usedBy'},{$group:{_id:null,redeemedCount:{$sum:'$usedBy.count'}}}]);
    const redeemedCoupons = redeemedCouponsCount[0].redeemedCount ||0;
    const totalSavings = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$discountValue" } // Adjust this if needed
        }
      }
    ]);

    const totalPages = Math.ceil(totalCoupons / limit);

    res.render("coupon", {
      search,
      totalCoupons,
      activeCoupons,
      redeemedCoupons,
      totalSavings: totalSavings[0]?.total || 0,
      coupons,
      currentPage,
      totalPages,
      isActive,
      sort
    });
  } catch (error) {
    console.log("load coupon error", error);
    res.status(500).render("errorPage", { message: "Failed to load coupons" });
  }
};

const addCoupons = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minimumPurchaseAmount,
      expiryDate,
      usageLimit,
      isActive,
      description
    } = req.body;


    const newCoupon = new Coupon({
      code,
      discountType,
      discountValue: parseFloat(discountValue),
      minimumPurchaseAmount: minimumPurchaseAmount ? parseFloat(minimumPurchaseAmount) : null,
      usageLimit: parseInt(usageLimit),
      expiryDate: new Date(expiryDate),
      isActive: isActive === true || isActive === 'true',
      description
    });

    await newCoupon.save();

    res.status(201).json({ success: true, message: "Coupon created successfully" });

  } catch (error) {
    console.error("add coupon error", error);
    res.status(500).json({ success: false, message: "Failed to add coupon" });
  }
};

const updateCoupon = async (req, res) => {
  try {
   

    const {
      id,
      code,
      discountType,
      discountValue,
      minimumPurchaseAmount,
      expiryDate,
      usageLimit,
      isActive,
      description,
    } = req.body;
console.log('update coupon',req.body)
    const findCoupon = await Coupon.findById(id);
    if (!findCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Update fields
    findCoupon.code = code;
    findCoupon.discountType = discountType;
    findCoupon.discountValue = discountValue;
    findCoupon.minimumPurchaseAmount = minimumPurchaseAmount;
    findCoupon.expiryDate = expiryDate;
    findCoupon.usageLimit = usageLimit;
    findCoupon.isActive = isActive;
    findCoupon.description = description;

    await findCoupon.save();

    res.status(200).json({ success: true, message: 'Coupon updated successfully', coupon: findCoupon });
  } catch (error) {
    console.error('error found from update', error);
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
};

const deleteCoupon=async (req,res) => {
  try {
    const{id}=req.params
   await Coupon.findByIdAndDelete(id)
   res.json({success:true})
  } catch (error) {
   console.error('Delete error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}




module.exports = {
    loadCoupon,
    addCoupons,
    updateCoupon,
    deleteCoupon
}