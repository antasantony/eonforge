const User=require('../../models/userSchema')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')





const pageError =async (req,res)=>{
    try {
        res.render('pageError')
    } catch (error) {
      res.status(500).send('Critical error')
        
    }
};



const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect('/admin/adminDashboard')
       }else{
        res.render('adminLogin',{message:null})
       }
       
    
}

const login = async (req,res)=>{
    try {
        const {email,password}=req.body;
        console.log('loginpost',req.body)
        const admin = await User.findOne({email,isAdmin:true})
        if(admin){
            console.log('afterpost',admin.email)
        const passwordMatch = await bcrypt.compare(password,admin.password)
        if(passwordMatch){
            req.session.admin=admin._id
            req.session.admin = true;
    console.log('passwordmatch',admin.email)
           return res.json({success:true,redirectUrl:'/admin/adminDashboard'})
        }else{
            return res.json({message:"invalid password"})
        }
        }else{
            return res.json({message:"Please enter  Email and Password "})
        }

    } catch (error) {
        console.log("login error",error);
        res.json({redirectUrl:'/admin/pageError'})
    }
}

const loadDashboard= async (req,res)=>{
    try {
        if(req.session.admin){
            console.log("loading dashborad",req.session.admin)
            res.render('adminDashboard')
        }else{
            res.redirect('/admin/login')
           
        }
    } catch (error) {
        res.redirect('/admin/pageError')
    }
}
const adminLogout = async (req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("Error destroying session",err);
              return res.redirect('/admin/pageError');

            }
            return res.redirect('/admin/login')
        })
    } catch (error) {
        console.log("unexpected error during logout",error)
        res.redirect("/admin/pageError")
    }
}
   







module.exports={
    loadLogin,
    login,
    loadDashboard,
    pageError,
    adminLogout
}