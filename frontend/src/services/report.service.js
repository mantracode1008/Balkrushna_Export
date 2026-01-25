import api from "./api";

const getDashboardStats = (params) => {
    return api.get("/dashboard", { params });
};

const getReports = (params) => {
    // params can be { range: 'daily', startDate: '...', endDate: '...' }
    const query = new URLSearchParams(params).toString();
    return api.get(`/reports?${query}`);
};

const getBuyingStats = (range) => {
    return api.get(`/buying?range=${range}`);
};

const getTopSellingItems = () => {
    return api.get("/top-selling");
};

const ReportService = {
    getDashboardStats,
    getReports,
    getBuyingStats,
    getTopSellingItems
};

export default ReportService;
