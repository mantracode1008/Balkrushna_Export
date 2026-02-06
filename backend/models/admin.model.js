module.exports = (sequelize, Sequelize) => {
    const Admin = sequelize.define("admin", {
        username: {
            type: Sequelize.STRING,
            // unique: true,
            allowNull: true // Changed to optional
        },
        name: {
            type: Sequelize.STRING,
            allowNull: true
        },
        role: {
            type: Sequelize.ENUM('admin', 'staff'),
            defaultValue: 'admin'
        },
        password: {
            type: Sequelize.STRING,
            allowNull: true // Changed to optional
        },
        mobile: {
            type: Sequelize.STRING,
            // unique: true,
            allowNull: true // Changed to optional for Admin, required for Staff logic handled in controller/validation
        },
        address: {
            type: Sequelize.STRING,
            allowNull: true
        },
        staff_id: {
            type: Sequelize.STRING,
            // unique: true, // Unique Staff ID
            allowNull: true
        },
        email: {
            type: Sequelize.STRING,
            // unique: true,
            allowNull: true // Optional for Staff, Required for Admin
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
        },
        permissions: {
            type: Sequelize.JSON,
            defaultValue: {}
        }
    }, {
        paranoid: true // Enable Soft Deletes
    });

    return Admin;
};
