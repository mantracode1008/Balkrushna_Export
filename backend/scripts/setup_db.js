const mysql = require('mysql2/promise');
const dbConfig = require('../config/db.config');
const db = require('../models');

async function initialize() {
    console.log("Starting Database Initialization...");

    try {
        // 1. Create connection without database selected
        const connection = await mysql.createConnection({
            host: dbConfig.HOST,
            user: dbConfig.USER,
            password: dbConfig.PASSWORD
        });

        // 2. Create database if it doesn't exist
        console.log(`Checking if database '${dbConfig.DB}' exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.DB}\`;`);
        console.log(`Database '${dbConfig.DB}' is ready.`);

        await connection.end();

        // 3. Sync Models (Create Tables)
        console.log("Syncing Tables and Models...");
        // Use sync() to create tables. We avoid {alter: true} here if there are too many keys,
        // but for a fresh DB, sync() is perfect.
        await db.sequelize.sync({ force: false });
        console.log("Database and Tables synced successfully.");

        // 4. Create Initial Admin
        console.log("Creating initial admin account...");
        const authController = require("../controllers/auth.controller");
        await authController.createInitialAdmin();
        console.log("Initial Admin created.");

        process.exit(0);
    } catch (err) {
        console.error("FAILED to initialize database:");
        console.error(err.message);
        process.exit(1);
    }
}

initialize();
