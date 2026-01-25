const xlsx = require("xlsx");
const fs = require('fs');

try {
    const rows = [
        { "ID": 1, "Name": "Test" }
    ];

    console.log("Creating Workbook...");
    const wb = xlsx.utils.book_new();

    console.log("Creating Worksheet...");
    const ws = xlsx.utils.json_to_sheet(rows);

    console.log("Appending Sheet...");
    xlsx.utils.book_append_sheet(wb, ws, "Sales Data");

    console.log("Writing Buffer...");
    const wbout = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

    console.log("Success! Buffer length:", wbout.length);

} catch (err) {
    console.error("XLSX Error:", err);
}
