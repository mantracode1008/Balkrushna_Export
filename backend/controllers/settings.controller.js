const db = require("../models");
const Settings = db.settings;

exports.get = async (req, res) => {
    try {
        const key = req.params.key;
        const setting = await Settings.findByPk(key);
        if (!setting) {
            // Return defaults if not found
            if (key === 'invoice_layout') {
                return res.send({
                    columns: ['No', 'Description', 'Certificate', 'Shape', 'Color', 'Clarity', 'Cut', 'Polish', 'Symmetry', 'Fluorescence', 'Lab', 'Depth_Pct', 'Table_Pct', 'Price', 'Discount', 'Net_Price', 'Amount']
                });
            }
            return res.send({});
        }
        res.send(setting.value);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const key = req.params.key;
        const value = req.body;

        const [setting, created] = await Settings.upsert({
            key: key,
            value: value
        });

        res.send({ message: "Settings updated successfully", setting });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};
