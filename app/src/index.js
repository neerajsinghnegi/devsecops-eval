const express = require('express');
const { MongoClient } = require('mongodb');


const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/testdb';


app.get('/', async (req, res) => {
res.json({ status: 'ok', time: new Date().toISOString() });
});


app.get('/health', (req, res) => res.sendStatus(200));


app.listen(PORT, () => console.log(`Listening on ${PORT}`));


// NOTE: production app should reuse a single connection and handle errors/timeouts.