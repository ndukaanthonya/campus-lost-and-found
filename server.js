const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// DATABASE CONNECTION
const dbURI = 'mongodb+srv://ndukaanthonya:CT3irktoTTSfkr1o@cluster0.xksjxbb.mongodb.net/lostandfound?appName=Cluster0RE';

mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB Cloud! ✅'))
    .catch(err => console.log('❌ DB Connection Error:', err));

// DATABASE SCHEMA
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String,
    location: String,
    date: String,
    details: String
}));

// ROUTES
app.post('/api/report', async (req, res) => {
    console.log("🚀 Server received data:", req.body);
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        res.status(201).json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/items', async (req, res) => {
    const items = await Item.find();
    res.json(items);
});

app.listen(3000, () => console.log('Server live at http://localhost:3000 🚀'));