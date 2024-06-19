const express = require('express');
const { Client } = require('pg');

const bodyParser = require('body-parser');

const app = express();
const port = 3000; // Порт, на котором будет работать сервер

// Парсинг данных application/json
app.use(bodyParser.json());




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

// Обработчик POST запроса для создания пользователя
app.post('/user/register', async (req, res) => {
  
  const { username, email, password } = req.body;
  console.log(username, email, password)

    const query = {
        text: 'INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING *',
        values: [username, email, password],
    };

    try {
        const result = await database.query(query);
        res.status(201).json({ message: 'Пользователь успешно создан', user: result.rows[0] });
    } catch (err) {
        console.error('Ошибка при создании пользователя:', err);
        res.status(500).json({ error: 'Ошибка сервера при создании пользователя' });
    }
});



app.post('/user/login', async (req, res) => {
  const { login, password } = req.body;

  const query = {
      text: 'SELECT * FROM users WHERE username = $1 OR email = $2',
      values: [login, login],
  };

  try {
      const result = await database.query(query);

      if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Неправильный логин или пароль' });
      }

      const user = result.rows[0];

      const isValidPassword = password === user.password
      if (!isValidPassword) {
          return res.status(401).json({ error: 'Неправильный логин или пароль' });
      }

      // Генерация и возвращение токена (например, JWT)
      // const token = generateJWT(user); // Предполагается, что у вас есть функция для генерации JWT
      // res.json({ message: 'Успешный вход', token });

      res.json({ message: 'Успешный вход', user: { username: user.username, email: user.email } });

  } catch (err) {
      console.error('Ошибка при входе пользователя:', err);
      res.status(500).json({ error: 'Ошибка сервера при входе пользователя' });
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