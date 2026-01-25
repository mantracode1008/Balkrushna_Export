import React, { useState, useEffect } from 'react';
import diamondService from '../services/diamond.service';

const SalesHistory = () => {
    const [diamonds, setDiamonds] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Fetch only sold items directly from backend
            const res = await diamondService.getAll({ status: 'sold' });
            setDiamonds(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line
        fetchHistory();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 ">Sales History</h1>
            </div>

            {/* Table */}
            <div className="bg-white  rounded-xl shadow-sm border border-slate-100  overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white  border-b border-slate-200 ">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600 ">Certificate</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 ">Shape</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 ">Carat</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 ">Price</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 ">Sold Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 ">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-8 text-slate-500 ">Loading...</td></tr>
                        ) : diamonds.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-8 text-slate-500 ">No sold diamonds found</td></tr>
                        ) : (
                            diamonds.map((diamond) => (
                                <tr key={diamond.id} className="hover:bg-slate-50  transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 ">{diamond.certificate}</td>
                                    <td className="px-6 py-4 text-slate-600 ">{diamond.shape}</td>
                                    <td className="px-6 py-4 text-slate-600 ">{diamond.carat}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900 ">${diamond.price}</td>
                                    <td className="px-6 py-4 text-slate-600 ">
                                        {new Date(diamond.updatedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesHistory;
