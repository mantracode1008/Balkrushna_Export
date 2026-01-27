module.exports = (sequelize, Sequelize) => {
    const InvoiceItem = sequelize.define("invoice_item", {
        quantity: {
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
        sale_price: {
            type: Sequelize.DECIMAL(10, 2)
        },
        price: { // Cost Price
            type: Sequelize.DECIMAL(10, 2)
        },
        commission: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0
        },
        profit: {
            type: Sequelize.DECIMAL(10, 2)
        },
        rate_per_carat: {
            type: Sequelize.DECIMAL(10, 2),
            comment: 'Selling rate per carat (sale_price / carat)'
        },
        carat_weight: {
            type: Sequelize.DECIMAL(8, 2),
            comment: 'Carat weight stored for quick reference'
        },
        billed_amount: {
            type: Sequelize.DECIMAL(10, 2),
            comment: 'Amount in Client Currency'
        },
        billed_rate: {
            type: Sequelize.DECIMAL(10, 2),
            comment: 'Rate per carat in Client Currency'
        }
    });

    return InvoiceItem;
};
