require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, uc: 60, price: 0.96 },
    { id: 2, uc: 120, price: 1.82 },
    { id: 3, uc: 325, price: 4.65 }
  ]);
});

app.listen(port, () => {
  console.log(`✅ Магазин запущен: http://localhost:${port}`);
});
