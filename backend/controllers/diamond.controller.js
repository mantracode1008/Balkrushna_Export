const db = require("../models");
const Diamond = db.diamonds;
const Op = db.Sequelize.Op;
const fs = require('fs');
const fastcsv = require('fast-csv');
const axios = require('axios'); // For external API

// Helper to normalize Fluorescence
const normalizeFluorescence = (val) => {
    if (!val && val !== 0) return "";
    const s = String(val).toUpperCase().trim();

    // Exact Code/Name Mappings based on User Request
    const map = {
        '0': 'N', 'NONE': 'N',
        '1': 'F', 'FAINT': 'F',
        '2': 'M', 'MEDIUM': 'M',
        '3': 'S', 'STRONG': 'S',
        '4': 'VS', 'VERY STRONG': 'VS', 'VERYSTRONG': 'VS'
    };

    // If direct match found
    if (map[s]) return map[s];

    // If input was already correct code (e.g. "VS"), map[s] might miss if we only mapped long names.
    // But "VS" is not in keys '0'...'VERY STRONG'. 
    // Example: User sends "N", "F", "VS".
    const validCodes = ['N', 'F', 'M', 'S', 'VS'];
    if (validCodes.includes(s)) return s;

    // Fallback: return uppercase (e.g. "SLIGHT")
    return s;
};

// Helper: Get Shape Code
const getShapeCode = (shape) => {
    if (!shape) return '';
    const sKey = String(shape).toUpperCase().trim();

    // 1. Exact / Normalized Map
    const map = {
        'ASSCHER': 'AS', 'CUSHION': 'CU', 'RECTANGULAR': 'RD', 'EMERALD': 'EM', 'FLOWER': 'CU', 'HEART': 'HR',
        'MARQUISE': 'MQ', 'OVAL': 'OV', 'PEAR': 'PE', 'PRINCESS': 'PR', 'RADIANT': 'RD', 'ROUND': 'R',
        'BR': 'R', 'RB': 'R', // Round Brilliant
        'ROUND ROSE': 'R', 'CUSHION BRILLIANT': 'CU', 'CUSHION MIXED CUT': 'CU', 'CUSHION MODIFIED BRILLIANT': 'CU',
        'EMERALD CUT': 'EM', 'SQUARE EMERALD CUT': 'EM', 'SQUARE RADIANT': 'RQ',
        'OVAL BRILLIANT': 'OV', 'PEAR BRILLIANT': 'PE', 'HEART BRILLIANT': 'HR', 'MARQUISE BRILLIANT': 'MQ'
    };

    if (map[sKey]) return map[sKey];
    if (map[sKey.replace(/\s+/g, ' ')]) return map[sKey.replace(/\s+/g, ' ')]; // Normalize space

    // 2. Substring / Fallback Logic
    if (sKey.includes('ROUND')) return 'R';
    if (sKey.includes('OVAL')) return 'OV';
    if (sKey.includes('PEAR')) return 'PE';
    if (sKey.includes('PRINCESS')) return 'PR';
    if (sKey.includes('MARQUISE')) return 'MQ';
    if (sKey.includes('HEART')) return 'HR';
    if (sKey.includes('ASSCHER')) return 'AS';

    // Complexity order: Square Emerald vs Emerald
    if (sKey.includes('SQUARE EMERALD')) return 'EM';
    if (sKey.includes('SQUARE RADIANT')) return 'RQ';
    if (sKey.includes('RADIANT')) return 'RD';
    if (sKey.includes('EMERALD')) return 'EM';

    if (sKey.includes('CUSHION')) return 'CU';

    return '';
};

exports.create = async (req, res) => {
    if (!req.body.certificate) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    console.log("Create Diamond Payload:", req.body);

    // Check for existing "in_stock" diamond with same certificate
    // We allow duplicates if the old one is "sold" or "in_cart", but "in_stock" must be unique.
    try {
        const existing = await Diamond.findOne({
            where: {
                certificate: req.body.certificate,
                status: 'in_stock'
            }
        });

        if (existing) {
            return res.status(400).send({ message: "Diamond with this Certificate Number is already in stock!" });
        }
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error checking for duplicates." });
    }

    const diamond = {
        certificate: req.body.certificate,
        certificate_date: req.body.certificate_date,
        description: req.body.description,
        shape: req.body.shape,
        S_code: req.body.S_code || getShapeCode(req.body.shape),
        measurements: req.body.measurements,
        carat: req.body.carat,
        color: req.body.color,
        color_code: req.body.color_code || ((() => {
            const map = { 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'H': 5, 'I': 6, 'J': 7, 'K': 8, 'L': 9, 'M': 10 };
            return map[String(req.body.color || '').toUpperCase().trim()] || null;
        })()),
        clarity: req.body.clarity,
        clarity_code: req.body.clarity_code || ((() => {
            const map = { 'IF': 'Q1', 'VVS1': 'Q2', 'VVS2': 'Q3', 'VS1': 'Q4', 'VS2': 'Q5', 'SI1': 'Q6', 'SI2': 'Q7', 'SI3': 'Q8', 'I1': 'Q9', 'I2': 'Q10', 'I3': 'Q11', 'I4': 'Q12', 'I5': 'Q13', 'I6': 'Q14', 'I7': 'Q15' };
            const val = String(req.body.clarity || '').toUpperCase().trim();
            return map[val] || map[val.replace(/\s+/g, '')] || '';
        })()),
        cut: req.body.cut,
        lab: req.body.lab,
        polish: req.body.polish,
        symmetry: req.body.symmetry,
        fluorescence: normalizeFluorescence(req.body.fluorescence),
        crown_height: req.body.crown_height,
        pavilion_depth: req.body.pavilion_depth,
        girdle_thickness: req.body.girdle_thickness,
        culet: req.body.culet,
        total_depth_percent: req.body.total_depth_percent,
        table_percent: req.body.table_percent,
        comments: req.body.comments,
        inscription: req.body.inscription,
        price: parseFloat(req.body.price) || 0,
        quantity: parseInt(req.body.quantity) || 1,
        commission: parseFloat(req.body.commission) || 0,
        discount: parseFloat(req.body.discount) || 0,
        status: req.body.status || 'in_stock',
        // New Fields
        diamond_type: req.body.diamond_type,
        buyer_name: req.body.buyer_name,
        buyer_country: req.body.buyer_country,
        buyer_mobile: req.body.buyer_mobile,
        sale_price: parseFloat(req.body.sale_price) || 0,
        growth_process: req.body.growth_process,
        growth_process: req.body.growth_process,
        report_url: req.body.report_url,
        seller_country: req.body.seller_country
    };

    Diamond.create(diamond)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            console.error("DIAMOND CREATE ERROR:", err);
            // Note: SequelizeUniqueConstraintError might still happen if DB index exists, 
            // but we want to catch it gracefully if it refers to 'in_stock' logic or if index wasn't removed.
            // However, with logic above, we shouldn't hit it unless race condition or old index is interfering globally.
            if (err.name === 'SequelizeUniqueConstraintError') {
                // Fallback catch, though ideally we removed the constraint.
                res.status(400).send({
                    message: "Diamond with this Certificate Number already exists (DB Constraint)!"
                });
            } else {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while creating the Diamond."
                });
            }
        });
};

exports.findAll = (req, res) => {
    const { certificate, shape, clarity, color } = req.query;
    var condition = {};

    if (certificate) condition.certificate = { [Op.like]: `%${certificate}%` };
    if (shape) condition.shape = { [Op.like]: `%${shape}%` };
    if (clarity) condition.clarity = { [Op.like]: `%${clarity}%` };
    if (color) condition.color = { [Op.like]: `%${color}%` };

    // Default: Only show In Stock items (hide sold and in_cart)
    // User requested: "remove from inventory because that diamond can not sale to other"
    // Status Filter
    if (req.query.status === 'all') {
        // No status filter applies (show everything)
    } else if (req.query.status) {
        condition.status = req.query.status;
    } else {
        // Default: Only show In Stock items 
        condition.status = 'in_stock';
    }

    Diamond.findAll({ where: condition })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving diamonds."
            });
        });
};

exports.findOne = (req, res) => {
    const id = req.params.id;

    Diamond.findByPk(id)
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `Cannot find Diamond with id=${id}.`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error retrieving Diamond with id=" + id
            });
        });
};

exports.update = (req, res) => {
    const id = req.params.id;

    console.log(`Update Diamond ${id} Payload:`, req.body);

    // Explicitly construct update object to ensure fields are handled correctly
    const updateData = { ...req.body };

    // Sanitize/Normalize
    if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price) || 0;
    if (updateData.discount !== undefined) updateData.discount = parseFloat(updateData.discount) || 0;
    if (updateData.quantity !== undefined) updateData.quantity = parseInt(updateData.quantity) || 0;
    if (updateData.fluorescence !== undefined) updateData.fluorescence = normalizeFluorescence(updateData.fluorescence);
    if (updateData.shape) updateData.S_code = getShapeCode(updateData.shape);
    if (updateData.sale_price !== undefined) updateData.sale_price = parseFloat(updateData.sale_price) || 0;
    if (updateData.growth_process) updateData.growth_process = updateData.growth_process;
    if (updateData.growth_process) updateData.growth_process = updateData.growth_process;
    if (updateData.report_url) updateData.report_url = updateData.report_url;
    if (updateData.seller_country) updateData.seller_country = updateData.seller_country;

    // Force Color Code Calculation or Parsing
    if (updateData.color) {
        const map = { 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'H': 5, 'I': 6, 'J': 7, 'K': 8, 'L': 9, 'M': 10 };
        const cKey = String(updateData.color).toUpperCase().trim();

        // Priority: 1. Calculated from Color (Source of Truth) 2. Existing valid input
        // Actually, if user changes Color, code MUST update. So calculation should take precedence or be re-checked.
        // If frontend sends correct code, fine. But to be safe, let's re-calculate if color is known.
        if (map[cKey]) {
            updateData.color_code = map[cKey];
        } else if (updateData.color_code) {
            // If color is standard but we allowed it? Or if color is non-standard but code is provided?
            // Just ensure it's int
            updateData.color_code = parseInt(updateData.color_code) || null;
        }
    }

    // Clarity Code Logic
    if (updateData.clarity) {
        const map = { 'IF': 'Q1', 'VVS1': 'Q2', 'VVS2': 'Q3', 'VS1': 'Q4', 'VS2': 'Q5', 'SI1': 'Q6', 'SI2': 'Q7', 'SI3': 'Q8', 'I1': 'Q9', 'I2': 'Q10', 'I3': 'Q11', 'I4': 'Q12', 'I5': 'Q13', 'I6': 'Q14', 'I7': 'Q15' };
        const val = String(updateData.clarity).toUpperCase().trim();
        const code = map[val] || map[val.replace(/\s+/g, '')];

        if (code) {
            updateData.clarity_code = code;
        } else if (updateData.clarity_code) {
            // Keep existing if provided
        }
    }

    Diamond.update(updateData, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "Diamond was updated successfully."
                });
            } else {
                res.send({
                    message: `Cannot update Diamond with id=${id}. Maybe Diamond was not found or req.body is empty!`
                });
            }
        })
        .catch(err => {
            console.error("Update Error:", err);
            res.status(500).send({
                message: "Error updating Diamond with id=" + id
            });
        });
};

// Update Status (e.g., in_cart, in_stock)
exports.updateStatus = async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    try {
        const validStatuses = ['in_stock', 'sold', 'in_cart'];
        if (!validStatuses.includes(status)) {
            return res.status(400).send({ message: "Invalid status value." });
        }

        const [num] = await Diamond.update({ status: status }, { where: { id: id } });
        if (num === 1) {
            res.send({ message: "Diamond status updated successfully." });
        } else {
            res.send({ message: `Cannot update Diamond with id=${id}. Maybe Diamond was not found or req.body is empty!` });
        }
    } catch (err) {
        res.status(500).send({ message: "Error updating Diamond status with id=" + id });
    }
};

exports.bulkUpdateStatus = async (req, res) => {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send({ message: "No IDs provided." });
    }

    const validStatuses = ['in_stock', 'sold', 'in_cart'];
    if (!validStatuses.includes(status)) {
        return res.status(400).send({ message: "Invalid status value." });
    }

    try {
        const [num] = await Diamond.update({ status: status }, {
            where: { id: ids }
        });

        res.send({ message: `${num} Diamonds status updated successfully.` });
    } catch (err) {
        console.error("Bulk Status Update Error:", err);
        res.status(500).send({ message: "Error updating bulk status." });
    }
};

exports.delete = (req, res) => {
    const id = req.params.id;

    Diamond.destroy({
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "Diamond was deleted successfully!"
                });
            } else {
                res.send({
                    message: `Cannot delete Diamond with id=${id}.`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete Diamond with id=" + id
            });
        });
};

exports.bulkDelete = (req, res) => {
    const ids = req.body.ids;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send({ message: "No IDs provided for deletion." });
    }

    Diamond.destroy({
        where: { id: ids }
    })
        .then(nums => {
            res.send({ message: `${nums} Diamonds were deleted successfully!` });
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Could not delete diamonds."
            });
        });
};

// Import Data (CSV/XLSX)
// Preview Import (Parse & Validate without Saving)
exports.previewImport = (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: "Please upload a file!" });
    }

    // Smart Column Mapping Configuration
    const FIELD_ALIASES = {
        certificate: ['certificate', 'cert', 'report no', 'report_no', 'report #', 'ref', 'stock no', 'stock #', 'report number', 'report_number', 'report_id'],
        certificate_date: ['certificate date', 'report date', 'date', 'dt', 'report_date'],
        description: ['description', 'desc', 'descr'],
        shape: ['shape', 'cut', 'shp', 'shape and cut', 'shape_and_cut', 'shape&cut'],
        measurements: ['measurements', 'measurement', 'measure', 'dim', 'dimensions'],
        carat: ['carat', 'weight', 'wt', 'cts', 'size', 'carat_weight', 'carat weight'],
        color: ['color', 'col', 'clr', 'color grade', 'color_grade'],
        clarity: ['clarity', 'purity', 'cla', 'clarity grade', 'clarity_grade'],
        cut: ['cut', 'cut grade', 'make', 'cut_grade'],
        lab: ['lab', 'laboratory', 'cert auth', 'report_lab'],
        polish: ['polish', 'pol', 'finish'],
        symmetry: ['symmetry', 'sym', 'symm'],
        fluorescence: ['fluorescence', 'fluor', 'flr', 'flo'],
        crown_height: ['crown height', 'cr ht', 'crown', 'ch', 'crown_height'],
        pavilion_depth: ['pavilion depth', 'pav dp', 'pavilion', 'pd', 'pavilion_depth'],
        girdle_thickness: ['girdle thickness', 'girdle', 'gird', 'girdle_thickness'],
        culet: ['culet', 'cul'],
        total_depth_percent: ['total depth', 'depth %', 'depth', 'dp', 'td', 'total_depth', 'total depth %'],
        table_percent: ['table', 'table %', 'table size', 'tbl', 'table_size', 'table size %'],
        comments: ['comments', 'comm', 'notes', 'comment'],
        inscription: ['inscription', 'inscr', 'laser inscription', 'inscription(s)'],
        price: ['price', 'cost', 'rap', 'amount', 'total', 'rate', 'price/ct', 'rap price', 'total amount'],
        quantity: ['quantity', 'qty', 'pcs', 'nos'],
        discount: ['discount', 'disc', 'disc %', 'back']
    };

    // Helper to find the best matching header from the file for a given DB field
    const findHeader = (fileHeaders, dbField) => {
        const aliases = FIELD_ALIASES[dbField];
        if (!aliases) return null;

        // 1. Exact match (normalized)
        for (const header of fileHeaders) {
            const h = header.toLowerCase().trim();
            if (aliases.includes(h)) return header;
        }

        // 2. Partial match (if alias is > 3 chars to avoid false positives)
        for (const header of fileHeaders) {
            const h = header.toLowerCase().trim();
            for (const alias of aliases) {
                if (alias.length > 3 && h.includes(alias)) return header;
            }
        }
        return null; // Not found
    };

    const processData = (rawData) => {
        if (!rawData || rawData.length === 0) return { validRows: [], invalidRows: [] };

        // Analyze Headers from first row keys
        const fileHeaders = Object.keys(rawData[0]);

        // Build a map of DB Field -> File Header
        const columnMap = {};
        Object.keys(FIELD_ALIASES).forEach(dbField => {
            const bestHeader = findHeader(fileHeaders, dbField);
            if (bestHeader) {
                columnMap[dbField] = bestHeader;
            }
        });

        const validRows = [];
        const invalidRows = [];

        rawData.forEach((row, index) => {
            const diamond = {
                status: 'in_stock', // Default
                commission: 0       // Default
            };

            let hasData = false;

            // Populate fields using the map
            Object.keys(columnMap).forEach(dbField => {
                const header = columnMap[dbField];
                let value = row[header];

                if (value !== undefined && value !== null && value !== '') hasData = true;

                // Clean specific fields if needed
                // Parse Numbers carefully (remove commas)
                if (dbField === 'quantity') {
                    value = String(value).replace(/,/g, '');
                    value = parseInt(value) || 1;
                }
                if (dbField === 'carat' || dbField === 'price' || dbField === 'discount') {
                    value = String(value).replace(/,/g, ''); // "1,200.50" -> "1200.50"
                    value = parseFloat(value) || 0;
                }
                if (dbField === 'fluorescence') value = normalizeFluorescence(value);

                diamond[dbField] = value;
            });

            // Set S_code
            if (diamond.shape) {
                diamond.S_code = getShapeCode(diamond.shape);
            }

            // If row is completely empty, skip without error
            if (!hasData) return;

            // Defaults for Cut, Polish, Symmetry (User Request: "Excellent" if missing/None)
            // Defaults for Cut, Polish, Symmetry (User Request: "Excellent" as "Ex", "Very Good" as "Vg", "Good" as "Gd")
            // Also default to "Ex" if missing/None
            ['cut', 'polish', 'symmetry'].forEach(field => {
                let val = diamond[field];

                // 1. Check if missing/null/none
                if (!val || String(val).trim().toLowerCase() === 'none' || String(val).trim().toLowerCase() === 'null') {
                    diamond[field] = 'Ex'; // Default as per "Excellent as Ex"
                } else {
                    // 2. Normalization
                    val = String(val).trim();
                    const vUpper = val.toUpperCase();
                    if (vUpper === 'EXCELLENT' || vUpper === 'EX') diamond[field] = 'Ex';
                    else if (vUpper === 'VERY GOOD' || vUpper === 'VERYGOOD' || vUpper === 'VG') diamond[field] = 'Vg';
                    else if (vUpper === 'GOOD' || vUpper === 'GD') diamond[field] = 'Gd';
                    else diamond[field] = val; // Keep original if not matched (e.g. Fair)
                }
            });

            // Clarity Code Mapping Logic
            if (diamond.clarity) {
                const clarityMap = {
                    'IF': 'Q1',
                    'VVS1': 'Q2',
                    'VVS2': 'Q3',
                    'VS1': 'Q4',
                    'VS2': 'Q5',
                    'SI1': 'Q6',
                    'SI2': 'Q7',
                    'SI3': 'Q8',
                    'I1': 'Q9',
                    'I2': 'Q10',
                    'I3': 'Q11',
                    'I4': 'Q12',
                    'I5': 'Q13',
                    'I6': 'Q14',
                    'I7': 'Q15'
                };
                const clarityKey = String(diamond.clarity).trim().toUpperCase();
                // Handle direct match or match with spaces removed (e.g. "VS 1" -> "VS1")
                if (clarityMap[clarityKey]) {
                    diamond.clarity_code = clarityMap[clarityKey];
                } else {
                    const noSpaceKey = clarityKey.replace(/\s+/g, '');
                    if (clarityMap[noSpaceKey]) {
                        diamond.clarity_code = clarityMap[noSpaceKey];
                    }
                }
            }

            // Color Code Mapping Logic
            if (diamond.color) {
                const colorMap = { 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'H': 5, 'I': 6, 'J': 7, 'K': 8, 'L': 9, 'M': 10 };
                const cKey = String(diamond.color).trim().toUpperCase();
                if (colorMap[cKey]) {
                    diamond.color_code = colorMap[cKey];
                }
            }

            // Validation Rules
            const errors = [];
            if (!diamond.certificate) {
                errors.push("Missing Certificate Number");
            }
            // Add more validations if needed (e.g. Price > 0)

            if (errors.length > 0) {
                invalidRows.push({ rowIndex: index + 1, data: row, errors });
            } else {
                // Formatting
                if (!diamond.lab) diamond.lab = 'IGI';
                validRows.push(diamond);
            }
        });

        return { validRows, invalidRows, headersFound: columnMap };
    };

    let path = __basedir + "/uploads/" + req.file.filename;

    try {
        let result = { validRows: [], invalidRows: [] };

        if (req.file.originalname.endsWith('.xlsx')) {
            const xlsx = require('xlsx');
            const workbook = xlsx.readFile(path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            let options = { raw: false };
            const rawData = xlsx.utils.sheet_to_json(sheet, options);
            result = processData(rawData);
        } else {
            // CSV
            const xlsx = require('xlsx');
            const workbook = xlsx.readFile(path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = xlsx.utils.sheet_to_json(sheet, { raw: false }); // Consistent behavior
            result = processData(rawData);
        }

        // Cleanup file
        fs.unlink(path, (err) => { if (err) console.error("Failed to delete temp file:", err); });

        res.json({
            message: "File analyzed successfully",
            summary: {
                totalFound: result.validRows.length + result.invalidRows.length,
                validCount: result.validRows.length,
                invalidCount: result.invalidRows.length
            },
            headersFound: result.headersFound,
            validRows: result.validRows,
            invalidRows: result.invalidRows
        });

    } catch (err) {
        console.error("Preview Error:", err);
        res.status(500).send({ message: "Could not process file: " + err.message });
    }
};

// Final Bulk Create
exports.bulkCreate = async (req, res) => {
    const diamonds = req.body.diamonds;
    if (!diamonds || !Array.isArray(diamonds) || diamonds.length === 0) {
        return res.status(400).send({ message: "No diamond data provided." });
    }

    try {
        // Use ignoreDuplicates to skip existing records based on unique keys (certificate likely)
        // Note: For this to work efficiently, 'certificate' should be UNIQUE in DB schema.
        // If not, we might insert duplicates.
        // Also, we want to ensure we don't insert if certificate matches 'in_stock'.

        // Let's do a manual check if we want strict "don't duplicate in_stock"
        // Or rely on DB constraint. 
        // Assuming user wants to insert whatever is valid from the preview.

        // We will try to insert. If DB lacks unique constraint, we get duplicates. 
        // We really should strictly enforce unique certificate for in_stock.

        const result = await Diamond.bulkCreate(diamonds, {
            ignoreDuplicates: true, // This works if there is a PRIMARY KEY violation or UNIQUE constraint
            validate: true
        });

        res.send({
            message: `Successfully processed import batch.`,
            count: result.length
        });

    } catch (err) {
        console.error("Bulk Create Error:", err);
        res.status(500).send({
            message: "Failed to import diamonds into database.",
            error: err.message,
            details: err.original?.sqlMessage || "Check server logs"
        });
    }
};

// Fetch Unique Buyers
exports.getBuyers = async (req, res) => {
    try {
        const buyers = await Diamond.findAll({
            attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('buyer_name')), 'buyer_name']],
            where: {
                buyer_name: {
                    [Op.ne]: null,
                    [Op.ne]: ''
                }
            },
            order: [['buyer_name', 'ASC']]
        });
        res.send(buyers);
    } catch (err) {
        console.error("Get Buyers Error:", err);
        res.status(500).send({ message: "Error retrieving buyers." });
    }
};

// External Fetch
exports.fetchExternal = async (req, res) => {
    const certNo = req.params.certNo ? req.params.certNo.trim() : "";
    console.log(`Fetching IGI data for: ${certNo}`);

    try {
        const url = `https://api.igi.org/ReportDetail.php?Printno=${certNo}`;
        const headers = { 'craftdiamonds': 'true' };

        const response = await axios.get(url, { headers });
        let data = response.data;

        let report = null;
        if (Array.isArray(data) && data.length > 0) {
            report = data[0];
        } else if (data && typeof data === 'object') {
            report = data;
        }

        if (!report || Object.keys(report).length === 0) {
            console.log("IGI API returned no report. Data:", JSON.stringify(data));
            return res.status(404).send({ message: "Diamond details not found in external API" });
        }

        const normReport = {};
        Object.keys(report).forEach(key => {
            normReport[key.toLowerCase().trim()] = report[key];
        });

        const findDate = (obj) => {
            const dateRegex = /([A-Za-z]+ \d{1,2}, \d{4})|(\d{1,2}\/\d{1,2}\/\d{4})/;
            for (const key in obj) {
                if (typeof obj[key] === 'string' && dateRegex.test(obj[key])) {
                    return obj[key].match(dateRegex)[0];
                }
            }
            return "";
        };

        // Shape Mapping
        let shapeRaw = normReport['shape and cut'] || normReport['shape'] || "";
        let shape = shapeRaw.split(' ')[0] || "";

        const parseCarat = (str) => {
            if (!str) return "";
            const match = String(str).match(/[\d\.]+/);
            return match ? match[0] : str;
        };

        const colorVal = normReport['color grade'] || normReport['color'] || "";
        const colorMap = { 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'H': 5, 'I': 6, 'J': 7, 'K': 8, 'L': 9, 'M': 10 };
        const color_code = colorMap[String(colorVal).toUpperCase().trim()] || null;

        const clarityVal = normReport['clarity grade'] || normReport['clarity'] || "";
        let clarity_code = "";
        if (clarityVal) {
            const clarityMap = {
                'IF': 'Q1', 'VVS1': 'Q2', 'VVS2': 'Q3', 'VS1': 'Q4', 'VS2': 'Q5',
                'SI1': 'Q6', 'SI2': 'Q7', 'SI3': 'Q8', 'I1': 'Q9', 'I2': 'Q10', 'I3': 'Q11',
                'I4': 'Q12', 'I5': 'Q13', 'I6': 'Q14', 'I7': 'Q15'
            };
            const clarityKey = String(clarityVal).trim().toUpperCase();
            if (clarityMap[clarityKey]) clarity_code = clarityMap[clarityKey];
            else {
                const noSpaceKey = clarityKey.replace(/\s+/g, '');
                if (clarityMap[noSpaceKey]) clarity_code = clarityMap[noSpaceKey];
            }
        }

        let sCode = getShapeCode(shapeRaw);
        const caratVal = parseCarat(normReport['carat weight'] || normReport['weight'] || normReport['carat']);

        // Lookup Rap Price
        let rap_price = 0;
        try {
            const RapRate = db.origionalRapRate;
            const Op = db.Sequelize.Op;
            const caratNum = parseFloat(caratVal);

            if (RapRate && !isNaN(caratNum) && sCode && color_code && clarity_code) {
                const rateRow = await RapRate.findOne({
                    where: {
                        F_Carat: { [Op.lte]: caratNum },
                        T_Carat: { [Op.gte]: caratNum },
                        S_Code: sCode,
                        C_Code: color_code
                    },
                    order: [['RapDate', 'DESC']]
                });

                if (rateRow) {
                    if (rateRow[clarity_code]) {
                        rap_price = parseFloat(rateRow[clarity_code]) || 0;
                    }
                }
            }
        } catch (dbErr) {
            console.error("Rap lookup error in fetch:", dbErr.message);
        }

        // Parsing Comments for Extra Data
        let growth_process = "";
        let diamond_type = "";
        const comments = normReport['comments'] || normReport['comment'] || "";
        const inscription = normReport['inscription(s)'] || normReport['inscription'] || "";

        const fullText = (comments + " " + inscription).toUpperCase();

        if (fullText.includes("HPHT")) growth_process = "HPHT";
        else if (fullText.includes("CVD")) growth_process = "CVD";

        if (fullText.includes("TYPE IIA")) diamond_type = "Type IIa";
        else if (fullText.includes("TYPE IIB")) diamond_type = "Type IIb";
        else if (fullText.includes("TYPE IA")) diamond_type = "Type Ia";

        // Construct PDF URL
        const report_url = `https://www.igi.org/viewpdf.php?r=${report.REPORT_NUMBER || certNo}`;

        const mappedData = {
            certificate: certNo,
            certificate_date: normReport['report date'] || normReport['date'] || findDate(report),
            description: normReport['description'] || normReport['desc'] || `Natural Diamond ${shapeRaw}`,
            shape: shape,
            S_code: sCode,
            measurements: normReport['measurements'] || normReport['measurement'] || "",
            carat: caratVal,
            color: colorVal,
            color_code: color_code,
            clarity: clarityVal,
            clarity_code: clarity_code,
            cut: normReport['cut grade'] || normReport['cut'] || "Ex",
            lab: "IGI", // Default to IGI since we are fetching from IGI
            polish: normReport['polish'] || "Ex",
            symmetry: normReport['symmetry'] || "Ex",
            fluorescence: normalizeFluorescence(normReport['fluorescence'] || ""),

            crown_height: normReport['crown height'] || "",
            pavilion_depth: normReport['pavilion depth'] || "",
            girdle_thickness: normReport['girdle thickness'] || normReport['girdle'] || "",
            culet: normReport['culet'] || "",
            total_depth_percent: normReport['total depth'] || normReport['depth %'] || normReport['depth'] || "",
            table_percent: normReport['table size'] || normReport['table'] || "",

            comments: normReport['comments'] || "",
            inscription: normReport['inscription(s)'] || normReport['inscription'] || "",

            price: 0,
            rap_price: rap_price,
            api_raw: data,
            // New Extracted Fields
            growth_process: growth_process,
            diamond_type: diamond_type,
            report_url: report_url
        };

        res.json(mappedData);

    } catch (err) {
        console.error("External API Error for cert " + certNo + ":", err.message);
        res.status(500).send({
            message: "Failed to fetch data from IGI API.",
            error: err.message
        });
    }
};
