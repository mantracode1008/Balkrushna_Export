const { verifyToken } = require("../middleware/authJwt");
const controller = require("../controllers/invoice.controller");

module.exports = function (app) {
    var router = require("express").Router();

    router.post("/", [verifyToken], controller.create);
    router.get("/", [verifyToken], controller.findAll);
    router.get("/:id/pdf", [verifyToken], controller.getJwt);
    router.delete("/reset", [verifyToken], controller.deleteAll);
    router.delete("/:id", [verifyToken], controller.delete);

    app.use('/api/invoices', router);
};
