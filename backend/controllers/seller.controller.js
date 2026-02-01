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

        // For summary view, we might want to calculate totals "on the fly" or fetch via separate aggregation query.
        // For MVP, simple list is fine. Advanced: Add purchase/payment sums.

        // Let's add simple stats if requested
        if (req.query.includeStats === 'true') {
            const sellersWithStats = await Promise.all(sellers.map(async (seller) => {
                const s = seller.toJSON();
                // Total Purchased
                const diamonds = await Diamond.findAll({
                    where: { seller_id: seller.id },
                    attributes: ['buy_price', 'paid_amount', 'payment_due_date']
                });

                let totalPurchased = 0;
                let totalPaid = 0;
                let totalDue = 0;
                let earliestDueDate = null;
                let pendingDiamondsCount = 0;

                diamonds.forEach(d => {
                    const buyPrice = parseFloat(d.buy_price || 0);
                    const paidAmount = parseFloat(d.paid_amount || 0);
                    const due = buyPrice - paidAmount;

                    totalPurchased += buyPrice;
                    totalPaid += paidAmount;

                    if (due > 0.01) { // Has outstanding due
                        totalDue += due;
                        pendingDiamondsCount++;

                        // Track earliest due date
                        if (d.payment_due_date) {
                            const dueDate = new Date(d.payment_due_date);
                            if (!earliestDueDate || dueDate < earliestDueDate) {
                                earliestDueDate = dueDate;
                            }
                        }
                    }
                });

                s.total_purchased = totalPurchased;
                s.total_paid = totalPaid;
                s.total_due = totalDue;
                s.earliest_due_date = earliestDueDate ? earliestDueDate.toISOString().split('T')[0] : null;
                s.pending_diamonds_count = pendingDiamondsCount;

                return s;
            }));
            res.send(sellersWithStats);
        } else {
            res.send(sellers);
        }
    } catch (err) {
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
