const db = require("./models");
const Diamond = db.diamonds;

const run = async () => {
    try {
        await db.sequelize.sync();

        const diamonds = [
            {
                certificate: "761565740",
                price: 1000.00,
                quantity: 2,
                status: "in_stock",
                shape: "ROUND",
                carat: 1.5,
                color: "D",
                clarity: "VS1",
                cut: "EX",
                lab: "GIA",
                report_file: "761565740.pdf"
            },
            {
                certificate: "760509626",
                price: 5000.00,
                quantity: 1,
                status: "in_stock",
                shape: "OVAL",
                carat: 2.0,
                color: "E",
                clarity: "VVS2",
                cut: "VG",
                lab: "IGI"
            }
        ];

        for (const data of diamonds) {
            const exists = await Diamond.findOne({ where: { certificate: data.certificate } });
            if (!exists) {
                await Diamond.create(data);
                console.log(`Created diamond ${data.certificate}`);
            } else {
                console.log(`Diamond ${data.certificate} already exists`);
            }
        }
    } catch (error) {
        console.error("Error adding test data:", error);
    } finally {
        process.exit();
    }
};

run();
