const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// خواندن پورت از ریلی‌وی یا پیش‌فرض 8080
const PORT = process.env.PORT || 8080;

app.use(express.json());

// روت اصلی برای اینکه ارور Cannot GET نده و بفهمی سرور آنلاینه
app.get('/', (req, res) => {
  res.send('SRM Panel & Tunnel is Online!');
});

// خواندن کانفیگ‌ها از همون فایل config.json که داری
app.get('/config', (req, res) => {
  try {
    const configData = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
    res.json(JSON.parse(configData));
  } catch (err) {
    res.status(500).send('Error reading config file');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running smoothly on port ${PORT}`);
});
