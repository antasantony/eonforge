const express=require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const profileController =require('../controllers/user/profileController')
const productController=require('../controllers/user/productController')
const passport = require('passport');
const { userAuth,isLogin } = require('../middlewares/auth');


router.get('/pageNotFound',userController.pageNotFound);
router.get('/signup',isLogin,userController.loadSignup);
router.post('/signup',userController.signup);
router.post('/verify-otp',userController.verifyOtp)
router.get('/login', isLogin, userController.loadLogin);
router.post('/login',userController.login)
router.get('/verify-otp',userController.loadVerifyotp)
router.post('/resend-otp',userController.resendOtp)


router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    req.session.userId = req.user._id;

    res.redirect('/')
});
router.get('/logout',userAuth,userController.logout)


//======== load home page/shop page =============//

  router.get('/',userController.loadHomePage);
  router.get('/shop',userController.loadShopPage);
  router.get('/filter',userController.filterProducts);
//====== profile Managenent  ========//

router.get('/forgot-password', profileController.loadForgotPassword);
router.post('/forgot-password', profileController.forgotPassword);
router.get('/forgotPassword-otp', profileController.loadForgotPasswordOtp)
router.post('/forgotPassword-otp', profileController.forgotPasswordOtp);
router.post('/forgotResend-otp', profileController.forgotResendOtp);
router.get('/reset-password', profileController.resetPassword);
router.patch('/reset-password', profileController.updatePassword);

//=========== product detail page ============//

router.get('/product-detail/:id',productController.loadProductDetail)



module.exports = router;