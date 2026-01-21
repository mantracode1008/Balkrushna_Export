
// 1. Fluorescence Mapping (FloName -> DisplayName)
const FLUORESCENCE_MAPPING = {
    "None": "N",
    "Faint": "F",
    "Medium": "M",
    "Strong": "S",
    "Very Strong": "VS"
};

// 2. Shape Mapping (Code -> Shape Name -> Shape Display)
// Note: 'Code' is not unique, so we store this as an array of objects.
const SHAPE_MAPPING = [
    { code: "AS", shapeName: "ASSCHER", shapeDisplay: "Asscher" },
    { code: "CU", shapeName: "Cushion Modified Brilliant", shapeDisplay: "Rectangular" },
    { code: "RD", shapeName: "Cut Cornered Rectangular Modified Brilliant", shapeDisplay: "Rectangular" },
    { code: "EM", shapeName: "Emerald Cut", shapeDisplay: "EMERALD" },
    { code: "HR", shapeName: "Heart Brilliant", shapeDisplay: "Heart" },
    { code: "MQ", shapeName: "Marquise Brilliant", shapeDisplay: "MARQUISE" },
    { code: "OV", shapeName: "Oval Modified Brilliant", shapeDisplay: "Oval" },
    { code: "PE", shapeName: "Pear Modified Brilliant", shapeDisplay: "PEAR" },
    { code: "PR", shapeName: "Princess Cut", shapeDisplay: "Pear" }, // As per user request: "Princess Cut" -> "Pear"
    { code: "R", shapeName: "ROUND Rose Cut", shapeDisplay: "ROUND Rose" },
    { code: "CU", shapeName: "Square Cushion Modified Brilliant", shapeDisplay: "Cushion Modified Brilliant" },
    { code: "EM", shapeName: "Square Emerald Cut", shapeDisplay: "Emerald Cut" }
];

// Helper to get Shape Display by Shape Name (if needed)
// const getShapeDisplayByName = (name) => SHAPE_MAPPING.find(s => s.shapeName === name)?.shapeDisplay || name;

// 3. Cut Grade Master
const CUT_GRADE_MASTER = {
    "Ex": "Excellent",
    "vg": "Very Good",
    "Gd": "Good"
};

// 4. Polish Grade Master (Same structure as Cut Grade)
const POLISH_GRADE_MASTER = {
    "Ex": "Excellent",
    "vg": "Very Good",
    "Gd": "Good"
};

// 5. Symmetry Grade Master (Same structure as above)
const SYMMETRY_GRADE_MASTER = {
    "Ex": "Excellent",
    "vg": "Very Good",
    "Gd": "Good"
};

module.exports = {
    FLUORESCENCE_MAPPING,
    SHAPE_MAPPING,
    CUT_GRADE_MASTER,
    POLISH_GRADE_MASTER,
    SYMMETRY_GRADE_MASTER
};
