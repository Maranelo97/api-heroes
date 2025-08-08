const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'negromg555',
  port: 5432, // puerto por defecto de PostgreSQL
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};