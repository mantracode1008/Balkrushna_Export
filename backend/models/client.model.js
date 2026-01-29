module.exports = (sequelize, Sequelize) => {
    const Client = sequelize.define("client", {
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        company_name: {
            type: Sequelize.STRING
        },
        country: {
            type: Sequelize.STRING,
            allowNull: false
        },
        address: {
            type: Sequelize.TEXT
        },
        city: {
            type: Sequelize.STRING
        },
        contact_number: {
            type: Sequelize.STRING,
            allowNull: true
        },
        email: {
            type: Sequelize.STRING
        },
        currency: {
            type: Sequelize.STRING,
            defaultValue: 'USD'
        },
        remarks: {
            type: Sequelize.TEXT
        },
        created_by: {
            type: Sequelize.INTEGER
        },
        gst_number: {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Customer GST registration number (optional)'
        }
    });

    return Client;
};
