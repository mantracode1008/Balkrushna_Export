module.exports = (sequelize, Sequelize) => {
    const ParameterDateMaster = sequelize.define("ParameterDateMaster_Tbl", {
        RapDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            primaryKey: true
        },
        Parameter_Id: {
            type: Sequelize.STRING(50),
            allowNull: false,
            primaryKey: true,
            defaultValue: ''
        },
        Parameter_Number: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        Remark: {
            type: Sequelize.STRING(1000),
            defaultValue: ''
        }
    }, {
        tableName: 'ParameterDateMaster_Tbl',
        timestamps: false
    });

    return ParameterDateMaster;
};
