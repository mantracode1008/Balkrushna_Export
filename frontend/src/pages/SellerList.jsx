import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Store, Phone, Mail, MapPin, ChevronRight, Calculator, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import sellerService from '../services/seller.service';

const SellerList = () => {
    const navigate = useNavigate();
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Seller Form State
    const [newSeller, setNewSeller] = useState({
        name: '',
        company: '',
        mobile: '',
        email: '',
        address: '',
        gst_no: ''
    });

    const fetchSellers = async () => {
        setLoading(true);
        try {
            const res = await sellerService.getAll(true); // Include Stats
            setSellers(res.data || []);
        } catch (err) {
            console.error("Failed to fetch sellers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSellers();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await sellerService.create(newSeller);
            setIsModalOpen(false);
            setNewSeller({ name: '', company: '', mobile: '', email: '', address: '', gst_no: '' });
            fetchSellers();
        } catch (err) {
            alert("Failed to create seller: " + (err.response?.data?.message || err.message));
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
    };

    const globalTotalDue = sellers.reduce((sum, s) => sum + (parseFloat(s.total_due) || 0), 0);
    const globalTotalPurchased = sellers.reduce((sum, s) => sum + (parseFloat(s.total_purchased) || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Seller Management</h1>
                    <p className="text-slate-500 font-medium">Manage suppliers, track purchases, and monitor dues</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right bg-indigo-50 px-5 py-2.5 rounded-2xl border border-indigo-100">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">Total Purchased</span>
                        <div className="text-xl font-black text-indigo-700">{formatCurrency(globalTotalPurchased)}</div>
                    </div>
                    <div className="text-right bg-rose-50 px-5 py-2.5 rounded-2xl border border-rose-100">
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-0.5">Total Overdue</span>
                        <div className="text-xl font-black text-rose-600">{formatCurrency(globalTotalDue)}</div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                        <Plus size={20} strokeWidth={3} />
                        <span>ADD SELLER</span>
                    </button>
                </div>
            </div>

            {/* Seller Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />)
                ) : sellers.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 italic">No sellers found. Add one to get started.</div>
                ) : (
                    sellers.map(seller => (
                        <div
                            key={seller.id}
                            onClick={() => navigate(`/sellers/${seller.id}`)}
                            className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <Store size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{seller.name}</h3>
                                        <p className="text-sm font-medium text-slate-400">{seller.company || 'No Company'}</p>
                                    </div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-full text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                    <Phone size={14} className="text-slate-300" />
                                    {seller.mobile || 'N/A'}
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                    <Mail size={14} className="text-slate-300" />
                                    {seller.email || 'N/A'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Due</span>
                                    <div className={`text-lg font-black ${seller.total_due > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {formatCurrency(seller.total_due)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Purchased</span>
                                    <div className="text-lg font-black text-slate-700">
                                        {formatCurrency(seller.total_purchased)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Seller Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Add New Seller</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Seller Name *</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    value={newSeller.name}
                                    onChange={e => setNewSeller({ ...newSeller, name: e.target.value })}
                                    required
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Company Name</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    value={newSeller.company}
                                    onChange={e => setNewSeller({ ...newSeller, company: e.target.value })}
                                    placeholder="Company / Entity name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mobile</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={newSeller.mobile}
                                        onChange={e => setNewSeller({ ...newSeller, mobile: e.target.value })}
                                        placeholder="+1 234..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">GST / Tax ID</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={newSeller.gst_no}
                                        onChange={e => setNewSeller({ ...newSeller, gst_no: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3.5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-200"
                                >
                                    Create Seller
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerList;
