const db = require("../models");
const config = require("../config/db.config");
const Admin = db.admins;
const Op = db.Sequelize.Op;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
require('dotenv').config();

const MAX_ATTEMPTS = 5;

// 1. Verify PIN (Main Login)
exports.verifyPin = async (req, res) => {
    const { pin } = req.body;
    if (!pin) return res.status(400).send({ message: "PIN is required" });

    try {
        // Assuming single admin system or finding the main record
        // We can look up by the known mobile or just findOne if there's only one admin
        let admin = await Admin.findOne({ where: { mobile: "9023671902" } });

        // Fallback: if no specific admin, try finding ANY admin
        if (!admin) admin = await Admin.findOne();

        if (!admin) return res.status(404).send({ message: "System not initialized" });

        // Check Lockout
        if (admin.failed_attempts >= MAX_ATTEMPTS) {
            return res.status(423).send({
                message: "System Locked. Enter Admin Password to Reset.",
                isLocked: true
            });
        }

        // Verify PIN
        const isValid = bcrypt.compareSync(pin, admin.pin);

        if (!isValid) {
            admin.failed_attempts = (admin.failed_attempts || 0) + 1;
            await admin.save();
            const attemptsLeft = MAX_ATTEMPTS - admin.failed_attempts;

            if (attemptsLeft <= 0) {
                return res.status(423).send({
                    message: "Maximum attempts reached. System Locked.",
                    isLocked: true
                });
            }

            return res.status(401).send({
                message: `Incorrect PIN. ${attemptsLeft} attempts remaining.`,
                attemptsLeft: attemptsLeft
            });
        }

        // Success: Reset attempts
        admin.failed_attempts = 0;
        await admin.save();

        const token = jwt.sign({ id: admin.id, mobile: admin.mobile }, process.env.JWT_SECRET || "secret_key_123", {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).send({
            id: admin.id,
            accessToken: token,
            message: "Login Successful"
        });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 2. Admin Unlock (Recovery)
exports.adminUnlock = async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).send({ message: "Admin Password required" });

    try {
        let admin = await Admin.findOne({ where: { mobile: "9023671902" } });
        if (!admin) admin = await Admin.findOne();

        if (!admin) return res.status(404).send({ message: "System not initialized" });

        // Check Admin Password
        if (!admin.admin_password) {
            // Fallback if not seeded yet (Should happen on startup, but just in case)
            const isDefault = password === "BalKrishna1008";
            if (isDefault) {
                // Auto-seed if matching default
                admin.admin_password = bcrypt.hashSync(password, 8);
                await admin.save();
            } else {
                return res.status(401).send({ message: "Admin Password not set. Contact Support." });
            }
        }

        const isValid = bcrypt.compareSync(password, admin.admin_password);
        if (!isValid) {
            return res.status(401).send({ message: "Invalid Admin Password" });
        }

        // Success: Return a temporary reset token
        const resetToken = jwt.sign({ id: admin.id, type: 'reset' }, process.env.JWT_SECRET || "secret_key_123", {
            expiresIn: 300 // 5 mins
        });

        res.status(200).send({
            message: "Unlocked. Proceed to Reset PIN.",
            resetToken: resetToken
        });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 3. Reset PIN
exports.resetPin = async (req, res) => {
    const { newPin, resetToken } = req.body;
    if (!newPin || !resetToken) return res.status(400).send({ message: "New PIN and Reset Token required" });

    // Validate 8 digits
    if (!/^\d{8}$/.test(newPin)) {
        return res.status(400).send({ message: "PIN must be exactly 8 digits" });
    }

    try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || "secret_key_123");
        if (decoded.type !== 'reset') return res.status(401).send({ message: "Invalid Token Type" });

        let admin = await Admin.findByPk(decoded.id);
        if (!admin) return res.status(404).send({ message: "Admin not found" });

        admin.pin = bcrypt.hashSync(newPin, 8);
        admin.failed_attempts = 0; // Reset attempts
        await admin.save();

        res.status(200).send({ message: "PIN Reset Successfully. Please Login." });

    } catch (err) {
        return res.status(401).send({ message: "Invalid or Expired Token" });
    }
};

// Seeding Function (called from index.js or manually)
exports.createInitialAdmin = async () => {
    try {
        let admin = await Admin.findOne({ where: { mobile: "9023671902" } });

        // Hashes
        const adminPassHash = bcrypt.hashSync("BalKrishna1008", 8);
        const defaultPinHash = bcrypt.hashSync("12345678", 8); // Default 8-digit PIN

        if (!admin) {
            await Admin.create({
                mobile: "9023671902",
                pin: defaultPinHash,
                admin_password: adminPassHash,
                failed_attempts: 0
            });
            console.log("Initial Admin Created (Mobile: 9023671902, Default PIN: 12345678)");
        } else {
            // Update existing admin to ensure password is set and schema is compliant
            let needsSave = false;

            if (!admin.admin_password) {
                admin.admin_password = adminPassHash;
                needsSave = true;
                console.log("Seeded Admin Password");
            }

            // Optional: Reset PIN to 8 digits if it was 6 digits before? 
            // Or just leave it. If user tries to enter 6 digit PIN on 8 digit pad, it might fail.
            // Let's NOT force reset PIN unless it's null.
            if (!admin.pin) {
                admin.pin = defaultPinHash;
                needsSave = true;
                console.log("Seeded Default PIN");
            }

            if (needsSave) await admin.save();
        }
    } catch (err) {
        console.error("Error seeding admin:", err);
    }
};
