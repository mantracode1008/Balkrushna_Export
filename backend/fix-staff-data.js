const db = require("./models");
const bcrypt = require("bcryptjs");
const Op = db.Sequelize.Op;

async function fixStaffData() {
    try {
        await db.sequelize.authenticate();
        console.log("Database connection established.");

        // 1. Delete Corrupted Data (Null fields)
        const deleted = await db.admins.destroy({
            where: {
                [Op.or]: [
                    { name: null },
                    { mobile: null },
                    { staff_id: null }
                ],
                role: 'staff'
            }
        });
        console.log(`Deleted ${deleted} corrupted staff records.`);

        // 2. Reset PIN for 'raju'
        const raju = await db.admins.findOne({ where: { name: 'raju', role: 'staff' } });
        if (raju) {
            const newPin = "1234";
            raju.pin = bcrypt.hashSync(newPin, 8);
            await raju.save();
            console.log(`Reset PIN for user 'raju' to '${newPin}'.`);
            console.log(`New Hash: ${raju.pin}`);
            console.log(`Verification Check: ${bcrypt.compareSync(newPin, raju.pin)}`);
        } else {
            console.log("User 'raju' not found.");
            // Create raju if not exists
            const pinHash = bcrypt.hashSync("1234", 8);
            const newRaju = await db.admins.create({
                name: "raju",
                mobile: "9998887776",
                staff_id: "raju",
                pin: pinHash,
                role: "staff",
                permissions: { inventory_manage: true } // Give some default permission
            });
            console.log("Created user 'raju' with PIN '1234'.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

fixStaffData();
