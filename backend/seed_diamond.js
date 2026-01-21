const db = require("./models");
const Diamond = db.diamonds;

async function seed() {
    try {
        const cert = "759519338";
        const existing = await Diamond.findOne({ where: { certificate: cert } });
        if (existing) {
            console.log("Diamond 759519338 already exists.");
            await existing.update({ status: 'in_stock' }); // Reset if needed
            return;
        }

        await Diamond.create({
            certificate: cert,
            certificate_date: "January 14, 2026",
            description: "Test Diamond for User",
            shape: "R",
            carat: 1.01,
            color: "D",
            clarity: "IF",
            cut: "EX",
            polish: "EX",
            symmetry: "EX",
            measurements: "6.40 - 6.45 x 4.00",
            table_percent: "58",
            total_depth_percent: "62",
            price: 5000.00, // Cost Price
            quantity: 1,
            status: 'in_stock',
            fluorescence: "NONE",
            lab: "GIA"
        });
        console.log("Created Diamond 759519338");
    } catch (err) {
        console.error("Error seeding:", err);
    }
}

// Run if called directly
const run = async () => {
    await db.sequelize.sync();
    await seed();
    process.exit();
};

run();
