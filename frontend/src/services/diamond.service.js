import api from "./api";

const getAll = (params) => {
    return api.get("/diamonds", { params });
};

const get = (id) => {
    return api.get(`/diamonds/${id}`);
};

const create = (data) => {
    return api.post("/diamonds", data);
};

const update = (id, data) => {
    return api.put(`/diamonds/${id}`, data);
};

const remove = (id) => {
    return api.delete(`/diamonds/${id}`);
};

const bulkDelete = (ids) => {
    return api.post(`/diamonds/bulk-delete`, { ids });
};

const fetchExternal = (certNo) => {
    return api.get(`/diamonds/fetch/${certNo}`);
};

// Upload is special, needs multipart (handled by browser usually but helps to have service)
const uploadCsv = (file) => {
    let formData = new FormData();
    formData.append("file", file);
    return api.post("/diamonds/import-preview", formData);
};

const bulkCreate = (diamonds) => {
    return api.post("/diamonds/bulk-create", { diamonds });
};

const updateStatus = (id, status) => {
    return api.patch(`/diamonds/${id}/status`, { status });
};

const bulkUpdateStatus = (ids, status) => {
    return api.post(`/diamonds/bulk-status`, { ids, status });
};

const calculateRapPrice = (data) => {
    return api.post("/pricing/calculate-rap", data);
};

const getSummary = (staffId) => {
    return api.get("/diamonds/summary", { params: { staffId } });
};

const DiamondService = {
    getAll,
    get,
    create,
    update,
    remove,
    bulkDelete,
    getBuyers: () => api.get("/diamonds/buyers"),
    getCompanies: () => api.get("/companies"),
    getLocations: () => api.get("/diamonds/locations"),
    fetchExternal,
    uploadCsv,
    bulkCreate,
    updateStatus,
    bulkUpdateStatus,
    bulkUpdateStatus,
    calculateRapPrice,
    getSummary,
    bulkSell: (data) => api.post("/diamonds/bulk-sell", data)
};

export default DiamondService;
