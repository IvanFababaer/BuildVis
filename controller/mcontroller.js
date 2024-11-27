const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');  
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const SECRET_KEY = process.env.SECRET_KEY || 'defaultSecretKey'; // Use environment variable for security

const itemsPerPage = 10; // Set items per page
const verificationCodes = {}; // Temporary storage
 // Controller Function
 const stripe = require('stripe')('sk_test_51QByzxDiiet8LsHjyPEAOe1d9RXocsOpYMXuspmrHC8XPqbrJhTugNdvldsvDHaAxVEXbcr9cxsCFqsa6v7DMEFS002wB9LZCq');

const show = {
    showlanding: (req, res) => {
        res.render('landing');
    },
    showRegister: (req, res) => {
        res.render('register');
    },
    showLogin: (req, res) => {
        res.render('login');
    },
    showDashboard: (req, res) => {
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
        User.totalrecords(req.session.user.id,(err, totalRecords) => {
            if (err) {
                console.error('Error retrieving total records:', err);
                return res.status(500).send('Error retrieving total records');
            }

            // Redirect to dashboard with totalRecords
            console.log('User authenticated:', user);
            res.render('dash', { user, totalRecords });
        });
    },
    showMaterials: (req, res) => {
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
        Promise.all([
            User.getAllProd(),
            User.getCategory(),
            new Promise((resolve, reject) => {
                User.totalrecords(req.session.user.id, (err, totalRecords) => {
                    if (err) reject(err);
                    else resolve(totalRecords);
                });
            })
        ])
        .then(([productList, categoryList,totalRecords]) => {
            res.render('materials', {
                user: req.session.user,
                product: productList,
                category: categoryList,
                totalRecords,
            });
        })
        .catch(err => {
            console.error('Error in showMaterials:', err);
            res.status(500).send('Server error');
        });
    }, 
    showOverview: async (req, res) => {
        // Check if the user is logged in
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
    
        try {
            const id = req.params.id;
    
            // Concurrently fetch the product, other products, and total records for the user
            const [product, otherProducts, totalRecords] = await Promise.all([
                User.getProductById(id),
                User.getAllProdexcept(id),
                new Promise((resolve, reject) => {
                    User.totalrecords(req.session.user.id, (err, count) => {
                        if (err) reject(err);
                        else resolve(count);
                    });
                })
            ]);
    
            // Check if the product with the specified ID exists
            if (!product || product.length === 0) {
                return res.status(404).send("Product not found");
            }
    
            // Render the 'material-overview' view with all fetched data
            res.render('material-overview', {
                user: req.session.user,
                prod: product[0],           // Main product data (first element in the array)
                products: otherProducts,     // List of all other products
                totalRecords                 // Total records count
            });
        } catch (err) {
            console.error('Error fetching product data:', err);
            res.status(500).send('Internal Server Error');
        }
    },    
    showContactus: (req, res) => {
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
    
        const userId = req.session.user.id;
    
        // Fetch total records for the logged-in user
        new Promise((resolve, reject) => {
            User.totalrecords(userId, (err, totalRecords) => {
                if (err) reject(err);
                else resolve(totalRecords);
            });
        })
        .then(totalRecords => {
            // Render the contactUs view with totalRecords
            res.render('contactUs', {
                user: req.session.user,
                totalRecords // Pass totalRecords to the view
            });
        })
        .catch(err => {
            console.error('Error fetching total records:', err);
            res.status(500).send('Internal Server Error');
        });
    },    
    showAdminDash: (req, res) => {
        res.render('admin/adminDashboard');
    },
    showEmailVerification: (req, res) => {
        res.render('emailVerification');
    },
    showResetPassword: (req, res) => {
        res.render('resetPassword');
    },
    showCart: (req, res) => {
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
    
        const userId = req.session.user.id;
    
        Promise.all([
            User.getCartItems(userId), // Pass limit and offset
            new Promise((resolve, reject) => {
                User.totalrecords(userId, (err, totalRecords) => {  
                    if (err) reject(err);
                    else resolve(totalRecords);
                });
            })
        ])
        .then(([cartItemList, totalRecords]) => {    
            res.render('cart', {
                user: req.session.user,
                cartItem: cartItemList,     // List of cart items
                totalRecords                // Total record count
            });
        })
        .catch(err => {
            console.error('Error fetching cart data:', err);
            res.status(500).send('Internal Server Error');
        });
    },    
    showProfile: (req, res) => {
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
    
        const id = req.session.user.id;
        console.log('User ID:', id);
    
        Promise.all([
            // Fetch billing details
            User.getBillingDetail(id),
            new Promise((resolve, reject) => {
                User.totalrecords(id, (err, totalRecords) => {
                    if (err) reject(err);
                    else resolve(totalRecords);
                });
            })
        ])
        .then(([billingdetail, totalRecords]) => {
            // Render the billingDetail view with user, billing, and totalRecords data
            res.render('profile', {
                user: req.session.user,
                billing: billingdetail,
                totalRecords // Pass totalRecords to the view
            });
        })
        .catch(err => {
            console.error('Error fetching billing data:', err);
            res.status(500).send('Internal Server Error');
        });
    },    
    showCheckout: (req, res) => {
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
    
        const userId = req.session.user.id;
        const items = req.session.checkoutItems;
        const subtotalEl = req.session.subtotalEl;
        const taxEl = req.session.taxEl;
        const totalEl = req.session.totalEl;
    
        if (!items || !Array.isArray(items) || items.length === 0) {
            req.flash('error', 'No items selected for checkout.');
            return res.redirect('/cart');
        }
    
        console.log('User ID:', userId);
        console.log('Checkout Items:', items);
    
        Promise.all([
            User.getBillingDetail(userId),
        ])
        .then(([billingDetail]) => {
            res.render('checkout', {
                userId: userId,
                billing: billingDetail,
                items: items,
                subtotalEl: subtotalEl,
                taxEl : taxEl,
                totalEl : totalEl,
            });
        })
        .catch(err => {
            console.error('Error during checkout preparation:', err);
            req.flash('error', 'Something went wrong. Please try again later.');
            res.status(500).redirect('/cart');
        });
    },
    orderConfirmation: (req, res) =>{
        res.render('orderConfirmation');
    },
    showHouseModel: (req, res) => {
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
    
        const userId = req.session.user.id;
    
        // Fetch total records for the logged-in user
        new Promise((resolve, reject) => {
            User.totalrecords(userId, (err, totalRecords) => {
                if (err) reject(err);
                else resolve(totalRecords);
            });
        })
        .then(totalRecords => {
            // Render the profile view with user and totalRecords data
            res.render('house_model/house_3d', {
                user: req.session.user,
                totalRecords // Pass totalRecords to the view
            });
        })
        .catch(err => {
            console.error('Error fetching total records:', err);
            res.status(500).send('Internal Server Error');
        });
        
    },
    showOrders: (req, res) => {
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
        const userId = req.session.user.id;
    
        Promise.all([
            new Promise((resolve, reject) => {
                User.totalrecords(req.session.user.id, (err, totalRecords) => {
                    if (err) reject(err);
                    else resolve(totalRecords);
                });
            }),
            User.getOrders(userId),
        ])
        .then(([totalRecords, order_details]) => {
            res.render('orders', {
                orders: order_details,
                totalRecords,
            });
        })
        .catch(err => {
            console.error('Error during checkout preparation:', err);
            req.flash('error', 'Something went wrong. Please try again later.');
            res.status(500).redirect('/dash');
        });
    },

    
    
    
    
    
    
    
    
    

};

const user = {
    register: (req, res) => {
        const { username, email, password, confirmPassword } = req.body;
        let errors = [];
    
        // Field validation
        if (!username || !email || !password || !confirmPassword) {
            errors.push({ msg: 'All fields are required' });
        }
        if (password.length < 6) {
            errors.push({ msg: 'Password must be at least 6 characters long' });
        }
        if (password !== confirmPassword) {
            errors.push({ msg: 'Passwords do not match' });
        }
    
        if (errors.length > 0) {
            return res.render('register', { errors, username, email, password, confirmPassword });
        }
    
        // Check if email already exists
        User.emailExists(email, (err, exists) => {
            if (err) {
                console.error('Error during email check:', err);
                return res.status(500).send('Error during email check');
            }
            if (exists) {
                console.log('User already exists with email:', email);
                return res.render('register', { errors: [{ msg: 'User already exists' }] });
            }
    
            // Proceed with registration
            User.register({ username, email, password }, (err) => {
                if (err) {
                    console.error('Error registering user:', err);
                    return res.status(500).send('Error registering user');
                }
                res.redirect('/login');
            });
        });
    },
    
    // /controllers/userController.js

    login: (req, res) => {
        const { email, password } = req.body;
        let errors = [];

        // Validate input
        if (!email || !password) {
            errors.push({ msg: 'Both email and password are required' });
        }

        if (errors.length > 0) {
            return res.render('login', { errors, email, password });
        }

        // Authenticate user
        User.authenticate(email, password, (err, user) => {
            if (err) {
                console.error('Error during authentication:', err);
                return res.status(500).send('Error during authentication');
            }
            if (!user) {
                return res.status(400).render('login', { errors: [{ msg: 'Invalid credentials' }], email });
            }

            // Set user session
            req.session.user = user;

            // Fetch user's role
            User.getRole(user.id)
                .then(role => {
                    // Redirect based on role
                    if (role === 'admin') {
                        return res.redirect('/admin');
                    } else if (role === 'user') {
                        return res.redirect('/dash');
                    } else {
                        return res.status(403).send(`Unauthorized role ${role}`);
                    }
                })
                .catch(err => {
                    console.error('Error fetching user role:', err);
                    return res.status(500).send('Error fetching user role');
                });
        });
    },        
    sendVerificationCode: async (req, res) => {
        const { email } = req.body;
    
        // Generate a random 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
        // Configure nodemailer to send an email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    
        // Define email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Verification Code',
            text: `Your verification code is: ${verificationCode}`
        };

        verificationCodes[email] = {
            code: verificationCode,
            expires: Date.now() + 10 * 60 * 1000 // 10 minutes from now
        };
    
        // Send the email
        try {
            await transporter.sendMail(mailOptions);
            res.render('enterCode', { email, verificationCode }); // Render a page for code entry, passing the code if needed
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Error sending verification email');
        }
    },

        // Route to verify the code entered by the user
    verifyCode: (req, res) => {
        const { email, verificationCode } = req.body;

        // Check if the verification code exists and is not expired
        const storedCode = verificationCodes[email];
        if (!storedCode || Date.now() > storedCode.expires) {
            return res.status(400).send('Invalid or expired code');
        }

        // Validate the verification code
        if (storedCode.code === verificationCode) {
            // Code is valid, proceed with email verification success logic
            delete verificationCodes[email]; // Remove the code after verification
            // res.send('Email verified successfully');
            req.session.userEmail = email;
            res.redirect('/reset-password');
        } else {
            res.status(400).send('Invalid code');
        }
    },
    resetPassword: async (req, res) => {
        const email = req.session.userEmail; // Get the email from the session
        const { newPassword, confirmPassword } = req.body;
    
        // Validate new passwords
        if (!newPassword || !confirmPassword) {
            return res.status(400).send('All fields are required');
        }
    
        if (newPassword !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }
    
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
    
        // Update password in the database
        User.updatePassword(email, hashedPassword, (err) => {
            if (err) {
                return res.status(500).send('Error updating password');
            }
            // res.send('Password reset successful'); // Redirect or render a success page as needed
            res.redirect('/login');
        });
    },
    logout:(req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('An error occurred');
            }
            res.redirect('/login');
        });
    },
    addToCart: (req, res) => {
        const { user_id, productId, quantity, totalPrice } = req.body;
    
        // Call model to handle add or update in the cart table
        User.addToCart({ user_id, productId, quantity, totalPrice }, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Failed to add to cart' });
            }
    
            res.redirect('/materials');
        });
    },       
    updateProfile: (req, res) => {
        const id = req.body.id;
        const data = req.body;
        User.updateProfile(id, data, (err) => {
            if (err) {
                console.error("Error updating profile:", err);
                return res.redirect('/dash');
            } 
            res.redirect('/login');
        });
    },
        // controllers/cartController.js
    deleteCartItem: (req, res) => {
        const cartId = req.params.id;

        // Step 1: Get the product ID and quantity from the cart item before deletion
        User.getCartItemById(cartId, (err, cartItem) => {
            if (err || !cartItem) {
                console.error('Error fetching cart item:', err);
                return res.status(500).send('Internal Server Error');
            }

            const productId = cartItem.product_id;
            const quantity = cartItem.quantity;

            // Step 2: Delete the cart item
            User.deleteCartItem(cartId, (err) => {
                if (err) {
                    console.error('Error deleting cart item:', err);
                    return res.status(500).send('Internal Server Error');
                }

                // Step 3: Update the product stock by adding the quantity back
                User.updateProductStock(productId, quantity, (err) => {
                    if (err) {
                        console.error('Error updating product stock:', err);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Redirect back to the cart page after successful deletion and stock update
                    res.redirect('/cart');
                });
            });
        });
    },
    updateQuantity: (req, res) => {
        const { cart_id, product_id, quantity, price } = req.body;
    
        // Step 1: Fetch the current cart item
        User.getCartItemById(cart_id, (err, cartItem) => {
            if (err || !cartItem) {
                console.error('Error fetching cart item:', err);
                return res.status(500).send('Internal Server Error');
            }
    
            const currentQuantity = cartItem.quantity;
            const productPrice = price; // Assume price is included in the cart item
            const newTotalPrice = productPrice * quantity;
    
            // Step 2: Update the product stock by adding the current cart quantity back
            User.updateProductStock(product_id, currentQuantity, (err) => {
                if (err) {
                    console.error('Error restoring product stock:', err);
                    return res.status(500).send('Internal Server Error');
                }
    
                // Step 3: Update the cart item with the new quantity and total price
                User.updateCartItem(cart_id, quantity, newTotalPrice, (err) => {
                    if (err) {
                        console.error('Error updating cart item:', err);
                        return res.status(500).send('Internal Server Error');
                    }
    
                    // Step 4: Update the product stock based on the new quantity
                    User.updateProductStock(product_id, -quantity, (err) => {
                        if (err) {
                            console.error('Error adjusting product stock:', err);
                            return res.status(500).send('Internal Server Error');
                        }
    
                        // Step 5: Redirect back to the cart page after successful update
                        res.redirect('/cart');
                    });
                });
            });
        });
    },
    addBillingDetail:(req, res) => {
        const data = {
          user_id: req.session.user.id,
          fullname: req.body.fullname,
          contact: req.body.contact,
          address: req.body.address,
          note: req.body.note,
        };
      
        // Insert data into the database
        User.addBillingDetail(data, (err, result) => {
          if (err) {
            console.error('Database insertion error:', err); // Log error for debugging
            return res.status(500).send('Error inserting product');
          }
          res.redirect('/billing-detail'); // Adjust redirection as needed
        });
      },
      checkoutSummary: (req, res) => {
        const { items, subtotalEl, taxEl, totalEl } = req.body;
    
        // Log items to debug
        console.log('Received Items for Checkout:', items);
    
        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            req.flash('error', 'No items selected for checkout.');
            return res.redirect('/cart');
        }
    
        // Save the items to the session
        req.session.checkoutItems = items;
        req.session.subtotalEl = subtotalEl;
        req.session.taxEl = taxEl;
        req.session.totalEl = totalEl;
    
        // Redirect to the GET route
        res.status(200).send({ success: true });
    },
    createPaymentIntent: async (req, res) => {
        const { amount } = req.body;
      
        // Validate amount
        if (!amount || amount <= 0) {
          return res.status(400).json({ error: 'Invalid payment amount' });
        }
      
        try {
          // Create the payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount, // Amount in cents
            currency: 'php',
            payment_method_types: ['card'],
          });
      
          console.log('Payment Intent Created:', paymentIntent);
          res.json({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
          console.error('Error creating Payment Intent:', error.message);
          res.status(500).json({ error: error.message });
        }
      },
      processOrder: async (req, res) => {
        const { cartIds, userId, billing_id } = req.body;
      
        if (!cartIds || cartIds.length === 0) {
          return res.status(400).json({ error: 'No cart IDs provided' });
        }
      
        try {
          // Fetch cart items
          const cartItems = await User.getCartItemsByIds(cartIds);
      
          if (cartItems.length === 0) {
            return res.status(404).json({ error: 'No cart items found' });
          }
      
          // Prepare order details
          const orderDate = new Date();
          const deliveryDate = new Date();
          deliveryDate.setDate(orderDate.getDate() + 7);
      
          const orders = cartItems.map((item) => ({
            user_id: userId,
            product_id: item.product_id,
            billing_id: billing_id,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            orderDate,
            deliveryDate,
            status: 'Pending',
          }));
      
          // Insert order details
          await User.insertOrderDetails(orders);
      
          // Delete cart items
          await User.deleteCartItemsByIds(cartIds);
      
          res.json({ message: 'Order processed successfully' });
        } catch (error) {
          console.error('Error processing order:', error);
          res.status(500).json({ error: 'Failed to process order' });
        }
    },
    
    
    
    
      
      
   


    
    
    


    
    
    
};


const admin = {
    showProd: (req, res) => {
        Promise.all([
            User.getAllProd(),
        ]).then(([productList]) =>{
            res.render('admin/adminProducts', {
                product : productList,
            });
        }).catch(err => {
            throw err;
        });
    },
    showUser: (req, res) => {
        Promise.all([
            User.getAllUser(),
        ]).then(([userList]) =>{
            res.render('admin/adminUsers', {
                user : userList,
            });
        }).catch(err => {
            throw err;
        });
    },
    showAdminOrder: (req, res) => {
        Promise.all([
            User.getAllOrders(),
        ]).then(([orderList]) =>{
            res.render('admin/adminOrder', {
                orders : orderList,
            });
        }).catch(err => {
            throw err;
        });
    },
    updateProducts:(req, res) =>{
        const id = req.body.productId;
        const data = req.body;
        User.updateProduct(id, data, (err) => {
            if(err) throw err;
            res.redirect('/adminProduct');
        });
    },
    addProducts:(req, res) => {
        if (!req.file) {
          return res.status(400).send('No file uploaded');
        }
      
        const productData = {
          name: req.body.productName,
          price: req.body.price,
          description: req.body.description,
          current_stock: req.body.current_stock,
          max_stock: req.body.max_stock,
          image_url: `/uploads/${req.file.filename}`,
          category: req.body.category
        };
      
        // Insert data into the database
        User.insertProduct(productData, (err, result) => {
          if (err) {
            console.error('Database insertion error:', err); // Log error for debugging
            return res.status(500).send('Error inserting product');
          }
          res.redirect('/adminProduct'); // Adjust redirection as needed
        });
      },
      updateUserRole:(req, res) =>{
        const id = req.body.user_id;
        const data = req.body.userRole;
        User.updateUserRole(id, data, (err) => {
            if(err) throw err;
            res.redirect('/adminUser');
        });
    },
    updateOrderStatus:(req, res) =>{
        const order_id = req.body.order_id;
        const status = req.body.status;
        User.updateOrderStatus(order_id, status, (err) => {
            if(err) throw err;
            res.redirect('/adminOrder');
        });
    },

};

 

module.exports = {
    show,
    user,
    admin
};





