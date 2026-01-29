import api from './api';

const API_URL = '/seller-payments/';

const create = (data) => {
    return api.post(API_URL, data);
};

const getAll = (sellerId) => {
    const query = sellerId ? `?seller_id=${sellerId}` : '';
    return api.get(API_URL + query);
};

const getUnpaidDiamonds = (sellerId) => {
    return api.get(API_URL + `unpaid?seller_id=${sellerId}`);
};

const sellerPaymentService = {
    create,
    getAll,
    getUnpaidDiamonds
};

export default sellerPaymentService;
