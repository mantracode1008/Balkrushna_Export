const db = require("../models");
const Invoice = db.invoices;
const Diamond = db.diamonds;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;
const dbConfig = require("../config/db.config.js");

exports.getDashboardStats = async (req, res) => {
    try {
        const diamondFilter = { status: 'in_stock' };
        const invoiceFilter = {};

        if (req.userRole === 'admin' && req.query.staffId) {
            const staffId = parseInt(req.query.staffId);
            diamondFilter.created_by = staffId;
            invoiceFilter.created_by = staffId;
        } else if (req.userRole === 'staff') {
            diamondFilter.created_by = req.userId;
            invoiceFilter.created_by = req.userId;
        }

        const inventoryRes = await Diamond.findAll({
            where: diamondFilter,
            attributes: [[sequelize.fn('SUM', sequelize.literal('price * quantity')), 'totalValue']],
            raw: true
        });
        const inventoryValue = inventoryRes[0].totalValue || 0;
        const inventoryCount = await Diamond.count({ where: diamondFilter });

        const soldCondition = { status: 'sold' };
        if (req.userRole === 'admin' && req.query.staffId) {
            soldCondition.created_by = parseInt(req.query.staffId);
        } else if (req.userRole === 'staff') {
            soldCondition.created_by = req.userId;
        }
        const soldCount = await Diamond.count({ where: soldCondition });

        const financials = await Invoice.findAll({
            where: invoiceFilter,
            attributes: [
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
                [sequelize.fn('SUM', sequelize.col('total_profit')), 'totalProfit']
            ],
            raw: true
        });

        const totalRevenue = (financials && financials.length > 0) ? financials[0].totalRevenue || 0 : 0;
        const totalProfit = (financials && financials.length > 0) ? financials[0].totalProfit || 0 : 0;

        const shapeDist = await Diamond.findAll({
            where: diamondFilter,
            attributes: ['shape', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['shape'],
            raw: true
        });

        const colorDist = await Diamond.findAll({
            where: diamondFilter,
            attributes: ['color', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['color'],
            raw: true
        });

        const clarityDist = await Diamond.findAll({
            where: diamondFilter,
            attributes: ['clarity', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['clarity'],
            raw: true
        });

        res.json({
            inventoryValue,
            inventoryCount,
            soldCount,
            totalRevenue,
            totalProfit,
            shapeDistribution: shapeDist,
            colorDistribution: colorDist,
            clarityDistribution: clarityDist
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).send({ message: err.message });
    }
};

exports.getReports = async (req, res) => {
    const { range, startDate, endDate } = req.query;
    let groupFormat;

    if (dbConfig.dialect === 'sqlite') {
        if (range === 'daily') groupFormat = '%Y-%m-%d';
        else if (range === 'monthly') groupFormat = '%Y-%m';
        else groupFormat = '%Y';
    } else {
        if (range === 'daily') groupFormat = '%Y-%m-%d';
        else if (range === 'monthly') groupFormat = '%Y-%m';
        else groupFormat = '%Y';
    }

    try {
        const isSqlite = dbConfig.dialect === 'sqlite';
        const dateFn = isSqlite ? 'strftime' : 'DATE_FORMAT';
        const dateFnArgs = isSqlite ? [groupFormat, sequelize.col('invoice_date')] : [sequelize.col('invoice_date'), groupFormat];

        const attributes = [
            [sequelize.fn(dateFn, ...dateFnArgs), 'date'],
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
            [sequelize.fn('SUM', sequelize.col('total_profit')), 'profit']
        ];

        const whereClause = {};
        if (req.userRole === 'staff') {
            whereClause.created_by = req.userId;
        }
        if (startDate && endDate) {
            whereClause.invoice_date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const data = await Invoice.findAll({
            attributes: attributes,
            where: whereClause,
            group: [sequelize.fn(dateFn, ...dateFnArgs)],
            order: [[sequelize.col('date'), 'ASC']],
            raw: true
        });

        res.json(data);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

exports.getTopSellingItems = async (req, res) => {
    try {
        const InvoiceItem = db.invoiceItems;

        let staffFilter = "";
        if (req.userRole === 'staff') {
            staffFilter = `JOIN invoices i ON ii.invoiceId = i.id WHERE i.created_by = ${req.userId}`;
        }

        const [topStats] = await sequelize.query(`
            SELECT 
                ii.diamondId, 
                SUM(ii.profit) as totalProfit, 
                SUM(ii.quantity) as totalQuantity, 
                SUM(ii.sale_price) as totalRevenue
            FROM invoice_items AS ii
            ${staffFilter}
            GROUP BY ii.diamondId
            ORDER BY totalProfit DESC
            LIMIT 5
        `);

        const diamondIds = topStats.map(s => s.diamondId);
        let details = [];
        if (diamondIds.length > 0) {
            details = await Diamond.findAll({
                where: { id: diamondIds },
                attributes: ['id', 'certificate', 'shape', 'carat', 'color', 'clarity'],
                raw: true
            });
        }

        const result = topStats.map(stat => {
            const detail = details.find(d => d.id === stat.diamondId) || {};
            return { ...stat, diamond: detail };
        });

        res.json(result);
    } catch (err) {
        console.error("Top Selling Error:", err);
        res.status(500).send({ message: err.message });
    }
};

exports.getBuyingStats = async (req, res) => {
    const { range } = req.query;
    let groupFormat;

    if (dbConfig.dialect === 'sqlite') {
        if (range === 'daily') groupFormat = '%Y-%m-%d';
        else if (range === 'monthly') groupFormat = '%Y-%m';
        else groupFormat = '%Y';
    } else {
        if (range === 'daily') groupFormat = '%Y-%m-%d';
        else if (range === 'monthly') groupFormat = '%Y-%m';
        else groupFormat = '%Y';
    }

    try {
        const isSqlite = dbConfig.dialect === 'sqlite';
        const dateFn = isSqlite ? 'strftime' : 'DATE_FORMAT';
        const dateFnArgs = isSqlite ? [groupFormat, sequelize.col('createdAt')] : [sequelize.col('createdAt'), groupFormat];

        const attributes = [
            [sequelize.fn(dateFn, ...dateFnArgs), 'date'],
            [sequelize.fn('SUM', sequelize.col('price')), 'cost']
        ];

        const whereClause = {};
        if (req.userRole === 'staff') {
            whereClause.created_by = req.userId;
        }

        const data = await Diamond.findAll({
            attributes: attributes,
            where: whereClause,
            group: [sequelize.fn(dateFn, ...dateFnArgs)],
            order: [[sequelize.col('date'), 'ASC']],
            raw: true
        });

        res.json(data);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Helper function to apply RBAC filters
const applyInvoiceRBAC = (whereClause, req) => {
    if (req.userRole === 'staff') {
        whereClause.created_by = req.userId;
    } else if (req.userRole === 'admin' && req.query.staffId) {
        whereClause.created_by = parseInt(req.query.staffId);
    }
    return whereClause;
};

// Company-wise Invoice Report
exports.invoicesByCompany = async (req, res) => {
    try {
        let whereClause = {};
        whereClause = applyInvoiceRBAC(whereClause, req);

        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                { model: db.clients, as: 'client', attributes: ['id', 'company_name', 'name', 'country'] },
                { model: db.admins, as: 'creator', attributes: ['id', 'name', 'role'] }
            ],
            order: [['invoice_date', 'DESC']]
        });

        const companyMap = {};
        invoices.forEach(inv => {
            const companyName = inv.client?.company_name || 'No Company';
            if (!companyMap[companyName]) {
                companyMap[companyName] = {
                    company: companyName,
                    invoices: [],
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    count: 0
                };
            }

            const amount = parseFloat(inv.grand_total || inv.total_amount || 0);
            const paid = parseFloat(inv.paid_amount || 0);
            const due = parseFloat(inv.balance_due || 0);

            companyMap[companyName].invoices.push(inv);
            companyMap[companyName].totalAmount += amount;
            companyMap[companyName].totalPaid += paid;
            companyMap[companyName].totalDue += due;
            companyMap[companyName].count += 1;
        });

        res.json(Object.values(companyMap));
    } catch (err) {
        console.error('Company Report Error:', err);
        res.status(500).send({ message: err.message });
    }
};

// Buyer-wise Invoice Report
exports.invoicesByBuyer = async (req, res) => {
    try {
        let whereClause = {};
        whereClause = applyInvoiceRBAC(whereClause, req);

        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                { model: db.clients, as: 'client', attributes: ['id', 'name', 'company_name', 'country', 'email', 'contact_number'] },
                { model: db.admins, as: 'creator', attributes: ['id', 'name'] }
            ],
            order: [['invoice_date', 'DESC']]
        });

        const buyerMap = {};
        invoices.forEach(inv => {
            const buyerName = inv.customer_name || inv.client?.name || 'Unknown Buyer';
            if (!buyerMap[buyerName]) {
                buyerMap[buyerName] = {
                    buyer: buyerName,
                    client: inv.client,
                    invoices: [],
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    count: 0
                };
            }

            const amount = parseFloat(inv.grand_total || inv.total_amount || 0);
            const paid = parseFloat(inv.paid_amount || 0);
            const due = parseFloat(inv.balance_due || 0);

            buyerMap[buyerName].invoices.push(inv);
            buyerMap[buyerName].totalAmount += amount;
            buyerMap[buyerName].totalPaid += paid;
            buyerMap[buyerName].totalDue += due;
            buyerMap[buyerName].count += 1;
        });

        res.json(Object.values(buyerMap));
    } catch (err) {
        console.error('Buyer Report Error:', err);
        res.status(500).send({ message: err.message });
    }
};

// Staff-wise Invoice Report
exports.invoicesByStaff = async (req, res) => {
    try {
        let whereClause = {};
        if (req.userRole === 'staff') {
            whereClause.created_by = req.userId;
        }

        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                { model: db.admins, as: 'creator', attributes: ['id', 'name', 'username', 'role'] },
                { model: db.clients, as: 'client', attributes: ['id', 'name'] }
            ],
            order: [['invoice_date', 'DESC']]
        });

        const staffMap = {};
        invoices.forEach(inv => {
            const staffId = inv.created_by;
            const staffName = inv.creator?.name || 'Unknown Staff';

            if (!staffMap[staffId]) {
                staffMap[staffId] = {
                    staffId: staffId,
                    staffName: staffName,
                    staff: inv.creator,
                    invoices: [],
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    totalProfit: 0,
                    count: 0
                };
            }

            const amount = parseFloat(inv.grand_total || inv.total_amount || 0);
            const paid = parseFloat(inv.paid_amount || 0);
            const due = parseFloat(inv.balance_due || 0);
            const profit = parseFloat(inv.total_profit || 0);

            staffMap[staffId].invoices.push(inv);
            staffMap[staffId].totalAmount += amount;
            staffMap[staffId].totalPaid += paid;
            staffMap[staffId].totalDue += due;
            staffMap[staffId].totalProfit += profit;
            staffMap[staffId].count += 1;
        });

        res.json(Object.values(staffMap));
    } catch (err) {
        console.error('Staff Report Error:', err);
        res.status(500).send({ message: err.message });
    }
};

// Date-wise Invoice Report
exports.invoicesByDate = async (req, res) => {
    try {
        let whereClause = {};
        whereClause = applyInvoiceRBAC(whereClause, req);

        if (req.query.startDate && req.query.endDate) {
            whereClause.invoice_date = {
                [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
            };
        }

        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                { model: db.clients, as: 'client', attributes: ['id', 'name'] },
                { model: db.admins, as: 'creator', attributes: ['id', 'name'] }
            ],
            order: [['invoice_date', 'DESC']]
        });

        const dateMap = {};
        invoices.forEach(inv => {
            const date = new Date(inv.invoice_date).toISOString().split('T')[0];

            if (!dateMap[date]) {
                dateMap[date] = {
                    date: date,
                    invoices: [],
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    totalProfit: 0,
                    count: 0
                };
            }

            const amount = parseFloat(inv.grand_total || inv.total_amount || 0);
            const paid = parseFloat(inv.paid_amount || 0);
            const due = parseFloat(inv.balance_due || 0);
            const profit = parseFloat(inv.total_profit || 0);

            dateMap[date].invoices.push(inv);
            dateMap[date].totalAmount += amount;
            dateMap[date].totalPaid += paid;
            dateMap[date].totalDue += due;
            dateMap[date].totalProfit += profit;
            dateMap[date].count += 1;
        });

        const result = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
        res.json(result);
    } catch (err) {
        console.error('Date Report Error:', err);
        res.status(500).send({ message: err.message });
    }
};

// Currency-wise Invoice Report
exports.invoicesByCurrency = async (req, res) => {
    try {
        let whereClause = {};
        whereClause = applyInvoiceRBAC(whereClause, req);

        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                { model: db.clients, as: 'client', attributes: ['id', 'name', 'country'] },
                { model: db.admins, as: 'creator', attributes: ['id', 'name'] }
            ],
            order: [['invoice_date', 'DESC']]
        });

        const currencyMap = {};
        invoices.forEach(inv => {
            const currency = inv.currency || 'USD';

            if (!currencyMap[currency]) {
                currencyMap[currency] = {
                    currency: currency,
                    invoices: [],
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    totalProfit: 0,
                    count: 0
                };
            }

            const amount = parseFloat(inv.grand_total || inv.total_amount || 0);
            const paid = parseFloat(inv.paid_amount || 0);
            const due = parseFloat(inv.balance_due || 0);
            const profit = parseFloat(inv.total_profit || 0);

            currencyMap[currency].invoices.push(inv);
            currencyMap[currency].totalAmount += amount;
            currencyMap[currency].totalPaid += paid;
            currencyMap[currency].totalDue += due;
            currencyMap[currency].totalProfit += profit;
            currencyMap[currency].count += 1;
        });

        res.json(Object.values(currencyMap));
    } catch (err) {
        console.error('Currency Report Error:', err);
        res.status(500).send({ message: err.message });
    }
};

// GST-wise Invoice Report
exports.invoicesByGST = async (req, res) => {
    try {
        let whereClause = { currency: 'INR' };
        whereClause = applyInvoiceRBAC(whereClause, req);

        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                { model: db.clients, as: 'client', attributes: ['id', 'name', 'company_name', 'gst_number'] },
                { model: db.admins, as: 'creator', attributes: ['id', 'name'] }
            ],
            order: [['invoice_date', 'DESC']]
        });

        const gstMap = {};
        let totalSubtotal = 0, totalCGST = 0, totalSGST = 0, totalGrandTotal = 0;

        invoices.forEach(inv => {
            const cgstRate = parseFloat(inv.cgst_rate || 0);
            const sgstRate = parseFloat(inv.sgst_rate || 0);
            const gstKey = `CGST ${cgstRate}% + SGST ${sgstRate}%`;

            if (!gstMap[gstKey]) {
                gstMap[gstKey] = {
                    gstCategory: gstKey,
                    cgstRate: cgstRate,
                    sgstRate: sgstRate,
                    invoices: [],
                    totalSubtotal: 0,
                    totalCGST: 0,
                    totalSGST: 0,
                    totalGST: 0,
                    totalGrandTotal: 0,
                    count: 0
                };
            }

            const subtotal = parseFloat(inv.subtotal_amount || 0);
            const cgst = parseFloat(inv.cgst_amount || 0);
            const sgst = parseFloat(inv.sgst_amount || 0);
            const gst = parseFloat(inv.total_gst || 0);
            const grandTotal = parseFloat(inv.grand_total || 0);

            gstMap[gstKey].invoices.push(inv);
            gstMap[gstKey].totalSubtotal += subtotal;
            gstMap[gstKey].totalCGST += cgst;
            gstMap[gstKey].totalSGST += sgst;
            gstMap[gstKey].totalGST += gst;
            gstMap[gstKey].totalGrandTotal += grandTotal;
            gstMap[gstKey].count += 1;

            totalSubtotal += subtotal;
            totalCGST += cgst;
            totalSGST += sgst;
            totalGrandTotal += grandTotal;
        });

        res.json({
            categories: Object.values(gstMap),
            totals: {
                totalSubtotal,
                totalCGST,
                totalSGST,
                totalGST: totalCGST + totalSGST,
                totalGrandTotal,
                count: invoices.length
            }
        });
    } catch (err) {
        console.error('GST Report Error:', err);
        res.status(500).send({ message: err.message });
    }
};

// Seller Reports
const Seller = db.sellers;
const SellerPayment = db.sellerPayments;

exports.sellerPurchases = async (req, res) => {
    try {
        const sellers = await Seller.findAll({
            include: [{ model: db.admins, as: 'creator', attributes: ['id', 'name'] }],
            order: [['createdAt', 'DESC']]
        });

        const sellerStats = await Promise.all(sellers.map(async (seller) => {
            const s = seller.toJSON();
            const diamonds = await Diamond.findAll({
                where: { seller_id: seller.id },
                attributes: ['buy_price', 'paid_amount', 'status']
            });

            let totalPurchased = 0, totalPaid = 0, totalDue = 0;
            diamonds.forEach(d => {
                const buyPrice = parseFloat(d.buy_price || 0);
                const paidAmount = parseFloat(d.paid_amount || 0);
                totalPurchased += buyPrice;
                totalPaid += paidAmount;
                totalDue += (buyPrice - paidAmount);
            });

            return { ...s, totalPurchased, totalPaid, totalDue, diamondCount: diamonds.length };
        }));

        res.json(sellerStats);
    } catch (err) {
        console.error('Seller Purchases Error:', err);
        res.status(500).send({ message: err.message });
    }
};

exports.sellerPayments = async (req, res) => {
    try {
        const sellers = await Seller.findAll();
        const paymentStats = await Promise.all(sellers.map(async (seller) => {
            const payments = await SellerPayment.findAll({
                where: { seller_id: seller.id },
                order: [['payment_date', 'DESC']]
            });

            let totalPayments = 0;
            payments.forEach(p => {
                totalPayments += parseFloat(p.amount || 0);
            });

            return {
                seller: seller.toJSON(),
                payments: payments,
                totalPayments: totalPayments,
                paymentCount: payments.length
            };
        }));

        res.json(paymentStats);
    } catch (err) {
        console.error('Seller Payments Error:', err);
        res.status(500).send({ message: err.message });
    }
};

exports.overdueSellerPayments = async (req, res) => {
    try {
        const today = new Date();
        const overdueDiamonds = await Diamond.findAll({
            where: {
                [Op.and]: [
                    sequelize.where(sequelize.literal('buy_price - paid_amount'), { [Op.gt]: 0 }),
                    { payment_due_date: { [Op.lt]: today } }
                ]
            },
            include: [{ model: Seller, as: 'seller', attributes: ['id', 'name', 'company', 'mobile', 'email'] }],
            order: [['payment_due_date', 'ASC']]
        });

        const sellerOverdueMap = {};
        overdueDiamonds.forEach(d => {
            const sellerId = d.seller_id;
            if (!sellerOverdueMap[sellerId]) {
                sellerOverdueMap[sellerId] = {
                    seller: d.seller,
                    diamonds: [],
                    totalOverdue: 0,
                    count: 0
                };
            }

            const due = parseFloat(d.buy_price || 0) - parseFloat(d.paid_amount || 0);
            sellerOverdueMap[sellerId].diamonds.push(d);
            sellerOverdueMap[sellerId].totalOverdue += due;
            sellerOverdueMap[sellerId].count += 1;
        });

        res.json(Object.values(sellerOverdueMap));
    } catch (err) {
        console.error('Overdue Payments Error:', err);
        res.status(500).send({ message: err.message });
    }
};

exports.getSellerBuyerSales = async (req, res) => {
    try {
        const { startDate, endDate, staffId } = req.query;
        let invoiceWhere = {};

        // Date Filter
        if (startDate && endDate) {
            invoiceWhere.invoice_date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // RBAC / Staff Filter
        if (req.userRole === 'staff') {
            invoiceWhere.created_by = req.userId;
        } else if (staffId) {
            invoiceWhere.created_by = staffId;
        }

        // Fetch Invoices with Items and Diamond Details
        const invoices = await Invoice.findAll({
            where: invoiceWhere,
            include: [
                {
                    model: db.clients,
                    as: 'client',
                    attributes: ['id', 'name', 'company_name']
                },
                {
                    model: db.invoiceItems,
                    as: 'items',
                    include: [{
                        model: Diamond,
                        as: 'diamond',
                        include: [{
                            model: Seller,
                            as: 'seller',
                            attributes: ['id', 'name', 'company']
                        }]
                    }]
                },
                {
                    model: db.admins,
                    as: 'creator',
                    attributes: ['id', 'name']
                }
            ],
            order: [['invoice_date', 'DESC']]
        });

        // Hierarchical Aggregation: Seller -> Buyer -> Transactions
        const sellerMap = {};

        invoices.forEach(inv => {
            if (!inv.items || inv.items.length === 0) return;

            inv.items.forEach(item => {
                // Determine Seller (Supplier)
                const diamond = item.diamond;
                if (!diamond) return;

                const sellerId = diamond.seller ? diamond.seller.id : 'unknown';
                const sellerName = diamond.seller ? diamond.seller.name : 'Unknown Seller';

                // Determine Buyer (Customer)
                const buyerId = inv.client ? inv.client.id : 'walkin';
                const buyerName = inv.client ? inv.client.name : (inv.customer_name || 'Walk-in Customer');

                // Initialize Seller Node
                if (!sellerMap[sellerId]) {
                    sellerMap[sellerId] = {
                        id: sellerId,
                        name: sellerName,
                        totalAmount: 0,
                        totalCarat: 0,
                        totalCount: 0,
                        buyers: {}
                    };
                }

                // Initialize Buyer Node under Seller
                if (!sellerMap[sellerId].buyers[buyerId]) {
                    sellerMap[sellerId].buyers[buyerId] = {
                        id: buyerId,
                        name: buyerName,
                        totalAmount: 0,
                        totalCarat: 0,
                        totalCount: 0,
                        transactions: []
                    };
                }

                // Transaction Details
                const amount = parseFloat(item.sale_price || 0); // Using sale_price from item
                const carat = parseFloat(diamond.carat || 0);

                const transaction = {
                    date: inv.invoice_date,
                    diamond: {
                        id: diamond.id,
                        certificate: diamond.certificate,
                        shape: diamond.shape,
                        carat: carat
                    },
                    amount: amount,
                    staff: inv.creator ? inv.creator.name : 'Unknown'
                };

                // Update Metrics (Buyer Level)
                sellerMap[sellerId].buyers[buyerId].transactions.push(transaction);
                sellerMap[sellerId].buyers[buyerId].totalAmount += amount;
                sellerMap[sellerId].buyers[buyerId].totalCarat += carat;
                sellerMap[sellerId].buyers[buyerId].totalCount += 1;

                // Update Metrics (Seller Level)
                sellerMap[sellerId].totalAmount += amount;
                sellerMap[sellerId].totalCarat += carat;
                sellerMap[sellerId].totalCount += 1;
            });
        });

        // Convert Maps to Arrays for Frontend
        const result = Object.values(sellerMap).map(seller => {
            return {
                ...seller,
                buyers: Object.values(seller.buyers) // Flatten buyers map to array
            };
        });

        // Sort by Seller Total Amount Descending
        result.sort((a, b) => b.totalAmount - a.totalAmount);

        res.json(result);
    } catch (err) {
        console.error("Seller-Buyer Report Error:", err);
        res.status(500).send({ message: err.message });
    }
};
// Seller Grid Report (Excel-like)
exports.getSellerGridReport = async (req, res) => {
    try {
        const {
            startDate, endDate,
            sellerId, staffId,
            status, // 'paid', 'due', 'partial'
            shape,
            minCarat, maxCarat,
            minAmount, maxAmount
        } = req.query;

        console.log("[DEBUG] Seller Grid Query:", JSON.stringify(req.query, null, 2));

        let whereClause = {
            // Must have a seller
            seller_id: { [Op.ne]: null }
        };

        // Date Range (Allow partial)
        if (startDate || endDate) {
            whereClause.buy_date = {};
            if (startDate) whereClause.buy_date[Op.gte] = new Date(startDate);
            if (endDate) whereClause.buy_date[Op.lte] = new Date(endDate);
        }

        // Filters (Handle string/array mismatch)
        if (sellerId) {
            const sellers = Array.isArray(sellerId) ? sellerId : String(sellerId).split(',');
            whereClause.seller_id = { [Op.in]: sellers };
        }

        if (staffId) {
            const staff = Array.isArray(staffId) ? staffId : String(staffId).split(',');
            whereClause.created_by = { [Op.in]: staff };
        }

        if (shape) {
            const shapes = Array.isArray(shape) ? shape : String(shape).split(',');
            whereClause.shape = { [Op.in]: shapes };
        }

        // Range Filters
        if (minCarat || maxCarat) {
            whereClause.carat = {};
            if (minCarat) whereClause.carat[Op.gte] = parseFloat(minCarat);
            if (maxCarat) whereClause.carat[Op.lte] = parseFloat(maxCarat);
        }

        // Price (Buy Amount) Range
        if (minAmount || maxAmount) {
            whereClause.buy_price = {};
            if (minAmount) whereClause.buy_price[Op.gte] = parseFloat(minAmount);
            if (maxAmount) whereClause.buy_price[Op.lte] = parseFloat(maxAmount);
        }

        // Fetch Data
        const diamonds = await Diamond.findAll({
            where: whereClause,
            include: [
                { model: db.sellers, as: 'seller', attributes: ['id', 'name'] },
                { model: db.admins, as: 'creator', attributes: ['id', 'name'] }
            ],
            order: [['buy_date', 'DESC'], ['id', 'DESC']]
        });

        const today = new Date();

        // Process Data & Calculate Computed Fields
        const gridData = diamonds.map(d => {
            const buyPrice = parseFloat(d.buy_price || 0);
            const paidAmount = parseFloat(d.paid_amount || 0);
            const dueAmount = buyPrice - paidAmount;
            const carat = parseFloat(d.carat || 0);
            const rate = carat > 0 ? (buyPrice / carat) : 0;

            let dueStatus = 'Due';
            if (dueAmount <= 0.9) dueStatus = 'Paid'; // Tolerance for small floats
            else if (paidAmount > 0) dueStatus = 'Partial';

            // Filter by Status if requested (since status is computed)
            if (status) {
                const requestedStatuses = Array.isArray(status) ? status : status.split(',');
                // Status mapping: 'paid', 'due', 'partial'
                // If filtering by 'overdue', we check due date?
                // Assuming status param matches these computed values lowercase
                if (!requestedStatuses.includes(dueStatus.toLowerCase())) return null;
            }

            // Days Outstanding calculation
            let daysOutstanding = 0;
            if (dueAmount > 0 && d.buy_date) {
                const buyDate = new Date(d.buy_date);
                const diffTime = Math.abs(today - buyDate);
                daysOutstanding = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return {
                id: d.id,
                certificate: d.certificate,
                seller_id: d.seller?.id,
                seller_name: d.seller?.name || 'Unknown',
                staff_id: d.creator?.id,
                staff_name: d.creator?.name || 'Unknown',
                shape: d.shape,
                carat: carat,
                rate: rate,
                buy_price: buyPrice,
                buy_date: d.buy_date,
                paid_amount: paidAmount,
                due_amount: dueAmount > 0 ? dueAmount : 0,
                due_status: dueStatus,
                days_outstanding: daysOutstanding,
                notes: d.comments || '' // Utilizing comments as notes
            };
        }).filter(item => item !== null); // Filter out nulls from status check

        res.json(gridData);

    } catch (err) {
        console.error("Seller Grid Report Error:", err);
        res.status(500).send({ message: err.message });
    }
};
