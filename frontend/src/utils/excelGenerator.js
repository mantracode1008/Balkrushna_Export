import XLSX from 'xlsx-js-style';

/**
 * Generate and Download Excel for Invoices
 * Layout: Detailed Multi-Currency & Tax Compliant
 * @param {Array} invoices - List of invoice objects with nested items
 * @param {String} fileName - Name of the file to download
 */
export const generateInvoiceExcel = (invoices, fileName = 'Invoices_Export') => {
    if (!invoices || invoices.length === 0) {
        alert("No data to export");
        return;
    }

    // Helper: Parse Float
    const parse = (val) => parseFloat(val) || 0;
    const fmt = (val) => parse(val).toFixed(2);

    // --- 1. DATA PREPARATION ---
    const registerData = [];

    invoices.forEach(inv => {
        // Invoice Level Data
        const currency = inv.currency || 'USD';
        const exRate = parse(inv.exchange_rate) || 1;

        // Tax Data (Invoice Level)
        const cgstAmount = parse(inv.cgst_amount);
        const sgstAmount = parse(inv.sgst_amount);

        // Grand Totals
        const grandTotalClient = parse(inv.grand_total || inv.total_amount); // Prioritize Client Currency Total
        const grandTotalUSD = parse(inv.grand_total_usd || (grandTotalClient / exRate));

        // Address construction
        const cAddress = inv.client ?
            [inv.client.address, inv.client.city, inv.client.country].filter(Boolean).join(', ') : '-';

        if (inv.items && inv.items.length > 0) {
            inv.items.forEach((item, idx) => {
                const d = item.diamond || {};

                // Item Financials
                // Client Currency
                const clientRate = parse(item.billed_rate || (item.rate_per_carat * exRate));
                const clientAmount = parse(item.billed_amount || (item.sale_price * exRate));

                // USD Values
                const usdRate = parse(item.rate_per_carat);
                const usdAmount = parse(item.sale_price);

                // Construct Row Object
                registerData.push({
                    "Invoice No": inv.id,
                    "Date": new Date(inv.invoice_date).toLocaleDateString(),
                    "Customer": inv.customer_name,
                    "Currency": currency,
                    "Ex Rate": exRate,

                    // Item Details
                    "Cert ID": d.certificate || '-',
                    "Shape": d.shape || '-',
                    "Carat": parse(d.carat),
                    "Color": d.color || '-',
                    "Clarity": d.clarity || '-',
                    "Poland": d.polish || '-',     // Kept 'Polish' -> 'Poland' typo check? No, 'Polish'
                    "Symm": d.symmetry || '-',

                    // Client Currency Columns (Primary)
                    [`Rate (${currency})`]: clientRate,
                    [`Amount (${currency})`]: clientAmount,

                    // USD Columns (Secondary)
                    "Rate (USD)": usdRate,
                    "Amount (USD)": usdAmount,

                    // Tax (Invoice Level, repeated for context)
                    "CGST": cgstAmount > 0 ? cgstAmount : 0,
                    "SGST": sgstAmount > 0 ? sgstAmount : 0,

                    // Totals
                    [`Grand Total (${currency})`]: grandTotalClient,
                    "Grand Total (USD)": grandTotalUSD,

                    "Address": cAddress
                });
            });
        } else {
            // Fallback for Invoice without items (should be rare)
            registerData.push({
                "Invoice No": inv.id,
                "Date": new Date(inv.invoice_date).toLocaleDateString(),
                "Customer": inv.customer_name,
                "Currency": currency,
                "Ex Rate": exRate,
                "Cert ID": "-",
                // ... Empty Item Fields ...
                [`Grand Total (${currency})`]: grandTotalClient,
                "Grand Total (USD)": grandTotalUSD,
                "Address": cAddress
            });
        }
    });

    // --- 2. STYLING SETUP ---
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(registerData);

    // DEFINE STYLES
    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, name: "Arial", sz: 10 },
        fill: { fgColor: { rgb: "4338CA" } }, // Indigo-700
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    const cellStyle = {
        font: { name: "Arial", sz: 10 },
        alignment: { vertical: "center", horizontal: "center" },
        border: { bottom: { style: "thin", color: { rgb: "E5E7EB" } } }
    };

    // Auto-width logic
    const wscols = Object.keys(registerData[0]).map(k => ({ wch: Math.max(k.length + 2, 12) }));
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Sales Register");
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
