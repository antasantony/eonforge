const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const brandController = require('../controllers/admin/brandController');
const productController = require('../controllers/admin/productController');
const orderController =require('../controllers/admin/orderController');
const offerController =require('../controllers/admin/offerController');
const couponController=require('../controllers/admin/couponController');
const { adminLogin, adminAuth } = require('../middlewares/auth');
// const multer = require('multer')
const uploads = require('../helpers/multer');
// const uploads = multer({storage:storage})


router.get('/pageError', adminController.pageError);
router.get('/login',adminLogin,adminController.loadLogin);
router.post('/login',adminLogin,adminController.login);
router.get('/adminDashboard',adminAuth, adminController.loadDashboard);
router.get('/logout',adminController.adminLogout);


//Customer Management
router.get('/users',adminAuth, customerController.customerInfo);
router.post('/blockCustomer',adminAuth,customerController.customerBlocked);
router.post('/unblockCustomer', adminAuth,customerController.customerUnblocked);


// Category Management
router.get('/category',adminAuth, categoryController.categoryInfo);
router.post('/addCategory', adminAuth,categoryController.addOrUpdateCategory);
router.put('/addCategory/:id', adminAuth,categoryController.addOrUpdateCategory);
router.patch('/category/:id/status',adminAuth, categoryController.categoryStatus);

// Brand Management
router.get('/brands',adminAuth, brandController.getBrandPage);
router.post('/addBrand', adminAuth,uploads.single("image"), brandController.addBrand);
router.put('/brand/:id',  adminAuth,uploads.single("image"), brandController.editBrand);
router.patch('/brand/:id/status',adminAuth, brandController.brandStatus);


// Product Management
router.get('/addProducts', adminAuth,productController.getProductPage);
router.post('/addProducts', adminAuth,uploads.any(), productController.addProduct);
router.put('/product/:id', adminAuth,uploads.any(), productController.updateProduct);
router.get('/products/:id', adminAuth,productController.getProductJson);
router.get('/products/:productId/variants/:variantId',adminAuth, productController.getVariantJson);
router.patch('/products/:id/status', adminAuth,productController.toggleProductStatus);
router.patch('/products/:productId/variants/:variantId/status',adminAuth, productController.toggleVariantStatus);


router.put('/products/:productId/variants/:variantId',adminAuth, uploads.any(), productController.updateVariant);


// Order Management
router.get('/orders',orderController.loadOrders);
router.get('/orders/:id',orderController.loadOrderDetail)
router.patch('/orders/:orderId/status', orderController.updateOrderStatus);
router.post('/orders/:orderId/return',  orderController.verifyReturnRequest);
router.post('/orders/:orderId/:itemId/return',  orderController.verifyItemReturnRequest);

// offer Management
router.get('/offer',offerController.loadOffer);
router.post('/addOffer',offerController.addOffer);


// Coupon management
router.get('/coupon',couponController.loadCoupon);
router.post('/addCoupons',couponController.addCoupons);
router.put('/updateCoupon',couponController.updateCoupon);
router.delete('/deleteCoupon/:id',couponController.deleteCoupon);

module.exports = router;