const mysql = require('mysql2/promise');
require('dotenv').config();

async function initialize() {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    try {
        const connection = await mysql.createConnection({ host: DB_HOST || 'localhost', user: DB_USER || 'root', password: DB_PASSWORD || '' });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME || 'diamond_inventory'}\`;`);
        console.log("Database initialized or already exists.");
        await connection.end();
    } catch (error) {
        console.error("Error initializing database:", error);
        process.exit(1);
    }
}

initialize();
