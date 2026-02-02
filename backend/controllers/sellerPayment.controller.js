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

        // 2. Process Allocations (Auto-Allocate if missing)
        let finalAllocations = allocations || [];

        // Auto-Allocation Logic
        if (finalAllocations.length === 0) {
            const unpaidDiamonds = await Diamond.findAll({
                where: {
                    seller_id: seller_id,
                    payment_status: { [db.Sequelize.Op.ne]: 'paid' }
                },
                order: [['payment_due_date', 'ASC'], ['buy_date', 'ASC'], ['createdAt', 'ASC']],
                transaction: t
            });

            let remainingPayment = parseFloat(amount);

            for (const d of unpaidDiamonds) {
                if (remainingPayment <= 0.01) break;

                const buyPrice = parseFloat(d.buy_price || 0);
                const paidAmt = parseFloat(d.paid_amount || 0);
                const due = buyPrice - paidAmt;

                if (due <= 0) continue;

                let allocAmt = 0;
                if (remainingPayment >= due) {
                    allocAmt = due;
                    remainingPayment -= due;
                } else {
                    allocAmt = remainingPayment;
                    remainingPayment = 0;
                }

                finalAllocations.push({
                    diamond_id: d.id,
                    amount: allocAmt
                });
            }
        }

        // Apply Allocations
        if (finalAllocations.length > 0) {
            for (const alloc of finalAllocations) {
                const { diamond_id, amount: allocAmount } = alloc;

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
                    // Tolerance for floating point
                    if (newPaidAmount >= buyPrice - 0.01 && buyPrice > 0) {
                        status = 'paid';
                    } else if (newPaidAmount <= 0.01) {
                        status = 'unpaid';
                    }

                    await diamond.update({
                        paid_amount: newPaidAmount,
                        payment_status: status
                    }, { transaction: t });
                }
            }
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
