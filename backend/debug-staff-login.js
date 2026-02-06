const db = require("./models");
const bcrypt = require("bcryptjs");

async function debugStaffLogin() {
    try {
        await db.sequelize.authenticate();
        console.log("Database connection established.");

        const staffUsers = await db.admins.findAll({
            where: { role: 'staff' }
        });

        console.log(`Found ${staffUsers.length} staff users.`);

        for (const user of staffUsers) {
            console.log(`\nChecking User: ${user.name} (${user.staff_id})`);
            console.log(`Mobile: ${user.mobile}`);
            console.log(`Stored PIN Hash: ${user.pin}`);

            const testPin1 = "1234";
            const testPin2 = "1111";

            const match1 = bcrypt.compareSync(testPin1, user.pin);
            const match2 = bcrypt.compareSync(testPin2, user.pin);

            console.log(`Match for '${testPin1}': ${match1}`);
            console.log(`Match for '${testPin2}': ${match2}`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        // await db.sequelize.close(); // Keep connection open or force exit
        process.exit();
    }
}

debugStaffLogin();
