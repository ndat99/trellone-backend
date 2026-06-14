const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Khoi tao Connection Pool ket noi Postgres
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test ket noi DB
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Connect to PostgreSQL failed:', err.stack);
  }
  console.log('Connect to PostgreSQL successful');
  release();
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server ExpressJS is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});