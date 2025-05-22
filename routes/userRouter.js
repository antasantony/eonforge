const express=require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const profileController =require('../controllers/user/profileController')
const passport = require('passport');
const { userAuth } = require('../middlewares/auth');

router.get('/pageNotFound',userController.pageNotFound);
router.get('/',userController.loadHomePage);
router.get('/signup',userController.loadSignup);
router.post('/signup',userController.signup);
router.post('/verify-otp',userController.verifyOtp)
router.get('/login',userController.loadLogin)
router.post('/login',userController.login)
router.get('/verify-otp',userController.loadVerifyotp)
router.post('/resend-otp',userController.resendOtp)


router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    req.session.userId = req.user._id;

    res.redirect('/')
});
router.get('/logout',userController.logout)

//====== profile Managenent  ========//

router.get('/forgot-password',profileController.loadForgotPassword)
router.post('/forgot-password',profileController.forgotPassword)
router.post('/forgotPassword-otp',profileController.forgotPasswordOtp)
router.get('/reset-password',profileController.resetPassword)
router.patch('/reset-password',profileController.updatePassword)
router.post('/forgotResend-otp',profileController.forgotResendOtp)





module.exports = router;