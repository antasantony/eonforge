const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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
      .sort({ createdAt: -1 })
      .populate('brand')
      .populate('category')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / limit);

    const products = productsRaw.map((p) => {
      const firstVar = p.colorVariants?.[0] || {};
      // const stockSum = p.colorVariants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
      const hasStock = p.colorVariants?.some((v) => (v.stock || 0) > 0 && v.isActive === 'Available') || false;
      const status = !hasStock ? 'Out of Stock' : 'Available';
      return {
        ...p,
        variants: p.colorVariants.map((v) => ({
          ...v,
          hasOffer: v.hasOffer ?? false,
          isActive: v.isActive,
          _id: v._id?.toString(),
        })),
        regularPrice: firstVar.regularPrice ?? null,
        offerPrice: firstVar.offerPrice ?? null,
        stockTotal: firstVar.stock ?? 0,
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
    console.error('Error in getProductPage:', error, error.stack);
    res.redirect('/pageError');
  }
};

const addProduct = async (req, res) => {
  try {
    const { productName, description, brand, category, colorVariants, hasOffer } = req.body;

    // console.log('addProduct - Request body:', req.body);
    // console.log('addProduct - Request files:', req.files);

    if (!productName?.trim() || !description?.trim() || !brand || !category || !colorVariants) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(brand) || !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: 'Invalid brand or category ID' });
    }

    const brandExists = await Brand.findById(brand);
    const categoryExists = await Category.findById(category);
    if (!brandExists || brandExists.isBlocked) {
      return res.status(400).json({ success: false, message: 'Invalid or blocked brand' });
    }
    if (!categoryExists || !categoryExists.isListed) {
      return res.status(400).json({ success: false, message: 'Invalid or unlisted category' });
    }

    let variants;
    try {

      variants = colorVariants

    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid JSON in colorVariants' });
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one color variant is required' });
    }

    for (const variant of variants) {
      if (!variant.colorName?.trim() || !variant.colorValue?.trim()) {
        return res.status(400).json({ success: false, message: 'Each variant must have a colorName and colorValue' });
      }
      if (isNaN(parseFloat(variant.regularPrice)) || isNaN(parseFloat(variant.offerPrice))) {
        return res.status(400).json({ success: false, message: `Invalid price for variant ${variant.colorName}` });
      }
      if (isNaN(parseInt(variant.stock)) || parseInt(variant.stock) < 0) {
        return res.status(400).json({ success: false, message: `Invalid stock for variant ${variant.colorName}` });
      }
    }

    const fileMap = {};
    (req.files || []).forEach((f) => {
      (fileMap[f.fieldname] ||= []).push(f);
    });

    console.log(colorVariants)
    const variantErrors = [];
    for (let idx = 0; idx < variants.length; idx++) {
      const images = fileMap[`colorVariants[${idx}][productImage][]`] || [];
      console.log(fileMap)
      if (images.length < 3) {
        variantErrors.push(`Color variant "${variants[idx].colorName}" must have at least 3 images.`);
      }
    }
    if (variantErrors.length > 0) {
      return res.status(400).json({ success: false, message: variantErrors.join(' ') });
    }

    const resizedDir = path.join(__dirname, '../../public/uploads/product-resized');
    if (!fs.existsSync(resizedDir)) {
      try {
        fs.mkdirSync(resizedDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create resized directory:', err);
        return res.status(500).json({ success: false, message: 'Failed to create image directory' });
      }
    }

    for (const [idx, variant] of variants.entries()) {
      const images = fileMap[`colorVariants[${idx}][productImage][]`] || [];
      const fileNames = [];

      for (const file of images) {
        const newName = `${Date.now()}-${file.originalname}`;
        const output = path.join(resizedDir, newName);
        try {
          await sharp(file.path).resize(800, 800, { fit: 'cover' }).toFile(output);
          console.log(`Successfully processed image: ${newName}`);
          fileNames.push(`/uploads/product-resized/${newName}`);
        } catch (sharpErr) {
          console.error(`Sharp error for file ${file.originalname}:`, sharpErr);
          return res.status(400).json({ success: false, message: `Failed to process image ${file.originalname}` });
        } finally {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log(`Deleted temporary file: ${file.path}`);
            } catch (unlinkErr) {
              console.error(`Failed to delete temp file ${file.path}:`, unlinkErr);
            }
          }
        }
      }

      if (fileNames.length < 3) {
        return res.status(400).json({
          success: false,
          message: `Color variant "${variant.colorName}" has fewer than 3 images after processing.`,
        });
      }

      variants[idx] = {
        colorName: variant.colorName.trim(),
        colorValue: variant.colorValue.trim(),
        regularPrice: parseFloat(variant.regularPrice),
        offerPrice: parseFloat(variant.offerPrice),
        stock: parseInt(variant.stock),
        productImage: fileNames,
        hasOffer: !!variant.hasOffer,
        isActive: parseInt(variant.stock) > 0 ? 'Available' : 'Out of Stock',
      };
    }

    const newProduct = new Product({
      productName: productName.trim(),
      description: description.trim(),
      brand,
      category,
      colorVariants: variants,
      hasOffer: !!hasOffer,
      isBlocked: false,
      status: variants.some(v => v.stock > 0 && v.isActive === 'Available') ? 'Available' : 'Out of Stock'
    });

    await newProduct.save();
    console.log('Product saved successfully:', newProduct._id);
    res.status(200).json({ success: true, message: 'Product added successfully' });
  } catch (err) {
    console.error('Error adding product:', err, err.stack);
    res.status(500).json({
      success: false,
      message: `Failed to add product: ${err.message}`,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { productName, description, brand, category, colorVariants, hasOffer } = req.body;

    // console.log('updateProduct - Request body:', req.body);
    console.log('updateProduct also variant- Request files:', req.files);

    if (!productName?.trim() || !description?.trim() || !brand || !category || !colorVariants) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(brand) || !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: 'Invalid brand or category ID' });
    }

    let variants;
    try {
      variants = colorVariants;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid JSON in colorVariants' });
    }

    const fileMap = {};
    (req.files || []).forEach((f) => {
      (fileMap[f.fieldname] ||= []).push(f);
    });

    const resizedDir = path.join(__dirname, '../../public/uploads/product-resized');
    if (!fs.existsSync(resizedDir)) {
      try {
        fs.mkdirSync(resizedDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create resized directory:', err);
        return res.status(500).json({ success: false, message: 'Failed to create image directory' });
      }
    }

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) return res.status(404).json({ success: false, message: 'Product not found' });

    const updatedVariants = [];
    for (const [idx, variant] of variants.entries()) {
      const imagesInField = fileMap[`colorVariants[${idx}][productImage][]`] || [];
      const removeImage = req.body[`colorVariants[${idx}][removeImage]`] === 'on';
      let existingImages = req.body[`colorVariants[${idx}][existingImage]`] || [];
      console.log('exist or not iamge=====', existingImages)
      existingImages = Array.isArray(existingImages) ? existingImages : existingImages ? [existingImages] : [];

      const existingVariant = existingProduct.colorVariants.find(v => v._id.toString() === variant._id);
      if (!existingImages.length && existingVariant) {
        existingImages = existingVariant.productImage || [];
      }

      let imagePaths = [];

      if (removeImage) {
        if (existingImages.length) {
          existingImages.forEach((imgPath) => {
            const fullPath = path.join(__dirname, '../../public', imgPath);
            if (fs.existsSync(fullPath)) {
              try {
                fs.unlinkSync(fullPath);
                console.log(`Deleted image: ${fullPath}`);
              } catch (err) {
                console.error(`Failed to delete image ${fullPath}:`, err);
              }
            }
          });
        }
        imagePaths = [];
      } else if (imagesInField.length === 0) {
        imagePaths = existingImages;
      }

      for (const file of imagesInField) {
        const newName = `${Date.now()}-${file.originalname}`;
        const output = path.join(resizedDir, newName);
        try {
          await sharp(file.path).resize(800, 800, { fit: 'cover' }).toFile(output);
          console.log(`Successfully processed image: ${newName}`);
          imagePaths.push(`/uploads/product-resized/${newName}`);
        } catch (sharpErr) {
          console.error(`Sharp error for file ${file.originalname}:`, sharpErr);
          return res.status(400).json({ success: false, message: `Failed to process image ${file.originalname}` });
        } finally {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log(`Deleted temporary file: ${file.path}`);
            } catch (unlinkErr) {
              console.error(`Failed to delete temp file ${file.path}:`, unlinkErr);
            }
          }
        }
      }

      if (imagePaths.length < 3) {
        return res.status(400).json({
          success: false,
          message: `Color variant "${variant.colorName}" must have at least 3 images.`,
        });
      }

      updatedVariants.push({
        _id: variant._id || undefined,
        colorName: variant.colorName?.trim(),
        colorValue: variant.colorValue?.trim(),
        regularPrice: parseFloat(variant.regularPrice) || 0,
        offerPrice: parseFloat(variant.offerPrice) || 0,
        stock: parseInt(variant.stock) || 0,
        productImage: imagePaths,
        hasOffer: !!variant.hasOffer,
        isActive: parseInt(variant.stock) > 0 ? 'Available' : 'Out of Stock',
      });
    }

    const updateDoc = {
      productName: productName.trim(),
      description: description.trim(),
      brand,
      category,
      colorVariants: updatedVariants,
      hasOffer: !!hasOffer,
      status: updatedVariants.some(v => v.stock > 0 && v.isActive === 'Available') ? 'Available' : 'Out of Stock'
    };

    await Product.findByIdAndUpdate(productId, updateDoc, { new: true });
    console.log('Product updated successfully:', productId);
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err, err.stack);
    res.status(500).json({
      success: false,
      message: `Failed to update product: ${err.message}`,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const getProductJson = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand')
      .populate('category')
      .lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const hasStock = product.colorVariants?.some((v) => (v.stock || 0) > 0 && v.isActive === 'Available') || false;
    const status = !hasStock ? 'Out of Stock' : 'Available';

    const formattedProduct = {
      ...product,
      colorVariants: product.colorVariants.map((v) => ({
        ...v,
        productImage: v.productImage || [],
        hasOffer: v.hasOffer ?? false,
        isActive: v.isActive,
      })),
      isBlocked: product.isBlocked,
      status,
    };

    res.json({ success: true, product: formattedProduct });
  } catch (err) {
    console.error('Error in getProductJson:', err, err.stack);
    res.status(500).json({ success: false, message: `Failed to fetch product: ${err.message}` });
  }
};

const getVariantJson = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const variant = product.colorVariants.find((v) => v._id.toString() === req.params.variantId);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const hasStock = product.colorVariants?.some((v) => (v.stock || 0) > 0 && v.isActive === 'Available') || false;
    const status = !hasStock ? 'Out of Stock' : 'Available';

    res.json({
      success: true,
      variant: {
        ...variant,
        productName: product.productName,
        brand: product.brand,
        category: product.category,
        description: product.description,
        status,
        hasOffer: variant.hasOffer ?? false,
        isActive: variant.isActive,
      }
    });
  } catch (err) {
    console.error('Error in getVariantJson:', err, err.stack);
    res.status(500).json({ success: false, message: `Failed to fetch variant: ${err.message}` });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { colorVariants } = req.body;

    console.log('updateVariant - Request body:', req.body);
    console.log('updateVariant - Request files:', req.files);

    const fileMap = {};
    (req.files || []).forEach((f) => {
      (fileMap[f.fieldname] ||= []).push(f);
    });

    if (!colorVariants) return res.status(400).json({ success: false, message: 'Missing colorVariants data' });

    let variants;
    try {
      variants = colorVariants;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid JSON in colorVariants' });
    }

    if (variants.length !== 1) {
      return res.status(400).json({ success: false, message: 'Exactly one variant should be provided' });
    }

    const variant = variants[0];
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const existingVariant = product.colorVariants.id(variantId);
    if (!existingVariant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const resizedDir = path.join(__dirname, '../../public/uploads/product-resized');
    if (!fs.existsSync(resizedDir)) {
      try {
        fs.mkdirSync(resizedDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create resized directory:', err);
        return res.status(500).json({ success: false, message: 'Failed to create image directory' });
      }
    }

    const imagesInField = fileMap[`colorVariants[0][productImage][]`] || [];
    const removeImage = req.body[`colorVariants[0][removeImage]`] === 'on';
    let existingImages = req.body[`colorVariants[0][existingImage]`] || [];

    existingImages = Array.isArray(existingImages) ? existingImages : existingImages ? [existingImages] : [];

    if (!existingImages.length) {
      existingImages = existingVariant.productImage || [];
    }

    let imagePaths = [];

    if (removeImage) {
      if (existingImages.length) {
        existingImages.forEach((imgPath) => {
          const fullPath = path.join(__dirname, '../../public', imgPath);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
              console.log(`Deleted image: ${fullPath}`);
            } catch (err) {
              console.error(`Failed to delete image ${fullPath}:`, err);
            }
          }
        });
      }
      imagePaths = [];
    } else if (imagesInField.length === 0) {
      imagePaths = existingImages;
    }


    for (const file of imagesInField) {
      const newName = `${Date.now()}-${file.originalname}`;
      const output = path.join(resizedDir, newName);
      try {
        await sharp(file.path).resize(800, 800, { fit: 'cover' }).toFile(output);
        console.log(`Successfully processed image: ${newName}`);
        imagePaths.push(`/uploads/product-resized/${newName}`);
      } catch (sharpErr) {
        console.error(`Sharp error for file ${file.originalname}:`, sharpErr);
        return res.status(400).json({ success: false, message: `Failed to process image ${file.originalname}` });
      } finally {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
            console.log(`Deleted temporary file: ${file.path}`);
          } catch (unlinkErr) {
            console.error(`Failed to delete temp file ${file.path}:`, unlinkErr);
          }
        }
      }
    }

    if (imagePaths.length < 3) {
      return res.status(400).json({
        success: false,
        message: `Color variant "${variant.colorName}" must have at least 3 images.`,
      });
    }

    existingVariant.colorName = variant.colorName?.trim();
    existingVariant.colorValue = variant.colorValue?.trim();
    existingVariant.regularPrice = parseFloat(variant.regularPrice) || 0;
    existingVariant.offerPrice = parseFloat(variant.offerPrice) || 0;
    existingVariant.stock = parseInt(variant.stock) || 0;
    existingVariant.hasOffer = !!variant.hasOffer;
    existingVariant.productImage = imagePaths;
    existingVariant.isActive = parseInt(variant.stock) > 0 ? 'Available' : 'Out of Stock';

    product.status = product.colorVariants.some(v => v.stock > 0 && v.isActive === 'Available') ? 'Available' : 'Out of Stock';

    await product.save();
    console.log('Variant updated successfully:', variantId);
    res.json({ success: true, message: 'Variant updated successfully' });
  } catch (err) {
    console.error('Error updating variant:', err, err.stack);
    res.status(500).json({
      success: false,
      message: `Failed to update variant: ${err.message}`,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const toggleProductStatus = async (req, res) => {
  try {
    const productId = req.params.id;
    const { isBlocked } = req.body;

    console.log('toggleProductStatus - Product ID:', productId, 'isBlocked:', isBlocked);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newBlockedState = isBlocked !== undefined ? isBlocked : !product.isBlocked;
    product.isBlocked = newBlockedState;

    // Update product status: consider both product and variant isBlocked states
    // product.status = product.isBlocked
    //   ? 'Out of Stock' // If product is blocked, it’s unavailable
    //   : product.colorVariants.some(v => v.stock > 0 && v.isActive === 'Available' && !v.isBlocked)
    //   ? 'Available'
    //   : 'Out of Stock';

    await product.save();
    console.log('Product status toggled:', product._id, 'isBlocked:', product.isBlocked);

    const action = product.isBlocked ? 'blocked' : 'unblocked';
    res.json({ success: true, message: `Product ${action} successfully`, isBlocked: product.isBlocked });
  } catch (error) {
    console.error('Toggle product status error:', error, error.stack);
    res.status(500).json({
      success: false,
      message: `Failed to toggle product status: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

const toggleVariantStatus = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { isBlocked } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ success: false, message: 'Invalid product or variant ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = product.colorVariants.id(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    variant.isBlocked = isBlocked;

    // Optional: Adjust status
    variant.isActive = variant.stock > 0 && !variant.isBlocked ? 'Available' : 'Out of Stock';
    product.status = product.isBlocked
      ? 'Out of Stock'
      : product.colorVariants.some(v => v.stock > 0 && v.isActive === 'Available' && !v.isBlocked)
      ? 'Available'
      : 'Out of Stock';

    await product.save();

    const message = isBlocked ? 'Variant blocked successfully' : 'Variant unblocked successfully';

    res.json({ success: true, message, variant });
  } catch (err) {
    console.error('Toggle variant status error:', err);
    res.status(500).json({
      success: false,
      message: `Failed to toggle variant: ${err.message}`,
    });
  }
};


module.exports = {
  getProductPage,
  addProduct,
  getProductJson,
  getVariantJson,
  updateProduct,
  updateVariant,
  toggleProductStatus,
  toggleVariantStatus,
 
};