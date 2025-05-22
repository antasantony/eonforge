const express = require("express")
const router = express.Router();
const adminController = require("../controllers/admin/adminController")
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const brandController = require('../controllers/admin/brandController')
const productController = require('../controllers/admin/productController')
const { userAuth, adminAuth } = require('../middlewares/auth');
// const multer = require('multer')
const uploads = require('../helpers/multer')
// const uploads = multer({storage:storage})


router.get('/pageError', adminController.pageError)
router.get('/login', adminController.loadLogin);
router.post('/login', adminAuth, adminController.login)
router.get('/adminDashboard', adminAuth, adminController.loadDashboard)
router.get('/logout', adminAuth, adminController.adminLogout)


//Customer Management
router.get('/users', customerController.customerInfo)
router.post('/blockCustomer', customerController.customerBlocked)
router.post('/unblockCustomer', customerController.customerUnblocked)


// Category Management
router.get('/category', categoryController.categoryInfo);
router.post('/addCategory', categoryController.addOrUpdateCategory);
router.put('/addCategory/:id', categoryController.addOrUpdateCategory);
router.patch('/category/:id/status', categoryController.categoryStatus);

// Brand Management
router.get('/brands', brandController.getBrandPage)
router.post('/addBrand', uploads.single("image"), brandController.addBrand)
router.patch('/brand/:id/status', brandController.brandStatus);
router.delete('/brand/:id', brandController.deleteBrand);

// Product Management
router.get('/addProducts', productController.getProductPage);
router.post('/addProducts', uploads.any(), productController.addProduct);
router.put('/product/:id', uploads.any(), productController.updateProduct);
router.get('/products/:id', productController.getProductJson);
router.get('/products/:productId/variants/:variantId', productController.getVariantJson);
router.patch('/products/:id/status', productController.toggleProductStatus);
router.patch('/products/:productId/variants/block/:variantId', productController.blockVariant);
router.patch('/products/:productId/variants/unblock/:variantId', productController.unblockVariant);





module.exports = router;