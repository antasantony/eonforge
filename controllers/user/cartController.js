// controllers/user/cartController.js
const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Wishlist = require('../../models/wishlistSchema')

const addToCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, variantId } = req.body;

    const user = await User.findById(userId)
    if (!user || user.isBlocked) {
      return res.status(403).json({ success: false, message: 'You are blocked from making purchases' });
    }
    if (!userId) return res.status(401).json({ message: 'Login required' });

    const product = await Product.findById(productId).populate('brand');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const selectedVariant = product.colorVariants.find(
      variant => variant._id.toString() === variantId
    );
    if (!selectedVariant) return res.status(400).json({ message: 'Invalid variant selected' });

    const stock = selectedVariant.stock;
    if (stock < 1) return res.status(400).json({ message: 'Out of stock' });

    const quantity = 1; // Start with quantity 1
    const rawPrice = selectedVariant.offerPrice ?? selectedVariant.regularPrice;
    const price = Number(rawPrice);


    if (!price || isNaN(price)) {
      return res.status(400).json({ message: 'Invalid price for selected variant' });
    }

    const totalPrice = price * quantity;

    console.log('total price in add cart', totalPrice)
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [{
          productId,
          variantId,
          quantity,
          price,
          totalPrice
        }],
        cartTotal: totalPrice
      });
    } else {
      const existingItem = cart.items.find(
        item => item.productId.toString() === productId && item.variantId.toString() === variantId
      );

      if (existingItem) {
        return res.status(400).json({ success: false, message: 'This product is already in your cart' });
      }


      if (existingItem) {
        if (existingItem.quantity + quantity > stock) {
          return res.status(400).json({ message: `Only ${stock} units available` });
        }
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * existingItem.price;
      } else {
        const pushPrice = Number(selectedVariant.offerPrice ?? selectedVariant.regularPrice);
        if (!pushPrice || isNaN(pushPrice)) {
          return res.status(400).json({ message: 'Invalid price for selected variant' });
        }
        cart.items.push({
          productId,
          variantId,
          quantity,
          price: pushPrice,
          totalPrice: pushPrice * quantity
        });

      }
      cart.cartTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }

    await cart.save();

    await Wishlist.updateOne(
      { userId },
      {
        $pull: {

          products: {
            productId: productId,         // Ensure these are ObjectId types if needed
            variantId: variantId
          }
        }
      }
    );
    res.status(200).json({ message: 'Added to cart', redirectUrl: '/cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const loadCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');

    const cartData = await Cart.findOne({ userId })
      .populate({
        path: 'items.productId',
        populate: {
          path: 'brand',
          select: 'brandName'
        }
      });


    if (!cartData || !cartData.items.length) {
      console.log('No cart found or cart is empty for user:', userId);
      return res.render('cart', { cartItems: [] });
    }

    const cartItems = cartData.items.map(item => {
      const product = item.productId;
      const variant = product?.colorVariants.find(
        v => v._id.toString() === item.variantId.toString()
      );

      
      if (!product || !variant) {
        console.error(`Product or variant not found for item: ${item._id}`);
        return null;
      }
      const latestPrice = variant.offerPrice ?? variant.regularPrice;

      console.log('latest price is valid', latestPrice)
      
      const quantity = item.quantity !== undefined ? item.quantity : item.stock || 1;
      const cartItem = {
        id: item._id.toString(),
        productId: product._id.toString(),
        variantId: item.variantId.toString(),
        productName: product.productName || 'N/A',
        productImage: variant.productImage?.[0] || '/placeholder.svg?height=160&width=160',
        color: variant.colorName || 'N/A',
        price: latestPrice,
        quantity,
        total: latestPrice * quantity,
        brandName: product.brand?.brandName || 'N/A',
        stock: variant.stock,
        status: variant.stock > 0 ? 'Available' : 'Out of Stock'
      };

      console.log('Cart item:', cartItem);
      return cartItem;
    }).filter(Boolean);


    console.log('Final cartItems:', JSON.stringify(cartItems, null, 2));
    res.render('cart', { cartItems });
  } catch (error) {
    console.error('Cart page error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const updateCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const userId = req.session.userId;

    console.log('update cart in reqbody:', req.body);
    if (!userId) return res.status(401).json({ success: false, message: 'Login required' });
    if (!productId || !variantId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    console.log('update cart in product:', product);

    const variant = product.colorVariants.find(v => v._id.toString() === variantId);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });
    console.log('update cart in variant:', variant);
    console.log('update cart in real quantity:', quantity);

    const stock = variant.stock; 
    console.log('update cart in stock:', stock);

    if (quantity > stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${stock} units of ${product.productName} (${variant.colorName}) available`
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.find(
      i => i.productId.toString() === productId && i.variantId.toString() === variantId
    );
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' });

    // Update cart item quantity and totalPrice
          // stock//
    item.quantity = quantity;
    item.totalPrice = item.price * quantity;
    cart.cartTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

    await cart.save();

    res.json({
      success: true,
      message: 'Cart updated',
      stock: variant.stock 
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.session.userId;

    if (!userId) return res.status(401).json({ success: false, message: 'Login required' });

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    if (cart.items.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.cartTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    await cart.save();

    res.json({ success: true, message: 'Item removed' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};


const addWishlist = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const userId = req.session.userId;
    console.log('addwishlist in wishlist new', req.body);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please login to manage wishlist' });
    }

    if (!variantId) {
      return res.status(400).json({ success: false, message: 'Variant ID is required' });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ userId });
    let action = '';

    if (!wishlist) {
      // New wishlist
      wishlist = await Wishlist.create({
        userId,
        products: [{ productId, variantId }],
      });
      action = 'added';
    } else {
      const alreadyExists = wishlist.products.find(
        p => p.productId.toString() === productId && p.variantId.toString() === variantId
      );

      if (alreadyExists) {
        // Remove it
        wishlist.products = wishlist.products.filter(
          p => !(p.productId.toString() === productId && p.variantId.toString() === variantId)
        );
        action = 'removed';
      } else {
        // Add it
        wishlist.products.push({ productId, variantId });
        action = 'added';
      }
      await wishlist.save();
    }

    return res.json({
      success: true,
      action,
      message: action === 'added' ? 'Added to wishlist' : 'Removed from wishlist',
    });

  } catch (error) {
    console.error('Add to wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};




const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');

    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'products.productId',
        populate: {
          path: 'brand',
        },
      })
      .lean();


    res.render('wishlist', {
      wishlistItems: wishlist ? wishlist.products : []
    });

  } catch (error) {
    console.log('wishlist page error:', error);
    res.status(500).render('500', { message: 'Something went wrong while loading wishlist' });
  }
};


const removeFromWishlist = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const userId = req.session.userId;

    console.log('remove from wishlist', req.body)

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please login' });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    // Filter out the product
    wishlist.products = wishlist.products.filter(
      item => item.variantId.toString() !== variantId
    );

    await wishlist.save();

    res.json({ success: true, message: 'Product removed from wishlist' });

  } catch (error) {
    console.error('Remove wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addToCartFromWishlist = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    console.log('Received body:', req.body);

    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please login' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = product.colorVariants.id(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    const price = variant.offerPrice || variant.regularPrice;
    const totalPrice = price * 1; // Assuming quantity = 1

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check for duplicate product+variant
    const itemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      item.variantId.toString() === variantId
    );

    if (itemIndex > -1) {
      return res.status(400).json({ success: false, message: 'Product already in cart' });
    }

    cart.items.push({
      productId,
      variantId,
      quantity: 1,
      price,
      totalPrice
    });

    await cart.save();

    // Remove from wishlist
    await Wishlist.updateOne(
      { userId },
      { $pull: { products: { variantId } } }
    );

    return res.json({ success: true, message: 'Moved to cart and removed from wishlist' });

  } catch (error) {
    console.error('Add to cart from wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};





module.exports = {
  loadCart,
  addToCart,
  updateCart,
  removeFromCart,
  loadWishlist,
  addWishlist,
  addToCartFromWishlist,
  removeFromWishlist
};