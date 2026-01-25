module.exports = (sequelize, Sequelize) => {
    const Company = sequelize.define("company", {
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        created_by: {
            type: Sequelize.INTEGER
        }
    });

    return Company;
};
