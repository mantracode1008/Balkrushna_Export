const { verifyToken } = require("../middleware/authJwt");
const controller = require("../controllers/diamond.controller");
const upload = require("../middleware/upload");

module.exports = function (app) {
    var router = require("express").Router();

    // Create a new Diamond
    router.post("/", [verifyToken], controller.create);

    // Fetch Unique Buyers
    router.get("/buyers", [verifyToken], controller.getBuyers);

    // Fetch Unique Companies
    router.get("/companies", [verifyToken], controller.getCompanies);

    // Fetch Unique Locations
    router.get("/locations", [verifyToken], controller.getLocations);

    // Fetch External
    router.get("/fetch/:certNo", [verifyToken], controller.fetchExternal);

    // Check Status (Sold/In Stock)
    router.get("/check-status/:certificate", [verifyToken], controller.checkStatus);

    // Inventory Summary (Must be before dynamic :id routes or root retrieval if specific path needed)
    router.get("/summary", [verifyToken], controller.getSummary);

    // Retrieve all Diamonds
    router.get("/", [verifyToken], controller.findAll);

    // Retrieve a single Diamond with id
    router.get("/:id", [verifyToken], controller.findOne);

    // Update a Diamond with id
    router.put("/:id", [verifyToken], controller.update);

    // Delete a Diamond with id
    router.delete("/bulk", [verifyToken], (req, res) => {
        // ... bulk delete logic if implemented in controller or here
        // If mapped to controller:
        controller.bulkDelete(req, res);
    });

    router.patch("/:id/status", [verifyToken], controller.updateStatus);

    router.delete("/:id", [verifyToken], controller.delete);


    // Bulk Delete
    router.post("/bulk-delete", [verifyToken], controller.bulkDelete);

    // Import Preview
    router.post("/import-preview", [verifyToken, (req, res, next) => {
        upload.single("file")(req, res, function (err) {
            if (err) {
                console.error("Multer Upload Error:", err);
                // Return 400 for upload errors
                return res.status(400).send({ message: typeof err === 'string' ? err : err.message });
            }
            next();
        });
    }], controller.previewImport);

    // Bulk Create (Confirm Import)
    router.post("/bulk-create", [verifyToken], controller.bulkCreate);

    // Bulk Update Status
    router.post("/bulk-status", [verifyToken], controller.bulkUpdateStatus);

    // Bulk Sell (Stock -> Client)
    router.post("/bulk-sell", [verifyToken], controller.bulkSell);


    app.use('/api/diamonds', router);
};
