const db = require("./models");
const Diamond = db.diamonds;
const Op = db.Sequelize.Op;

const getShapeCode = (shape) => {
    if (!shape) return '';
    const sKey = String(shape).toUpperCase().trim();
    const map = {
        'ASSCHER': 'AS',
        'CUSHION': 'CU',
        'RECTANGULAR': 'RD',
        'EMERALD': 'EM',
        'FLOWER': 'CU',
        'HEART': 'HR',
        'MARQUISE': 'MQ',
        'OVAL': 'OV',
        'PEAR': 'PE',
        'PRINCESS': 'PR',
        'RADIANT': 'RD',
        'ROUND': 'R',
        'ROUND ROSE': 'R',
        'CUSHION BRILLIANT': 'CB',
        'CUSHION MIXED CUT': 'CU',
        'CUSHION MODIFIED BRILLIANT': 'CU',
        'EMERALD CUT': 'EM',
        'SQUARE EMERALD CUT': 'EM',
        'SQUARE RADIANT': 'RQ'
    };
    // Helper: try exact, then try space removal (rarely needed for shape but good practice)
    return map[sKey] || map[sKey.replace(/\s+/g, ' ')] || '';
};

async function backfillSCode() {
    try {
        console.log("Starting S_code Backfill...");

        const diamonds = await Diamond.findAll({
            where: {
                S_code: null,
                shape: { [Op.ne]: null }
            }
        });

        console.log(`Found ${diamonds.length} diamonds to update.`);

        let updatedCount = 0;
        for (const d of diamonds) {
            const code = getShapeCode(d.shape);

            if (code) {
                await d.update({ S_code: code });
                updatedCount++;
                process.stdout.write(".");
            } else {
                // console.warn(`\nNo code found for shape: ${d.shape}`);
            }
        }

        console.log(`\nSuccess! Updated ${updatedCount} diamonds.`);

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        process.exit();
    }
}

backfillSCode();
