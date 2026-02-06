module.exports = (sequelize, Sequelize) => {
    const Settings = sequelize.define("settings", {
        key: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        value: {
            type: Sequelize.JSON, // Stores the config object
            allowNull: false
        },
        description: {
            type: Sequelize.STRING
        }
    });

    return Settings;
};
