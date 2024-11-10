const Product = require('../model/productModel'); // Import model

exports.getFilteredProducts = async function (req, res) {
    const { name, category, minPrice, maxPrice, sort } = req.query;

    try {
        const products = await Product.getFilteredProducts({
            name,
            category,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            sort,
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching products.' });
    }
};
