import api from './api';

const API_URL = '/sellers/';

const create = (data) => {
    return api.post(API_URL, data);
};

const getAll = (includeStats = false) => {
    return api.get(API_URL + (includeStats ? '?includeStats=true' : ''));
};

const get = (id) => {
    return api.get(API_URL + id);
};

const update = (id, data) => {
    return api.put(API_URL + id, data);
};

const remove = (id) => {
    return api.delete(API_URL + id);
};

const sellerService = {
    create,
    getAll,
    get,
    update,
    remove
};

export default sellerService;
