const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const session = require('express-session');
const flash = require('connect-flash');
const routes = require('./router/routes');
require('dotenv').config();


app.set('view engine', 'ejs');
app.use(session({
    secret: 'secret',  // Replace with a secure key for your app
    resave: false,            // Prevents session from being saved back to the store if not modified
    saveUninitialized: true,  // Save uninitialized sessions (new but not modified)
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Set to true if using HTTPS
}));

// Flash middleware
app.use(flash());

// Pass flash messages to views
app.use((req, res, next) => {
    res.locals.error = req.flash('error'); // Set 'error' flash messages
    res.locals.success = req.flash('success'); // Set 'success' flash messages
    next();
});



app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use('/', routes);

app.listen(3000, () =>{
    console.log('Server Initialized on http://localhost:3000/');
    
})
