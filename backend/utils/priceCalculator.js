
const { CLARITY_MAPPING, ORIGINAL_RAP_RATES, DISCOUNT_RAP_RATES } = require('../config/rapRates');

/**
 * Calculates the diamond price based on Rap Rates and Discounts.
 * 
 * @param {Object} params - The input parameters.
 * @param {string} params.color - Diamond color (e.g., 'F').
 * @param {string} params.shape - Diamond shape code (e.g., 'R').
 * @param {number} params.carat - Carat weight (e.g., 0.15).
 * @param {string} params.clarity - Clarity grade (e.g., 'VVS1').
 * @param {number} [params.additionalDiscount=0] - Additional discount percentage (e.g., 1 for 1%).
 * @returns {Object} Result object containing rates and final amounts.
 */
function calculateDiamondPrice({ color, shape, carat, clarity, additionalDiscount = 0 }) {
    // 1. Validate inputs
    if (!color || !shape || !carat || !clarity) {
        throw new Error("Missing required parameters: color, shape, carat, clarity");
    }

    const clarityKey = CLARITY_MAPPING[clarity];
    if (!clarityKey) {
        throw new Error(`Invalid clarity grade: ${clarity}`);
    }

    // Normalize Shape
    const SHAPE_MAP = {
        'ROUND': 'R',
        'PEAR': 'P',
        'OVAL': 'O',
        'MARQUISE': 'M',
        'EMERALD': 'E',
        'PRINCESS': 'PR',
        'RADIANT': 'RA',
        'CUSHION': 'C',
        'ASSCHER': 'A',
        'HEART': 'H'
    };
    const normShape = SHAPE_MAP[shape.toUpperCase()] || shape.toUpperCase().charAt(0); // Fallback to first letter? Or keep original if not found. Use 'R' if 'Round' not mapped.

    // 2. Find matching row in Original Rap Table
    // Use normShape
    const originalRow = ORIGINAL_RAP_RATES.find(row =>
        row.Color === color &&
        row.Shape === normShape &&
        carat >= row.Fsize &&
        carat <= row.Tsize
    );

    if (!originalRow) {
        throw new Error(`No Rap Rate found for Color: ${color}, Shape: ${shape}, Carat: ${carat}`);
    }

    const originalRate = originalRow[clarityKey];

    // 3. Find matching row in Discount Rap Table
    const discountRow = DISCOUNT_RAP_RATES.find(row =>
        row.Color === color &&
        row.Shape === normShape &&
        carat >= row.Fsize &&
        carat <= row.Tsize
    );

    // If no discount row is found, assume 0% discount? Or throw? usually logic implies it must exist.
    // For now, default to 0 if not found for robustness, but log warning in real app.
    const discountPercent = discountRow ? discountRow[clarityKey] : 0;

    // 4. Calculate Net Rate per Carat
    // PerCaratRate = OriginalRate * (1 - Discount%)
    // Discount is in integer (e.g., 3 means 3%), so divide by 100.
    const discountFactor = discountPercent / 100;
    const perCaratRate = originalRate * (1 - discountFactor);

    // 5. Calculate Diamond Amount
    // DiamondAmt = PerCaratRate * Carat
    const diamondAmt = perCaratRate * carat;

    // 6. Apply Additional Discount
    // FinalAmt = DiamondAmt * (1 - AdditionalDiscount%)
    const additionalDiscountFactor = additionalDiscount / 100;
    const finalDiamondAmt = diamondAmt * (1 - additionalDiscountFactor);

    return {
        originalRate: originalRate,
        discountPercent: discountPercent,
        perCaratRate: parseFloat(perCaratRate.toFixed(2)), // Rounding to 2 decimal places for currency
        diamondAmt: parseFloat(diamondAmt.toFixed(3)), // User example had 3 decimal places (199.335)
        finalDiamondAmt: parseFloat(finalDiamondAmt.toFixed(5)), // User example had 5 decimal places
        additionalDiscount: additionalDiscount,
        inputs: { color, shape, carat, clarity }
    };
}

module.exports = { calculateDiamondPrice };
