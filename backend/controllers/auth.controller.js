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
    // Mobile is Optional for "Default Admin" but Required for Staff
    const { pin, mobile } = req.body;
    if (!pin) return res.status(400).send({ message: "PIN is required" });

    try {
        let admin;

        if (mobile) {
            // Explicit Login (Staff or Admin specific)
            admin = await Admin.findOne({ where: { mobile: mobile } });
        } else {
            // Default Fallback (Main Admin) - For backward compatibility or "Quick Admin Login"
            admin = await Admin.findOne({ where: { mobile: "9023671902" } });
        }

        if (!admin) return res.status(404).send({ message: "User not found" });

        // Check Lockout
        if (admin.failed_attempts >= MAX_ATTEMPTS) {
            return res.status(423).send({
                message: "Account Locked. Contact Admin.",
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
                    message: "Maximum attempts reached. Account Locked.",
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

        const token = jwt.sign({ id: admin.id, mobile: admin.mobile, role: admin.role, name: admin.name }, process.env.JWT_SECRET || "secret_key_123", {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).send({
            id: admin.id,
            name: admin.name,
            mobile: admin.mobile,
            role: admin.role,
            accessToken: token,
            message: "Login Successful"
        });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// ... existing Admin Unlock / Reset ...

// 4. Create Staff
exports.createStaff = async (req, res) => {
    const { name, mobile, pin, address, permissions } = req.body;
    if (!name || !mobile || !pin) return res.status(400).send({ message: "Name, Mobile, and PIN required" });

    // Validate PIN length (User requested 4 digits for staff)
    if (pin.length !== 4) {
        return res.status(400).send({ message: "Staff PIN must be exactly 4 digits." });
    }

    try {
        // Check if mobile already exists
        const existingMobile = await Admin.findOne({ where: { mobile: mobile } });
        if (existingMobile) {
            return res.status(400).send({ message: "Mobile number is already registered." });
        }

        const pinHash = bcrypt.hashSync(pin, 8);

        // Generate Unique Staff ID: First Letter + Last 2 Digits of Mobile
        const firstLetter = name.trim().charAt(0).toLowerCase();
        const lastTwoDigits = mobile.slice(-2);
        let staff_id = `${firstLetter}${lastTwoDigits}`;

        // Ensure Uniqueness
        let attempt = 0;
        let unique_staff_id = staff_id;
        while (await Admin.findOne({ where: { staff_id: unique_staff_id } })) {
            attempt++;
            const suffixes = 'abcdefghijklmnopqrstuvwxyz';
            if (attempt <= 26) {
                unique_staff_id = `${staff_id}${suffixes[attempt - 1]}`;
            } else {
                unique_staff_id = `${staff_id}${attempt}`;
            }
        }
        staff_id = unique_staff_id;

        const newStaff = await Admin.create({
            name,
            mobile,
            address: address || null,
            staff_id,
            pin: pinHash,
            role: 'staff',
            failed_attempts: 0,
            permissions: permissions || {}
        });

        res.status(201).send({
            message: "Staff created successfully",
            staff_id: newStaff.staff_id
        });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).send({ message: "Mobile number or Name already exists." });
        }
        res.status(500).send({ message: err.message });
    }
};

// 5. Get All Staff
exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Admin.findAll({
            // Fetch ALL users (Staff + Admin) so Admin can filter by anyone
            attributes: ['id', 'name', 'mobile', 'address', 'staff_id', 'role', 'createdAt', 'failed_attempts', 'permissions'],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).send(staff);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 9. Update Staff Permissions
exports.updateStaffPermissions = async (req, res) => {
    const { staffId, permissions } = req.body;

    try {
        const staff = await Admin.findByPk(staffId);
        if (!staff) return res.status(404).send({ message: "Staff member not found." });

        staff.permissions = permissions;
        await staff.save();

        res.status(200).send({ message: "Permissions updated successfully." });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 6. Delete Staff
exports.deleteStaff = async (req, res) => {
    const { id } = req.params;
    try {
        await Admin.destroy({ where: { id: id, role: 'staff' } }); // Ensure only deleting staff
        res.status(200).send({ message: "Staff deleted successfully" });
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
// 1. Admin Login (Email + Password)
exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send({ message: "Email and Password are required." });

    try {
        const admin = await Admin.findOne({
            where: {
                email: email,
                role: 'admin'
            }
        });

        if (!admin) return res.status(404).send({ message: "Admin not found." });

        // Check Lockout
        if (admin.failed_attempts >= MAX_ATTEMPTS) {
            return res.status(423).send({ message: "Account Locked. Contact Support.", isLocked: true });
        }

        const isValid = bcrypt.compareSync(password, admin.admin_password || "");
        if (!isValid) {
            admin.failed_attempts = (admin.failed_attempts || 0) + 1;
            await admin.save();
            return res.status(401).send({ message: "Invalid Password." });
        }

        // Reset attempts
        admin.failed_attempts = 0;
        await admin.save();

        const token = jwt.sign({ id: admin.id, role: admin.role, name: admin.name }, process.env.JWT_SECRET || "secret_key_123", {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).send({
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            accessToken: token,
            message: "Welcome Admin"
        });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 2. Staff Login (Username/Mobile + PIN)
exports.loginStaff = async (req, res) => {
    const { username, pin } = req.body; // 'username' can be staff_id, mobile, or name
    if (!username || !pin) return res.status(400).send({ message: "Username/ID and PIN are required." });

    try {
        // Try finding by staff_id, mobile, or name
        let staff = await Admin.findOne({
            where: {
                [Op.or]: [
                    { staff_id: username }, // Priority 1: Unique ID
                    { mobile: username },   // Priority 2: Mobile
                    { name: username }      // Priority 3: Name
                ],
                role: 'staff'
            }
        });

        if (!staff) return res.status(404).send({ message: "Staff user not found." });

        if (staff.failed_attempts >= MAX_ATTEMPTS) {
            return res.status(423).send({ message: "Account Locked. Contact Admin.", isLocked: true });
        }

        const isValid = bcrypt.compareSync(pin, staff.pin);
        if (!isValid) {
            staff.failed_attempts = (staff.failed_attempts || 0) + 1;
            await staff.save();
            return res.status(401).send({ message: "Incorrect PIN." });
        }

        staff.failed_attempts = 0;
        await staff.save();

        const token = jwt.sign({
            id: staff.id,
            role: staff.role,
            name: staff.name,
            staff_id: staff.staff_id
        }, process.env.JWT_SECRET || "secret_key_123", {
            expiresIn: 86400
        });

        res.status(200).send({
            id: staff.id,
            name: staff.name,
            staff_id: staff.staff_id, // Return ID
            role: staff.role,
            permissions: staff.permissions, // Include permissions
            accessToken: token,
            message: "Login Successful"
        });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 7. Admin Update Self (PIN or Password)
exports.updateSelfCredentials = async (req, res) => {
    const { id, newPin, newPassword } = req.body;

    // Security Check: Ensure the requester is the one actually logged in (though middleware handles this usually, double check)
    // Here we assume req.userId is set by middleware, or we trust the ID passed if admin.

    try {
        const admin = await Admin.findByPk(id);
        if (!admin) return res.status(404).send({ message: "User not found." });

        if (newPin) {
            if (!/^\d{4,8}$/.test(newPin)) {
                return res.status(400).send({ message: "PIN must be between 4 and 8 digits." });
            }
            admin.pin = bcrypt.hashSync(newPin, 8);
        }

        if (newPassword && admin.role === 'admin') {
            admin.admin_password = bcrypt.hashSync(newPassword, 8);
        }

        await admin.save();
        res.status(200).send({ message: "Credentials updated successfully." });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 8. Admin Update Staff PIN
exports.updateStaffPin = async (req, res) => {
    const { staffId, newPin } = req.body; // staffId is the DB ID (primary key)

    if (!newPin || !/^\d{4}$/.test(newPin)) {
        return res.status(400).send({ message: "Staff PIN must be exactly 4 digits." });
    }

    try {
        const staff = await Admin.findByPk(staffId);
        if (!staff || staff.role !== 'staff') {
            return res.status(404).send({ message: "Staff member not found." });
        }

        staff.pin = bcrypt.hashSync(newPin, 8);
        await staff.save();

        res.status(200).send({ message: `PIN updated for ${staff.name}` });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Seeding Function
exports.createInitialAdmin = async () => {
    try {
        // Check for any existing admin to update, or create new
        let admin = await Admin.findOne({
            where: {
                role: 'admin'
            }
        });

        const adminPassHash = bcrypt.hashSync("1212", 8); // Updated Password to 1212
        const defaultPinHash = bcrypt.hashSync("12345678", 8);

        if (!admin) {
            await Admin.create({
                name: "Super Admin",
                email: "admin12", // Updated Username
                mobile: "9023671902",
                role: 'admin',
                pin: defaultPinHash,
                admin_password: adminPassHash,
                failed_attempts: 0
            });
            console.log("Initial Admin Created: admin12 / 1212");
        } else {
            // Check if we need to enforce the new defaults or if this was a manual change
            // For development consistency, we will enforce the requested credentials if they match the OLD default or force update.
            // Requirement was "set admin username...", implying a permanent change.

            admin.email = "admin12";
            admin.admin_password = adminPassHash;
            if (!admin.mobile) admin.mobile = "9023671902";

            await admin.save();
            console.log("Admin Credentials Synced: admin12 / 1212");
        }
    } catch (err) {
        console.error("Error seeding admin:", err);
    }
};
