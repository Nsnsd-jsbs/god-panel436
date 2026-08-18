const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('SRM Panel is Online and Working perfectly!');
});

app.get('/config', (req, res) => {
  try {
    const configData = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
    res.json(JSON.parse(configData));
  } catch (err) {
    res.status(500).send('Error reading config');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
