const priceCalculator = require("../utils/priceCalculator");
const db = require("../models");

exports.calculate = (req, res) => {
    try {
        const { color, shape, carat, clarity, additionalDiscount } = req.body;

        // Ensure params are present
        if (!color || !shape || !carat || !clarity) {
            return res.status(400).send({ message: "Missing required fields: color, shape, carat, clarity" });
        }

        const result = priceCalculator.calculateDiamondPrice({
            color,
            shape,
            carat: parseFloat(carat),
            clarity,
            additionalDiscount: parseFloat(additionalDiscount || 0)
        });

        res.send(result);
    } catch (err) {
        console.error("Pricing Error:", err.message);
        res.status(500).send({ message: err.message });
    }
};

exports.calculateRapPrice = async (req, res) => {
    try {
        const { carat, shape, color_code, clarity_code, S_code } = req.body;

        if (!carat || (!shape && !S_code) || !color_code || !clarity_code) {
            return res.status(400).send({ message: "Missing required fields (carat, shape/S_code, color_code, clarity_code)" });
        }

        // 1. Map Shape to S_Code
        // If S_code is provided directly (e.g. from frontend that already mapped it), use it.
        let sCode = S_code;

        if (!sCode && shape) {
            // Fallback mapping if S_code not sent
            const shapeMap = {
                'ROUND': 'R',
                'PEAR': 'PE',
                'PRINCESS': 'PR',
                'MARQUISE': 'MQ',
                'OVAL': 'OV',
                'RADIANT': 'RD',
                'EMERALD': 'EM',
                'HEART': 'HR',
                'CUSHION': 'CU',
                'ASSCHER': 'AS',
                'RECTANGULAR': 'RD', // Added from expanded list
                'FLOWER': 'CU'       // Added from expanded list
            };
            const sKey = String(shape).toUpperCase().trim();
            sCode = shapeMap[sKey];

            if (!sCode) {
                // Partial matches or other logic
                if (sKey.includes('ROUND')) sCode = 'R';
                else if (sKey.includes('OVAL')) sCode = 'OV';
                else if (sKey.includes('PEAR')) sCode = 'PE';
                else if (sKey.includes('PRINCESS')) sCode = 'PR';
                else if (sKey.includes('MARQUISE')) sCode = 'MQ';
                else if (sKey.includes('EMERALD')) sCode = 'EM';
                else if (sKey.includes('RADIANT')) sCode = 'RD';
                else if (sKey.includes('HEART')) sCode = 'HR';
                else if (sKey.includes('ASSCHER')) sCode = 'AS';
                else if (sKey.includes('CUSHION')) sCode = 'CU';
            }
        }

        if (!sCode) {
            return res.status(404).send({ message: `Shape '${shape}' not supported for Rap Price.` });
        }

        // 2. Find Row
        const RapRate = db.origionalRapRate;
        const Op = db.Sequelize.Op;

        // Find latest rate for params
        // Assuming unique row for range+shape+color+date? Or just picking one?
        // "OrigionalRapRate_Live_Tbl" implies "Live", maybe only one active set?
        // We will match Range, S_Code, C_Code.

        const rateRow = await RapRate.findOne({
            where: {
                F_Carat: { [Op.lte]: carat },
                T_Carat: { [Op.gte]: carat },
                S_Code: sCode,
                C_Code: color_code
            },
            order: [['RapDate', 'DESC']] // detailed query might need ordering if history exists
        });

        if (!rateRow) {
            return res.status(404).send({ message: "Rap Rate not found for given criteria." });
        }

        // 3. Extract Price from Q column
        // clarity_code e.g. "Q1", "Q3"
        const price = rateRow[clarity_code];

        // Check if column exists/value is valid
        if (price === undefined) {
            return res.status(400).send({ message: `Invalid Clarity Code column: ${clarity_code}` });
        }

        res.send({
            price: parseFloat(price) || 0,
            details: {
                s_code: sCode,
                c_code: color_code,
                q_code: clarity_code
            }
        });

    } catch (err) {
        console.error("Rap Price Error:", err);
        res.status(500).send({ message: "Error calculating Rap Price." });
    }
};
