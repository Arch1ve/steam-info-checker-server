const express = require('express');
const app = express();
const port = 3000;

app.get('/test', (req, res) => {
    const data = {
      message: "Test data"
    };
    res.json(data);
  });

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});