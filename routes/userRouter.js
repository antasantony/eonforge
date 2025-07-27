const express = require('express');
const router = express.Router();
const nocache = require('nocache');
const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const productController = require('../controllers/user/productController');
const cartController = require('../controllers/user/cartController');
const checkoutController=require('../controllers/user/checkoutController');
const paymentController =require('../controllers/user/paymentController')
const passport = require('passport');
const uploads = require('../helpers/multer');
const { userAuth, isLogin} = require('../middlewares/auth');


router.get('/pageNotFound', userController.pageNotFound);
router.get('/signup', isLogin, userController.loadSignup);
router.post('/signup', isLogin, userController.signup);
router.post('/verify-otp', userController.verifyOtp)
router.get('/login',nocache(), isLogin, userController.loadLogin);
router.post('/login',nocache(), isLogin, userController.login)
router.get('/verify-otp', userController.loadVerifyotp)
router.post('/resend-otp', userController.resendOtp)


router.get('/auth/google',nocache(), isLogin, passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
  console.log('reached')
  req.session.userId = req.user._id;

  res.redirect('/')
});
router.get('/logout', userController.logout)


//============ load home page/shop page =============//

router.get('/',  userController.loadHomePage);
router.get('/shop', userController.loadShopPage);
router.get('/filter', userController.filterProducts);

//=========== profile Managenent ============//

router.get('/forgot-password', isLogin, profileController.loadForgotPassword);
router.post('/forgot-password', isLogin, profileController.forgotPassword);
router.get('/forgotPassword-otp', isLogin, profileController.loadForgotPasswordOtp);
router.post('/forgotPassword-otp', isLogin, profileController.forgotPasswordOtp);
router.post('/forgotResend-otp', isLogin, profileController.forgotResendOtp);
router.get('/reset-password', isLogin, profileController.resetPassword);
router.patch('/reset-password', isLogin, profileController.updatePassword);

router.get('/profile', userAuth, profileController.userProfile)     //userAuth//
router.get('/editProfile', userAuth, profileController.loadEditProfile)
router.post('/editProfile', userAuth, uploads.single("profileImage"), profileController.editProfile)
router.get('/change-email', userAuth, profileController.changeEmail)
router.post('/change-email', userAuth, profileController.changeEmailvalid)
router.get('/change-email-otp', userAuth, profileController.loadChangeEmailOtp)
router.post('/change-email-otp', userAuth, profileController.changeEmailOtp)
router.get('/update-email', userAuth, profileController.loadUpdateEmail)
router.post('/update-email', userAuth, profileController.updateEmail)
router.get('/change-newEmail-otp',userAuth,profileController. loadChangeNewEmailOtp)
router.post('/change-newEmail-otp',userAuth,profileController.changeNewEmailOtp)
router.post('/change-password', userAuth, profileController.changePassword)



//=============  address management  ===============//

router.get('/add-address', userAuth, profileController.addAddress)
router.post('/add-address', userAuth, profileController.postAddAddress)
router.put('/update-address', userAuth, profileController.updateAddress)
router.delete('/delete-address', userAuth, profileController.deleteAddress)


//========== cart management  ==================//

router.get('/cart',userAuth, cartController.loadCart)
router.post('/addCart', cartController.addToCart)
router.post('/update-cart',cartController.updateCart)
router.post('/remove-from-cart', cartController.removeFromCart);
//================  wishlist ==================//
router.get('/wishlist',userAuth,cartController.loadWishlist)
router.post('/addWishlist',userAuth,cartController.addWishlist)
router.post('/remove-from-wishlist',cartController.removeFromWishlist);
router.post('/wishlist-to-cart', cartController.addToCartFromWishlist);




//============= checkout management  ==============//
router.get('/checkout',checkoutController.loadCheckout);
router.post('/checkout-address', checkoutController.addAddress);
router.put('/checkout-edit-address', checkoutController.editAddress);
router.post('/checkout-delete-address', checkoutController.deleteAddress);
// Online payment  //


router.post('/place-order',checkoutController.placeOrder);
router.get('/place-order',checkoutController.loadPlaceOrder)
router.get('/order-details',checkoutController.orderDetails)
router.get('/orders',checkoutController.orders);
router.patch('/cancel-order-item/:orderId/:itemId',checkoutController.cancelOrderItem)
router.post('/return-order-item', checkoutController.returnOrderItem);

router.post('/cancel-order', checkoutController.cancelOrder)
router.post('/return-order', checkoutController.returnOrder);

//=========== product detail page ============//

router.get('/product-detail/:id', productController.loadProductDetail)

//================== wallet =====================//

router.get('/wallet',productController.loadWallet)
router.post('/wallet/add-funds', productController.addFunds);
router.post('/wallet/verify-add-funds', productController.verifyAddFunds);


// ============ payment  ============= //

router.post('/payment/create-order',paymentController.createRazorpayOrder);
router.post('/payment/verify', paymentController.verifyAndPlaceOrder);

module.exports = router;