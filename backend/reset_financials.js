const db = require("./models");
const Invoice = db.invoices;
const Diamond = db.diamonds;

async function resetFinancials() {
    try {
        console.log("Starting financial data reset...");

        // 1. Delete all invoices
        const deletedInvoices = await Invoice.destroy({
            where: {},
            truncate: false // Use truncate: true if you want to reset auto-increment IDs too, but simple delete is safer for FKs usually
        });
        console.log(`Deleted ${deletedInvoices} invoices.`);

        // 2. Reset Sold diamonds to In Stock
        const [updatedRows] = await Diamond.update(
            { status: 'in_stock' },
            { where: { status: ['sold', 'in_cart'] } }
        );
        console.log(`Reset ${updatedRows} diamonds from 'sold'/'in_cart' to 'in_stock'.`);

        console.log("Financial reset complete. Revenue and Profit should now be 0.");

    } catch (err) {
        console.error("Error resetting financials:", err);
    }
}

const run = async () => {
    await db.sequelize.sync();
    await resetFinancials();
    process.exit();
};

run();
