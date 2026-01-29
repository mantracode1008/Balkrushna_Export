module.exports = (sequelize, Sequelize) => {
    const SellerPaymentAllocation = sequelize.define("seller_payment_allocation", {
        payment_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        diamond_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        allocated_amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        }
    });

    return SellerPaymentAllocation;
};
