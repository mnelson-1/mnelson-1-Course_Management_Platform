const express = require('express');
const sequelize = require('./models/index');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Course Management Platform API');
});

// Sync database and start server
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});