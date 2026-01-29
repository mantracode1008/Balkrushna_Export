const { verifyToken } = require("../middleware/authJwt");
const payments = require("../controllers/sellerPayment.controller.js");

module.exports = app => {
    var router = require("express").Router();

    router.post("/", [verifyToken], payments.create);
    router.get("/", [verifyToken], payments.findAll);
    router.get("/unpaid", [verifyToken], payments.getUnpaidDiamonds);

    app.use('/api/seller-payments', router);
};
