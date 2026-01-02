const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "UNN_Campus_Secret_2026", 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } 
}));

mongoose.connect("mongodb+srv://ndukaanthonya:ITNAA2026@cluster0.xksjxbb.mongodb.net/?appName=Cluster0")
  .then(() => console.log("Connected to UNN Database"))
  .catch(err => console.log("DB Connection Error:", err));

// --- SCHEMAS ---
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    iconClass: String,
    location: String,
    date: String,
    details: String,
    status: { type: String, default: 'active' }
});
const Item = mongoose.model("Item", itemSchema);

const reserveSchema = new mongoose.Schema({
    itemId: String,
    itemName: String,
    fullName: String,
    email: String,
    phone: String,
    userType: String,
    comment: String,
    dateSent: { type: Date, default: Date.now }
});
const Reservation = mongoose.model("Reservation", reserveSchema);

const Admin = mongoose.model("Admin", new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

// --- ROUTES ---

// Reservation Route
app.post("/api/reserve", async (req, res) => {
    try {
        const newRes = new Reservation(req.body);
        await newRes.save();
        // Send JSON so the frontend script can show an alert without refreshing
        res.status(200).json({ success: true, message: "Reservation received" });
    } catch (err) { 
        console.error("Reservation Error:", err);
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// Admin view reservations
app.get("/api/reservations", async (req, res) => {
    try {
        const resList = await Reservation.find({}).sort({ dateSent: -1 });
        res.json(resList);
    } catch (err) { res.status(500).send(err); }
});

app.get("/setup-admin", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash("MrIzu2026", 10);
        await Admin.deleteMany({ username: "admin" });
        const newAdmin = new Admin({ username: "admin", password: hashedPassword });
        await newAdmin.save();
        res.send("Admin Created.");
    } catch (err) { res.status(500).send(err); }
});

app.use(express.static("public"));

function checkAuth(req, res, next) {
    if (req.session.isAdmin) next();
    else res.redirect("/login.html");
}

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const foundAdmin = await Admin.findOne({ username });
    if (foundAdmin && await bcrypt.compare(password, foundAdmin.password)) {
        req.session.isAdmin = true;
        res.redirect("/manage.html");
    } else res.send("Invalid Login.");
});

app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/login.html"); });

app.get("/manage.html", checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "manage.html"));
});

// API CRUD
app.post("/api/report", checkAuth, async (req, res) => {
    const newItem = new Item(req.body);
    await newItem.save();
    res.json({ success: true });
});

app.get("/api/items", async (req, res) => {
    const items = await Item.find({});
    res.json(items);
});

app.patch("/api/items/:id", checkAuth, async (req, res) => {
    await Item.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
});

app.delete("/api/items/:id", checkAuth, async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));