module.exports = (sequelize, Sequelize) => {
    const RapRate = sequelize.define("OrigionalRapRate_Live_Tbl", {
        F_Carat: {
            type: Sequelize.DECIMAL(10, 3),
            primaryKey: true
        },
        T_Carat: {
            type: Sequelize.DECIMAL(10, 3),
            primaryKey: true
        },
        S_Code: {
            type: Sequelize.STRING(5),
            primaryKey: true
        },
        C_Code: {
            type: Sequelize.SMALLINT,
            primaryKey: true
        },
        RapDate: {
            type: Sequelize.DATEONLY,
            primaryKey: true
        },
        Parameter_Value: {
            type: Sequelize.STRING(15),
            primaryKey: true
        },
        Q1: { type: Sequelize.DECIMAL(10, 2) },
        Q2: { type: Sequelize.DECIMAL(10, 2) },
        Q3: { type: Sequelize.DECIMAL(10, 2) },
        Q4: { type: Sequelize.DECIMAL(10, 2) },
        Q5: { type: Sequelize.DECIMAL(10, 2) },
        Q6: { type: Sequelize.DECIMAL(10, 2) },
        Q7: { type: Sequelize.DECIMAL(10, 2) },
        Q8: { type: Sequelize.DECIMAL(10, 2) },
        Q9: { type: Sequelize.DECIMAL(10, 2) },
        Q10: { type: Sequelize.DECIMAL(10, 2) },
        Q11: { type: Sequelize.DECIMAL(10, 2) },
        Q12: { type: Sequelize.DECIMAL(10, 2) },
        Q13: { type: Sequelize.DECIMAL(10, 2) },
        Q14: { type: Sequelize.DECIMAL(10, 2) },
        Q15: { type: Sequelize.DECIMAL(10, 2) }
    }, {
        tableName: 'OrigionalRapRate_Live_Tbl',
        timestamps: false
    });

    return RapRate;
};
