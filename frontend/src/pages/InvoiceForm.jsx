import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import invoiceService from '../services/invoice.service';
import diamondService from '../services/diamond.service';
import { Plus, Trash2, Search, ArrowLeft, Check } from 'lucide-react';

const InvoiceForm = () => {
    const navigate = useNavigate();
    const location = useLocation(); // To possibly get pre-selected diamond from "Mark as Sold" redirect

    // Form State
    const [customerName, setCustomerName] = useState('');
    const [selectedDiamonds, setSelectedDiamonds] = useState([]); // Array of diamond objects with sale_price
    const [loading, setLoading] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Pre-load logic (if redirected with a diamond ID?)
    // Implementation: simple search for now.

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setSearchLoading(true);
        try {
            // We want to find In Stock OR Sold items (that might not be invoiced).
            // Our getAll service matches certificate.
            // But verify backend behavior: findAll returns ALL if no status passed?
            // Diamond.controller: "if (req.query.status) ... else default in_stock".
            // We need to pass status='all' to find sold items too.
            const res = await diamondService.getAll({
                certificate: searchTerm,
                status: 'all' // Crucial to find the item we just marked as sold!
            });
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setSearchLoading(false);
        }
    };

    const addDiamond = (diamond) => {
        if (selectedDiamonds.find(d => d.id === diamond.id)) return;

        // Default Sale Price: existing sale_price > 0 ? sale_price : (price + discount logic?) or just price.
        // If it was marked sold with a price, use it.
        const defaultSalePrice = (diamond.sale_price && Number(diamond.sale_price) > 0)
            ? diamond.sale_price
            : (parseFloat(diamond.price) * 1.05).toFixed(2); // Default 5% markup example

        setSelectedDiamonds(prev => [...prev, {
            ...diamond,
            finalSalePrice: defaultSalePrice,
            qty: 1
        }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeDiamond = (id) => {
        setSelectedDiamonds(prev => prev.filter(d => d.id !== id));
    };

    const updateItem = (id, field, value) => {
        setSelectedDiamonds(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const handleSubmit = async () => {
        if (!customerName) { alert("Please enter customer name"); return; }
        if (selectedDiamonds.length === 0) { alert("Please add at least one diamond"); return; }

        setLoading(true);
        try {
            const payload = {
                customerName,
                items: selectedDiamonds.map(d => ({
                    diamondId: d.id,
                    salePrice: d.finalSalePrice,
                    quantity: 1, // Logic simplified for single diamonds
                    commission: 0 // Optional logic
                }))
            };

            await invoiceService.create(payload);
            alert("Invoice Created Successfully!");
            navigate('/invoices');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to create invoice");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Totals
    const totalAmount = selectedDiamonds.reduce((sum, d) => sum + (parseFloat(d.finalSalePrice) || 0), 0);
    const totalProfit = selectedDiamonds.reduce((sum, d) => sum + ((parseFloat(d.finalSalePrice) || 0) - (parseFloat(d.price) || 0)), 0);

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl min-h-[calc(100vh-100px)] animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-500" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">New Invoice</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    {loading ? 'Processing...' : 'Generate Invoice'}
                    {!loading && <Check className="w-5 h-5" />}
                </button>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-8">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Bill To</label>
                <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xl font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter Customer / Company Name"
                    autoFocus
                />
            </div>

            {/* Item Selection */}
            <div className="mb-8">
                <div className="relative mb-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search Diamond by Certificate..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-lg"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <button
                        onClick={handleSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800"
                    >
                        Add
                    </button>

                    {/* Dropdown Results */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 max-h-60 overflow-y-auto">
                            {searchResults.map(d => (
                                <div
                                    key={d.id}
                                    onClick={() => addDiamond(d)}
                                    className="p-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center"
                                >
                                    <div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{d.certificate}</span>
                                        <span className="text-xs text-slate-500 ml-2">({d.shape} • {d.carat}ct • {d.color}/{d.clarity})</span>
                                        {d.status === 'sold' && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-bold">SOLD (Unbilled?)</span>}
                                    </div>
                                    <div className="font-mono font-bold text-slate-600 dark:text-slate-400">
                                        ${d.sale_price || d.price}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Items Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Certificate</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Cost</th>
                                <th className="px-6 py-4 text-right">Sale Price</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {selectedDiamonds.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-slate-400">No items added yet.</td></tr>
                            ) : (
                                selectedDiamonds.map((d, index) => (
                                    <tr key={index} className="group">
                                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{d.certificate}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                            {d.shape}, {d.carat}ct, {d.color}, {d.clarity}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-500">${d.price}</td>
                                        <td className="px-6 py-4 text-right">
                                            <input
                                                type="number"
                                                value={d.finalSalePrice}
                                                onChange={(e) => updateItem(d.id, 'finalSalePrice', e.target.value)}
                                                className="w-32 text-right font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => removeDiamond(d.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {selectedDiamonds.length > 0 && (
                            <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-right font-bold text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider">Total</td>
                                    <td className="px-6 py-4 text-right font-black text-xl text-slate-800 dark:text-white">
                                        ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td colSpan="3" className="px-6 py-2 text-right font-bold text-emerald-600/70 uppercase text-[10px] tracking-wider">Est. Profit</td>
                                    <td className="px-6 py-2 text-right font-bold text-emerald-600 text-sm">
                                        ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;
