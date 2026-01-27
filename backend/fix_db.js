const dotenv = require('dotenv');
dotenv.config();
const db = require("./models");

async function fix() {
    try {
        const queryInterface = db.sequelize.getQueryInterface();
        // Check Invoice Items
        const TableNameItems = 'invoice_items';
        const colsItems = ['billed_amount', 'billed_rate'];

        for (const col of colsItems) {
            try {
                console.log(`Adding ${col} to ${TableNameItems}...`);
                await queryInterface.addColumn(TableNameItems, col, {
                    type: db.Sequelize.DECIMAL(10, 2),
                    defaultValue: 0
                });
                console.log(`Added ${col}`);
            } catch (e) {
                console.log(`Error adding ${col} to ${TableNameItems}:`, e.message);
            }
        }

        const TableName = 'invoices';
        const columns = [
            'subtotal_amount',
            'cgst_rate', 'sgst_rate',
            'cgst_amount', 'sgst_amount',
            'total_gst', 'grand_total',
            'gst_number', 'billing_country',
            'subtotal_usd', 'grand_total_usd'
        ];

        for (const col of columns) {
            try {
                console.log(`Adding ${col}...`);
                await queryInterface.addColumn(TableName, col, {
                    type: db.Sequelize.DECIMAL(10, 2), // Default to Decimal for amounts
                    defaultValue: 0
                });
                console.log(`Added ${col}`);
            } catch (e) {
                console.log(`Error adding ${col} (Likely exists):`, e.message);
            }
        }

        // billing_country and gst_number are String
        try {
            await queryInterface.changeColumn(TableName, 'billing_country', { type: db.Sequelize.STRING });
        } catch (e) { }
        try {
            await queryInterface.changeColumn(TableName, 'gst_number', { type: db.Sequelize.STRING });
        } catch (e) { }


    } catch (err) {
        console.error("Critical Error", err);
    } finally {
        process.exit();
    }
}

fix();
