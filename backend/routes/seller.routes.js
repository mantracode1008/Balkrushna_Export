const { verifyToken } = require("../middleware/authJwt");
const sellers = require("../controllers/seller.controller.js");

module.exports = app => {
    var router = require("express").Router();

    router.post("/", [verifyToken], sellers.create);
    router.get("/", [verifyToken], sellers.findAll);
    router.get("/overdue", [verifyToken], sellers.getOverdueSellers); // Specific route BEFORE param route
    router.get("/:id", [verifyToken], sellers.findOne);
    router.put("/:id", [verifyToken], sellers.update);
    router.delete("/:id", [verifyToken], sellers.delete);

    app.use('/api/sellers', router);
};
