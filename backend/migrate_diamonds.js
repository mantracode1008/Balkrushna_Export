const db = require("./models");

async function migrate() {
    try {
        console.log("Adding columns to diamonds table...");
        const queryInterface = db.sequelize.getQueryInterface();

        try {
            await queryInterface.addColumn('diamonds', 'growth_process', {
                type: db.Sequelize.STRING
            });
            console.log("Added growth_process");
        } catch (e) {
            console.log("growth_process might already exist or error: " + e.message);
        }

        try {
            await queryInterface.addColumn('diamonds', 'report_url', {
                type: db.Sequelize.STRING
            });
            console.log("Added report_url");
        } catch (e) {
            console.log("report_url might already exist or error: " + e.message);
        }

        console.log("Migration done.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
