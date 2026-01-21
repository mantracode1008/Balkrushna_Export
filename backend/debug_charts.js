const db = require("./models");
const Diamond = db.diamonds;
const sequelize = db.sequelize;

async function debugStats() {
    try {
        console.log("Checking Diamond Distribution...");

        const count = await Diamond.count();
        console.log("Total Diamonds in DB:", count);

        const inStockCount = await Diamond.count({ where: { status: 'in_stock' } });
        console.log("In Stock Diamonds:", inStockCount);

        const shapeDist = await Diamond.findAll({
            where: { status: 'in_stock' },
            attributes: [
                'shape',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['shape'],
            raw: true
        });
        console.log("Shape Distribution:", shapeDist);

        const colorDist = await Diamond.findAll({
            where: { status: 'in_stock' },
            attributes: [
                'color',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['color'],
            raw: true
        });
        console.log("Color Distribution:", colorDist);

    } catch (err) {
        console.error("Error:", err);
    }
}

const run = async () => {
    await db.sequelize.sync();
    await debugStats();
    process.exit();
};

run();
