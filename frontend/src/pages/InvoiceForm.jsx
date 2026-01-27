import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import invoiceService from '../services/invoice.service';
import diamondService from '../services/diamond.service';
import clientService from '../services/client.service';
import { Plus, Trash2, Search, ArrowLeft, Check, User, Users } from 'lucide-react';
import ClientSelect from '../components/ClientSelect';

const InvoiceForm = () => {
    const navigate = useNavigate();

    // Form State
    const [clientMode, setClientMode] = useState('EXISTING'); // 'EXISTING' | 'NEW'
    const [customerName, setCustomerName] = useState(''); // Stores name for both modes

    // New Client Details
    const [newClientDetails, setNewClientDetails] = useState({
        mobile: '',
        email: '',
        address: '',
        city: '',
        country: 'India' // Default
    });

    const [selectedDiamonds, setSelectedDiamonds] = useState([]);
    const [loading, setLoading] = useState(false);

    // Invoice Settings
    const [dueDays, setDueDays] = useState(0);
    const [paymentTerms, setPaymentTerms] = useState('Immediate');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Clients Data
    const [clients, setClients] = useState([]);

    useEffect(() => {
        // Load Clients for dropdown
        clientService.getAll().then(res => setClients(res.data)).catch(err => console.error(err));
    }, []);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setSearchLoading(true);
        try {
            const res = await diamondService.getAll({
                certificate: searchTerm,
                status: 'all'
            });
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setSearchLoading(false);
        }
    };

    // Bidirectional Calculation Logic
    const updateItem = (id, field, value) => {
        setSelectedDiamonds(prev => prev.map(d => {
            if (d.id !== id) return d;

            const cost = parseFloat(d.price) || 0;
            let newData = { ...d, [field]: value };

            if (field === 'finalSalePrice') {
                // Reverse Calc: Changed Final Price -> Update Comm% and Comm$
                const final = parseFloat(value) || 0;
                const profit = final - cost;
                newData.commissionAmt = profit.toFixed(2);
                newData.commissionRate = cost > 0 ? ((profit / cost) * 100).toFixed(2) : 0;
            }
            else if (field === 'commissionRate') {
                // Changed Comm% -> Update Comm$ and Final
                const rate = parseFloat(value) || 0;
                const profit = cost * (rate / 100);
                newData.commissionAmt = profit.toFixed(2);
                newData.finalSalePrice = (cost + profit).toFixed(2);
            }
            else if (field === 'commissionAmt') {
                // Changed Comm$ -> Update Comm% and Final
                const profit = parseFloat(value) || 0;
                newData.finalSalePrice = (cost + profit).toFixed(2);
                newData.commissionRate = cost > 0 ? ((profit / cost) * 100).toFixed(2) : 0;
            }

            return newData;
        }));
    };

    // Update addDiamond to init new fields
    const addDiamond = (diamond) => {
        if (selectedDiamonds.find(d => d.id === diamond.id)) return;

        const cost = parseFloat(diamond.price) || 0;
        // Default Logic: If sale_price exists use it, else default to Cost + 0% (or 5% markup?)
        // Let's default to Cost (0% Comm) to be safe, or keep previous logic.
        // User asked for auto-calc. Let's start with 0 markup or existing sale_price.

        let finalSalePrice = parseFloat(diamond.price).toFixed(2);
        let commissionAmt = 0;
        let commissionRate = 0;

        if (diamond.sale_price && Number(diamond.sale_price) > 0) {
            finalSalePrice = parseFloat(diamond.sale_price).toFixed(2);
            commissionAmt = (finalSalePrice - cost).toFixed(2);
            commissionRate = cost > 0 ? ((commissionAmt / cost) * 100).toFixed(2) : 0;
        }

        setSelectedDiamonds(prev => [...prev, {
            ...diamond,
            finalSalePrice,
            commissionAmt,
            commissionRate,
            qty: 1
        }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeDiamond = (id) => {
        setSelectedDiamonds(prev => prev.filter(d => d.id !== id));
    };

    const handleSubmit = async () => {
        if (!customerName) { alert("Please enter/select customer name"); return; }
        if (selectedDiamonds.length === 0) { alert("Please add at least one diamond"); return; }

        setLoading(true);
        try {
            // Include client details if NEW mode (backend should handle creating client if needed, or we send raw fields)
            // Current invoice.controller create expects 'customerName'. 
            // If we want to save full client, we should probably create client first or update backend.
            // For now, we will send customerName. If backend supports on-the-fly client creation, great.
            // Assuming simplified backend for now as per previous context.

            const payload = {
                customerName,
                // Pass new client details if needed, or just name
                clientDetails: clientMode === 'NEW' ? newClientDetails : null,
                payment_terms: paymentTerms,
                due_days: dueDays,
                items: selectedDiamonds.map(d => ({
                    diamondId: d.id,
                    salePrice: d.finalSalePrice,
                    quantity: 1,
                    commission: d.commissionAmt
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
    const totalProfit = selectedDiamonds.reduce((sum, d) => sum + (parseFloat(d.commissionAmt) || 0), 0);

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-xl min-h-[calc(100vh-100px)] animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-500" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">New Invoice</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    {loading ? 'Processing...' : 'Generate Invoice'}
                    {!loading && <Check className="w-5 h-5" />}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Client Mode Selection */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 block">Select Client Mode</label>
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                        <button
                            onClick={() => setClientMode('EXISTING')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${clientMode === 'EXISTING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users className="w-4 h-4" /> Existing Client
                        </button>
                        <button
                            onClick={() => setClientMode('NEW')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${clientMode === 'NEW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <User className="w-4 h-4" /> New Client
                        </button>
                    </div>

                    {clientMode === 'EXISTING' ? (
                        <div className="animate-in fade-in">
                            <ClientSelect
                                options={clients}
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Search client by name..."
                            />
                        </div>
                    ) : (
                        <div className="animate-in fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Client Name *</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-blue-500"
                                    placeholder="Enter Full Name"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Mobile</label>
                                <input
                                    type="text"
                                    value={newClientDetails.mobile}
                                    onChange={(e) => setNewClientDetails({ ...newClientDetails, mobile: e.target.value })}
                                    className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Country/City</label>
                                <input
                                    type="text"
                                    value={newClientDetails.city}
                                    onChange={(e) => setNewClientDetails({ ...newClientDetails, city: e.target.value })}
                                    className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                                    placeholder="e.g. Surat, India"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Terms Selection */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 block">Payment Terms</label>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Terms</label>
                            <select
                                value={paymentTerms}
                                onChange={(e) => {
                                    setPaymentTerms(e.target.value);
                                    if (e.target.value === 'Immediate') setDueDays(0);
                                    if (e.target.value === 'Net 15') setDueDays(15);
                                    if (e.target.value === 'Net 30') setDueDays(30);
                                    if (e.target.value === 'Net 60') setDueDays(60);
                                }}
                                className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none"
                            >
                                <option value="Immediate">Immediate / Cash</option>
                                <option value="Net 15">Net 15 Days</option>
                                <option value="Net 30">Net 30 Days</option>
                                <option value="Net 60">Net 60 Days</option>
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block flex justify-between">
                                Due Days <span>{dueDays > 0 ? `Due: ${new Date(new Date().setDate(new Date().getDate() + parseInt(dueDays))).toLocaleDateString()}` : 'Due Today'}</span>
                            </label>
                            <input
                                type="number"
                                value={dueDays}
                                onChange={(e) => {
                                    setDueDays(e.target.value);
                                    setPaymentTerms('Custom');
                                }}
                                className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
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
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-lg"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <button
                        onClick={handleSearch}
                        disabled={searchLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
                        {searchLoading ? '...' : 'Add'}
                    </button>

                    {/* Dropdown Results */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 max-h-60 overflow-y-auto">
                            {searchResults.map(d => (
                                <div
                                    key={d.id}
                                    onClick={() => addDiamond(d)}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 flex justify-between items-center"
                                >
                                    <div>
                                        <span className="font-bold text-slate-800">{d.certificate}</span>
                                        <span className="text-xs text-slate-500 ml-2">({d.shape} • {d.carat}ct • {d.color}/{d.clarity})</span>
                                        {d.status === 'sold' && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-bold">SOLD (Unbilled?)</span>}
                                    </div>
                                    <div className="font-mono font-bold text-slate-600">
                                        ${d.sale_price || d.price}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Items Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Certificate</th>
                                <th className="px-4 py-3">Specs</th>
                                <th className="px-4 py-3 text-right text-slate-400">Base Cost ($)</th>
                                <th className="px-4 py-3 text-right text-blue-600">Comm (%)</th>
                                <th className="px-4 py-3 text-right text-blue-600">Comm ($)</th>
                                <th className="px-4 py-3 text-right text-emerald-700">Final Price ($)</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {selectedDiamonds.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-12 text-slate-400">No items added yet.</td></tr>
                            ) : (
                                selectedDiamonds.map((d, index) => (
                                    <tr key={index} className="group hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-bold text-slate-700">{d.certificate}</td>
                                        <td className="px-4 py-3 text-slate-600 text-xs font-semibold">
                                            {d.shape} {d.carat}ct {d.color}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-400 text-xs">${d.price}</td>

                                        {/* Comm % */}
                                        <td className="px-4 py-3 text-right">
                                            <input
                                                type="number"
                                                value={d.commissionRate}
                                                onChange={(e) => updateItem(d.id, 'commissionRate', e.target.value)}
                                                className="w-16 text-right font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/50 text-xs"
                                                step="0.01"
                                            />
                                        </td>

                                        {/* Comm $ */}
                                        <td className="px-4 py-3 text-right">
                                            <input
                                                type="number"
                                                value={d.commissionAmt}
                                                onChange={(e) => updateItem(d.id, 'commissionAmt', e.target.value)}
                                                className="w-20 text-right font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/50 text-xs"
                                            />
                                        </td>

                                        {/* Final Price */}
                                        <td className="px-4 py-3 text-right">
                                            <input
                                                type="number"
                                                value={d.finalSalePrice}
                                                onChange={(e) => updateItem(d.id, 'finalSalePrice', e.target.value)}
                                                className="w-24 text-right font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => removeDiamond(d.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {selectedDiamonds.length > 0 && (
                            <tfoot className="bg-slate-50 border-t border-slate-200">
                                <tr>
                                    <td colSpan="5" className="px-4 py-3 text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider">Total Payable</td>
                                    <td className="px-4 py-3 text-right font-black text-xl text-slate-800">
                                        ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td colSpan="5" className="px-4 py-2 text-right font-bold text-emerald-600/70 uppercase text-[10px] tracking-wider">Total Commission / Profit</td>
                                    <td className="px-4 py-2 text-right font-bold text-emerald-600 text-sm">
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
