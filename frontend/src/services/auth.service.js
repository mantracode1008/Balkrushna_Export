import api from "./api";

// New PIN System Methods
const verifyPin = (pin, mobile) => {
    return api.post("/auth/verify-pin", { pin, mobile })
        .then((response) => {
            if (response.data.accessToken) {
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        });
};

const createStaff = (name, mobile, pin) => {
    return api.post("/auth/staff", { name, mobile, pin });
};

const getAllStaff = () => {
    return api.get("/auth/staff").then(response => response.data);
};

const deleteStaff = (id) => {
    return api.delete(`/auth/staff/${id}`);
};

const adminUnlock = (password) => {
    return api.post("/auth/admin-unlock", { password })
        .then((response) => {
            return response.data;
        });
};

const resetPin = (newPin, resetToken) => {
    return api.post("/auth/reset-pin", { newPin, resetToken })
        .then((response) => {
            return response.data;
        });
};

const logout = () => {
    localStorage.removeItem("user");
};

const getCurrentUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

// New Split Auth
const loginAdmin = (email, password) => {
    return api.post("/auth/admin/login", { email, password })
        .then((response) => {
            if (response.data.accessToken) {
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        });
};

const loginStaff = (username, pin) => {
    return api.post("/auth/staff/login", { username, pin })
        .then((response) => {
            if (response.data.accessToken) {
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        });
};

const authService = {
    verifyPin,
    loginAdmin,
    loginStaff,
    adminUnlock,
    resetPin,
    logout,
    getCurrentUser,
    createStaff,
    getAllStaff,
    deleteStaff,
    updateSelf: (id, newPin, newPassword) => api.post("/auth/update-self", { id, newPin, newPassword }),
    updateStaffPin: (staffId, newPin) => api.post("/auth/update-staff-pin", { staffId, newPin })
};

export default authService;
