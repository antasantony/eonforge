const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController')
const productController = require('../controllers/user/productController')
const cartController=require('../controllers/user/cartController')
const passport = require('passport');
const uploads = require('../helpers/multer')
const { userAuth, isLogin } = require('../middlewares/auth');


router.get('/pageNotFound', userController.pageNotFound);
router.get('/signup',  userController.loadSignup);
router.post('/signup', userController.signup);
router.post('/verify-otp', userController.verifyOtp)
router.get('/login',  userController.loadLogin);
router.post('/login', userController.login)
router.get('/verify-otp', userController.loadVerifyotp)
router.post('/resend-otp', userController.resendOtp)


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
  req.session.userId = req.user._id;

  res.redirect('/')
});
router.get('/logout',  userController.logout)


//============ load home page/shop page =============//

router.get('/', userController.loadHomePage);
router.get('/shop', userController.loadShopPage);
router.get('/filter', userController.filterProducts);

//=========== profile Managenent ============//

router.get('/forgot-password', profileController.loadForgotPassword);
router.post('/forgot-password', profileController.forgotPassword);
router.get('/forgotPassword-otp', profileController.loadForgotPasswordOtp)
router.post('/forgotPassword-otp', profileController.forgotPasswordOtp);
router.post('/forgotResend-otp', profileController.forgotResendOtp);
router.get('/reset-password', profileController.resetPassword);
router.patch('/reset-password', profileController.updatePassword);
router.get('/profile', profileController.userProfile)     //userAuth//
router.get('/editProfile', profileController.loadEditProfile)
router.post('/editProfile', uploads.single("profileImage"), profileController.editProfile)
router.get('/change-email', profileController.changeEmail)
router.post('/change-email', profileController.changeEmailvalid)
router.get('/change-email-otp', profileController.loadChangeEmailOtp)
router.post('/change-email-otp', profileController.changeEmailOtp)
router.get('/update-email',profileController.loadUpdateEmail)
router.post('/update-email',profileController.updateEmail)
router.post('/change-password',profileController.changePassword)

//=============  address management  ===============//

router.get('/add-address',profileController.addAddress)
router.post('/add-address',profileController.postAddAddress)
router.put('/update-address',profileController.updateAddress)
router.delete('/delete-address',profileController.deleteAddress)


//========== cart management  ==================//
router.get('/cart',cartController.loadCart)

//=========== product detail page ============//

router.get('/product-detail/:id', productController.loadProductDetail)



module.exports = router;