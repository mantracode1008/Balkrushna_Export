const multer = require("multer");
const fs = require('fs');

// Ensure uploads dir
const uploadDir = __basedir + '/uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const csvFilter = (req, file, cb) => {
    console.log("Upload Filter | MimeType:", file.mimetype, "| OriginalName:", file.originalname);
    if (file.mimetype.includes("csv") ||
        file.mimetype.includes("officedocument") ||
        file.mimetype.includes("excel") ||
        file.mimetype.includes("spreadsheet") ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.csv')) {
        cb(null, true);
    } else {
        console.warn("Upload Filter | Rejected:", file.mimetype);
        cb("Please upload only csv or xlsx file.", false);
    }
};

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __basedir + "/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-bezkoder-${file.originalname}`);
    },
});

var uploadFile = multer({ storage: storage, fileFilter: csvFilter });
module.exports = uploadFile;
