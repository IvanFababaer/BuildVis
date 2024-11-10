const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'buildvis'
});

db.connect((err) =>{
    if(err) throw err;
    console.log('Connect to mysql database');
    
});

module.exports = db;