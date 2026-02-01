const { verifyToken } = require("../middleware/authJwt");
const controller = require("../controllers/report.controller");

module.exports = function (app) {
    const router = require("express").Router();

    // Existing Dashboard & General Reports
    router.get("/dashboard", [verifyToken], controller.getDashboardStats);
    router.get("/reports", [verifyToken], controller.getReports);
    router.get("/top-selling", [verifyToken], controller.getTopSellingItems);
    router.get("/buying", [verifyToken], controller.getBuyingStats);

    // ========================================
    // SECTION-WISE INVOICE REPORTS
    // ========================================
    router.get("/invoices/by-company", [verifyToken], controller.invoicesByCompany);
    router.get("/invoices/by-buyer", [verifyToken], controller.invoicesByBuyer);
    router.get("/invoices/by-staff", [verifyToken], controller.invoicesByStaff);
    router.get("/invoices/by-date", [verifyToken], controller.invoicesByDate);
    router.get("/invoices/by-currency", [verifyToken], controller.invoicesByCurrency);
    router.get("/invoices/by-gst", [verifyToken], controller.invoicesByGST);

    // ========================================
    // SECTION-WISE SELLER REPORTS
    // ========================================
    router.get("/sellers/purchases", [verifyToken], controller.sellerPurchases);
    router.get("/sellers/payments", [verifyToken], controller.sellerPayments);
    router.get("/sellers/overdue", [verifyToken], controller.overdueSellerPayments);
    router.get("/sellers/buyer-sales", [verifyToken], controller.getSellerBuyerSales);
    router.get("/reports/sellers/grid", [verifyToken], controller.getSellerGridReport);

    app.use('/api', router);
};
