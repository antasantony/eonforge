// const User = require("../../models/userSchema")
// const nodemailer = require('nodemailer')
// const bcrypt = require("bcrypt")
// const session = require('express-session')
// const env = require('dotenv').config()





// const loadForgotPassword = async (req, res) => {

//   try {

//     res.render('forgot-password')

//   } catch (error) {
//     return res.redirect('/pageNotFound')

//   }

// }

// function generateOtp() {
//   const digits = '1234567890';
//   let otp = '';
//   for (let i = 0; i < 6; i++) {

//     otp += digits[Math.floor(Math.random() * 10)]
//   }
//   return otp

// }

// async function sendVerificationEmail(email, otp) {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       port: 587,
//       secure: false,
//       requireTLS: true,
//       auth: {
//         user: process.env.NODEMAILER_EMAIL,
//         pass: process.env.NODEMAILER_PASSWORD
//       }
//     })
//     const info = await transporter.sendMail({
//       from: process.env.NODEMAILER_EMAIL,
//       to: email,
//       subject: 'your otp forn password reset',
//       text: `Your OTP is ${otp}`,
//       html: `<p>your OTP is:<strong> ${otp}</strong></p>`,
//     })
//     //  console.log('Mail info:',info)
//     return info.accepted.length > 0

//   } catch (error) {
//     console.error('error sending email', error)
//     return false
//   }
// }


// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const findUser = await User.findOne({ email: email })

//     if (findUser) {
//       let otp = generateOtp();
//       const emailSent = await sendVerificationEmail(email, otp)

//       console.log('hello i am here', email)
//       if (emailSent) {
//         req.session.email = email;
//         req.session.otpExpiresAt = Date.now() + 60 * 1000;
//         req.session.otp = otp;

//         // res.redirect('forgotPass-otp')


//         console.log('OTP :', otp)

//       } else {

//         res.json({ success: false, message: 'Failed to send OTP. Please try again' });
//       }
//     } else {
//     
//     }

//   } catch (error) {
//     console.log(error)
//     res.redirect('/pageNotFound')
//   }
// }

// const loadForgotPasswordOtp=async (req,res) => {
//   try {
//       res.render('forgotPass-otp')
//   } catch (error) {
//     console.log(error)
//   }

// }



// const forgotPasswordOtp = async (req, res) => {
//   try {

//     const { otp } = req.body
//     console.log('hello typed otp', otp)
//     if (otp == req.session.otp) {
//       return res.json({ success: true, redirectUrl: '/reset-password' })
//     } else {
//       return res.json({ success: false, message: 'Incorrect OTP. Please try again.' });
//     }

//   } catch (error) {
//     console.log(error);
//     res.redirect('/pageNotFound')
//     res.status(500).json({ success: false, message: "an occuerd. Please try again" })
//   }

// }

// const forgotResendOtp = async (req, res) => {
//   try {

//     const email = req.session.email
//     console.log('hello i am here resend otp', req.session.email)
//     const otpExpiresAt = req.session.otpExpiresAt;
//     if (!email) {
//       return res.status(400).json({ success: false, message: 'Email not found in session' })
//     }

//     if (otpExpiresAt && Date.now() < otpExpiresAt) {
//       const secondsLeft = Math.ceil((otpExpiresAt - Date.now()) / 1000);
//       return res.status(429).json({
//         success: false,
//         message: `Please wait ${secondsLeft}s before resending OTP`
//       });
//     }




//     // const email = req.session.email
//     // console.log('resend otp mail:',email)


//     const otp = generateOtp();
//     req.session.otp = otp;

//     const emailSent = await sendVerificationEmail(email, otp);
//     if (emailSent) {
//       console.log('Resend OTP :', otp);
//       res.status(200).json({ success: true, message: 'OTP Resend Succeccfully' })

//     } else {
//       res.status(500).json({ success: false, message: 'Failed to resend OTP. Please try again' })
//     }
//   } catch (error) {
//     console.error('Error resending OTP', error);
//     res.status(500).json({ success: false, message: 'Internal Server Error . Please try again' })

//   }
// }

// const resetPassword = async (req, res) => {
//   try {
//     if (req.session.email) {
//       return res.render('reset-password')
//     } else {
//       res.redirect('/forgot-password')
//     }

//   } catch (error) {
//     console.log(error)
//     res.redirect('/pageNotFound')
//   }
// };


// const updatePassword = async (req, res) => {
//   try {
//     const { newPassword } = req.body;
//     const email = req.session.email;

//     console.log('Received body:', req.body);
//     console.log('Received email in session:', req.session.email);

//     if (!email) {
//       return res.status(400).json({ success: false, message: 'Session expired. Please try again.' });
//     }
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     await User.updateOne({ email }, { $set: { password: hashedPassword } });

//     req.session.email = null;
//     req.session.otp = null;


//     return res.json({ success: true, message: 'Password updated successfully. Please login again.' });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ success: false, message: 'Something went wrong' });
//   }
// };


// module.exports = {
//   loadForgotPassword,
//   forgotPassword,
//   loadForgotPasswordOtp,
//   forgotPasswordOtp,
//   resetPassword,
//   forgotResendOtp,
//   updatePassword

// }

const User = require("../../models/userSchema");
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const session = require('express-session');
require('dotenv').config();

const loadForgotPassword = async (req, res) => {
  try {
    res.render('forgot-password');
  } catch (error) {
    console.error('Error loading forgot password:', error);
    res.redirect('/pageNotFound');
  }
};

function generateOtp() {
  const digits = '1234567890';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    });

    const info = await transporter.sendMail({
      from: `"Eon Forge" <${process.env.NODEMAILER_EMAIL}>`,
      to: email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP is ${otp}`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const findUser = await User.findOne({ email });

    if (findUser) {
      const otp = generateOtp();
      const emailSent = await sendVerificationEmail(email, otp);
      console.log('hello i am here', email)
      if (emailSent) {
        req.session.email = email;
        req.session.otp = otp;
        console.log('OTP :', otp)
        req.session.otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
        req.session.resendOtpAllowedAt = Date.now() + 60 * 1000;
        return res.json({ success: true, redirectUrl: '/forgotPassword-otp' });
      } else {
        return res.json({ success: false, message: 'Failed to send OTP. Please try again.' });
      }
    } else {
      return res.json({ success: false, message: 'User with this email does not exist.' });
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.redirect('/pageNotFound');
  }
};

const loadForgotPasswordOtp = async (req, res) => {
  try {
    if (!req.session.email) {
      return res.redirect('/forgot-password');
    }
    res.render('forgotPass-otp');
  } catch (error) {
    console.error('Error loading OTP page:', error);
    res.redirect('/pageNotFound');
  }
};

const forgotPasswordOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!req.session.otp || !req.session.otpExpiresAt) {
      return res.json({ success: false, message: 'Session expired. Please start over.' });
    }

    if (Date.now() > req.session.otpExpiresAt) {
      return res.json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (otp === req.session.otp) {
      return res.json({ success: true, redirectUrl: '/reset-password' });
    } else {
      return res.json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.json({ success: false, message: 'An error occurred. Please try again.' });
  }
};

const forgotResendOtp = async (req, res) => {
    try {
        const email = req.session.email;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Session expired. Please start over.' });
        }

        const resendOtpAllowedAt =req.session.resendOtpAllowedAt;
        if (resendOtpAllowedAt && Date.now() < resendOtpAllowedAt) {
          console.log('otpexp',otpExpiresAt)
            const secondsLeft = Math.ceil((resendOtpAllowedAtt - Date.now()) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${secondsLeft} seconds before requesting a new OTP.`
            });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            req.session.otp = otp;
            req.session.otpExpiresAt = Date.now() + 5 * 60 * 1000; // Set to 5 minutes
            console.log('Resend OTP:', otp);
            return res.status(200).json({ success: true, message: 'OTP resent successfully.' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to resend OTP. Please try again.' });
        }
    } catch (error) {
        console.error('Error resending OTP:', error);
        return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
    }
};

const resetPassword = async (req, res) => {
  try {
    if (!req.session.email) {
      return res.redirect('/forgot-password');
    }
    res.render('reset-password');
  } catch (error) {
    console.error('Error loading reset password:', error);
    res.redirect('/pageNotFound');
  }
};

const updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const email = req.session.email;

    if (!email) {
      return res.json({ success: false, message: 'Session expired. Please start over.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    // Clear session
    req.session.destroy((err) => {
      if (err) console.error('Error destroying session:', err);
    });

    return res.json({ success: true, redirectUrl: '/login', message: 'Password updated successfully. Please login.' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.json({ success: false, message: 'An error occurred. Please try again.' });
  }
};

module.exports = {
  loadForgotPassword,
  forgotPassword,
  loadForgotPasswordOtp,
  forgotPasswordOtp,
  resetPassword,
  forgotResendOtp,
  updatePassword
};