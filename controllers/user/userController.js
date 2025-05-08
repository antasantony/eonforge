const User = require("../../models/userSchema");
const env = require("dotenv").config();
const nodemailer=require("nodemailer")
const bcrypt = require("bcrypt")
const pageNotFound= async (req,res)=>{
  try{
   res.render('page-404')
  }
  catch(error){
  res.redirect('/pageNotFound')
  }
}

     
//===========  home page  ============//


const loadHomePage = async (req,res)=>{
  try{
    console.log("Google login session saved:", req.session.userId);

    const userId = req.session.userId;
    const isLoggedIn = !!userId;
    let user = null;

    if (isLoggedIn) {
      user = await User.findById(userId);
    }

    console.log('Is Logged In:', isLoggedIn);
    console.log('Session userId:', userId);
    console.log('User:', user);

    return res.render('home', { isLoggedIn, user });
  }catch (error){
    console.log('Home page not found')
    res.status(500).send('Server error')
  }
} 

// =============  loading signup  ==============//

const loadSignup = async(req,res)=>{
  try{
    return res.render('signup',{message:'null', title: 'Sign Up - EON FORGE' });
  }catch(error){
    console.log('Home page not loading:',error);
    res.status(500).send("Server Error ")
  }
}

//===========  otp generate  ===========//

function generateOtp(){
  return Math.floor(100000+ Math.random()*900000).toString();
}

 //============   verification mail sending ============//

async function sendVerificationEmail(email,otp){
  try {
   const transporter = nodemailer.createTransport({
    service:'gmail',
    port:587,
    secure:false,
    requireTLs:true,
    auth:{
      user:process.env.NODEMAILER_EMAIL,
      pass:process.env.NODEMAILER_PASSWORD
    }
   })

 

   const info = await transporter.sendMail({
    from:process.env.NODEMAILER_EMAIL,
    to:email,
    subject:'verify your account',
    text:`Your OTP is ${otp}`,
    html:`<p>your OTP is:<strong> ${otp}</strong></p>`,
   })
  //  console.log('Mail info:',info)
   return info.accepted.length>0 


  } catch (error) {
    console.error('Error sending email',error);
    return false ;
  }
}

//==========  load otp page  ==========//


const loadVerifyotp= async(req,res)=>{
  try {
    res.render('verify-otp')
    
  } catch (error) {
    console.error('Error loading Otp page',error);
    res.redirect('/pageNotFound')
  }
}
 
//===========  verify signup  ===========//

const signup = async (req,res)=>{
  try {   
    const{firstName,lastName,email,password,confirmPassword} = req.body;


    if(password!=confirmPassword){
      return res.json({success:false,message:"Password do not match"})
    }

    const findUser = await User.findOne({email});
    if(findUser){
      if(findUser.googleId){
        return res.json({success:false,message:'This email is registered via Google. Please login using Google.'})
      }else{
        return res.json({success:false,message:"User with this email already exists"})
      }
      
    }

    const otp=generateOtp()
    const emailSent = await sendVerificationEmail(email,otp)
    if(!emailSent){
      return res.json('email-error')
    }
    
    req.session.userOtp = otp;
    req.session.otpExpiresAt= Date.now()+60*1000;
    req.session.userData = {lastName,firstName,email,password}
    
    console.log('OTP sent',otp)
   
  return res.json({success:true,redirectUrl:"/verify-otp"})
  
  
   } catch(error){
    console.error('Error for save user',error)
    res.status(500).send('Internal server Error')
   }
   
}

  const securePassword = async (password)=>{
    try {

      const passwordHash = await bcrypt.hash(password,10)
      return passwordHash;

    } catch (error) {
      console.error("Error hashing password", error);
      throw error;
    }
  }

  //=========  verifying otp  ==========//

  const verifyOtp=async (req,res)=>{
    try {
      const {otp} = req.body
      console.log(req.body)
      if(otp==req.session.userOtp){
        const user= req.session.userData
        const passwordHash = await securePassword(user.password);
        const saveUserData=new User({
          firstName:user.firstName,
          lastName:user.lastName,
          email:user.email,
          password:passwordHash,

        })
        await saveUserData.save()
        req.session.userId = saveUserData._id;

        req.session.save(() => {
          console.log('Session saved:', req.session.userId);
          res.json({ success: true, redirectUrl: '/' });
        });
        
      }else{
        res.status(400).json({success:false, message:"Invalid OTP Please try again"})
      }
       
    } catch (error) {
      console.error('Error verifying OTP',error);
      res.status(500).json({success:false, message:'An error occured'})
    }
  }

  const resendOtp=async(req,res)=>{
    try {

      const userData = req.session.userData
      console.log(userData)
      const otpExpiresAt=req.session.otpExpiresAt;
      if(!userData ||!userData.email){
        return res.status(400).json({success:false,message:'Email not found in session'})
      }
      
      if (otpExpiresAt && Date.now() < otpExpiresAt) {
        const secondsLeft = Math.ceil((otpExpiresAt - Date.now()) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft}s before resending OTP`
        });
      }
  



      const email = userData.email
      

      const otp = generateOtp();
      req.session.userOtp = otp;

      const emailSent = await sendVerificationEmail(email,otp);
      if(emailSent){
        console.log('Resend OTP :',otp);
        res.status(200).json({success:true,message:'OTP Resend Succeccfully'})

      }else{
        res.status(500).json({success:false,message:'Failed to resend OTP. Please try again'})
      }
    } catch (error) {
      console.error('Error resending OTP',error);
      res.status(500).json({success:false,message:'Internal Server Error . Please try again'})
      
    }
  }
//=========   LOAD LOGIN  ==========//

  const loadLogin = async (req,res)=>{
    try{
      if(!req.session.user){
        return res.render('login',{success:false,message:""})
      }else{
        res.redirect('/')
      }
  
    }catch (error){
      // console.log('Home page not found')
      // res.status(500).send('Server error')
      res.redirect('/pageNotFound')
    }
  }
 
  //========== verifying login  ===========//
  const login = async (req,res)=>{
    try {
       
      const{email,password,googleId} = req.body;
      console.log(googleId)

      let findUser;
      if(googleId){
        findUser= await User.findOne({email})
        if(!findUser){
          findUser = new User({email:email,googleId:googleId})
          await findUser.save();
        }else if(!findUser.googleId){
          return res.json({success:false,message:'This email is registered using password. Please use normal login.'})
        }
        console.log(findUser)
        req.session.userId = findUser._id;
        return res.json({ success: true, redirectUrl: '/' });
      }else{
        
       findUser = await User.findOne({isAdmin:0,email:email});
       if(!findUser){
         return res.json({success:false,message: 'Invalid email address'})
       }
       if(findUser.googleId){
         return res.json({success:false,message:'This account is registered via Google. Please login using Google.'})
       }
 
       if(findUser.isBlocked){
          return res.json({success:false,message:'User  is blocked by admin'})
       }
       const passwordMatch = await bcrypt.compare(password,findUser.password);
        if(!passwordMatch){
         return res.json({success:false,message:'Password is incorrect'});
        }
        
        req.session.userId = findUser._id ;
        return res.json({success:true,redirectUrl:"/"})
      }

    } catch (error) {
      console.error('login error',error);
      res.json({success:false,message:'signin failed. Please try again later '})
    }
  }
  const logout = async (req,res)=>{
    try {
      req.session.destroy((err)=>{
        if(err){
          console.log("Session destruction error",err.message);
        }
        return res.redirect('/login')
       
      })
    } catch (error) {
      console.log('Logout error',error)
      res.redirect('/pageNotFound')
    }
  }




module.exports = {
    loadHomePage,
    loadSignup,
    pageNotFound,
    signup,
    loadVerifyotp,
    verifyOtp,
    loadLogin,
    login,
    resendOtp,
    logout
    
}