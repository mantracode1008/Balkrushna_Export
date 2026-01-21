const db = require("./models");
const Diamond = db.diamonds;

async function checkDiamonds() {
    try {
        const diamonds = await Diamond.findAll();
        console.log("Found " + diamonds.length + " diamonds.");
        diamonds.forEach(d => {
            console.log(`ID: ${d.id}, Cert: ${d.certificate}, Qty: ${d.quantity}, Price: ${d.price}, Status: ${d.status}`);
            console.log(`Type of Price: ${typeof d.price}`);
        });
    } catch (err) {
        console.error("Error:", err);
    }
}

checkDiamonds();
