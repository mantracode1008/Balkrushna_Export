const db = require("../models");
const Invoice = db.invoices;
const InvoiceItem = db.invoiceItems;
const Diamond = db.diamonds;
const pdfGenerator = require("../utils/pdfGenerator");
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
        let totalAmount = 0;
        let totalProfit = 0;
        let invoiceItemsData = [];

        for (const item of items) {
            const diamond = await Diamond.findByPk(item.diamondId, { transaction: t });
            if (!diamond) throw new Error(`Diamond ${item.diamondId} not found.`);
            // MODIFIED: Allow 'sold' status if we are generating the invoice for it (post-facto).
            // Strict check: if it's sold, ensure it's not already on another invoice? 
            // For now, relax the check. If status is sold, we assume this invoice is the documentation for that sale.
            // A better check would be: if (diamond.status === 'sold' && await InvoiceItem.count({ where: { diamondId: diamond.id } }) > 0) throw ...

            // Checking if already invoiced
            const existingInvoiceItem = await InvoiceItem.findOne({ where: { diamondId: diamond.id }, transaction: t });
            if (existingInvoiceItem) {
                throw new Error(`Diamond ${diamond.certificate} is already invoiced (Invoice #${existingInvoiceItem.invoiceId}).`);
            }

            // If status is in_cart, allow. If sold, allow (as we just verified it's not invoiced).
            // if (diamond.status === 'sold') throw new Error(`Diamond ${diamond.certificate} is already sold.`);
            // User requested that Profit should include the "Commission" (Markup). 
            // So we do NOT subtract commission from the profit formula.
            // Formula: unitProfit = salePrice - costPrice.
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

            // Update Diamond Quantity and Status
            const newQuantity = diamond.quantity - quantity;
            const newStatus = newQuantity === 0 ? 'sold' : 'in_stock';

            await diamond.update({
                quantity: newQuantity,
                status: newStatus
            }, { transaction: t });
        }

        const invoice = await Invoice.create({
            customer_name: customerName,
            total_amount: totalAmount,
            total_profit: totalProfit,
            invoice_date: new Date()
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
    Invoice.findAll({
        include: [{
            model: InvoiceItem,
            as: "items",
            include: [{ model: Diamond, as: "diamond" }]
        }],
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

        // 2. Truncate Tables
        await InvoiceItem.destroy({ truncate: true, cascade: false, transaction: t });
        await Invoice.destroy({ truncate: true, cascade: false, transaction: t });

        await t.commit();
        res.send({ message: "All Invoices deleted and stock restored successfully!" });

    } catch (err) {
        await t.rollback();
        res.status(500).send({
            message: err.message || "Some error occurred while removing all invoices."
        });
    }
};
