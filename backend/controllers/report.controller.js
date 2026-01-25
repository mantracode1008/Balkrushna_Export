const db = require("../models");
const Invoice = db.invoices;
const Diamond = db.diamonds;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;

exports.getDashboardStats = async (req, res) => {
    try {
        // RBAC Filters
        // RBAC Filters
        const diamondFilter = { status: 'in_stock' };
        const invoiceFilter = {};

        // Admin Filter by Staff (if provided)
        if (req.userRole === 'admin' && req.query.staffId) {
            const staffId = parseInt(req.query.staffId);
            diamondFilter.created_by = staffId;
            invoiceFilter.created_by = staffId;
        }
        // Staff Force Filter
        else if (req.userRole === 'staff') {
            diamondFilter.created_by = req.userId;
            invoiceFilter.created_by = req.userId;
        }

        // 1. Inventory Value (Cost Price of In Stock)
        const inventoryRes = await Diamond.findAll({
            where: diamondFilter,
            attributes: [
                [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'totalValue']
            ],
            raw: true
        });
        const inventoryValue = inventoryRes[0].totalValue || 0;

        // 1.5 Total Inventory Count (In Stock)
        const inventoryCount = await Diamond.count({ where: diamondFilter });

        // 2. Total Sold Count
        const soldCondition = { status: 'sold' };

        if (req.userRole === 'admin' && req.query.staffId) {
            soldCondition.created_by = parseInt(req.query.staffId);
        } else if (req.userRole === 'staff') {
            soldCondition.created_by = req.userId;
        }
        const soldCount = await Diamond.count({ where: soldCondition });

        // 3. Total Revenue & Profit (From Invoices)
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

        // 4. Shape Distribution
        const shapeDist = await Diamond.findAll({
            where: diamondFilter,
            attributes: [
                'shape',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['shape'],
            raw: true
        });

        // 5. Color Distribution
        const colorDist = await Diamond.findAll({
            where: diamondFilter,
            attributes: [
                'color',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['color'],
            raw: true
        });

        // 6. Clarity Distribution
        const clarityDist = await Diamond.findAll({
            where: diamondFilter,
            attributes: [
                'clarity',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
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
    const { range, startDate, endDate } = req.query; // daily, monthly, yearly OR custom dates

    let groupFormat;
    // SQLite date format syntax
    if (dbConfig.dialect === 'sqlite') {
        if (range === 'daily') groupFormat = '%Y-%m-%d';
        else if (range === 'monthly') groupFormat = '%Y-%m';
        else groupFormat = '%Y';
    } else {
        // MySQL Syntax
        if (range === 'daily') groupFormat = '%Y-%m-%d';
        else if (range === 'monthly') groupFormat = '%Y-%m';
        else groupFormat = '%Y';
    }

    try {
        const isSqlite = dbConfig.dialect === 'sqlite';
        const dateFn = isSqlite ? 'strftime' : 'DATE_FORMAT';

        // strftime(format, date) vs DATE_FORMAT(date, format)
        const dateFnArgs = isSqlite
            ? [groupFormat, sequelize.col('invoice_date')]
            : [sequelize.col('invoice_date'), groupFormat];

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
        const db = require("../models");
        const InvoiceItem = db.invoiceItems;
        const Diamond = db.diamonds;

        // 1. Get Top IDs and Stats (RAW SQL to avoid Sequelize ambiguity issues)
        const [topStats] = await sequelize.query(`
            SELECT 
                diamondId, 
                SUM(ii.profit) as totalProfit, 
                SUM(ii.quantity) as totalQuantity, 
                SUM(ii.sale_price) as totalRevenue
            FROM invoice_items AS ii
            GROUP BY diamondId
            ORDER BY totalProfit DESC
            LIMIT 5
        `);

        // 2. Fetch Details
        const diamondIds = topStats.map(s => s.diamondId);

        let details = [];
        if (diamondIds.length > 0) {
            details = await Diamond.findAll({
                where: { id: diamondIds },
                attributes: ['id', 'certificate', 'shape', 'carat', 'color', 'clarity'],
                raw: true
            });
        }

        // 3. Merge
        const result = topStats.map(stat => {
            const detail = details.find(d => d.id === stat.diamondId) || {};
            // Flatten structure to match frontend expectation
            return {
                ...stat,
                diamond: detail // Frontend expects `diamond` object
            };
        });

        res.json(result);
    } catch (err) {
        console.error("Top Selling Error:", err);
        res.status(500).send({ message: err.message });
    }
};

const dbConfig = require("../config/db.config.js");

exports.getBuyingStats = async (req, res) => {
    const { range } = req.query; // daily, monthly, yearly
    let groupFormat;

    // SQLite date format syntax
    if (dbConfig.dialect === 'sqlite') {
        if (range === 'daily') groupFormat = '%Y-%m-%d';
        else if (range === 'monthly') groupFormat = '%Y-%m';
        else groupFormat = '%Y';
    } else {
        // MySQL Syntax
        if (range === 'daily') groupFormat = '%Y-%m-%d';
        else if (range === 'monthly') groupFormat = '%Y-%m';
        else groupFormat = '%Y';
    }

    try {
        const isSqlite = dbConfig.dialect === 'sqlite';
        const dateFn = isSqlite ? 'strftime' : 'DATE_FORMAT';

        // strftime(format, date) vs DATE_FORMAT(date, format)
        const dateFnArgs = isSqlite
            ? [groupFormat, sequelize.col('createdAt')]
            : [sequelize.col('createdAt'), groupFormat];

        const attributes = [
            [sequelize.fn(dateFn, ...dateFnArgs), 'date'],
            [sequelize.fn('SUM', sequelize.col('price')), 'cost'] // buying cost
        ];

        const data = await Diamond.findAll({
            attributes: attributes,
            group: [sequelize.fn(dateFn, ...dateFnArgs)],
            order: [[sequelize.col('date'), 'ASC']],
            raw: true
        });

        res.json(data);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};
