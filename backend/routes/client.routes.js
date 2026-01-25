const { verifyToken } = require("../middleware/authJwt");
const clients = require("../controllers/client.controller.js");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post("/api/clients", [verifyToken], clients.create);
    app.get("/api/clients", [verifyToken], clients.findAll);
    app.get("/api/clients/:id", [verifyToken], clients.findOne);
    app.put("/api/clients/:id", [verifyToken], clients.update);
    app.delete("/api/clients/:id", [verifyToken], clients.delete);
};
