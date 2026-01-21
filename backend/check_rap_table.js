const db = require("./models");

async function checkRapTable() {
    try {
        const [results, metadata] = await db.sequelize.query("DESCRIBE OrigionalRapRate_Live_Tbl");
        console.log("Table Schema:", JSON.stringify(results, null, 2));
    } catch (err) {
        console.error("Error checking schema:", err.message);
        // Try listing all tables if it fails
        try {
            const [tables] = await db.sequelize.query("SHOW TABLES");
            console.log("Available Tables:", JSON.stringify(tables, null, 2));
        } catch (e) {
            console.error("Error listing tables:", e.message);
        }
    } finally {
        process.exit();
    }
}

checkRapTable();
