const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: false,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.admins = require("./admin.model.js")(sequelize, Sequelize);
db.diamonds = require("./diamond.model.js")(sequelize, Sequelize);
db.invoices = require("./invoice.model.js")(sequelize, Sequelize);
db.invoiceItems = require("./invoiceItem.model.js")(sequelize, Sequelize);
db.parameterDateMaster = require("./parameterDateMaster.model.js")(sequelize, Sequelize);
db.origionalRapRate = require("./origionalRapRate.model.js")(sequelize, Sequelize);
db.parameterDiscount = require("./parameterDiscount.model.js")(sequelize, Sequelize);

// Associations
db.invoices.hasMany(db.invoiceItems, { as: "items" });
db.invoiceItems.belongsTo(db.invoices, {
    foreignKey: "invoiceId",
    as: "invoice",
});

db.diamonds.hasOne(db.invoiceItems, { as: "saleItem" });
db.invoiceItems.belongsTo(db.diamonds, {
    foreignKey: "diamondId",
    as: "diamond",
});

module.exports = db;
