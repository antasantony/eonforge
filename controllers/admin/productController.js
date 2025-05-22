const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const getProductPage = async (req, res) => {
  try {
    let search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const brands = await Brand.find({ brandName: { $regex: search, $options: 'i' }, isBlocked: false }).select('_id').lean();
    const categories = await Category.find({ name: { $regex: search, $options: 'i' }, isListed: true }).select('_id').lean();

    const brandIds = brands.map((b) => b._id);
    const categoryIds = categories.map((c) => c._id);

    const searchQuery = {
      $or: [
        { productName: { $regex: search, $options: 'i' } },
        { brand: { $in: brandIds } },
        { category: { $in: categoryIds } },
      ],
    };

    const productsRaw = await Product.find(searchQuery)
      .populate('brand')
      .populate('category')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / limit);

    const products = productsRaw.map((p) => {
      const firstVar = p.colorVariants?.[0] || {};
      const stockSum = p.colorVariants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
      const hasStock = p.colorVariants?.some((v) => (v.stock || 0) > 0 && !v.deletedAt) || false;
      const status = p.isBlocked || !hasStock ? 'Out of Stock' : 'Available';
      return {
        ...p,
        variants: p.colorVariants.map((v) => ({
          ...v,
          hasOffer: v.hasOffer ?? false,
          isActive: v.deletedAt ? 'Out of Stock' : (v.stock > 0 ? 'Available' : 'Out of Stock'),
          _id: v._id?.toString(),
        })),
        regularPrice: firstVar.regularPrice ?? null,
        offerPrice: firstVar.offerPrice ?? null,
        stockTotal: stockSum,
        status,
        isBlocked: p.isBlocked,
      };
    });

    res.render('product-add', {
      cat: await Category.find({ isListed: true }).lean(),
      brand: await Brand.find({ isBlocked: false }).lean(),
      products,
      currentPage: page,
      totalPages,
      search,
      limit,
    });
  } catch (error) {
    console.error(error);
    res.redirect('/pageError');
  }
};

const addProduct = async (req, res) => {
  try {
    const { productName, description, brand, category, colorVariants, hasOffer } = req.body;

    if (!colorVariants) return res.status(400).json({ message: 'Missing colorVariants data' });

    let variants;
    try {
      variants = JSON.parse(colorVariants);
    } catch {
      return res.status(400).json({ message: 'Invalid JSON in colorVariants' });
    }

    const fileMap = {};
    (req.files || []).forEach((f) => {
      (fileMap[f.fieldname] ||= []).push(f);
    });

    const resizedDir = path.join(__dirname, '../../public/uploads/product-resized');
    if (!fs.existsSync(resizedDir)) fs.mkdirSync(resizedDir, { recursive: true });

    variants = await Promise.all(
      variants.map(async (variant, idx) => {
        const images = fileMap[`colorVariants[${idx}].productImage`] || [];
        const fileNames = [];

        for (const file of images) {
          const newName = `${Date.now()}-${file.originalname}`;
          const output = path.join(resizedDir, newName);
          await sharp(file.path).resize(800, 800).toFile(output);
          fs.unlinkSync(file.path);
          fileNames.push(`/uploads/product-resized/${newName}`);
        }

        return {
          ...variant,
          productImage: fileNames.length > 0 ? fileNames : variant.productImage || [],
          stock: parseInt(variant.stock) || 0,
          regularPrice: parseFloat(variant.regularPrice) || 0,
          offerPrice: parseFloat(variant.offerPrice) || 0,
          hasOffer: !!variant.hasOffer,
          isActive: parseInt(variant.stock) > 0 ? 'Available' : 'Out of Stock',
          deletedAt: null, // Ensure new variants are not blocked by default
        };
      })
    );

    const newProduct = new Product({
      productName,
      description,
      brand,
      category,
      colorVariants: variants,
      hasOffer: !!hasOffer,
      isBlocked: false,
    });

    await newProduct.save();
    res.status(200).json({ success: true, message: 'Product added successfully.' });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to add product',
    });
  }
};

const getProductJson = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand')
      .populate('category')
      .lean();
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });

    const hasStock = product.colorVariants?.some((v) => (v.stock || 0) > 0 && !v.deletedAt) || false;
    const status = product.isBlocked || !hasStock ? 'Out of Stock' : 'Available';

    const formattedProduct = {
      ...product,
      colorVariants: product.colorVariants.map((v) => ({
        ...v,
        productImage: v.productImage || [],
        hasOffer: v.hasOffer ?? false,
        isActive: v.deletedAt ? 'Out of Stock' : (v.stock > 0 ? 'Available' : 'Out of Stock'),
      })),
      isBlocked: product.isBlocked,
      status,
    };

    res.json(formattedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

const getVariantJson = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const variant = product.colorVariants.find((v) => v._id.toString() === req.params.variantId);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const hasStock = product.colorVariants?.some((v) => (v.stock || 0) > 0 && !v.deletedAt) || false;
    const status = product.isBlocked || !hasStock ? 'Out of Stock' : 'Available';

    res.json({
      ...variant,
      productName: product.productName,
      brand: product.brand,
      category: product.category,
      description: product.description,
      status,
      hasOffer: variant.hasOffer ?? false,
      isActive: variant.deletedAt ? 'Out of Stock' : (variant.stock > 0 ? 'Available' : 'Out of Stock'),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch variant' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { productName, description, brand, category, colorVariants, hasOffer } = req.body;

    const fileMap = {};
    (req.files || []).forEach((f) => {
      (fileMap[f.fieldname] ||= []).push(f);
    });

    if (!colorVariants) return res.status(400).json({ message: 'Missing colorVariants data' });

    let variants;
    try {
      variants = JSON.parse(colorVariants);
    } catch {
      return res.status(400).json({ message: 'Invalid JSON in colorVariants' });
    }

    const resizedDir = path.join(__dirname, '../../public/uploads/product-resized');
    if (!fs.existsSync(resizedDir)) fs.mkdirSync(resizedDir, { recursive: true });

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) return res.status(404).json({ success: false, message: 'Product not found' });

    variants = await Promise.all(
      variants.map(async (variant, idx) => {
        const imagesInField = fileMap[`colorVariants[${idx}].productImage`] || [];
        const removeImage = req.body[`colorVariants[${idx}].removeImage`] === 'on';
        const existingImages = req.body[`colorVariants[${idx}].existingImage`] || [];

        let imagePaths = [];

        if (removeImage) {
          if (Array.isArray(existingImages)) {
            existingImages.forEach((imgPath) => {
              const fullPath = path.join(__dirname, '../../public', imgPath);
              if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            });
          } else if (existingImages) {
            const fullPath = path.join(__dirname, '../../public', existingImages);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
          }
        } else if (imagesInField.length === 0) {
          imagePaths = Array.isArray(existingImages) ? existingImages : existingImages ? [existingImages] : [];
        }

        for (const file of imagesInField) {
          const newName = `${Date.now()}-${file.originalname}`;
          const output = path.join(resizedDir, newName);
          await sharp(file.path).resize(800, 800).toFile(output);
          fs.unlinkSync(file.path);
          imagePaths.push(`/uploads/product-resized/${newName}`);
        }

        // Preserve the deletedAt state of the variant if it exists
        const existingVariant = existingProduct.colorVariants.find(v => v._id.toString() === variant._id);
        const deletedAt = existingVariant ? existingVariant.deletedAt : null;

        return {
          ...variant,
          productImage: imagePaths,
          stock: parseInt(variant.stock) || 0,
          regularPrice: parseFloat(variant.regularPrice) || 0,
          offerPrice: parseFloat(variant.offerPrice) || 0,
          hasOffer: !!variant.hasOffer,
          isActive: deletedAt ? 'Out of Stock' : (parseInt(variant.stock) > 0 ? 'Available' : 'Out of Stock'),
          deletedAt: deletedAt, // Preserve the blocked state
          _id: variant._id || undefined,
        };
      })
    );

    const updateDoc = {
      productName,
      description,
      brand,
      category,
      colorVariants: variants,
      hasOffer: !!hasOffer,
    };

    await Product.findByIdAndUpdate(productId, updateDoc, { new: true });
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

const toggleProductStatus = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isBlocked = !product.isBlocked;
    await product.save();

    const action = product.isBlocked ? 'blocked' : 'unblocked';
    res.json({ success: true, message: `Product ${action} successfully`, isBlocked: product.isBlocked });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const blockVariant = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = product.colorVariants.id(req.params.variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    variant.isActive = 'Out of Stock';
    variant.deletedAt = new Date();
    await product.save();

    res.json({ success: true, message: 'Variant blocked successfully' });
  } catch (err) {
    console.error('Block variant error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const unblockVariant = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = product.colorVariants.id(req.params.variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    variant.isActive = variant.stock > 0 ? 'Available' : 'Out of Stock';
    variant.deletedAt = null;
    await product.save();

    res.json({ success: true, message: 'Variant unblocked successfully' });
  } catch (err) {
    console.error('Unblock variant error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProductPage,
  addProduct,
  getProductJson,
  getVariantJson,
  updateProduct,
  toggleProductStatus,
  blockVariant,
  unblockVariant,
};