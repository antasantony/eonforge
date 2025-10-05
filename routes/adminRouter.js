const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const brandController = require('../controllers/admin/brandController');
const productController = require('../controllers/admin/productController');
const orderController = require('../controllers/admin/orderController');
const salesController=require('../controllers/admin/salesController')
const cloudinary = require('../config/cloudinary');

const couponController = require('../controllers/admin/couponController');
const { adminLogin, adminAuth } = require('../middlewares/auth');
const errorController = require("../controllers/error/errorController")
// const multer = require('multer')
const uploads = require('../helpers/multer');
// const uploads = multer({storage:storage})



router.get('/pageError', adminController.pageError);
router.get('/login', adminLogin, adminController.loadLogin);
router.post('/login', adminLogin, adminController.login);
router.get('/adminDashboard', adminAuth, adminController.loadDashboard);
router.get('/logout', adminController.adminLogout);


//Customer Management
router.get('/users', adminAuth, customerController.customerInfo);
router.post('/blockCustomer', adminAuth, customerController.customerBlocked);
router.post('/unblockCustomer', adminAuth, customerController.customerUnblocked);


// Category Management
router.get('/category', adminAuth, categoryController.categoryInfo);
router.post('/category', adminAuth, categoryController.addOrUpdateCategory);
router.put('/category/:id', adminAuth, categoryController.addOrUpdateCategory);
router.patch('/category/:id/status', adminAuth, categoryController.categoryStatus);

// Brand Management
router.get('/brands', adminAuth, brandController.getBrandPage);
router.post('/brand', adminAuth, uploads.single("image"), brandController.addBrand);
router.put('/brand/:id', adminAuth, uploads.single("image"), brandController.editBrand);
router.patch('/brand/:id/status', adminAuth, brandController.brandStatus);


// Product Management
router.get('/addProducts', adminAuth, productController.getProductPage);
router.post('/addProducts', adminAuth, uploads.any(), productController.addProduct);
router.put('/product/:id', adminAuth, uploads.any(), productController.updateProduct);
router.get('/products/:id', adminAuth, productController.getProductJson);
router.get('/products/:productId/variants/:variantId', adminAuth, productController.getVariantJson);
router.patch('/products/:id/status', adminAuth, productController.toggleProductStatus);
router.patch('/products/:productId/variants/:variantId/status', adminAuth, productController.toggleVariantStatus);


router.put('/products/:productId/variants/:variantId', adminAuth, uploads.any(), productController.updateVariant);


// Order Management
router.get('/orders',adminAuth, orderController.loadOrders);
router.get('/orders/:id', adminAuth,orderController.loadOrderDetail)
router.patch('/orders/:orderId/status',adminAuth, orderController.updateOrderStatus);
router.post('/orders/:orderId/return',adminAuth, orderController.verifyReturnRequest);
router.post('/orders/:orderId/:itemId/return',adminAuth, orderController.verifyItemReturnRequest);




// Coupon management
router.get('/coupon',adminAuth, couponController.loadCoupon);
router.post('/coupon',adminAuth, couponController.addCoupons);
router.put('/coupon',adminAuth, couponController.updateCoupon);
router.delete('/coupon/:id',adminAuth, couponController.deleteCoupon);


//  sales report
router.get('/sales-report',adminAuth,salesController.loadSalesReport);
router.get('/sales-report/filter',adminAuth,salesController.filterSalesReport);
router.get('/sales-report/download/:type', adminAuth, salesController.downloadSalesReport);

// router.use(errorController.pageError)

module.exports = router;