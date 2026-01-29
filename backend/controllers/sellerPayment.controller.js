const db = require("../models");
const SellerPayment = db.sellerPayments;
const SellerPaymentAllocation = db.sellerPaymentAllocations;
const Diamond = db.diamonds;
const Seller = db.sellers; // For validation if needed

// Create Payment & Allocate
exports.create = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { seller_id, amount, payment_date, payment_mode, reference_number, notes, allocations } = req.body;
        // allocations: array of { diamond_id, amount }

        if (!seller_id || !amount) {
            return res.status(400).send({ message: "Seller and Amount are required." });
        }

        // 1. Create Payment Record
        const payment = await SellerPayment.create({
            seller_id,
            amount,
            payment_date: payment_date || new Date(),
            payment_mode,
            reference_number,
            notes,
            created_by: req.userId
        }, { transaction: t });

        // 2. Process Allocations
        if (allocations && allocations.length > 0) {
            let totalAllocated = 0;

            for (const alloc of allocations) {
                const { diamond_id, amount: allocAmount } = alloc;
                totalAllocated += parseFloat(allocAmount);

                // Create Allocation Record
                await SellerPaymentAllocation.create({
                    payment_id: payment.id,
                    diamond_id,
                    allocated_amount: parseFloat(allocAmount)
                }, { transaction: t });

                // Update Diamond Status
                const diamond = await Diamond.findByPk(diamond_id, { transaction: t });
                if (diamond) {
                    const newPaidAmount = parseFloat(diamond.paid_amount || 0) + parseFloat(allocAmount);
                    const buyPrice = parseFloat(diamond.buy_price || 0);

                    let status = 'partially_paid';
                    if (newPaidAmount >= buyPrice && buyPrice > 0) {
                        status = 'paid';
                    } else if (newPaidAmount <= 0) {
                        status = 'unpaid';
                    }

                    await diamond.update({
                        paid_amount: newPaidAmount,
                        payment_status: status
                    }, { transaction: t });
                }
            }

            // Validate total allocation doesn't exceed payment amount (optional, but good practice)
            // if (totalAllocated > parseFloat(amount)) ... warning? or just allow "over-allocation" error?
        }

        await t.commit();
        res.send(payment);

    } catch (err) {
        await t.rollback();
        console.error("Payment Creation Error:", err);
        res.status(500).send({ message: err.message || "Error creating payment." });
    }
};

// List Payments for a Seller
exports.findAll = async (req, res) => {
    try {
        const { seller_id } = req.query;
        const condition = seller_id ? { seller_id } : null;

        const payments = await SellerPayment.findAll({
            where: condition,
            include: [
                { model: db.sellers, as: 'seller', attributes: ['name', 'company'] },
                { model: db.admins, as: 'creator', attributes: ['name'] }
            ],
            order: [['payment_date', 'DESC']]
        });
        res.send(payments);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Determine available "Unpaid" diamonds for a seller
exports.getUnpaidDiamonds = async (req, res) => {
    try {
        const { seller_id } = req.query;
        if (!seller_id) return res.status(400).send({ message: "Seller ID required." });

        const diamonds = await Diamond.findAll({
            where: {
                seller_id: seller_id,
                payment_status: { [db.Sequelize.Op.ne]: 'paid' } // Not 'paid'
            },
            attributes: ['id', 'certificate', 'buy_price', 'paid_amount', 'payment_status', 'payment_due_date']
        });

        // Calculate remaining due for frontend convenience
        const result = diamonds.map(d => {
            const due = parseFloat(d.buy_price || 0) - parseFloat(d.paid_amount || 0);
            return {
                ...d.toJSON(),
                due_amount: due > 0 ? due : 0
            };
        });

        res.send(result);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};
