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
        }
    });

    return Invoice;
};
