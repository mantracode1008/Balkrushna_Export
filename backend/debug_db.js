const db = require("./models");

db.sequelize.sync().then(async () => {
    try {
        const diamonds = await db.diamonds.findAll({
            limit: 1,
            include: [{ model: db.admins, as: "creator" }]
        });
        console.log("Diamond w/ Creator:", JSON.stringify(diamonds, null, 2));
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        process.exit();
    }
});
