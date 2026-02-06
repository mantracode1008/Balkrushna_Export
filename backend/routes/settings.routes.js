const { authJwt } = require("../middleware");
const controller = require("../controllers/settings.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get("/api/settings/:key", [authJwt.verifyToken], controller.get);
    app.post("/api/settings/:key", [authJwt.verifyToken, authJwt.isAdmin], controller.update);
};
