
// Clarity Mapping: Maps standard clarity grades to Q columns
const CLARITY_MAPPING = {
    "IF": "Q1",
    "VVS1": "Q2",
    "VVS2": "Q3",
    "VS1": "Q4",
    "VS2": "Q5",
    "SI1": "Q6",
    "SI2": "Q7",
    "SI3": "Q8",
    "I1": "Q9",
    "I2": "Q10",
    "I3": "Q11"
};

// Original Rap Rates (Base Price per Carat)
// Using sample data + mock row for 0.15ct example
const ORIGINAL_RAP_RATES = [
    // Mock row for 0.14 - 0.17 size to support the 0.15ct example with 1370 base rate
    {
        Color: "F",
        Date: "01/02/26",
        Fsize: 0.14,
        Tsize: 0.17,
        Shape: "R",
        Q1: 1370, Q2: 1370, Q3: 1370, Q4: 1160, Q5: 1160, Q6: 1000, Q7: 850, Q8: 710, Q9: 600, Q10: 450, Q11: 360
    },
    // The exact row from the image
    {
        Color: "F",
        Date: "01/02/26",
        Fsize: 0.18,
        Tsize: 0.22,
        Shape: "R",
        Q1: 1370, Q2: 1370, Q3: 1370, Q4: 1160, Q5: 1160, Q6: 1000, Q7: 850, Q8: 710, Q9: 600, Q10: 450, Q11: 360
    },
    // Generic rows for common sizes (0.30 - 0.99) and colors D-H
    ...["D", "E", "F", "G", "H"].flatMap(color => [
        { Color: color, Shape: "R", Fsize: 0.30, Tsize: 0.39, Q1: 2000, Q2: 1800, Q3: 1600, Q4: 1400, Q5: 1200, Q6: 1000, Q7: 800, Q8: 600, Q9: 400, Q10: 200, Q11: 100 },
        { Color: color, Shape: "R", Fsize: 0.40, Tsize: 0.49, Q1: 2500, Q2: 2300, Q3: 2100, Q4: 1900, Q5: 1700, Q6: 1500, Q7: 1200, Q8: 900, Q9: 600, Q10: 300, Q11: 150 },
        { Color: color, Shape: "R", Fsize: 0.50, Tsize: 0.69, Q1: 3500, Q2: 3200, Q3: 2900, Q4: 2600, Q5: 2300, Q6: 2000, Q7: 1600, Q8: 1200, Q9: 800, Q10: 400, Q11: 200 },
        { Color: color, Shape: "R", Fsize: 0.70, Tsize: 0.89, Q1: 4500, Q2: 4200, Q3: 3900, Q4: 3600, Q5: 3300, Q6: 2900, Q7: 2400, Q8: 1800, Q9: 1200, Q10: 600, Q11: 300 },
        { Color: color, Shape: "R", Fsize: 0.90, Tsize: 0.99, Q1: 5500, Q2: 5200, Q3: 4900, Q4: 4600, Q5: 4300, Q6: 3900, Q7: 3200, Q8: 2400, Q9: 1600, Q10: 800, Q11: 400 },
        { Color: color, Shape: "R", Fsize: 1.00, Tsize: 1.49, Q1: 8500, Q2: 8000, Q3: 7500, Q4: 7000, Q5: 6500, Q6: 6000, Q7: 5000, Q8: 4000, Q9: 2500, Q10: 1200, Q11: 600 },
    ]),
];

// Discount Rap Rates (Percentage Discount)
// Using sample data + mock row for 0.15ct example
const DISCOUNT_RAP_RATES = [
    // Mock row for 0.14 - 0.17 size to support the 0.15ct example with 3% discount
    {
        Color: "F",
        Date: "01/02/26",
        Fsize: 0.14,
        Tsize: 0.17,
        Shape: "R",
        Q1: 3, Q2: 3, Q3: 3, Q4: 3, Q5: 3, Q6: 3, Q7: 3, Q8: 3, Q9: 3, Q10: 3, Q11: 3
    },
    // The exact row from the image
    {
        Color: "F",
        Date: "01/02/26",
        Fsize: 0.18,
        Tsize: 0.22,
        Shape: "R",
        Q1: 3, Q2: 3, Q3: 3, Q4: 3, Q5: 3, Q6: 3, Q7: 3, Q8: 3, Q9: 3, Q10: 3, Q11: 3
    }
];

module.exports = {
    CLARITY_MAPPING,
    ORIGINAL_RAP_RATES,
    DISCOUNT_RAP_RATES
};
