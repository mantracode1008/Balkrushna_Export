module.exports = (sequelize, Sequelize) => {
    const SellerPayment = sequelize.define("seller_payment", {
        seller_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        payment_date: {
            type: Sequelize.DATEONLY,
            defaultValue: Sequelize.NOW
        },
        payment_mode: {
            type: Sequelize.STRING // Cash, Cheque, Bank Transfer, etc.
        },
        reference_number: {
            type: Sequelize.STRING
        },
        notes: {
            type: Sequelize.TEXT
        },
        created_by: {
            type: Sequelize.INTEGER
        }
    });

    return SellerPayment;
};
