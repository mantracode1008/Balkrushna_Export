module.exports = (sequelize, Sequelize) => {
    const ParameterDiscount = sequelize.define("ParameterDiscount_Tbl", {
        F_Carat: {
            type: Sequelize.DECIMAL(10, 3),
            allowNull: false,
            primaryKey: true
        },
        T_Carat: {
            type: Sequelize.DECIMAL(10, 3),
            allowNull: false,
            primaryKey: true
        },
        S_Code: {
            type: Sequelize.STRING(5),
            allowNull: false,
            primaryKey: true
        },
        C_Code: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            primaryKey: true
        },
        RapDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            primaryKey: true
        },
        Parameter_Id: {
            type: Sequelize.STRING(50),
            allowNull: false,
            primaryKey: true
        },
        Parameter_Number: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        Parameter_Value: {
            type: Sequelize.STRING(15),
            allowNull: false,
            primaryKey: true
        },
        // Q1 to Q15
        Q1: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q2: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q3: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q4: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q5: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q6: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q7: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q8: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q9: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q10: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q11: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q12: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q13: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q14: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 },
        Q15: { type: Sequelize.DECIMAL(10, 4), defaultValue: 0 }
    }, {
        tableName: 'ParameterDiscount_Tbl',
        timestamps: false
    });

    return ParameterDiscount;
};
