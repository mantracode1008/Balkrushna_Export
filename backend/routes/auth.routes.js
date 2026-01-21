const { verifyToken } = require("../middleware/authJwt");
const controller = require("../controllers/auth.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    // app.post("/api/auth/login", controller.signin); // Removed
    // app.post("/api/auth/otp/request", controller.requestOtp);
    // app.post("/api/auth/otp/verify", controller.verifyOtp);
    // app.post("/api/auth/pin/set", controller.setPin);

    // New PIN System
    app.post("/api/auth/verify-pin", controller.verifyPin);
    app.post("/api/auth/admin-unlock", controller.adminUnlock);
    app.post("/api/auth/reset-pin", controller.resetPin);
};
