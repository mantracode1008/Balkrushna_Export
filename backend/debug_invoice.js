const db = require("./models");
const Invoice = db.invoices;

async function testCreate() {
    try {
        await db.sequelize.sync();

        const dueDays = 30;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);

        console.log("Creating Test Invoice...");
        console.log("Target Due Date:", dueDate);

        const inv = await Invoice.create({
            customer_name: "Test Client",
            total_amount: 1000.00,
            total_profit: 100.00,
            payment_status: 'Pending',
            payment_terms: 'Net 30',
            due_days: dueDays,
            due_date: dueDate,
            paid_amount: 0,
            balance_due: 1000.00,
            created_by: 1
        });

        console.log("Invoice Created. ID:", inv.id);

        // Fetch it back to verify
        const fetched = await Invoice.findByPk(inv.id);
        console.log("Fetched Invoice:");
        console.log("ID:", fetched.id);
        console.log("Balance Due:", fetched.balance_due);
        console.log("Due Date:", fetched.due_date);

        if (parseFloat(fetched.balance_due) === 1000.00 && fetched.due_date) {
            console.log("SUCCESS: Data persisted correctly.");
        } else {
            console.log("FAILURE: Data missing.");
        }

    } catch (e) {
        console.error(e);
    }
}

testCreate();
