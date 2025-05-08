const express = require("express")
const router = express.Router();
const adminController = require("../controllers/admin/adminController")
const customerController = require('../controllers/admin/customerController')
const {userAuth,adminAuth} = require('../middlewares/auth')



router.get('/pageError',adminController.pageError)
router.get('/login',adminAuth,adminController.loadLogin);
router.post('/login',adminAuth,adminController.login)
router.get('/adminDashboard',adminController.loadDashboard)
router.get('/logout',adminController.adminLogout)


//Customer Management
router.get('/users',adminAuth,customerController.customerInfo)
router.post('/blockCustomer',adminAuth,customerController.customerBlocked)
router.post('/unblockCustomer',adminAuth,customerController.customerUnblocked)













module.exports=router;