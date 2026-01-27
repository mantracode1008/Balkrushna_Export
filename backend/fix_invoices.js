const db = require("./models");
const Invoice = db.invoices;
const Op = db.Sequelize.Op;

async function fixInvoices() {
    try {
        await db.sequelize.sync();
        const invoices = await Invoice.findAll();

        console.log(`Found ${invoices.length} invoices to check.`);

        for (const inv of invoices) {
            let updates = {};
            let needsUpdate = false;

            // 1. Fix Balance Due
            const total = parseFloat(inv.total_amount || 0);
            const paid = parseFloat(inv.paid_amount || 0);
            const currentBalance = parseFloat(inv.balance_due);

            const calculatedBalance = total - paid;

            // If balance is null, or it's 0 but shouldn't be (Pending/Partial)
            if (inv.balance_due === null || (currentBalance === 0 && inv.payment_status !== 'Paid' && calculatedBalance > 0)) {
                updates.balance_due = calculatedBalance;
                needsUpdate = true;
                console.log(`Invoice #${inv.id}: Fixing Balance Due to ${calculatedBalance} (was ${inv.balance_due})`);
            }

            // 2. Fix Due Date
            if (!inv.due_date) {
                // Default to created date + due_days (or 0)
                const created = new Date(inv.createdAt);
                const days = inv.due_days || 0;
                created.setDate(created.getDate() + days);

                updates.due_date = created;
                needsUpdate = true;
                console.log(`Invoice #${inv.id}: Fixing Due Date to ${created.toISOString()}`);
            }

            if (needsUpdate) {
                await inv.update(updates);
            }
        }
        console.log("Fix complete.");

    } catch (e) {
        console.error(e);
    }
}

fixInvoices();
