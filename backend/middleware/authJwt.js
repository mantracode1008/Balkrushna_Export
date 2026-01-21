const jwt = require("jsonwebtoken");
require('dotenv').config();

verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];
    console.log("Auth Middleware | Headers:", JSON.stringify(req.headers));
    console.log("Auth Middleware | Token:", token);

    if (!token) {
        return res.status(403).send({
            message: "No token provided!"
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || "secret_key_123", (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: "Unauthorized!"
            });
        }
        req.userId = decoded.id;
        next();
    });
};

const authJwt = {
    verifyToken: verifyToken
};
module.exports = authJwt;
