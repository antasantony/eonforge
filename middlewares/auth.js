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


const isLogin = (req, res, next) => {
    console.log('is login called')
    if (req.session.userId) {
        console.log('hello sesssion1')
        return res.redirect('/');
    }
    next();
};


const adminAuth = (req, res, next) => {
    User.findOne({ isAdmin: true })

        .then(data => {
            if (data) {

                next();

            } else {
                res.redirect('/admin/login')
            }
        })

        .catch(error => {
            console.log("Error in adminAuth middleware", error);
            res.status(500).send('Internal server Error')
        })
}

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
    adminAuth,
    adminLogin 
}