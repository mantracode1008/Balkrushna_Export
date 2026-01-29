module.exports = (sequelize, Sequelize) => {
    const Seller = sequelize.define("seller", {
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        company: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        mobile: {
            type: Sequelize.STRING
        },
        address: {
            type: Sequelize.TEXT
        },
        gst_no: {
            type: Sequelize.STRING
        },
        created_by: {
            type: Sequelize.INTEGER
        }
    });

    return Seller;
};
