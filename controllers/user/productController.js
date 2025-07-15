const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const Cart = require('../../models/cartSchema')
const Wishlist = require('../../models/wishlistSchema')


const loadProductDetail = async (req, res) => {
  try {
    const userId = req.session.userId;
    const isLoggedIn = !!userId;
    const user = isLoggedIn ? await User.findById(userId) : null;

 let wishlistProductIds = [];
if (isLoggedIn) {
  const wishlist = await Wishlist.findOne({ userId }).lean();
  if (wishlist) {
    wishlistProductIds = wishlist.products.map(item => `${item.productId}:${item.variantId}`);
  }
}



    const productId = req.params.id
    const variantId = req.query.variant;

    console.log('hello variant', variantId)

    const brands = await Brand.find({ isBlocked: false }).lean();
    const categories = await Category.find({ isListed: true }).lean();

    // Fetch product with validation for unblocked brand and listed category
    const product = await Product.findOne({
      _id: productId,
      isBlocked: false,
      brand: { $in: await Brand.find({ isBlocked: false }).distinct('_id') },
      category: { $in: await Category.find({ isListed: true }).distinct('_id') },
    })
      .populate('category')
      .populate('brand')
      .lean();

      
      
      let selectedVariant = product.colorVariants[0];
      
      if (variantId) {
        const variant = product.colorVariants.find(v => v._id.toString() === variantId);
        if (variant) selectedVariant = variant;
      }
      const cart = await Cart.findOne({ userId });
  
      let cartQuantity = 0;
      if (cart) {
  
        const item = cart.items.find((value) => value.productId.toString() === productId &&
          value.variantId.toString() === selectedVariant._id.toString()
        );
        cartQuantity = item ? item.stock : 0;
      }
  console.log('cart quantity in product detail',cartQuantity)
let isInCart = false;
if (cart) {
  const item = cart.items.find((value) =>
    value.productId.toString() === productId &&
    value.variantId.toString() === selectedVariant._id.toString()
  );
  if (item) {
    cartQuantity = item.stock;
    isInCart = true;
  }
}
    const sameBrandProducts = await Product.find({
      brand: product.brand._id,
      _id: { $ne: product._id },
      isBlocked: false
    })
      .limit(5);
    res.render('product-detail', {
      user,
      isLoggedIn,
      product,
      categories,
      brands,
      selectedVariant,
      sameBrandProducts,
      cartQuantity,
      isInCart,
       wishlistProductIds

    })
  } catch (error) {

    console.error('Error loading product detail:', error);
    res.redirect('/pageNotFound');
  }
}




module.exports = {
  loadProductDetail,
};