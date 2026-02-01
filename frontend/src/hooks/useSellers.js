import { useState, useEffect, useCallback } from 'react';
import sellerService from '../services/seller.service';

/**
 * Custom hook for centralized seller data management
 * Provides single source of truth for seller list across all components
 * Auto-refresh mechanism ensures data consistency
 */
const useSellers = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch sellers from API
    const fetchSellers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await sellerService.getAll();
            setSellers(response.data || []);
        } catch (err) {
            console.error('Failed to fetch sellers:', err);
            setError(err.message || 'Failed to load sellers');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchSellers();
    }, [fetchSellers]);

    // Create new seller and auto-refresh list
    const createSeller = useCallback(async (sellerData) => {
        try {
            const response = await sellerService.create(sellerData);
            // Auto-refresh seller list after creation
            await fetchSellers();
            return response;
        } catch (err) {
            throw err;
        }
    }, [fetchSellers]);

    // Manual refresh function
    const refreshSellers = useCallback(() => {
        return fetchSellers();
    }, [fetchSellers]);

    return {
        sellers,
        loading,
        error,
        refreshSellers,
        createSeller
    };
};

export default useSellers;
