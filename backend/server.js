const express = require("express");
const cors = require("cors");
const db = require("./models");
require("dotenv").config();

global.__basedir = __dirname;

const app = express();

var corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:5174"]
};

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json({ limit: '50mb' }));
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/invoices', express.static('uploads/invoices')); // Serve invoices statically

// simple route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Diamond Inventory API." });
});

// Sync DB
const authController = require("./controllers/auth.controller");
console.log("Syncing database...");
db.sequelize.sync()
    .then(() => {
        console.log("Database synced.");
    })
    .then(() => {
        // Create initial admin if not exists
        authController.createInitialAdmin();
    })
    .catch((err) => {
        console.log("Failed to sync db: " + err.message);
    });

// Routes
require("./routes/auth.routes")(app);
require("./routes/diamond.routes")(app);
require("./routes/invoice.routes")(app);
require("./routes/report.routes")(app);
require("./routes/pricing.routes")(app);
require("./routes/company.routes")(app);
require("./routes/client.routes")(app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
