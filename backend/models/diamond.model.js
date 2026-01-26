module.exports = (sequelize, Sequelize) => {
    // Add new columns for Direct Sale / Buyer Info
    const DiamondModel = sequelize.define("diamond", {
        created_by: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        certificate: {
            type: Sequelize.STRING,
            allowNull: false
        },
        certificate_date: {
            type: Sequelize.STRING
        },
        description: {
            type: Sequelize.TEXT
        },
        ratio: {
            type: Sequelize.STRING
        },
        shade: {
            type: Sequelize.STRING
        },
        inclusion: {
            type: Sequelize.STRING
        },
        key_to_symbols: {
            type: Sequelize.TEXT
        },
        lab_comment: {
            type: Sequelize.TEXT
        },
        member_comment: {
            type: Sequelize.TEXT
        },
        vendor_stock_no: {
            type: Sequelize.STRING
        },
        item_url: {
            type: Sequelize.TEXT
        },
        shape: {
            type: Sequelize.STRING
        },
        S_code: {
            type: Sequelize.STRING
        },
        measurements: {
            type: Sequelize.STRING
        },
        carat: {
            type: Sequelize.DECIMAL(10, 2)
        },
        color: {
            type: Sequelize.STRING
        },
        color_code: {
            type: Sequelize.INTEGER
        },
        clarity: {
            type: Sequelize.STRING
        },
        clarity_code: {
            type: Sequelize.STRING
        },
        cut: {
            type: Sequelize.STRING
        },
        lab: {
            type: Sequelize.STRING
        },
        polish: {
            type: Sequelize.STRING
        },
        symmetry: {
            type: Sequelize.STRING
        },
        fluorescence: {
            type: Sequelize.STRING
        },
        crown_height: {
            type: Sequelize.STRING
        },
        pavilion_depth: {
            type: Sequelize.STRING
        },
        girdle_thickness: {
            type: Sequelize.STRING
        },
        culet: {
            type: Sequelize.STRING
        },
        total_depth_percent: {
            type: Sequelize.STRING
        },
        table_percent: {
            type: Sequelize.STRING
        },
        comments: {
            type: Sequelize.TEXT
        },
        inscription: {
            type: Sequelize.STRING
        },
        price: { // Cost Price
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        quantity: {
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
        discount: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
        },
        status: {
            type: Sequelize.ENUM('in_stock', 'sold', 'in_cart'),
            defaultValue: 'in_stock'
        },
        // New Fields for Combined Buy/Sale & Diamond Type
        diamond_type: {
            type: Sequelize.STRING
        },
        buyer_name: {
            type: Sequelize.STRING
        },
        buyer_country: {
            type: Sequelize.STRING
        },
        buyer_mobile: {
            type: Sequelize.STRING
        },
        sale_price: { // Actual Selling Price
            type: Sequelize.DECIMAL(10, 2)
        },
        sold_by: { // Tracker for who sold it
            type: Sequelize.INTEGER
        },
        growth_process: {
            type: Sequelize.STRING
        },
        report_url: {
            type: Sequelize.TEXT
        },
        seller_country: {
            type: Sequelize.STRING
        },
        company: {
            type: Sequelize.STRING
        },
        price_per_carat: {
            type: Sequelize.DECIMAL(10, 2)
        },
        total_price: {
            type: Sequelize.DECIMAL(10, 2)
        },
        rap_discount: {
            type: Sequelize.DECIMAL(10, 2)
        },
        seller_name: {
            type: Sequelize.STRING
        },
        // Advanced Sales Flow Fields
        sale_type: {
            type: Sequelize.ENUM('STOCK', 'ORDER'),
            defaultValue: 'STOCK'
        },
        client_id: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        // Currency & Commission
        currency: {
            type: Sequelize.STRING,
            defaultValue: 'USD'
        },
        exchange_rate: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 1.00
        },
        commission_usd: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0
        },
        commission_inr: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0
        },
        final_price_usd: {
            type: Sequelize.DECIMAL(10, 2)
        },
        final_price_inr: {
            type: Sequelize.DECIMAL(10, 2)
        },
        sale_date: {
            type: Sequelize.DATE
        }
    });

    return DiamondModel;
};
