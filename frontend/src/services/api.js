import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080/api",
    // headers: {
    //     "Content-Type": "application/json",
    // },
});

api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.accessToken) {
            console.log("API Interceptor | Attaching Token:", user.accessToken.substring(0, 10) + "...");
            config.headers["x-access-token"] = user.accessToken;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Auto logout if 401/403
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
