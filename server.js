const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();

// --- 1. Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Setting up Sessions (The "ID Card" system)
app.use(session({
    secret: "UNN_Campus_Secret_2026", 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Session expires in 1 hour
}));

// --- 2. Database Connection ---
// Replace the string below with your actual MongoDB Atlas connection string
mongoose.connect("mongodb+srv://YOUR_CONNECTION_STRING", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Connected to UNN Database"))
  .catch(err => console.log("DB Connection Error:", err));

// --- 3. Schemas & Models ---

// Item Schema (For Lost/Found Items)
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    iconClass: String,
    location: String,
    date: String,
    details: String,
    status: { type: String, default: 'active' }
});
const Item = mongoose.model("Item", itemSchema);

// Admin Schema (For Secure Login)
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Admin = mongoose.model("Admin", adminSchema);

// --- 4. Auth Gatekeeper (Middleware) ---
// This function checks if you are logged in before letting you see a page
function checkAuth(req, res, next) {
    if (req.session.isAdmin) {
        next(); // You are logged in, proceed!
    } else {
        res.redirect("/login.html"); // Not logged in? Go to login page.
    }
}

// --- 5. Authentication Routes ---

// Login Logic
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

// Logout Logic
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login.html");
});

// --- 6. Protected Page Route ---
// Only logged-in admins can reach manage.html
app.get("/manage.html", checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "manage.html"));
});

// --- 7. API Routes (The CRUD Operations) ---

// CREATE: Post item
app.post("/api/report", checkAuth, async (req, res) => {
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// READ: Get all items
app.get("/api/items", async (req, res) => {
    try {
        const items = await Item.find({});
        res.json(items);
    } catch (err) { res.status(500).json(err); }
});

// UPDATE: Mark as Claimed
app.patch("/api/items/:id", checkAuth, async (req, res) => {
    try {
        await Item.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// DELETE: The Trash Can
app.delete("/api/items/:id", checkAuth, async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// --- 8. One-Time Setup Route ---
// RUN THIS ONCE by visiting /setup-admin then DELETE THIS BLOCK
app.get("/setup-admin", async (req, res) => {
    const hashedPassword = await bcrypt.hash("MrIzu2026", 10);
    const newAdmin = new Admin({
        username: "admin",
        password: hashedPassword
    });
    await newAdmin.save();
    res.send("Admin 'admin' created with password 'MrIzu2026'. DELETE THIS ROUTE NOW!");
});

// --- 9. Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));