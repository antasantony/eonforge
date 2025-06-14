const Product=require('../../models/productSchema');
const Cart=require('../../models/cartSchema')




const loadCart=async (req,res) => {
    try {

        const userId=req.session.userId
        if(!userId){
            res.redirect('/login')

        }
        // const cartData= await Cart.findOne({userId}).populate("items.productId")
        // cartData.items.forEach((item)=>{
        //     console.log('product from cart here',item.productId.productName)
        // })

      
        res.render('cart')
    } catch (error) {
        console.log('Cart page error',error)
    }
    
}









module.exports={
    loadCart
}