import api from "./api";

// New PIN System Methods
const verifyPin = (pin) => {
    return api.post("/auth/verify-pin", { pin })
        .then((response) => {
            if (response.data.accessToken) {
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        });
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

const authService = {
    verifyPin,
    adminUnlock,
    resetPin,
    logout,
    getCurrentUser,
};

export default authService;
