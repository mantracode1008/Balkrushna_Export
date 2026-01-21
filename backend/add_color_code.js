const db = require("./models");

async function addColorCode() {
    try {
        console.log("Attempting to add color_code column...");
        await db.sequelize.query("ALTER TABLE diamonds ADD COLUMN color_code INT AFTER color;");
        console.log("Column added successfully!");
    } catch (err) {
        if (err.parent && err.parent.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error("Error adding column:", err);
        }
    } finally {
        process.exit();
    }
}

addColorCode();
