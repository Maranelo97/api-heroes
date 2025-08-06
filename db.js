const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',       // o el host donde tengas tu DB
  user: 'root',
  password: 'negromg555',
  database: 'heroes_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;