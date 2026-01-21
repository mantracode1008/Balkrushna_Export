require('dotenv').config();
const db = require('./models');
const Diamond = db.diamonds;

async function testDiamondFlow() {
    const testCert = "TEST_" + Date.now();
    console.log(`Starting Test for Cert: ${testCert}`);

    try {
        // 1. Create with Buyer Details
        const newDiamond = {
            certificate: testCert,
            price: 1000,
            status: 'in_stock',
            buyer_name: "Test Buyer",
            buyer_mobile: "1234567890",
            buyer_country: "Testland",
            sale_price: 0
        };

        const created = await Diamond.create(newDiamond);
        console.log("1. Created Diamond ID:", created.id);
        console.log("   Buyer Name Saved:", created.buyer_name);

        if (created.buyer_name !== "Test Buyer") {
            console.error("FAIL: Buyer Name was NOT saved.");
        } else {
            console.log("PASS: Buyer Name saved.");
        }

        // 2. Fetch to confirm persistence
        const fetched = await Diamond.findByPk(created.id);
        console.log("2. Fetched Status:", fetched.status);
        if (fetched.buyer_name !== "Test Buyer") console.error("FAIL: Fetched data missing buyer_name");

        // 3. Update DETAILS only (simulating edit without sale)
        // Note: Frontend sends whole object usually, but let's test partial update first
        console.log("3. Updating Shape (leaving status undefined in payload)...");
        await Diamond.update({ shape: 'OVAL' }, { where: { id: created.id } });

        const afterUpdate1 = await Diamond.findByPk(created.id);
        console.log("   Status after update:", afterUpdate1.status);
        if (afterUpdate1.status !== 'in_stock') {
            console.error("FAIL: Status changed unexpectedly!");
        } else {
            console.log("PASS: Status remained in_stock");
        }

        // 4. Update with explicit status same as before
        console.log("4. Updating with status='in_stock'...");
        await Diamond.update({ status: 'in_stock' }, { where: { id: created.id } });
        const afterUpdate2 = await Diamond.findByPk(created.id);
        console.log("   Status:", afterUpdate2.status);

        // 5. Update Sale Price (Simulation of sale)
        console.log("5. Updating Sale Price to 1500...");
        // Frontend logic might be: if sale_price > 0, set status = 'sold'
        // Let's see if backend auto-updates status? (It shouldn't unless coded)
        await Diamond.update({ sale_price: 1500 }, { where: { id: created.id } });
        const afterUpdate3 = await Diamond.findByPk(created.id);
        console.log("   Status after sale_price update:", afterUpdate3.status);
        console.log("   Sale Price:", afterUpdate3.sale_price);

        // Cleanup
        await Diamond.destroy({ where: { id: created.id } });
        console.log("Details Verified. Cleanup Done.");

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

testDiamondFlow();
