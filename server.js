require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const redis = require('redis');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Подключение к Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});
redisClient.connect().catch(console.error);

// Сессии через Redis
const RedisStore = require('connect-redis').default || require('connect-redis');
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'vortex-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Статические файлы ИЗ ПАПКИ public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Главный маршрут для SPA (отдаёт index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API маршруты
app.get('/api/user', (req, res) => {
  res.json(req.session.user || { loggedIn: false });
});

app.get('/api/products', async (req, res) => {
  const products = [
    { id: 1, uc: 60, price: 0.96, perUc: 0.0160, currency: 'USDT' },
    { id: 2, uc: 120, price: 1.82, perUc: 0.0152, currency: 'USDT' },
    { id: 3, uc: 180, price: 2.88, perUc: 0.0160, currency: 'USDT' },
    { id: 4, uc: 325, price: 4.65, perUc: 0.0143, currency: 'USDT' },
    { id: 5, uc: 660, price: 8.20, perUc: 0.0124, currency: 'USDT' }
  ];
  res.json(products);
});

app.post('/api/create-order', async (req, res) => {
  const { productId, playerId, paymentMethod } = req.body;
  try {
    // Здесь будет запись в БД, пока заглушка
    const order = {
      id: Date.now(),
      productId,
      playerId,
      paymentMethod,
      status: 'pending',
      createdAt: new Date()
    };
    
    const paymentLink = paymentMethod === 'binance' 
      ? `https://pay.binance.com/gateway?order=${order.id}`
      : `https://pay.google.com/gateway?order=${order.id}`;
    
    res.json({ 
      success: true, 
      order, 
      paymentLink,
      message: 'Заказ создан. Перейдите по ссылке для оплаты.' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FAQ данные
app.get('/api/faq', (req, res) => {
  const faq = [
    { 
      q: 'Как найти Player ID в PUBG Mobile?', 
      a: '1. Откройте PUBG Mobile<br>2. Нажмите на аватар в правом нижнем углу<br>3. Перейдите в раздел "База"<br>4. Ваш Player ID отобразится вверху (9-12 цифр)' 
    },
    { 
      q: 'Сколько ждать доставку UC?', 
      a: 'После успешной оплаты: 5–10 минут. В редких случаях до 30 минут.' 
    },
    { 
      q: 'Какие методы оплаты поддерживаются?', 
      a: 'Binance Pay (USDT), Google Pay, банковские карты (Visa/Mastercard)' 
    },
    { 
      q: 'Как получить возврат средств?', 
      a: 'При отмене заказа до оплаты: автоматически. При технических проблемах: 3-7 рабочих дней. Пишите в поддержку Telegram: @vortex_shop_support' 
    }
  ];
  res.json(faq);
});

// Для всех остальных маршрутов — отдаём index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(port, async () => {
  console.log(`✅ VORTEX SHOP запущен: http://localhost:${port}`);
  
  // Создание таблиц если их нет
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        avatar TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER,
        player_id VARCHAR(50),
        payment_method VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);
    console.log('✅ Таблицы базы данных проверены/созданы');
  } catch (err) {
    console.error('❌ Ошибка создания таблиц:', err.message);
  }
});
