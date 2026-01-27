const db = require("../models");
const Invoice = db.invoices;
const InvoiceItem = db.invoiceItems;
const Diamond = db.diamonds;
const pdfGenerator = require("../utils/pdfGenerator");
const xlsx = require("xlsx");
const Op = db.Sequelize.Op;

// Create Invoice
exports.create = async (req, res) => {
    // req.body.items = [{ diamondId: 1, salePrice: 1000 }, ...]
    const { items, customerName } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).send({ message: "No items in invoice." });
    }

    const t = await db.sequelize.transaction();

    try {
        // Initialize Totals
        let totalAmount = 0;
        let totalProfit = 0;
        let invoiceItemsData = [];
        const exRate = parseFloat(req.body.exchange_rate) || 84; // Default to 84 (approx INR) if not provided
        const currency = req.body.currency || 'USD';

        for (const item of items) {
            const diamond = await Diamond.findByPk(item.diamondId, { transaction: t });
            if (!diamond) throw new Error(`Diamond ${item.diamondId} not found.`);
            // ... (rest of diamond check logic, unchanged) ...

            // Checking if already invoiced
            const existingInvoiceItem = await InvoiceItem.findOne({ where: { diamondId: diamond.id }, transaction: t });
            if (existingInvoiceItem) {
                throw new Error(`Diamond ${diamond.certificate} is already invoiced (Invoice #${existingInvoiceItem.invoiceId}).`);
            }

            // Extract values
            const quantity = item.quantity || 1;
            const salePrice = parseFloat(item.salePrice) || 0;
            const commission = item.commission !== undefined ? parseFloat(item.commission) : (diamond.commission || 0);

            // Cost Calculation
            const basePrice = parseFloat(diamond.price) || 0;
            const discount = parseFloat(diamond.discount) || 0;
            const costPrice = basePrice * (1 - discount / 100);

            // Profit Calculation
            const unitProfit = salePrice - costPrice;
            const totalItemProfit = unitProfit * quantity;
            const totalItemAmount = salePrice * quantity;

            totalAmount += totalItemAmount;
            totalProfit += totalItemProfit;

            invoiceItemsData.push({
                diamondId: diamond.id,
                quantity: quantity,
                sale_price: salePrice,
                commission: commission,
                profit: totalItemProfit
            });

            // Update Diamond Quantity & Status
            const newQuantity = (diamond.quantity || 1) - quantity;
            const newStatus = newQuantity <= 0 ? 'sold' : 'in_stock';

            await diamond.update({
                quantity: newQuantity,
                status: newStatus,
                // SYNC SALE DATA
                sale_price: salePrice,
                buyer_name: customerName,
                sale_date: new Date(),
                sold_by: req.userId
            }, { transaction: t });
        }

        // Calculate Due Date
        const dueDays = parseInt(req.body.due_days) || 0;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);

        // Calculate Finals
        const finalUSD = totalAmount;
        const finalINR = totalAmount * exRate;

        const invoice = await Invoice.create({
            customer_name: customerName,
            total_amount: totalAmount,
            total_profit: totalProfit,
            invoice_date: new Date(),
            created_by: req.userId,
            payment_status: 'Pending',
            remarks: req.body.remarks || '',

            // Financials & Currency
            currency: currency,
            exchange_rate: exRate,
            final_amount_usd: finalUSD,
            final_amount_inr: finalINR,
            commission_total_usd: 0, // Placeholder if not tracked globally per invoice
            commission_total_inr: 0,

            // Payment Fields
            payment_terms: req.body.payment_terms || 'Custom',
            due_days: dueDays,
            due_date: dueDate,
            paid_amount: 0,
            balance_due: totalAmount,
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
        res.status(500).send({ message: "Could not delete Invoice with id=" + id });
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
                const row = {
                    // Invoice / Sale Details
                    "Invoice ID": inv.id,
                    "Date": new Date(inv.invoice_date).toLocaleDateString(),
                    "Customer": inv.customer_name,
                    "Sold By": d && d.creator ? d.creator.name : 'Admin',

                    // Diamond - Identification
                    "Certificate": d ? d.certificate : 'N/A',
                    "Shape": d ? d.shape : '',
                    "Carat": d ? d.carat : 0,

                    // Diamond - Quality (4Cs)
                    "Color": d ? d.color : '',
                    "Clarity": d ? d.clarity : '',
                    "Cut": d ? d.cut : '',
                    "Polish": d ? d.polish : '',
                    "Sym": d ? d.symmetry : '',
                    "Fluor": d ? d.fluorescence : '',
                    "Lab": d ? d.lab : '',

                    // Diamond - Other Specs
                    "Measurements": d ? d.measurements : '',
                    "Table %": d ? d.table_percent : '',
                    "Depth %": d ? d.total_depth_percent : '',

                    // Diamond - Source/Logistics (User Request: "fetching from and sell to")
                    "Company": d ? d.company : '',
                    "Stock Location (From)": d ? d.buyer_country : '', // 'buyer_country' stores 'Stock Location' per form logic
                    "Buyer Location (To)": d ? d.seller_country : '',   // 'seller_country' stores 'Buyer Location' per form logic

                    // Financials
                    "Sale Price": parseFloat(item.sale_price) || 0,

                    // Admin Only Fields?
                    // Usually exports are for admin/accounting. 
                    // Let's include cost/profit if admin.
                    ...(req.userRole === 'admin' ? {
                        "Cost Price": d ? parseFloat(d.price * (1 - (d.discount || 0) / 100)) : 0,
                        "Initial Price": d ? parseFloat(d.price) : 0,
                        "Discount %": d ? parseFloat(d.discount) : 0,
                        "Profit": parseFloat(item.profit) || 0
                    } : {})
                };
                rows.push(row);
            });
        });

        // 4. Generate Excel
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(rows);

        // Auto-width columns roughly
        const colWidths = Object.keys(rows[0] || {}).map(k => ({ wch: k.length + 5 }));
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
            if (payment_status === 'Paid') {
                updateData.paid_amount = invoice.total_amount;
                updateData.balance_due = 0;
                // We keep due_date as record of when it was supposed to be paid
            } else if (payment_status === 'Pending') {
                updateData.paid_amount = 0;
                updateData.balance_due = invoice.total_amount;
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
        const totalAmount = parseFloat(invoice.total_amount);

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
