import React, { useState, useEffect } from 'react';
import sellerService from '../services/seller.service';
import { Store, ChevronDown, Check } from 'lucide-react';

const SellerSelect = ({ value, onChange, placeholder = "Select Seller" }) => {
    const [sellers, setSellers] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadSellers = async () => {
            setLoading(true);
            try {
                const res = await sellerService.getAll();
                setSellers(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadSellers();
    }, []);

    const selectedSeller = sellers.find(s => s.id === parseInt(value));

    return (
        <div className="flex flex-col relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Store size={10} /> {placeholder}
            </label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer flex justify-between items-center transition-all hover:bg-white"
            >
                <span className={!selectedSeller ? "text-slate-400 font-medium" : ""}>
                    {selectedSeller ? selectedSeller.name : "Choose a Seller..."}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-200">
                        {sellers.map(s => (
                            <div
                                key={s.id}
                                onClick={() => {
                                    onChange({ target: { name: 'seller_id', value: s.id } });
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors flex items-center justify-between ${parseInt(value) === s.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                                <span>{s.name} <span className="text-xs font-normal text-slate-400 ml-1">{s.company}</span></span>
                                {parseInt(value) === s.id && <Check size={14} className="text-indigo-600" />}
                            </div>
                        ))}
                        {sellers.length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center italic">No sellers found</div>
                        )}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                            <div className="px-4 py-2 text-xs text-indigo-600 font-bold cursor-pointer hover:bg-indigo-50 rounded-lg text-center">
                                + Add New Seller
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SellerSelect;
