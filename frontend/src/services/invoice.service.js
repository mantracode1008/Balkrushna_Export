import api from "./api";

const create = (data) => {
    return api.post("/invoices", data);
};

const getAll = () => {
    return api.get("/invoices");
};

const getPdf = (id) => {
    return api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
};

const remove = (id) => {
    return api.delete(`/invoices/${id}`);
};

const deleteAll = () => {
    return api.delete(`/invoices/reset`);
};

const InvoiceService = {
    create,
    getAll,
    getPdf,
    delete: remove,
    deleteAll
};

export default InvoiceService;
