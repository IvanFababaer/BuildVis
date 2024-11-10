const db = require('../config/db');

exports.getFilteredProducts = async function ({ name, category, minPrice, maxPrice, sort }) {
    let query = `SELECT * FROM products WHERE 1=1`; // Use `WHERE 1=1` for flexible filtering
    const params = [];

    // Name filter (partial match)
    if (name) {
        query += ` AND (name LIKE ? OR description LIKE ?)`;
        params.push(`%${name}%`, `%${name}%`);
    }

    // Category filter
    if (category) {
        query += ` AND category = ?`;
        params.push(category);
    }

    // Price range filters
    if (minPrice) {
        query += ` AND price >= ?`;
        params.push(minPrice);
    }
    if (maxPrice) {
        query += ` AND price <= ?`;
        params.push(maxPrice);
    }

    // Sorting option
    if (sort === 'price_asc') {
        query += ` ORDER BY price ASC`;
    } else if (sort === 'price_desc') {
        query += ` ORDER BY price DESC`;
    }

    try {
        const [rows] = await db.execute(query, params);
        return rows;
    } catch (error) {
        throw error;
    }
};