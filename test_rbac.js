const Sequelize = require("sequelize");
const db = require("./backend/models");
const controller = require("./backend/controllers/diamond.controller");

// Mock Response
const mockRes = {
    send: (data) => console.log("Response Data:", JSON.stringify(data, null, 2)),
    json: (data) => console.log("Response JSON:", JSON.stringify(data, null, 2)),
    status: (code) => ({
        send: (msg) => console.log(`Status ${code}:`, msg)
    })
};

// Mock Request Helpers
const mockReqAdmin = {
    userRole: 'admin',
    userId: 1,
    query: { status: 'in_stock' }
};

const mockReqStaff = {
    userRole: 'staff',
    userId: 2, // Assuming user 2 is a staff member
    query: { status: 'in_stock' }
};

// Helper to run query
async function test() {
    try {
        await db.sequelize.authenticate();
        console.log("Database connected.");

        console.log("\n--- Testing Admin findAll ---");
        // We need to temporarily properly mock findAll to use the db model
        // but since we are identifying logic, we can just run the controller function if the db is connected.
        // However, we need to ensure the DB has data.

        await controller.findAll(mockReqAdmin, mockRes);

        console.log("\n--- Testing Staff findAll ---");
        await controller.findAll(mockReqStaff, mockRes);

        console.log("\n--- Testing Admin getSummary ---");
        await controller.getSummary(mockReqAdmin, mockRes);

        console.log("\n--- Testing Staff getSummary ---");
        await controller.getSummary(mockReqStaff, mockRes);

    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        // await db.sequelize.close(); // Keep open if needed or close
        process.exit();
    }
}

test();
