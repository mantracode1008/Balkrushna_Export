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

    // New PIN System (Legacy/Unlock)
    app.post("/api/auth/verify-pin", controller.verifyPin); // Can keep for backward compatibility or remove if fully switching
    app.post("/api/auth/admin-unlock", controller.adminUnlock);
    app.post("/api/auth/reset-pin", controller.resetPin);

    // New Split Auth
    app.post("/api/auth/admin/login", controller.loginAdmin);
    app.post("/api/auth/staff/login", controller.loginStaff);

    // Staff Management (Admin Only)
    app.post("/api/auth/staff", [verifyToken], controller.createStaff);
    app.get("/api/auth/staff", [verifyToken], controller.getAllStaff);
    app.delete("/api/auth/staff/:id", [verifyToken], controller.deleteStaff);
};
