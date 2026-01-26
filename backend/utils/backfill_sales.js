const db = require("../models");
const Diamond = db.diamonds;
const Invoice = db.invoices;
const InvoiceItem = db.invoiceItems;

const backfillSales = async () => {
    try {
        console.log("Starting Sales Data Backfill...");

        // Fetch all SOLD diamonds with missing sold_by or sale_price
        const soldDiamonds = await Diamond.findAll({
            where: {
                status: 'sold'
            },
            include: [{
                model: InvoiceItem,
                as: 'saleItem',
                include: [{
                    model: Invoice,
                    as: 'invoice'
                }]
            }]
        });

        console.log(`Found ${soldDiamonds.length} sold diamonds. Checking for missing data...`);

        let updatedCount = 0;

        for (const diamond of soldDiamonds) {
            let needsUpdate = false;
            const updates = {};

            // 1. Resolve Seller (sold_by)
            // If already set, keep it. If missing, look at Invoice Creator.
            if (!diamond.sold_by) {
                if (diamond.saleItem && diamond.saleItem.invoice && diamond.saleItem.invoice.created_by) {
                    updates.sold_by = diamond.saleItem.invoice.created_by;
                    needsUpdate = true;
                } else if (diamond.created_by) {
                    // Fallback to Creator if no Invoice found (legacy data inconsistency)
                    // updates.sold_by = diamond.created_by;
                    // needsUpdate = true;
                    console.log(`Diamond ${diamond.certificate} has no invoice creator. Skipping sold_by.`);
                }
            }

            // 2. Resolve Sale Price
            // If 0, try to get from Invoice Item or calculate
            if (!diamond.sale_price || parseFloat(diamond.sale_price) === 0) {
                if (diamond.saleItem && diamond.saleItem.price) { // InvoiceItem.price stores the sold rate usually? Or is it cost?
                    // Check Invoice Item definition.
                    // Usually InvoiceItem.price is the rate. InvoiceItem.profit is calculated.
                    // Let's assume InvoiceItem.price is the Selling Price per unit.
                    updates.sale_price = diamond.saleItem.price;
                    needsUpdate = true;
                } else if (diamond.saleItem && diamond.saleItem.invoice && diamond.saleItem.invoice.total_amount) {
                    // Single item invoice?
                    // risky to guess.
                }
            }

            if (needsUpdate) {
                await diamond.update(updates);
                updatedCount++;
                console.log(`Updated Diamond ${diamond.certificate}: Sold By ${updates.sold_by}, Price ${updates.sale_price}`);
            }
        }

        console.log(`Backfill Complete. Updated ${updatedCount} diamonds.`);

    } catch (err) {
        console.error("Backfill Error:", err);
    }
};

// Run
const run = async () => {
    await db.sequelize.sync();
    await backfillSales();
    process.exit();
};

run();
