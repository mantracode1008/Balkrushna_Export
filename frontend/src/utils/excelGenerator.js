import * as XLSX from 'xlsx';

/**
 * Generate and Download Excel for Invoices
 * @param {Array} invoices - List of invoice objects with nested items
 * @param {String} fileName - Name of the file to download
 */
export const generateInvoiceExcel = (invoices, fileName = 'Invoices_Export') => {
    if (!invoices || invoices.length === 0) {
        alert("No data to export");
        return;
    }

    // 1. Summary Sheet Data
    const summaryData = invoices.map(inv => ({
        "Invoice #": inv.id,
        "Date": new Date(inv.invoice_date).toLocaleDateString(),
        "Client": inv.customer_name,
        "Total Amount": parseFloat(inv.total_amount || 0),
        "Total Profit": parseFloat(inv.total_profit || 0),
        "Currency": inv.currency || 'USD',
        "Payment Status": inv.payment_status || 'Pending',
        "Remarks": inv.remarks || '',
        "Bill To": inv.client ? `${inv.client.address}, ${inv.client.city}, ${inv.client.country}` : '-'
    }));

    // 2. Detailed Sheet Data
    const detailedData = [];
    invoices.forEach(inv => {
        if (inv.items) {
            inv.items.forEach(item => {
                const d = item.diamond;
                detailedData.push({
                    "Invoice #": inv.id,
                    "Date": new Date(inv.invoice_date).toLocaleDateString(),
                    "Client": inv.customer_name,

                    // Diamond Details
                    "Certificate": d ? d.certificate : 'N/A',
                    "Shape": d ? d.shape : '',
                    "Carat": d ? parseFloat(d.carat) : 0,
                    "Color": d ? d.color : '',
                    "Clarity": d ? d.clarity : '',
                    "Cut": d ? d.cut : '',
                    "Polish": d ? d.polish : '',
                    "Sym": d ? d.symmetry : '',
                    "Fluor": d ? d.fluorescence : '',

                    // Financials
                    "Sale Price": parseFloat(item.sale_price || 0),
                    "Cost Price": d ? parseFloat(d.price * (1 - (d.discount || 0) / 100)) : 0,
                    "Profit": parseFloat(item.profit || 0),
                    "Commission": parseFloat(item.commission || 0),

                    // Logistics
                    "Location": d ? d.buyer_country : '-',
                    "Sold To": d ? d.seller_country : '-'
                });
            });
        }
    });

    // 3. Create Workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    // Auto-width
    const wscolsSummary = Object.keys(summaryData[0] || {}).map(k => ({ wch: 20 }));
    wsSummary['!cols'] = wscolsSummary;
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Details Sheet
    if (detailedData.length > 0) {
        const wsDetails = XLSX.utils.json_to_sheet(detailedData);
        const wscolsDetails = Object.keys(detailedData[0] || {}).map(k => ({ wch: 15 }));
        wsDetails['!cols'] = wscolsDetails;
        XLSX.utils.book_append_sheet(wb, wsDetails, "Item Details");
    }

    // 4. Download
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
