const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors')
const shell = require('shelljs')

const updateServer = () => {
    shell.exec('git pull && npm install && pm2 restart server')
}

const updateClient = () => {
  shell.exec('cd ../client/steam-info-checker-client && git pull && npm install && npm run build'    )
}

const app = express();
const port = 3000; // Порт, на котором будет работать сервер
const secretKey = '12345';
const corsOptions = {
  origin: '*', // домен сервиса, с которого будут приниматься запросы
  optionsSuccessStatus: 200 // для старых браузеров
}

// Парсинг данных application/json
app.use(bodyParser.json());
app.use(cors(corsOptions));

const config = {
  connectionString:
    "postgres://cloud_user:Temikadza_2002@gobijita.beget.app:5432/default_db"
};

const database = new Client(config);

database.connect((err) => {
  if (err) throw err;
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


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

app.post('/users/register', async (req, res) => {
  const { username, email, password } = req.body;
    
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    // Создание соли вручную
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const token = jwt.sign({ username, email }, secretKey, { expiresIn: '10000000d' });

    const query = {
      text: 'INSERT INTO users(username, email, password, token) VALUES($1, $2, $3, $4) RETURNING *',
      values: [username, email, hashedPassword, token],
    };

    const result = await database.query(query);
    res.status(201).json({ message: 'Пользователь успешно создан', user: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при создании пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при создании пользователя' });
  }
});



app.post('/user/login', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
}

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
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неправильный логин или пароль' });
    }

    const token = user.token

    res.json({ message: 'Успешный вход', token });

  } catch (err) {
    console.error('Ошибка при входе пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе пользователя' });
  }
});

app.get('/user/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Доступ к защищенному ресурсу предоставлен', user: req.user });
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

app.post('/update/server', async (req, res) => {
  
  const { password } = req.body;
  
  if (password === "DrowRanger") {
    updateServer()
    res.status(200).send("Success")
  } else {
    res.status(500).json({ error: 'Wrong password' });
  }

});

app.post('/update/client', async (req, res) => {
  
  const { password } = req.body;

  if (password === "DrowRanger") {
    updateClient()
    res.status(200).send("Success")
  } else {
    res.status(500).json({ error: 'Wrong password' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
