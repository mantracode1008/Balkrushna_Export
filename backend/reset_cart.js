const db = require("./models");
const Diamond = db.diamonds;

async function resetCartItems() {
    try {
        // Find all items with status 'in_cart'
        const cartItems = await Diamond.findAll({ where: { status: 'in_cart' } });
        console.log(`Found ${cartItems.length} items in cart. Resetting to 'in_stock'...`);

        await Diamond.update({ status: 'in_stock' }, { where: { status: 'in_cart' } });

        console.log("All cart items have been reset to 'in_stock'.");
    } catch (err) {
        console.error("Error resetting cart items:", err);
    }
}

// Run if called directly
const run = async () => {
    await db.sequelize.sync();
    await resetCartItems();
    process.exit();
};

run();
