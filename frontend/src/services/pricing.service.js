import api from "./api";

const calculatePrice = (data) => {
    return api.post("/pricing/calculate", data);
};

const pricingService = {
    calculatePrice
};

export default pricingService;
