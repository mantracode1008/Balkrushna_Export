const { verifyToken } = require("../middleware/authJwt");
const controller = require("../controllers/pricing.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post("/api/pricing/calculate", [verifyToken], controller.calculate);
    app.post("/api/pricing/calculate-rap", [verifyToken], controller.calculateRapPrice);
};
