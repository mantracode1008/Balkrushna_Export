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
        }
    });

    return InvoiceItem;
};
