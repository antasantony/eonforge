

const about = async (req,res) => {
   try {
    let user=null;
    res.render('about',{
        user
    })
   } catch (error) {
    console.log('about page error:',error)
   } 
};

const contact = async (req,res) => {
    try {
        let user=null;
        res.render('contact',{
            user
        })
    } catch (error) {
        console.log('contact page error:',error)
    }
    
}
const privacyPolicy = async (req,res) => {
    try {
        let user=null;
        res.render('privacyPolicy',{
            user
        })
    } catch (error) {
        console.log('Privacy Policy page error:',error)
    }
    
}


module.exports={
    about,
    contact,
    privacyPolicy
}