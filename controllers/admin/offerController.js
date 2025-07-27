const Product =require('../../models/productSchema');
const Category =require('../../models/categorySchema');
const Offer=require('../../models/offerSchema')




const loadOffer = async (req, res) => {
    try {
        let search = req.query.search ? req.query.search.trim() : "";
        let page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const searchRegex = new RegExp(search, 'i');

        const categoryPromise = Category.find({ name: { $regex: searchRegex } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategoriesPromise = Category.countDocuments({ name: { $regex: searchRegex } });

        const productPromise = Product.find({ name: { $regex: searchRegex } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalProductsPromise = Product.countDocuments({ name: { $regex: searchRegex } });

        const totalDiscountPromise = Product.aggregate([
            { $match: { name: { $regex: searchRegex } } },
            { $group: { _id: null, total: { $sum: '$discount' } } } // Adjust 'discount' to your actual field
        ]);

        const [categoryData, totalCategories, productData, totalProducts, totalDiscountResult] = await Promise.all([
            categoryPromise,
            totalCategoriesPromise,
            productPromise,
            totalProductsPromise,
            totalDiscountPromise
        ]);

        const totalCategoryPages = Math.ceil(totalCategories / limit);
        const totalProductPages = Math.ceil(totalProducts / limit);
        const totalDiscount = totalDiscountResult.length > 0 ? totalDiscountResult[0].total : 0;

        // Combine categories and products into a single offers array
        const offers = [
            ...categoryData.map(cat => ({
                _id: cat._id,
                type: 'Category',
                code: cat.name, // Using name as code
                description: cat.description || 'N/A', // Adjust based on your Category model
                discountType: cat.discountType || 'percentage', // Adjust based on your Category model
                discountValue: cat.discount || 0, // Adjust based on your Category model
                validUntil: cat.validUntil || new Date(), // Adjust based on your Category model
                status: cat.status || 'Active', // Adjust based on your Category model
                createdAt: cat.createdAt
            })),
            ...productData.map(prod => ({
                _id: prod._id,
                type: 'Product',
                code: prod.name, // Using name as code
                description: prod.description || 'N/A', // Adjust based on your Product model
                discountType: prod.discountType || 'percentage', // Adjust based on your Product model
                discountValue: prod.discount || 0, // Adjust based on your Product model
                validUntil: prod.validUntil || new Date(), // Adjust based on your Product model
                status: prod.status || 'Active', // Adjust based on your Product model
                createdAt: prod.createdAt
            }))
        ];

        // Sort combined offers by createdAt
        offers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Paginate the combined offers
        const paginatedOffers = offers.slice(skip, skip + limit);
        const totalOffers = totalCategories + totalProducts;
        const totalPages = Math.ceil(totalOffers / limit);

        // Calculate active and expired offers
        const activeCategories = await Category.countDocuments({ 
            name: { $regex: searchRegex }, 
            status: 'Active' // Adjust based on your Category model
        });
        const activeProducts = await Product.countDocuments({ 
            name: { $regex: searchRegex }, 
            status: 'Active' // Adjust based on your Product model
        });

        res.render('offer', {
            offers: paginatedOffers,
            totalOffers,
            activeOffers: activeCategories + activeProducts,
            expiredOffers: (totalCategories - activeCategories) + (totalProducts - activeProducts),
            totalDiscount,
            totalPages,
            currentPage: page,
            search,
            status: req.query.status || '',
            sort: req.query.sort || 'desc',
            limit
        });
    } catch (error) {
        console.log('load offer page error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const addOffer= async (req,res) => {
    try {
        const{title,targetName, discountType,discountValue,targetType,startDate,endDate}=req.body;
        console.log('this offer added:',req.body)
    let targetId
    if(targetType==='Category'){
        const category= await Category.findOne({name:targetName})
        console.log(category)
         if (!category) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }
       targetId=category.id;
       console.log(targetId)
    }else if(targetType==='Product'){
        const product=await Product.findOne({productName:targetName})
        if(!product){
           return res.status(400).json({ success: false, message: 'Product not found' });  
        }
        targetId=product.id
    }else{
        return res.status(400).json({ success: false, message: 'Invalid targetType' });
    }

       const newOffer=new Offer ({title,targetType,targetName,discountType,discountValue,targetType,targetId,startDate,endDate,isActive:true});
       await newOffer.save()
          res.status(201).json({ success: true, message: 'Offer added successfully', offer: newOffer });
    } catch (error) {
        console.log('add offer error:',error)
    }
}




module.exports={
    loadOffer,
    addOffer
}