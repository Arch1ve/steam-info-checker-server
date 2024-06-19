const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Настройка подключения к базе данных
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Пример запроса к базе данных
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get('/trade_items', async (req, res) => {
  try {
    const result = await pool.query('SELECT users.username, trade_items.item_link, trade_items.price, trade_items.quantity FROM users JOIN trade_items ON users.id = trade_items.user_id;');
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});