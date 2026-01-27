const db = require("./models");

async function fixSchema() {
    const sequelize = db.sequelize;

    const queries = [
        // Invoice Table
        "ALTER TABLE `invoices` ADD COLUMN `subtotal_amount` DECIMAL(10, 2);",
        "ALTER TABLE `invoices` ADD COLUMN `cgst_rate` DECIMAL(5, 2) DEFAULT 0.75;",
        "ALTER TABLE `invoices` ADD COLUMN `sgst_rate` DECIMAL(5, 2) DEFAULT 0.75;",
        "ALTER TABLE `invoices` ADD COLUMN `cgst_amount` DECIMAL(10, 2) DEFAULT 0;",
        "ALTER TABLE `invoices` ADD COLUMN `sgst_amount` DECIMAL(10, 2) DEFAULT 0;",
        "ALTER TABLE `invoices` ADD COLUMN `total_gst` DECIMAL(10, 2) DEFAULT 0;",
        "ALTER TABLE `invoices` ADD COLUMN `grand_total` DECIMAL(10, 2);",
        "ALTER TABLE `invoices` ADD COLUMN `gst_number` VARCHAR(255);",

        // Invoice Items Table
        "ALTER TABLE `invoice_items` ADD COLUMN `rate_per_carat` DECIMAL(10, 2);",
        "ALTER TABLE `invoice_items` ADD COLUMN `carat_weight` DECIMAL(8, 2);",

        // Clients Table
        "ALTER TABLE `clients` ADD COLUMN `gst_number` VARCHAR(255);"
    ];

    console.log("Starting manual schema update...");

    for (const query of queries) {
        try {
            await sequelize.query(query);
            console.log(`Executed: ${query}`);
        } catch (error) {
            if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
                console.log(`Skipped (Exists): ${query}`);
            } else {
                console.error(`Error executing: ${query}`, error.message);
            }
        }
    }

    console.log("Schema update completed.");
    process.exit(0);
}

fixSchema();
