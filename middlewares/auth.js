const User = require('../models/userSchema');

const userAuth = (req, res, next) => {
        if (req.session.userId) {
            User.findById(req.session.userId)

                .then(data => {
                    if (data && !data.isBlocked) {
                        next()
                    } else {
                        res.redirect('/login')
                    }

                })
                .catch(error => {
                    console.log('Error in user auth middleware', error)
                    res.status(500).send('Internal server error')
                })
        } else {
            res.redirect('/login')
        }
    }


const isLogin = async(req, res, next) => {
    console.log(req.session.userId)
    const user = await User.findOne({_id:req.session.userId,isBlocked:false})
    if (user) {
        console.log('hello sesssion1')
        return res.redirect('/');
    }
    next();
};


const isLogged = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    next(); // Proceed to userController.loadHomePage if not logged in
};

const adminAuth = (req, res, next) => {
    if (req.session.admin) {
        return next();
    } else {
        res.redirect('/admin/login');
    }
};


const adminLogin = (req, res, next) => {
    console.log('is login called')
    if (req.session.admin) {
        console.log('hello sesssion1')
        return res.redirect('/admin/adminDashboard');
    }
    next();
};

module.exports = {
    userAuth,
    isLogin,
    isLogged,
    adminAuth,
    adminLogin 
}