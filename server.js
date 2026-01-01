const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// --- MIDDLEWARES ---
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE CONNECTION ---
const dbURI = 'mongodb+srv://ndukaanthonya:CT3irktoTTSfkr1o@cluster0.xksjxbb.mongodb.net/lostandfound?appName=Cluster0RE';

mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB Cloud! ✅'))
    .catch(err => console.log('❌ DB Connection Error:', err));

// --- DATABASE SCHEMA ---
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String,
    location: String,
    date: String,
    details: String
}));

// This tells the server: "When someone visits the home page, send them index.html"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- ROUTES ---

// POST: Save a new item
app.post('/api/report', async (req, res) => {
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        res.status(201).json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch all items
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});