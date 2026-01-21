const { verifyToken } = require("../middleware/authJwt");
const controller = require("../controllers/report.controller");

module.exports = function (app) {
    const router = require("express").Router();

    router.get("/dashboard", [verifyToken], controller.getDashboardStats);
    router.get("/reports", [verifyToken], controller.getReports);
    router.get("/top-selling", [verifyToken], controller.getTopSellingItems);
    router.get("/buying", [verifyToken], controller.getBuyingStats);

    app.use('/api', router);
};
