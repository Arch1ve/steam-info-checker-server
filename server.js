const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const shell = require('shelljs');

const updateServer = () => {
  shell.exec('git pull && npm install && pm2 restart server');
};

const updateClient = () => {
  shell.exec('cd ../client/steam-info-checker-client && git pull && npm install && npm run build');
};

const app = express();
const port = 3000;
const secretKey = '12345';
const corsOptions = {
  origin: '*', // разрешаем все домены для примера, можно заменить на конкретный домен
  optionsSuccessStatus: 200 // для старых браузеров
};

app.use(bodyParser.json());
app.use(cors(corsOptions));

const config = {
  connectionString: "postgres://cloud_user:Temikadza_2002@gobijita.beget.app:5432/default_db"
};

const database = new Client(config);

database.connect((err) => {
  if (err) throw err;
});


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];



  if (!token) return res.sendStatus(401);

  jwt.verify(token, secretKey, async (err, decoded) => {

    if (err) {
      console.error('Token verification error:', err);
      return res.sendStatus(403);
    }

    const query = {
      text: 'SELECT * FROM users WHERE username = $1 OR email = $2',
      values: [decoded.username, decoded.email],
    };
    
    const result = await database.query(query)
    

    req.user = {...decoded, id:result.rows[0].id}; // сохраняем расшифрованные данные пользователя
    next();
  });
};

// Регистрация пользователя
app.post('/users/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создание токена
    const token = jwt.sign({ username, email }, secretKey, { expiresIn: '10000000d' });

    // Сохранение пользователя в базе данных
    const insertUserQuery = {
      text: 'INSERT INTO users(username, email, password, token) VALUES($1, $2, $3, $4) RETURNING id, username, email, token',
      values: [username, email, hashedPassword, token],
    };

    const result = await database.query(insertUserQuery);
    const newUser = result.rows[0];

    res.status(201).json({ message: 'Пользователь успешно создан', user: newUser });
  } catch (err) {
    console.error('Ошибка при создании пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при создании пользователя' });
  }
});

// Логин пользователя
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

    const token = user.token; // Используем сохраненный токен из базы данных

    res.json({ message: 'Успешный вход', token });
  } catch (err) {
    console.error('Ошибка при входе пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе пользователя' });
  }
});

// Эндпоинт для создания элемента
app.post('/create-item', authenticateToken, async (req, res) => {
  const { name, item_link, price, quantity } = req.body;
  const userId = req.user.id; // извлекаем id пользователя из расшифрованных данных токена

  // Проверяем, есть ли userId
  if (!userId) {
    return res.status(400).json({ error: 'Неверный токен. Пользователь не идентифицирован' });
  }

  // SQL запрос для вставки нового элемента в таблицу
  const insertItemQuery = `
    INSERT INTO trade_items (name, item_link, price, quantity, user_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING item_id, name, item_link, price, quantity;
  `;

  try {
    // Вставка нового элемента в таблицу
    const result = await database.query(insertItemQuery, [name, item_link, price, quantity, userId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при создании элемента:', err);
    res.status(500).json({ error: 'Ошибка сервера при создании элемента' });
  }
});

// Эндпоинт для получения элементов торговли
app.get('/trade_items', async (req, res) => {
  try {
    // Пример запроса к базе данных для получения элементов торговли
    const result = await database.query('SELECT * FROM trade_items');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении элементов торговли:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении элементов торговли' });
  }
});

app.post('/update/server', async (req, res) => {
  const { password } = req.body;

  if (password === 'DrowRanger') {
    updateServer();
    res.status(200).send('Success');
  } else {
    res.status(500).json({ error: 'Wrong password' });
  }
});

app.post('/update/client', async (req, res) => {
  const { password } = req.body;

  if (password === 'DrowRanger') {
    updateClient();
    res.status(200).send('Success');
  } else {
    res.status(500).json({ error: 'Wrong password' });
  }
});

app.get('/user/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Доступ к защищенному ресурсу предоставлен', user: req.user });
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});