const express = require('express');
const app = express();

// این خط یعنی از پورت ریلی‌وی استفاده کن، اگر نبود برو روی 8080
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('SRM Panel is Online and Running!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
