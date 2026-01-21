const db = require("./models");
const Diamond = db.diamonds;
const Op = db.Sequelize.Op;

async function fixColorCodes() {
    try {
        console.log("Starting Color Code Migration...");

        // Fetch all diamonds where color_code is null but color is present
        const diamonds = await Diamond.findAll({
            where: {
                color_code: null,
                color: { [Op.ne]: null }
            }
        });

        console.log(`Found ${diamonds.length} diamonds to update.`);

        const map = { 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'H': 5, 'I': 6, 'J': 7, 'K': 8, 'L': 9, 'M': 10 };
        let updatedCount = 0;

        for (const d of diamonds) {
            const cKey = String(d.color || '').toUpperCase().trim();
            const code = map[cKey];

            if (code) {
                // Update directly
                await d.update({ color_code: code });
                updatedCount++;
                process.stdout.write("."); // Progress dot
            }
        }

        console.log(`\nSuccess! Updated ${updatedCount} diamonds.`);

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        process.exit();
    }
}

fixColorCodes();
