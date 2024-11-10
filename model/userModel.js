const db = require('../config/db');
const bcrypt = require('bcrypt');

const user = {
    register: async (data, callback) => {
        try {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
            db.query(query, [data.username, data.email, hashedPassword], callback);
        } catch (error) {
            console.error('Error hashing password:', error);
            callback(error);
        }
    },
    authenticate: (email, password, callback) => {
        const query = 'SELECT * FROM users WHERE email = ?';
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return callback(err);
            }
            if (results.length === 0) {
                console.log('No user found for email:', email);
                return callback(null, false);
            }

            // Check password match
            const match = await bcrypt.compare(password, results[0].password);
            if (match) {
                callback(null, results[0]); // User authenticated
            } else {
                console.log('Incorrect password for email:', email);
                callback(null, false);
            }
        });
    },
    emailExists: (email, callback) => {
        const query = 'SELECT * FROM users WHERE email = ?';
        db.query(query, [email], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return callback(err);
            }
            callback(null, results.length > 0); // true if email exists, false otherwise
        });
    },
    updatePassword: (email, newPassword, callback) => {
        const sql = 'UPDATE users SET password = ? WHERE email = ?'; // Adjust your table and column names as necessary

        db.query(sql, [newPassword, email], (err, results) => {
            if (err) {
                console.error('Error updating password:', err);
                return callback(err);
            }
            if (results.affectedRows === 0) {
                return callback(new Error('No user found with that email'));
            }
            callback(null);
        });
    },
        // Function to get all products
    getAllProd: () => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM products';
            db.query(query, (err, result) => {
                if (err) {    
                    return reject(err);
                }
                resolve(result);
            }); 
        });
    },
    getAllProdexcept: (id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM products where product_id != ?';
            db.query(query,[id], (err, result) => {
                if (err) {    
                    return reject(err);
                }
                resolve(result);
            }); 
        });
    },
    getAllUser:() => {
        return new Promise((resolve, reject) => {
            const query = 'select * from users';
            db.query(query, (err, result)=>{
                if(err){    
                    return reject (err);
                }
                resolve(result); 
            }); 
        })
    },
    updateProduct:(id, data, callback) =>{
        const query = "update products set price = ?, stock =? where product_id=?"; 
        db.query(query, [data.price, data.stock, id], callback);
    },
        // Function to get a specific product by ID
    getProductById: (id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM products WHERE product_id = ?';
            db.query(query, [id], (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    },
    addToCart: (data, callback) => {
        // Start a transaction to ensure both actions happen together
        db.beginTransaction((err) => {
            if (err) {
                return callback(err); // If the transaction can't be started, return the error
            }
    
            // Query to insert the product into the cart
            const insertQuery = "INSERT INTO cart (user_id, product_id, quantity, totalPrice) VALUES (?, ?, ?, ?)";
            db.query(insertQuery, [data.user_id, data.productId, data.quantity, data.totalPrice], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        callback(err); // If the insert fails, roll back the transaction
                    });
                }
    
                // Query to update the stock in the products table
                const updateStockQuery = "UPDATE products SET stock = stock - ? WHERE product_id = ?";
                db.query(updateStockQuery, [data.quantity, data.productId], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            callback(err); // If the update fails, roll back the transaction
                        });
                    }
    
                    // Commit the transaction if both queries are successful
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                callback(err); // If commit fails, roll back the transaction
                            });
                        }
    
                        callback(null, result); // If everything succeeds, return the result
                    });
                });
            });
        });
    },
    updateProfile:(id, data, callback) =>{
        const query = "update users set username = ?, email =? where id=?"; 
        db.query(query, [data.username, data.email, id], callback);
    },
        // models/User.js
    getCartItems: (id, limit, offset) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    cart.cart_id, 
                    cart.quantity, 
                    cart.totalPrice,
                    products.image_url,
                    products.name, 
                    products.price
                FROM 
                    cart
                JOIN 
                    products ON cart.product_id = products.product_id
                WHERE 
                    cart.user_id = ?
                LIMIT ? OFFSET ?`;
            db.query(query, [id, limit, offset], (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    },

    getBillingDetail: (id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM billingdetail where user_id = ?';
            db.query(query,[id], (err, result) => {
                if (err) {    
                    return reject(err);
                }
                resolve(result);
            }); 
        });
    },
    totalrecords: (id, callback) => {
        const query = 'SELECT COUNT(*) AS total_records FROM cart WHERE user_id = ?';
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                return callback(err, null);
            }
            // Ensure the result is as expected
            const totalRecords = result[0] ? result[0].total_records : 0;
            callback(null, totalRecords);
        });
    },
    // models/User.js
    getCartItemById: (cartId, callback) => {
        const query = "SELECT product_id, quantity FROM cart WHERE cart_id = ?";
        db.query(query, [cartId], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]); // Return the first result, which should contain product_id and quantity
        });
    },

    deleteCartItem: (id, callback) => {
        const query = "DELETE FROM cart WHERE cart_id = ?";
        db.query(query, [id], callback);
    },

    updateProductStock: (productId, quantity, callback) => {
        const query = "UPDATE products SET stock = stock + ? WHERE product_id = ?";
        db.query(query, [quantity, productId], callback);
    },

    
    
    
    
    
    
    
};


module.exports = user;
