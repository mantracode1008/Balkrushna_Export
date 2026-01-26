module.exports = (sequelize, Sequelize) => {
    const Invoice = sequelize.define("invoice", {
        invoice_date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        customer_name: {
            type: Sequelize.STRING
        },
        total_amount: { // Total Sale Price
            type: Sequelize.DECIMAL(10, 2)
        },
        total_profit: {
            type: Sequelize.DECIMAL(10, 2)
        },
        created_by: {
            type: Sequelize.INTEGER,
            allowNull: true // Should be populated for new invoices
        },
        client_id: {
            type: Sequelize.INTEGER
        },
        currency: {
            type: Sequelize.STRING
        },
        exchange_rate: {
            type: Sequelize.DECIMAL(10, 2)
        },
        commission_total_usd: {
            type: Sequelize.DECIMAL(10, 2)
        },
        commission_total_inr: {
            type: Sequelize.DECIMAL(10, 2)
        },
        final_amount_usd: {
            type: Sequelize.DECIMAL(10, 2)
        },
        final_amount_inr: {
            type: Sequelize.DECIMAL(10, 2)
        },
        payment_status: {
            type: Sequelize.ENUM('Pending', 'Paid', 'Partial', 'Overdue', 'Cancelled'),
            defaultValue: 'Pending'
        },
        remarks: {
            type: Sequelize.TEXT
        },
        payment_terms: {
            type: Sequelize.STRING
        },
        due_days: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        due_date: {
            type: Sequelize.DATE
        },
        paid_amount: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0
        },
        balance_due: {
            type: Sequelize.DECIMAL(10, 2)
        },
        payment_history: {
            type: Sequelize.JSON // [{ date, amount, mode, note }]
        }
    });

    return Invoice;
};
