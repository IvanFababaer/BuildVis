const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');  // Import nodemailer for sending emails
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const SECRET_KEY = process.env.SECRET_KEY || 'defaultSecretKey'; // Use environment variable for security

const itemsPerPage = 10; // Set items per page
const verificationCodes = {}; // Temporary storage

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
            new Promise((resolve, reject) => {
                User.totalrecords(req.session.user.id, (err, totalRecords) => {
                    if (err) reject(err);
                    else resolve(totalRecords);
                });
            })
        ])
        .then(([productList, totalRecords]) => {
            res.render('materials', {
                user: req.session.user,
                product: productList,
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
        res.render('adminDashboard');
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
        const currentPage = parseInt(req.query.page) || 1; // Get current page from query, default to 1
        const offset = (currentPage - 1) * itemsPerPage;
    
        Promise.all([
            User.getCartItems(userId, itemsPerPage, offset), // Pass limit and offset
            new Promise((resolve, reject) => {
                User.totalrecords(userId, (err, totalRecords) => {
                    if (err) reject(err);
                    else resolve(totalRecords);
                });
            })
        ])
        .then(([cartItemList, totalRecords]) => {
            const totalPages = Math.ceil(totalRecords / itemsPerPage);
    
            res.render('cart', {
                user: req.session.user,
                cartItem: cartItemList,     // List of cart items
                currentPage,                // Current page
                totalPages,                 // Total pages for pagination
                totalRecords                // Total record count
            });
        })
        .catch(err => {
            console.error('Error fetching cart data:', err);
            res.status(500).send('Internal Server Error');
        });
    },    
    showBillingDetail: (req, res) => {
        if (!req.session.user) {
            req.flash('error', 'Please log in first');
            return res.redirect('/login');
        }
    
        const id = req.session.user.id;
        console.log('User ID:', id);
    
        Promise.all([
            // Fetch billing details
            User.getBillingDetail(id),
            // Wrap totalrecords in a Promise to use it with Promise.all
            new Promise((resolve, reject) => {
                User.totalrecords(id, (err, totalRecords) => {
                    if (err) reject(err);
                    else resolve(totalRecords);
                });
            })
        ])
        .then(([billingdetail, totalRecords]) => {
            // Render the billingDetail view with user, billing, and totalRecords data
            res.render('billingDetail', {
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
    showProfile: (req, res) => {
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
            res.render('profile', {
                user: req.session.user,
                totalRecords // Pass totalRecords to the view
            });
        })
        .catch(err => {
            console.error('Error fetching total records:', err);
            res.status(500).send('Internal Server Error');
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
    
    login: (req, res) => {
        const { email, password } = req.body;
        let errors = [];
    
        if (email === "Admin" && password === "adminako") {
            return res.redirect('admin');
        }
    
        if (!email || !password) {
            req.flash('error', 'Both email and password are required');
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
                console.log('Invalid credentials');
                return res.status(400).render('login', { errors: [{ msg: 'Invalid credentials' }], email });
            }
    
            // Set user session and retrieve total records
            req.session.user = user;
    
            // Fetch total records and pass them to the dashboard
            User.totalrecords(user.id,(err, totalRecords) => {
                if (err) {
                    console.error('Error retrieving total records:', err);
                    return res.status(500).send('Error retrieving total records');
                }
                console.log(totalRecords);
                // Redirect to dashboard with totalRecords
                console.log('User authenticated:', user);
                res.render('dash', { user, totalRecords });
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
        // Call model to insert data into the cart table
        User.addToCart({ user_id, productId, quantity, totalPrice}, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Failed to add to cart' });
            }

            // res.status(200).json({ success: true, message: 'Product added to cart' });
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
    updateProducts:(req, res) =>{
        const id = req.body.productId;
        const data = req.body;
        User.updateProduct(id, data, (err) => {
            if(err) throw err;
            res.redirect('/adminProduct');
        });
    },
    

};

module.exports = {
    show,
    user,
    admin
};





