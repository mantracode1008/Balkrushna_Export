module.exports = (sequelize, Sequelize) => {
    const Admin = sequelize.define("admin", {
        username: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: true // Changed to optional
        },
        password: {
            type: Sequelize.STRING,
            allowNull: true // Changed to optional
        },
        mobile: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false // Main identifier now
        },
        pin: {
            type: Sequelize.STRING,
            allowNull: true // Nullable until set
        },
        otp: {
            type: Sequelize.STRING,
            allowNull: true
        },
        otp_expires: {
            type: Sequelize.DATE,
            allowNull: true
        },
        admin_password: {
            type: Sequelize.STRING,
            allowNull: true
        },
        failed_attempts: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        lock_until: {
            type: Sequelize.DATE,
            allowNull: true
        }
    });

    return Admin;
};
