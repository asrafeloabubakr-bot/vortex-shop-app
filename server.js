require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <h1>🛒 VORTEX SHOP</h1>
    <p>Интернет-магазин запущен!</p>
    <p>База данных: ${process.env.DATABASE_URL ? '✅ Подключена' : '❌ Нет'}</p>
    <p>Redis: ${process.env.REDIS_URL ? '✅ Подключен' : '❌ Нет'}</p>
    <hr>
    <p><a href="/api/products">Товары (API)</a></p>
  `);
});

app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Телефон', price: 29990 },
    { id: 2, name: 'Ноутбук', price: 89990 },
    { id: 3, name: 'Наушники', price: 4990 }
  ]);
});

app.listen(port, () => {
  console.log(`✅ VORTEX SHOP запущен: http://localhost:${port}`);
});
