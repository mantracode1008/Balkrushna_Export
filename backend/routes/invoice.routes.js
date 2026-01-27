const { verifyToken } = require("../middleware/authJwt");
const controller = require("../controllers/invoice.controller");

module.exports = function (app) {
    var router = require("express").Router();

    router.post("/", [verifyToken], controller.create);
    router.get("/", [verifyToken], controller.findAll);
    router.get("/:id/pdf", [verifyToken], controller.getJwt);
    router.get("/:id/excel", [verifyToken], controller.exportExcel); // Single Export
    router.post("/export-excel", [verifyToken], controller.exportExcel); // Bulk Export
    router.delete("/reset", [verifyToken], controller.deleteAll);
    router.post("/bulk-delete", [verifyToken], controller.bulkDelete);
    router.put("/:id/status", [verifyToken], controller.updateStatus);
    router.post("/:id/payment", [verifyToken], controller.addPayment);
    router.delete("/:id", [verifyToken], controller.delete);

    app.use('/api/invoices', router);
};
