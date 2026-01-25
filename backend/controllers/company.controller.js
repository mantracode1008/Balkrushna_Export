const db = require("../models");
const Company = db.companies;
const Op = db.Sequelize.Op;

// Retrieve all Companies from the database.
exports.findAll = (req, res) => {
    const name = req.query.name;
    var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

    Company.findAll({ where: condition, order: [['name', 'ASC']] })
        .then(data => {
            const names = data.map(c => c.name); // Just return array of names mostly
            res.send(names);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving companies."
            });
        });
};

// Create a new Company (Internal Use mostly, but exposed if needed)
exports.create = (req, res) => {
    if (!req.body.name) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    const company = {
        name: req.body.name,
        created_by: req.userId
    };

    Company.create(company)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Company."
            });
        });
};
