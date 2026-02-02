const db = require("../models");
const Seller = db.sellers;
const Op = db.Sequelize.Op;
const Diamond = db.diamonds;
const SellerPayment = db.sellerPayments;

// Create
exports.create = async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).send({ message: "Seller name cannot be empty." });
        }

        const seller = {
            name: req.body.name,
            company: req.body.company,
            email: req.body.email,
            mobile: req.body.mobile,
            address: req.body.address,
            gst_no: req.body.gst_no,
            created_by: req.userId
        };

        const data = await Seller.create(seller);
        res.send(data);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error creating Seller." });
    }
};

// Find All (with Total Due calculation)
exports.findAll = async (req, res) => {
    try {
        const name = req.query.name;
        var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

        const sellers = await Seller.findAll({
            where: condition,
            include: [
                { model: db.admins, as: 'creator', attributes: ['id', 'username', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Add stats if requested
        if (req.query.includeStats === 'true') {
            const sellersWithStats = await Promise.all(sellers.map(async (seller) => {
                const s = seller.toJSON();

                // 1. Total Purchased (Source of Truth: Diamonds with a buy_price)
                const totalPurchased = await Diamond.sum('buy_price', {
                    where: { seller_id: seller.id }
                }) || 0;

                // 2. Total Paid (Source of Truth: SellerPayments)
                const totalPaid = await SellerPayment.sum('amount', {
                    where: { seller_id: seller.id }
                }) || 0;

                // 3. Total Due
                // Due is simply Purchased - Paid.
                // We do NOT use diamond.paid_amount sum because unallocated payments might exist.
                const totalDue = totalPurchased - totalPaid;

                // 4. Earliest Due Date & Pending Count
                // For this we check diamonds that effectively have an unpaid balance.
                // Since we rely on global payment sum, we approximate "pending diamonds"
                // by checking those where buy_price > paid_amount in the diamond record.
                // This assumes payments are allocated. If not, this might be slightly off count-wise,
                // but totals are correct.

                const diamonds = await Diamond.findAll({
                    where: {
                        seller_id: seller.id,
                        [Op.and]: [
                            Sequelize.where(Sequelize.col('buy_price'), '>', Sequelize.col('paid_amount'))
                        ]
                    },
                    attributes: ['payment_due_date']
                });

                let earliestDueDate = null;
                diamonds.forEach(d => {
                    if (d.payment_due_date) {
                        const due = new Date(d.payment_due_date);
                        if (!earliestDueDate || due < earliestDueDate) {
                            earliestDueDate = due;
                        }
                    }
                });

                s.total_purchased = parseFloat(totalPurchased).toFixed(2);
                s.total_paid = parseFloat(totalPaid).toFixed(2);
                s.total_due = parseFloat(totalDue).toFixed(2);
                s.earliest_due_date = earliestDueDate ? earliestDueDate.toISOString().split('T')[0] : null;
                s.pending_diamonds_count = diamonds.length;

                return s;
            }));
            res.send(sellersWithStats);
        } else {
            res.send(sellers);
        }
    } catch (err) {
        console.error("Error in findAll sellers:", err);
        res.status(500).send({ message: err.message || "Error retrieving Sellers." });
    }
};

// Find One
exports.findOne = async (req, res) => {
    const id = req.params.id;
    try {
        const data = await Seller.findByPk(id);
        if (data) res.send(data);
        else res.status(404).send({ message: `Cannot find Seller with id=${id}.` });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving Seller with id=" + id });
    }
};

// Update
exports.update = async (req, res) => {
    const id = req.params.id;
    try {
        const num = await Seller.update(req.body, { where: { id: id } });
        if (num == 1) res.send({ message: "Seller was updated successfully." });
        else res.send({ message: `Cannot update Seller with id=${id}. Maybe Seller was not found or req.body is empty!` });
    } catch (err) {
        res.status(500).send({ message: "Error updating Seller with id=" + id });
    }
};

// Delete
exports.delete = async (req, res) => {
    const id = req.params.id;
    try {
        // Check dependencies
        const diamondCount = await Diamond.count({ where: { seller_id: id } });
        if (diamondCount > 0) {
            return res.status(400).send({ message: "Cannot delete seller. They have linked diamonds." });
        }

        const num = await Seller.destroy({ where: { id: id } });
        if (num == 1) res.send({ message: "Seller was deleted successfully!" });
        else res.send({ message: `Cannot delete Seller with id=${id}. Maybe Seller was not found!` });
    } catch (err) {
        res.status(500).send({ message: "Could not delete Seller with id=" + id });
    }
};
// Get Overdue / Outstanding Sellers
exports.getOverdueSellers = async (req, res) => {
    try {
        // Fetch all sellers
        const sellers = await Seller.findAll({
            include: [
                { model: db.admins, as: 'creator', attributes: ['name'] }
            ]
        });

        // Calculate dues for each
        const reportData = await Promise.all(sellers.map(async (seller) => {
            // 1. Total Purchases
            const totalPurchases = await Diamond.sum('buy_price', {
                where: { seller_id: seller.id, status: { [Op.ne]: 'deleted' } } // Assuming soft delete or similar
            }) || 0;

            // 2. Total Paid
            const totalPaid = await SellerPayment.sum('amount', {
                where: { seller_id: seller.id }
            }) || 0;

            const due = totalPurchases - totalPaid;

            if (due > 0.5) { // Filter distinct 0 (floating point safety)
                return {
                    id: seller.id,
                    name: seller.name,
                    company: seller.company,
                    mobile: seller.mobile,
                    totalPurchases,
                    totalPaid,
                    dueAmount: due
                };
            }
            return null;
        }));

        const overdue = reportData.filter(x => x !== null);
        res.send(overdue);

    } catch (err) {
        console.error("Error fetching overdue sellers:", err);
        res.status(500).send({ message: err.message });
    }
};
