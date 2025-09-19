const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

// Use env var for MongoDB connection (from secrets in GitHub Actions or Docker)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devsecopsdb';

// Track DB connection status
let dbStatus = 'Not connected';

// MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  dbStatus = 'MongoDB connected successfully ✅';
  console.log(dbStatus);
})
.catch((err) => {
  dbStatus = 'MongoDB connection failed ❌: ' + err.message;
  console.error(dbStatus);
});

// Routes
app.get('/', (req, res) => {
  res.send(`<h1>DevSecOps Demo App</h1><p>${dbStatus}</p>`);
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', db: dbStatus });
});

app.listen(PORT, () => {
  console.log(`🚀 App running at http://localhost:${PORT}`);
});
