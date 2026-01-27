import api from './api';

const getAll = () => {
    return api.get('/clients');
};

const getById = (id) => {
    return api.get(`/clients/${id}`);
};

const create = (data) => {
    return api.post('/clients', data);
};

const update = (id, data) => {
    return api.put(`/clients/${id}`, data);
};

const remove = (id) => {
    return api.delete(`/clients/${id}`);
};

const clientService = {
    getAll,
    getById,
    create,
    update,
    remove
};

export default clientService;
