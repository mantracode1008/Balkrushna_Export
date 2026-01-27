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
        },
        // GST Fields
        subtotal_amount: {
            type: Sequelize.DECIMAL(10, 2),
            comment: 'Diamond amount before GST'
        },
        cgst_rate: {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 0.75,
            comment: 'CGST percentage'
        },
        sgst_rate: {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 0.75,
            comment: 'SGST percentage'
        },
        cgst_amount: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0,
            comment: 'Calculated CGST amount'
        },
        sgst_amount: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0,
            comment: 'Calculated SGST amount'
        },
        total_gst: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0,
            comment: 'Total GST (CGST + SGST)'
        },
        grand_total: {
            type: Sequelize.DECIMAL(10, 2),
            comment: 'Final amount including GST'
        },
        gst_number: {
            type: Sequelize.STRING,
            comment: 'Company GST number for this invoice'
        },
        billing_country: {
            type: Sequelize.STRING,
            comment: 'Country of the customer at time of billing'
        },
        subtotal_usd: {
            type: Sequelize.DECIMAL(10, 2),
            comment: 'Subtotal in USD for reference'
        },
        grand_total_usd: {
            type: Sequelize.DECIMAL(10, 2),
            comment: 'Grand Total in USD for reference'
        }
    });

    return Invoice;
};
