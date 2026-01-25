import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Calculator, User, DollarSign, Building2 } from 'lucide-react';
import ClientSelect from './ClientSelect';
import ClientForm from './ClientForm';
import api from '../services/api';
import diamondService from '../services/diamond.service';

const SalesModal = ({ selectedDiamonds, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Client, 2: Financials
    const [loading, setLoading] = useState(false);

    // Data Step 1
    const [clientMode, setClientMode] = useState('EXISTING'); // 'EXISTING' | 'NEW'
    const [selectedClientName, setSelectedClientName] = useState('');
    const [existingClients, setExistingClients] = useState([]);
    const [newClientData, setNewClientData] = useState({});

    // Data Step 2
    const [financials, setFinancials] = useState({
        currency: 'USD',
        exchange_rate: '',
        commission_usd: '',
        commission_inr: '',
        final_total_usd: '',
        final_total_inr: ''
    });

    // Load Clients
    useEffect(() => {
        const loadClients = async () => {
            try {
                const res = await api.get('/clients');
                setExistingClients(res.data);
            } catch (err) { console.error(err); }
        };
        loadClients();
    }, []);

    // Calculate Totals based on selection
    const totalBaseCost = selectedDiamonds.reduce((sum, d) => {
        const cost = (parseFloat(d.price) || 0) * (1 - (parseFloat(d.discount) || 0) / 100);
        return sum + cost;
    }, 0);

    const handleNext = () => {
        if (step === 1) {
            if (clientMode === 'EXISTING' && !selectedClientName) return alert("Please select a client.");
            if (clientMode === 'NEW' && !newClientData.name) return alert("Please fill client details.");
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let backendClientId = null;

            // 1. Resolve Client ID
            if (clientMode === 'EXISTING') {
                const client = existingClients.find(c => c.name === selectedClientName);
                if (!client) throw new Error("Selected client not found.");
                backendClientId = client.id;
            } else {
                // Create New
                const res = await api.post('/clients', newClientData);
                backendClientId = res.data.id;
            }

            // 2. Prepare Payload
            const payload = {
                diamond_ids: selectedDiamonds.map(d => d.id),
                client_id: backendClientId,
                financials: {
                    currency: financials.currency,
                    exchange_rate: parseFloat(financials.exchange_rate) || 1,
                    commission_total_usd: parseFloat(financials.commission_usd) || 0,
                    commission_total_inr: parseFloat(financials.commission_inr) || 0,
                    final_total_usd: parseFloat(financials.final_total_usd) || totalBaseCost,
                    final_total_inr: parseFloat(financials.final_total_inr) || 0
                }
            };

            await diamondService.bulkSell(payload);

            onSuccess(); // Parent refresh
            onClose();

        } catch (err) {
            console.error("Bulk Sell Error:", err);
            alert(err.response?.data?.message || err.message || "Sale failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">Sell Selected Diamonds</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedDiamonds.length} Stones Selected</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                        <X className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="p-6 bg-slate-50/50 flex-1 overflow-y-auto max-h-[70vh]">

                    {/* Stepper */}
                    <div className="flex items-center justify-center mb-6 gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                        <div className="w-12 h-0.5 bg-slate-200"></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            {/* Client Selection Mode */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Select Client Mode</label>
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setClientMode('EXISTING')}
                                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${clientMode === 'EXISTING' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-indigo-400'}`}
                                    >
                                        Existing Client
                                    </button>
                                    <button
                                        onClick={() => setClientMode('NEW')}
                                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${clientMode === 'NEW' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-indigo-400'}`}
                                    >
                                        New Client
                                    </button>
                                </div>
                            </div>

                            {clientMode === 'EXISTING' ? (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[200px]">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Search Client</label>
                                    <select
                                        value={selectedClientName}
                                        onChange={(e) => setSelectedClientName(e.target.value)}
                                        className="w-full px-4 py-3 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50"
                                    >
                                        <option value="">Select a Client...</option>
                                        {existingClients.map(c => <option key={c.id} value={c.name}>{c.name} ({c.company_name})</option>)}
                                    </select>
                                </div>
                            ) : (
                                <ClientForm value={newClientData} onChange={setNewClientData} />
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {/* Review Items Summary (Collapsible or simple count) */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Base Cost Total</span>
                                    <div className="text-xl font-black text-slate-800">${totalBaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Items</span>
                                    <div className="text-xl font-black text-indigo-600">{selectedDiamonds.length}</div>
                                </div>
                            </div>

                            {/* Financials Form */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Currency</label>
                                        <select
                                            value={financials.currency}
                                            onChange={(e) => setFinancials({ ...financials, currency: e.target.value })}
                                            className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50"
                                        >
                                            <option value="USD">USD</option>
                                            <option value="INR">INR</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Rate (1$)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50"
                                            placeholder="e.g. 85.0"
                                            value={financials.exchange_rate}
                                            onChange={(e) => setFinancials({ ...financials, exchange_rate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block">Comm ($)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 text-sm font-bold border-2 border-emerald-100 rounded-lg focus:border-emerald-500 outline-none"
                                            value={financials.commission_usd}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const rate = parseFloat(financials.exchange_rate) || 0;
                                                setFinancials(prev => ({
                                                    ...prev,
                                                    commission_usd: val,
                                                    commission_inr: (val && rate) ? (parseFloat(val) * rate).toFixed(2) : ''
                                                }));
                                            }}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block">Comm (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 text-sm font-bold border-2 border-emerald-100 rounded-lg focus:border-emerald-500 outline-none"
                                            value={financials.commission_inr}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const rate = parseFloat(financials.exchange_rate) || 0;
                                                setFinancials(prev => ({
                                                    ...prev,
                                                    commission_inr: val,
                                                    commission_usd: (val && rate) ? (parseFloat(val) / rate).toFixed(2) : ''
                                                }));
                                            }}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <label className="text-xs font-black text-slate-800 uppercase mb-2 block">Final Payable Amount (USD)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 text-xl font-bold bg-slate-900 text-white rounded-xl outline-none"
                                        value={financials.final_total_usd}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const rate = parseFloat(financials.exchange_rate) || 0;
                                            setFinancials(prev => ({
                                                ...prev,
                                                final_total_usd: val,
                                                final_total_inr: (val && rate) ? (parseFloat(val) * rate).toFixed(2) : ''
                                            }));
                                        }}
                                        placeholder={(totalBaseCost + (parseFloat(financials.commission_usd) || 0)).toFixed(2)}
                                    />
                                    {financials.final_total_inr && (
                                        <p className="text-right text-xs font-bold text-slate-500 mt-2">
                                            ~ ₹ {parseFloat(financials.final_total_inr).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 flex justify-between bg-white">
                    {step === 2 ? (
                        <button onClick={() => setStep(1)} className="px-6 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Back</button>
                    ) : <div></div>}

                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                        {loading ? 'Processing...' : (step === 1 ? 'Next Step' : 'Confirm Sale')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesModal;
