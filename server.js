const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();

// --- 1. Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setting up Sessions
app.use(session({
    secret: "UNN_Campus_Secret_2026", 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } 
}));

// --- 2. Database Connection ---
mongoose.connect("mongodb+srv://ndukaanthonya:ITNAA2026@cluster0.xksjxbb.mongodb.net/?appName=Cluster0")
  .then(() => console.log("Connected to UNN Database"))
  .catch(err => console.log("DB Connection Error:", err));

// --- 3. Schemas & Models ---
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    iconClass: String,
    location: String,
    date: String,
    details: String,
    status: { type: String, default: 'active' }
});
const Item = mongoose.model("Item", itemSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Admin = mongoose.model("Admin", adminSchema);

// --- 4. The Setup Route (ADED THIS BACK) ---
// Visit /setup-admin ONCE to create your login
app.get("/setup-admin", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash("MrIzu2026", 10);
        await Admin.deleteMany({ username: "admin" }); // Clear old ones
        const newAdmin = new Admin({
            username: "admin",
            password: hashedPassword
        });
        await newAdmin.save();
        res.send("<h1>SUCCESS!</h1><p>Admin 'admin' created. Go to <a href='/login.html'>Login Page</a></p>");
    } catch (err) {
        res.status(500).send("Setup Error: " + err.message);
    }
});

// Serve static files AFTER the setup route
app.use(express.static("public"));

// --- 5. Auth Gatekeeper ---
function checkAuth(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect("/login.html");
    }
}

// --- 6. Routes ---

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const foundAdmin = await Admin.findOne({ username: username });
        if (foundAdmin) {
            const match = await bcrypt.compare(password, foundAdmin.password);
            if (match) {
                req.session.isAdmin = true;
                res.redirect("/manage.html");
            } else {
                res.send("Incorrect password. <a href='/login.html'>Try again</a>");
            }
        } else {
            res.send("Admin not found. <a href='/login.html'>Try again</a>");
        }
    } catch (err) { res.status(500).send("Login Error"); }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login.html");
});

app.get("/manage.html", checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "manage.html"));
});

// --- 7. API Routes ---
app.post("/api/report", checkAuth, async (req, res) => {
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

app.get("/api/items", async (req, res) => {
    try {
        const items = await Item.find({});
        res.json(items);
    } catch (err) { res.status(500).json(err); }
});

app.patch("/api/items/:id", checkAuth, async (req, res) => {
    try {
        await Item.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

app.delete("/api/items/:id", checkAuth, async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));