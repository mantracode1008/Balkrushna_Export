const db = require("../models");
const Invoice = db.invoices;
const InvoiceItem = db.invoiceItems;
const Diamond = db.diamonds;
const pdfGenerator = require("../utils/pdfGenerator");
const xlsx = require("xlsx");
const Op = db.Sequelize.Op;
const GST = require("../constants/gst.constants");

// Create Invoice
// Create Invoice
exports.create = async (req, res) => {
    const { items, customerName, client_id, billing_country } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).send({ message: "No items in invoice." });
    }

    const t = await db.sequelize.transaction();

    try {
        // 1. Determine/Create Client and Country for Tax Logic
        let country = billing_country;
        let actualClientId = client_id;

        if (!actualClientId && req.body.clientDetails) {
            const details = req.body.clientDetails;
            const newClient = await db.clients.create({
                name: customerName,
                company_name: details.company_name || '',
                country: details.country || 'India',
                address: details.address || '',
                city: details.city || '',
                contact_number: details.mobile || '', // Form uses mobile
                email: details.email || '',
                currency: req.body.currency || 'USD',
                created_by: req.userId
            }, { transaction: t });
            actualClientId = newClient.id;
            country = newClient.country;
        } else if (actualClientId) {
            const clientData = await db.clients.findByPk(actualClientId, { transaction: t });
            if (clientData) country = clientData.country;
        }

        if (!country) country = 'India'; // Default fallback if nothing provided

        // 2. Financials Setup
        const currency = req.body.currency || 'USD';
        const exRate = parseFloat(req.body.exchange_rate) || 1; // Default 1 if USD

        // Initialize Totals (USD BASE)
        let totalAmountUSD = 0;
        let totalProfitUSD = 0;
        let invoiceItemsData = [];

        for (const item of items) {
            const diamond = await Diamond.findByPk(item.diamondId, { transaction: t });
            if (!diamond) throw new Error(`Diamond ${item.diamondId} not found.`);

            // Checking if already invoiced logic (unchanged)
            const existingInvoiceItem = await InvoiceItem.findOne({ where: { diamondId: diamond.id }, transaction: t });
            if (existingInvoiceItem) {
                // Allow re-invoicing if status is not sold? No, strict check.
                throw new Error(`Diamond ${diamond.certificate} is already invoiced (Invoice #${existingInvoiceItem.invoiceId}).`);
            }

            // Extract values (Assumed USD from Frontend/Diamond)
            const quantity = item.quantity || 1;
            const salePriceUSD = parseFloat(item.salePrice) || 0;
            const commissionUSD = item.commission !== undefined ? parseFloat(item.commission) : (diamond.commission || 0);

            // Cost Calculation
            const basePrice = parseFloat(diamond.price) || 0;
            const discount = parseFloat(diamond.discount) || 0;
            const costPrice = basePrice * (1 - discount / 100);

            // Profit Calculation
            const unitProfit = salePriceUSD - costPrice;
            const totalItemProfit = unitProfit * quantity;
            const totalItemAmount = salePriceUSD * quantity;

            totalAmountUSD += totalItemAmount;
            totalProfitUSD += totalItemProfit;

            // Calculate rate per carat (USD)
            const caratWeight = parseFloat(diamond.carat) || 0;
            const ratePerCaratUSD = caratWeight > 0 ? salePriceUSD / caratWeight : 0;

            // Convert to Client Currency for Locking
            const billedAmount = salePriceUSD * exRate;
            const billedRate = ratePerCaratUSD * exRate;

            invoiceItemsData.push({
                diamondId: diamond.id,
                quantity: quantity,
                sale_price: salePriceUSD, // Keep USD reference
                commission: commissionUSD,
                profit: totalItemProfit,
                rate_per_carat: ratePerCaratUSD,
                carat_weight: caratWeight,
                // New Fields
                billed_amount: parseFloat(billedAmount.toFixed(2)),
                billed_rate: parseFloat(billedRate.toFixed(2))
            });

            // Update Diamond Quantity & Status
            const newQuantity = (diamond.quantity || 1) - quantity;
            const newStatus = newQuantity <= 0 ? 'sold' : 'in_stock';

            await diamond.update({
                quantity: newQuantity,
                status: newStatus,
                sale_price: salePriceUSD,
                buyer_name: customerName,
                sale_date: new Date(),
                sold_by: req.userId
            }, { transaction: t });
        }

        // 3. GST Calculation Logic
        // Subtotal in Client Currency
        const subtotalClient = totalAmountUSD * exRate;

        let cgstRate = 0;
        let sgstRate = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;

        // Apply Tax Rule: Only if Currency is INR (User Rule)
        // Ignoring Country: User stated "otherwise any country select then do not add tax"
        if (req.body.currency === 'INR') {
            cgstRate = GST.CGST_RATE || 0.75;
            sgstRate = GST.SGST_RATE || 0.75;
            cgstAmount = (subtotalClient * cgstRate) / 100;
            sgstAmount = (subtotalClient * sgstRate) / 100;
        }

        const totalGst = cgstAmount + sgstAmount;
        const grandTotalClient = subtotalClient + totalGst;

        // USD Equivalents for dual display
        // Grand Total USD = Grand Total Client / Rate (Approximation for display)
        const grandTotalUSD = grandTotalClient / exRate;

        // Calculate Due Date
        const dueDays = parseInt(req.body.due_days) || 0;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);

        const invoice = await Invoice.create({
            customer_name: customerName,
            client_id: actualClientId,
            total_amount: totalAmountUSD, // Base USD Subtotal (Legacy field name)
            subtotal_usd: totalAmountUSD,
            grand_total_usd: parseFloat(grandTotalUSD.toFixed(2)),

            // Client Currency Fields
            currency: req.body.currency,
            exchange_rate: exRate,
            subtotal_amount: parseFloat(subtotalClient.toFixed(2)),
            cgst_amount: parseFloat(cgstAmount.toFixed(2)),
            sgst_amount: parseFloat(sgstAmount.toFixed(2)),
            grand_total: parseFloat(grandTotalClient.toFixed(2)),

            total_profit: totalProfitUSD,
            invoice_date: new Date(),
            created_by: req.userId,
            payment_status: 'Pending',
            remarks: req.body.remarks || '',

            // Financials & Currency
            currency: currency,
            exchange_rate: exRate,
            final_amount_usd: parseFloat(grandTotalUSD.toFixed(2)), // Final with Tax (USD equiv)
            final_amount_inr: currency === 'INR' ? grandTotalClient : (grandTotalClient * (currency === 'USD' ? (req.body.inr_rate_ref || 85) : 1)), // Logic fallback

            // New Explicit Fields
            billing_country: country,
            subtotal_usd: parseFloat(totalAmountUSD.toFixed(2)),
            grand_total_usd: parseFloat(grandTotalUSD.toFixed(2)),

            // GST Fields (Stored in Client Currency)
            subtotal_amount: parseFloat(subtotalClient.toFixed(2)),
            cgst_rate: cgstRate,
            sgst_rate: sgstRate,
            cgst_amount: parseFloat(cgstAmount.toFixed(2)),
            sgst_amount: parseFloat(sgstAmount.toFixed(2)),
            total_gst: parseFloat(totalGst.toFixed(2)),
            grand_total: parseFloat(grandTotalClient.toFixed(2)),
            gst_number: country.trim().toLowerCase() === 'india' ? GST.COMPANY_GST_NUMBER : 'Not Applicable',

            // Payment Fields
            payment_terms: req.body.payment_terms || 'Custom',
            due_days: dueDays,
            due_date: dueDate,
            paid_amount: 0,
            balance_due: parseFloat(grandTotalClient.toFixed(2)), // In Client Currency
            payment_history: []
        }, { transaction: t });

        for (const itemData of invoiceItemsData) {
            itemData.invoiceId = invoice.id;
            await InvoiceItem.create(itemData, { transaction: t });
        }

        await t.commit();
        res.send({ message: "Invoice created successfully.", invoiceId: invoice.id });

    } catch (err) {
        await t.rollback();
        res.status(500).send({ message: err.message });
    }
};

exports.findAll = (req, res) => {
    const whereCondition = {};

    // RBAC & Filtering
    if (req.userRole === 'admin') {
        // Admin: Optional Filter by Staff
        if (req.query.staffId) {
            whereCondition.created_by = req.query.staffId;
        }
    } else {
        // Staff: Strict restriction to own invoices
        whereCondition.created_by = req.userId;
    }

    Invoice.findAll({
        where: whereCondition,
        include: [
            {
                model: InvoiceItem,
                as: "items",
                include: [{ model: Diamond, as: "diamond" }]
            },
            {
                model: db.admins,
                as: "creator",
                attributes: ['name', 'role']
            }
        ],
        order: [['createdAt', 'DESC']]
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
};

exports.getJwt = (req, res) => {
    const id = req.params.id;
    Invoice.findByPk(id, {
        include: [{
            model: InvoiceItem,
            as: "items",
            include: [{ model: Diamond, as: "diamond" }]
        },
        {
            model: db.clients,
            as: "client"
        }]
    })
        .then(invoice => {
            if (!invoice) return res.status(404).send({ message: "Invoice not found" });
            pdfGenerator.generateInvoicePDF(invoice, invoice.items, res);
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
};

// Delete single invoice
exports.delete = async (req, res) => {
    const id = req.params.id;
    const t = await db.sequelize.transaction();

    try {
        const invoice = await Invoice.findByPk(id, {
            include: [{ model: InvoiceItem, as: "items" }],
            transaction: t
        });

        if (!invoice) {
            await t.rollback();
            return res.status(404).send({ message: "Invoice not found!" });
        }

        // Restore Items to Stock
        for (const item of invoice.items) {
            const diamond = await Diamond.findByPk(item.diamondId, { transaction: t });
            if (diamond) {
                // Restore quantity
                await diamond.update({
                    quantity: diamond.quantity + item.quantity,
                    status: 'in_stock'
                }, { transaction: t });
            }
        }

        // Delete Invoice (Cascade should handle items, but best to be safe)
        await InvoiceItem.destroy({ where: { invoiceId: id }, transaction: t });
        await Invoice.destroy({ where: { id: id }, transaction: t });

        await t.commit();
        res.send({ message: "Invoice deleted and stock restored successfully!" });

    } catch (err) {
        await t.rollback();
        res.status(500).send({
            message: "Could not delete Invoice with id=" + id
        });
    }
};

// Bulk Delete
exports.bulkDelete = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send({ message: "No IDs provided for deletion." });
    }

    const t = await db.sequelize.transaction();

    try {
        const whereCondition = { id: ids };
        if (req.userRole !== 'admin') {
            whereCondition.created_by = req.userId;
        }

        const invoices = await Invoice.findAll({
            where: whereCondition,
            include: [{ model: InvoiceItem, as: "items" }],
            transaction: t
        });

        if (invoices.length === 0) {
            await t.rollback();
            return res.status(404).send({ message: "No matching invoices found for deletion." });
        }

        for (const invoice of invoices) {
            // Restore Items to Stock
            for (const item of invoice.items) {
                const diamond = await Diamond.findByPk(item.diamondId, { transaction: t });
                if (diamond) {
                    await diamond.update({
                        quantity: diamond.quantity + item.quantity,
                        status: 'in_stock'
                    }, { transaction: t });
                }
            }
            // Delete items and invoice
            await InvoiceItem.destroy({ where: { invoiceId: invoice.id }, transaction: t });
            await Invoice.destroy({ where: { id: invoice.id }, transaction: t });
        }

        await t.commit();
        res.send({ message: `${invoices.length} Invoices deleted and stock restored successfully!` });
    } catch (err) {
        await t.rollback();
        console.error("Bulk Delete Error:", err);
        res.status(500).send({ message: err.message || "Could not delete invoices." });
    }
};

// Delete ALL invoices (Reset)
exports.deleteAll = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        // 1. Find all invoices to restore stock (optional but safer for data integrity)
        // For efficiency, we can just update all 'sold' diamonds to 'in_stock'?
        // But some might have been sold manually? 
        // Better: iterate invoice items. If data is huge this is slow, but for this app it's fine.

        // Actually, user said: "remove all pdf reset to 0".
        // This implies a full reset of sales data.

        // Let's restore ALL diamonds that are 'sold' back to 'in_stock'
        // This is a "Reset App" kind of feature.

        await Diamond.update({ status: 'in_stock' }, {
            where: { status: 'sold' }, // Or just all diamonds?
            transaction: t
        });

        // We also need to fix quantities if we tracked specific sale quantities?
        // Diamond model has 'quantity'. If we sold 1 of 2, now we have 1.
        // If we reset, we should probably set quantity back?
        // Just setting status to 'in_stock' might not restore the quantity if it was decremented.
        // It's hard to know original quantity without invoice history.
        // BUT, if we delete invoice items, we can use them to restore.

        const allItems = await InvoiceItem.findAll({ transaction: t });
        for (const item of allItems) {
            await Diamond.increment('quantity', {
                by: item.quantity,
                where: { id: item.diamondId },
                transaction: t
            });
        }

        // 2. Truncate Tables - Use destroy with where for safety in transaction
        await InvoiceItem.destroy({ where: {}, transaction: t });
        await Invoice.destroy({ where: {}, transaction: t });

        await t.commit();
        res.send({ message: "All Invoices deleted and stock restored successfully!" });

    } catch (err) {
        await t.rollback();
        res.status(500).send({
            message: err.message || "Some error occurred while removing all invoices."
        });
    }
};


// EXCEL EXPORT
exports.exportExcel = async (req, res) => {
    try {
        const { id, ids, startDate, endDate, customer, deliveryStatus } = req.body || {};
        // Also support query params for single ID (e.g. GET /:id/excel)
        const paramId = req.params.id;

        const whereCondition = {};

        // 1. Determine Filters
        if (paramId) {
            whereCondition.id = paramId;
        } else if (id) {
            whereCondition.id = id;
        } else if (ids && Array.isArray(ids) && ids.length > 0) {
            whereCondition.id = ids;
        } else {
            // Bulk Filters
            if (startDate) whereCondition.invoice_date = { [Op.gte]: new Date(startDate) };
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (whereCondition.invoice_date) {
                    whereCondition.invoice_date = { ...whereCondition.invoice_date, [Op.lte]: end };
                } else {
                    whereCondition.invoice_date = { [Op.lte]: end };
                }
            }
            if (customer) whereCondition.customer_name = { [Op.like]: `%${customer}%` };
        }

        // RBAC
        if (req.userRole === 'staff') {
            whereCondition.created_by = req.userId;
        }

        // 2. Fetch Data
        const invoices = await Invoice.findAll({
            where: whereCondition,
            include: [{
                model: InvoiceItem,
                as: "items",
                include: [{
                    model: Diamond,
                    as: "diamond",
                    include: [{ model: db.admins, as: "creator", attributes: ['name'] }]
                }]
            },
            {
                model: db.clients,
                as: "client"
            }],
            order: [['invoice_date', 'DESC']]
        });

        if (invoices.length === 0) {
            return res.status(404).send({ message: "No invoices found to export." });
        }

        // 3. Flat Map Data for Excel
        const rows = [];
        invoices.forEach(inv => {
            if (!inv.items) return; // Safety check
            inv.items.forEach(item => {
                const d = item.diamond;

                // GST Calculations per item (Pro-rated)
                const salePrice = parseFloat(item.sale_price) || 0;
                const cgstRate = parseFloat(inv.cgst_rate) || 0;
                const sgstRate = parseFloat(inv.sgst_rate) || 0;
                const itemCgst = salePrice * (cgstRate / 100);
                const itemSgst = salePrice * (sgstRate / 100);
                const itemGrandTotal = salePrice + itemCgst + itemSgst;

                const row = {
                    // Invoice / Sale Details
                    "Invoice ID": inv.id,
                    "Date": new Date(inv.invoice_date).toLocaleDateString(),
                    "Customer": inv.customer_name,
                    "GST No": inv.client ? inv.client.gst_number : '', // Customer GST

                    // Diamond - Identification
                    "Certificate": d ? d.certificate : 'N/A',
                    "Shape": d ? d.shape : '',
                    "Carat": d ? d.carat : 0,

                    // Diamond - Quality
                    "Color": d ? d.color : '',
                    "Clarity": d ? d.clarity : '',
                    "Cut": d ? d.cut : '',
                    "Polish": d ? d.polish : '',
                    "Sym": d ? d.symmetry : '',

                    // Financials
                    "Rate / Carat": item.rate_per_carat || (d && d.carat > 0 ? salePrice / d.carat : 0),
                    "Amount (Subtotal)": salePrice,
                    [`CGST (${cgstRate}%)`]: itemCgst,
                    [`SGST (${sgstRate}%)`]: itemSgst,
                    "Grand Total": itemGrandTotal
                };
                rows.push(row);
            });
        });

        // 4. Generate Excel with Enhanced Formatting
        const wb = xlsx.utils.book_new();

        // For single invoice export, add client metadata header
        const isSingleInvoice = invoices.length === 1;
        let ws;

        if (isSingleInvoice) {
            const inv = invoices[0];
            const client = inv.client;

            // Create metadata rows
            const metadata = [];
            metadata.push(['BALKRISHNA EXPORTS - INVOICE']);
            metadata.push([]);
            metadata.push(['Invoice ID:', inv.id]);
            metadata.push(['Invoice Date:', new Date(inv.invoice_date).toLocaleDateString()]);
            metadata.push(['Customer Name:', inv.customer_name || '']);

            if (client) {
                if (client.company_name) metadata.push(['Company:', client.company_name]);
                if (client.address) metadata.push(['Address:', client.address]);
                if (client.gst_number) metadata.push(['Customer GST:', client.gst_number]);
                if (client.city || client.country) {
                    const location = [client.city, client.country].filter(Boolean).join(', ');
                    metadata.push(['Location:', location]);
                }
            }

            // Add Company GST
            metadata.push(['Company GST:', GST.COMPANY_GST_NUMBER]);

            metadata.push([]);
            metadata.push(['DIAMOND DETAILS']);
            metadata.push([]);

            // Create worksheet from metadata
            ws = xlsx.utils.aoa_to_sheet(metadata);

            // Add data rows starting after metadata
            xlsx.utils.sheet_add_json(ws, rows, { origin: -1, skipHeader: false });

            // Add Totals Footer
            const totalRow = [
                { "Invoice ID": "TOTALS", "Amount (Subtotal)": parseFloat(inv.subtotal_amount || 0), [`CGST (${inv.cgst_rate}%)`]: parseFloat(inv.cgst_amount || 0), [`SGST (${inv.sgst_rate}%)`]: parseFloat(inv.sgst_amount || 0), "Grand Total": parseFloat(inv.grand_total || 0) }
            ];
            // Since columns are dynamic, we need to map totalRow to match columns.
            // Simplified approach: Append calculated totals at end of data.
            const footer = [];
            footer.push([]);
            footer.push(['', '', '', '', '', '', '', '', '', 'Totals:', inv.subtotal_amount, inv.cgst_amount, inv.sgst_amount, inv.grand_total]);
            xlsx.utils.sheet_add_aoa(ws, footer, { origin: -1 });

        } else {
            // For bulk export, just create the sheet with data
            ws = xlsx.utils.json_to_sheet(rows);
        }

        // Intelligent Column Width Calculation
        const colWidths = [];
        const headers = Object.keys(rows[0] || {});

        headers.forEach((header, idx) => {
            // Start with header length
            let maxWidth = header.length;

            // Check all data rows for this column
            rows.forEach(row => {
                const cellValue = row[header];
                const cellLength = cellValue ? String(cellValue).length : 0;
                maxWidth = Math.max(maxWidth, cellLength);
            });

            // Add padding and set min/max constraints
            const width = Math.min(Math.max(maxWidth + 2, 10), 50);
            colWidths.push({ wch: width });
        });

        ws['!cols'] = colWidths;

        xlsx.utils.book_append_sheet(wb, ws, "Sales Data");

        const wbout = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // 5. Send Response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Sales_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
        res.send(wbout);

    } catch (err) {
        console.error("Export Error:", err);
        res.status(500).send({ message: "Export failed: " + err.message });
    }
};

// Update Invoice Status
exports.updateStatus = async (req, res) => {
    const id = req.params.id;
    const { payment_status, remarks } = req.body;

    try {
        const invoice = await Invoice.findByPk(id);
        if (!invoice) {
            return res.status(404).send({ message: "Invoice not found." });
        }

        const updateData = {};
        if (payment_status) {
            updateData.payment_status = payment_status;

            // Auto-update financials based on status change
            // Use grand_total if available, or calculate from Base USD
            const grandClient = parseFloat(invoice.grand_total || 0);
            const baseTotal = parseFloat(invoice.total_amount || 0);
            const rate = parseFloat(invoice.exchange_rate || 85);

            const totalToPay = grandClient > 0
                ? grandClient
                : (invoice.currency === 'INR' ? baseTotal * rate : baseTotal);
            if (payment_status === 'Paid') {
                updateData.paid_amount = totalToPay;
                updateData.balance_due = 0;
                // We keep due_date as record of when it was supposed to be paid
            } else if (payment_status === 'Pending') {
                updateData.paid_amount = 0;
                updateData.balance_due = totalToPay;
            }
        }
        if (remarks !== undefined) updateData.remarks = remarks;

        await invoice.update(updateData);
        res.send({ message: "Invoice status and financials updated successfully." });

    } catch (err) {
        res.status(500).send({ message: "Error updating Invoice with id=" + id });
    }
};

// Add Payment
exports.addPayment = async (req, res) => {
    const id = req.params.id;
    const { amount, date, mode, note } = req.body;

    const t = await db.sequelize.transaction();

    try {
        const invoice = await Invoice.findByPk(id, { transaction: t });
        if (!invoice) {
            await t.rollback();
            return res.status(404).send({ message: "Invoice not found." });
        }

        const paymentAmount = parseFloat(amount) || 0;
        const newPaidAmount = parseFloat(invoice.paid_amount || 0) + paymentAmount;
        // Use grand_total if available, otherwise fall back to total_amount
        const totalAmount = parseFloat(invoice.grand_total || invoice.total_amount);

        let newBalance = totalAmount - newPaidAmount;
        // Float precision safety
        if (newBalance < 0.01 && newBalance > -0.01) newBalance = 0;

        let newStatus = invoice.payment_status;
        if (newBalance <= 0) {
            newStatus = 'Paid';
            newBalance = 0; // Ensure no negative -0.00
        } else if (newBalance < totalAmount) {
            newStatus = 'Partial';
        }

        // Update History
        let history = invoice.payment_history || [];
        // Helper if history is string (legacy safety)
        if (typeof history === 'string') {
            try { history = JSON.parse(history); } catch (e) { history = []; }
        }

        history.push({
            date: date || new Date(),
            amount: paymentAmount,
            mode: mode || 'Cash',
            note: note || ''
        });

        await invoice.update({
            paid_amount: newPaidAmount,
            balance_due: newBalance,
            payment_status: newStatus,
            payment_history: history
        }, { transaction: t });

        await t.commit();
        res.send({ message: "Payment recorded successfully.", newStatus, newBalance, history });

    } catch (err) {
        await t.rollback();
        res.status(500).send({ message: "Error recording payment: " + err.message });
    }
};
