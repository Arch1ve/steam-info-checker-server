const express = require('express');
const { Client } = require('pg');



const app = express();
const port = process.env.PORT || 3000;

const config = {
  connectionString:
      "postgres://cloud_user:Temikadza_2002@gobijita.beget.app:5432/default_db"
};

const database = new Client(config);

database.connect((err) => {
  if (err) throw err;
});


app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Пример запроса к базе данных
app.get('/users', async (req, res) => {
  try {
    const result = await database.query('SELECT * FROM users');

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get('/trade_items', async (req, res) => {
  try {
    const result = await database.query('SELECT users.username, trade_items.item_link, trade_items.price, trade_items.quantity FROM users JOIN trade_items ON users.id = trade_items.user_id;');
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});