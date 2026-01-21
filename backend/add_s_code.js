const db = require("./models");

async function addSCode() {
    try {
        await db.sequelize.query("ALTER TABLE diamonds ADD COLUMN S_code VARCHAR(255) AFTER shape;");
        console.log("Added S_code column.");
    } catch (err) {
        console.log("Error (probably exists):", err.message);
    } finally {
        process.exit();
    }
}

addSCode();
