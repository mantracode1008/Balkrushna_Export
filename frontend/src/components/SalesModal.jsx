import React, { useState, useEffect, useCallback } from 'react';
import ClientSelect from './ClientSelect';
import ClientForm from './ClientForm';
import api from '../services/api';
import diamondService from '../services/diamond.service';
import clientService from '../services/client.service';
import { X, CheckCircle, Calculator, User, DollarSign, Building2, Pencil, Trash2, Save, ChevronDown } from 'lucide-react';

const SalesModal = ({ selectedDiamonds, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Client, 2: Financials
    const [loading, setLoading] = useState(false);

    // Data Step 1
    const [clientMode, setClientMode] = useState('EXISTING'); // 'EXISTING' | 'NEW'
    const [selectedClientName, setSelectedClientName] = useState('');
    const [existingClients, setExistingClients] = useState([]);
    const [newClientData, setNewClientData] = useState({});

    // Edit Mode State
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [editClientData, setEditClientData] = useState({});

    // Custom Dropdown State
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    // Data Step 2
    const [financials, setFinancials] = useState({
        currency: 'USD',
        exchange_rate: '',
        commission_percent: '',
        commission_usd: '',
        commission_inr: '',
        final_total_usd: '',
        final_total_inr: ''
    });

    const [paymentTerms, setPaymentTerms] = useState('Net 30');
    const [dueDays, setDueDays] = useState(30);

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

    // Helper function to recalculate all financial fields
    const recalculateFinancials = useCallback((currentFinancials, baseCost, changedField, value) => {
        let newFinancials = { ...currentFinancials };

        const rate = parseFloat(newFinancials.exchange_rate) || 0;

        // Update the changed field first
        if (changedField === 'commission_percent') {
            newFinancials.commission_percent = value;
            const pct = parseFloat(value) || 0;
            const commUSD = (baseCost * pct) / 100;
            newFinancials.commission_usd = commUSD.toFixed(2);
            newFinancials.commission_inr = (commUSD * rate).toFixed(2);
        } else if (changedField === 'commission_usd') {
            newFinancials.commission_usd = value;
            const commUSD = parseFloat(value) || 0;
            newFinancials.commission_percent = baseCost > 0 ? ((commUSD / baseCost) * 100).toFixed(2) : '';
            newFinancials.commission_inr = (commUSD * rate).toFixed(2);
        } else if (changedField === 'commission_inr') {
            newFinancials.commission_inr = value;
            const commInr = parseFloat(value) || 0;
            const commUSD = rate > 0 ? (commInr / rate) : 0;
            newFinancials.commission_usd = commUSD.toFixed(2);
            newFinancials.commission_percent = baseCost > 0 ? ((commUSD / baseCost) * 100).toFixed(2) : '';
        } else if (changedField === 'exchange_rate') {
            newFinancials.exchange_rate = value;
            const newRate = parseFloat(value) || 0;
            const commUSD = parseFloat(newFinancials.commission_usd) || 0;
            newFinancials.commission_inr = (commUSD * newRate).toFixed(2);
        } else if (changedField === 'final_total_usd') {
            newFinancials.final_total_usd = value;
            const finalUSD = parseFloat(value) || 0;
            newFinancials.final_total_inr = (finalUSD * rate).toFixed(2);
        } else if (changedField === 'final_total_inr') {
            newFinancials.final_total_inr = value;
            const finalInr = parseFloat(value) || 0;
            newFinancials.final_total_usd = rate > 0 ? (finalInr / rate).toFixed(2) : '';
        }

        // Ensure final totals are consistent after commission/rate changes
        const currentCommUSD = parseFloat(newFinancials.commission_usd) || 0;
        const calculatedTotalUSD = baseCost + currentCommUSD;

        // Only update final_total_usd/inr if they haven't been manually overridden
        // Or if the change was to commission/rate, then recalculate them
        if (!changedField || changedField.startsWith('commission') || changedField === 'exchange_rate') {
            newFinancials.final_total_usd = calculatedTotalUSD.toFixed(2);
            newFinancials.final_total_inr = (calculatedTotalUSD * (parseFloat(newFinancials.exchange_rate) || 0)).toFixed(2);
        }

        return newFinancials;
    }, []);

    // Auto-Calculate Totals when Base Cost changes
    useEffect(() => {
        // Only trigger recalculation if the TOTAL BASE COST changes (e.g. added/removed items)
        // We do NOT want this to trigger when the user types in commission fields.

        // Use functional state update to access CURRENT values without adding them to dependency array
        setFinancials(prev => {
            if (prev.commission_percent) {
                return recalculateFinancials(prev, totalBaseCost, 'commission_percent', prev.commission_percent);
            }
            return recalculateFinancials(prev, totalBaseCost, null, null);
        });

    }, [totalBaseCost, recalculateFinancials]);

    // Data Step 2 (Extras)
    // Custom Currency State
    const [isCustomCurrency, setIsCustomCurrency] = useState(false);

    // Auto-Set Currency from Client
    useEffect(() => {
        if (clientMode === 'EXISTING' && selectedClientName) {
            const client = existingClients.find(c => c.name === selectedClientName);
            if (client && client.currency) {
                setFinancials(prev => ({ ...prev, currency: client.currency }));
            }
        }
    }, [selectedClientName, clientMode, existingClients]);


    // Handlers for Edit/Delete
    const handleEditClick = () => {
        const client = existingClients.find(c => c.name === selectedClientName);
        if (!client) return;
        setEditClientData(client);
        setIsEditingClient(true);
    };

    const handleSaveClientEdit = async () => {
        if (!editClientData.name) return alert("Name is required");
        setLoading(true);
        try {
            await clientService.update(editClientData.id, editClientData);

            // Update Local State
            setExistingClients(prev => prev.map(c => c.id === editClientData.id ? editClientData : c));
            setSelectedClientName(editClientData.name); // Keep selected if name changed
            setIsEditingClient(false);
            alert("Client updated successfully!");
        } catch (err) {
            console.error("Update Client Error:", err);
            alert("Failed to update client.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async () => {
        const client = existingClients.find(c => c.name === selectedClientName);
        if (!client) return;

        if (!window.confirm(`Are you sure you want to delete ${client.name}? This cannot be undone.`)) return;

        setLoading(true);
        try {
            await clientService.remove(client.id);
            setExistingClients(prev => prev.filter(c => c.id !== client.id));
            setSelectedClientName(''); // Clear selection
            alert("Client deleted successfully!");
        } catch (err) {
            console.error("Delete Client Error:", err);
            alert("Failed to delete client. It might be linked to existing invoices.");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (clientMode === 'EXISTING' && !selectedClientName) return alert("Please select a client.");
            if (clientMode === 'EXISTING' && !selectedClientName) return alert("Please select a client.");
            if (clientMode === 'NEW' && !newClientData.name) return alert("Please fill client details (Name is required).");
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
                    commission_percent: parseFloat(financials.commission_percent) || 0,
                    commission_total_usd: parseFloat(financials.commission_usd) || 0,
                    commission_total_inr: parseFloat(financials.commission_inr) || 0,
                    final_total_usd: parseFloat(financials.final_total_usd) || totalBaseCost,
                    final_total_inr: parseFloat(financials.final_total_inr) || 0
                },
                payment_terms: paymentTerms,
                due_days: dueDays
            };

            // Calculate GST for Payload (Snapshot)
            const subtotal = parseFloat(financials.final_total_usd) || totalBaseCost;
            const cgst = (subtotal * 0.75) / 100;
            const sgst = (subtotal * 0.75) / 100;
            const grandTotal = subtotal + cgst + sgst;

            payload.financials.gst_breakdown = {
                subtotal: subtotal.toFixed(2),
                cgst: cgst.toFixed(2),
                sgst: sgst.toFixed(2),
                grand_total: grandTotal.toFixed(2)
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
                                    {!isEditingClient ? (
                                        <>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Search Client</label>
                                            <div className="flex gap-2 relative">
                                                {/* Custom Dropdown Trigger */}
                                                <div
                                                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                                    className="flex-1 px-4 py-3 text-sm font-bold border border-slate-200 rounded-xl bg-white cursor-pointer flex justify-between items-center hover:border-indigo-300 transition-colors shadow-sm text-slate-700"
                                                >
                                                    <span className={!selectedClientName ? "text-slate-400 font-normal" : ""}>
                                                        {selectedClientName || "Select a Client..."}
                                                    </span>
                                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
                                                </div>

                                                {/* Dropdown Menu */}
                                                {isClientDropdownOpen && (
                                                    <div className="absolute top-full left-0 w-[calc(100%-80px)] mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 p-1">
                                                        {existingClients.map(c => {
                                                            const displayLocation = c.country ? `(${c.country})` : '';
                                                            const displayCompany = c.company_name ? ` - ${c.company_name}` : '';
                                                            const displayName = `${c.name} ${displayLocation}${displayCompany}`;
                                                            const isSelected = c.name === selectedClientName;

                                                            return (
                                                                <div
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        setSelectedClientName(c.name);
                                                                        setIsClientDropdownOpen(false);
                                                                    }}
                                                                    className={`px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                                                >
                                                                    <span>
                                                                        {c.name}
                                                                        <span className="text-slate-400 font-normal ml-1">{displayLocation}</span>
                                                                        <span className="text-slate-400 font-medium ml-1 text-xs">{displayCompany}</span>
                                                                    </span>
                                                                    {isSelected && <CheckCircle size={14} className="text-indigo-600" />}
                                                                </div>
                                                            );
                                                        })}
                                                        {existingClients.length === 0 && (
                                                            <div className="px-4 py-3 text-sm text-slate-400 text-center italic">No clients found.</div>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedClientName && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleEditClick}
                                                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
                                                            title="Edit Client"
                                                        >
                                                            <Pencil size={18} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={handleDeleteClient}
                                                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors border border-red-200"
                                                            title="Delete Client"
                                                        >
                                                            <Trash2 size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                                <h3 className="font-bold text-slate-800">Edit Client Details</h3>
                                                <button onClick={() => setIsEditingClient(false)} className="text-slate-400 hover:text-slate-600">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <ClientForm value={editClientData} onChange={setEditClientData} />
                                            <div className="flex justify-end gap-3 mt-4">
                                                <button
                                                    onClick={() => setIsEditingClient(false)}
                                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveClientEdit}
                                                    disabled={loading}
                                                    className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2"
                                                >
                                                    <Save size={14} />
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
                                        {!isCustomCurrency ? (
                                            <select
                                                value={['USD', 'INR', 'EUR', 'AED'].includes(financials.currency) ? financials.currency : 'OTHER'}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'OTHER') {
                                                        setIsCustomCurrency(true);
                                                        setFinancials(prev => ({ ...prev, currency: '' }));
                                                    } else {
                                                        setFinancials(prev => ({ ...prev, currency: val }));
                                                    }
                                                }}
                                                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            >
                                                <option value="USD">USD</option>
                                                <option value="INR">INR</option>
                                                <option value="EUR">EUR</option>
                                                <option value="AED">AED</option>
                                                <option value="OTHER">+ Add Custom</option>
                                            </select>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    placeholder="e.g. GBP"
                                                    value={financials.currency}
                                                    onChange={(e) => setFinancials(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                                                    className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
                                                />
                                                <button
                                                    onClick={() => setIsCustomCurrency(false)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Rate (1$)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50"
                                            placeholder="e.g. 85.0"
                                            value={financials.exchange_rate}
                                            onChange={(e) => setFinancials(prev => recalculateFinancials(prev, totalBaseCost, 'exchange_rate', e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Comm (%)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 text-sm font-bold border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                                            value={financials.commission_percent}
                                            onChange={(e) => setFinancials(prev => recalculateFinancials(prev, totalBaseCost, 'commission_percent', e.target.value))}
                                            placeholder="%"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block">Comm ($)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 text-sm font-bold border-2 border-emerald-100 rounded-lg focus:border-emerald-500 outline-none"
                                            value={financials.commission_usd}
                                            onChange={(e) => setFinancials(prev => recalculateFinancials(prev, totalBaseCost, 'commission_usd', e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block">Comm ({financials.currency})</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 text-sm font-bold border-2 border-emerald-100 rounded-lg focus:border-emerald-500 outline-none"
                                            value={financials.commission_inr}
                                            onChange={(e) => setFinancials(prev => recalculateFinancials(prev, totalBaseCost, 'commission_inr', e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                            </div>

                            {/* Payment Terms */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Terms</label>
                                    <select
                                        value={paymentTerms}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPaymentTerms(val);
                                            if (val === 'COD') setDueDays(0);
                                            else if (val === 'Net 7') setDueDays(7);
                                            else if (val === 'Net 15') setDueDays(15);
                                            else if (val === 'Net 30') setDueDays(30);
                                        }}
                                        className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="COD">COD (Immediate)</option>
                                        <option value="Net 7">Net 7 Days</option>
                                        <option value="Net 15">Net 15 Days</option>
                                        <option value="Net 30">Net 30 Days</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Due Days</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={dueDays}
                                            onChange={(e) => setDueDays(parseInt(e.target.value) || 0)}
                                            disabled={paymentTerms !== 'Custom'}
                                            className={`w-20 px-3 py-2 text-xs font-bold border rounded-lg outline-none ${paymentTerms !== 'Custom' ? 'bg-slate-100 text-slate-400' : 'bg-white focus:ring-2 focus:ring-indigo-500/20'}`}
                                        />
                                        <div className="px-3 py-2 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg flex items-center">
                                            Due: {(() => {
                                                const d = new Date();
                                                d.setDate(d.getDate() + (parseInt(dueDays) || 0));
                                                return d.toLocaleDateString();
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                                    Taxable Amount (Excl. GST)
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 text-lg font-bold bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                                    value={financials.currency === 'USD' ? financials.final_total_usd : financials.final_total_inr}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        const rate = parseFloat(financials.exchange_rate) || 1;

                                        if (financials.currency === 'USD') {
                                            setFinancials(prev => ({
                                                ...prev,
                                                final_total_usd: e.target.value,
                                                final_total_inr: (val * rate).toFixed(2)
                                            }));
                                        } else {
                                            setFinancials(prev => ({
                                                ...prev,
                                                final_total_inr: e.target.value,
                                                final_total_usd: (val / rate).toFixed(2)
                                            }));
                                        }
                                    }}
                                    placeholder="0.00"
                                />

                                {/* GST Breakdown - Only for India */}
                                <div className="mt-4 space-y-2">
                                    {(() => {
                                        // User Rule: Tax only if Currency is INR
                                        const isTaxable = financials.currency === 'INR';

                                        const subtotal = parseFloat(financials.currency === 'USD' ? financials.final_total_usd : financials.final_total_inr) || 0;

                                        // Calculate Tax based on Currency
                                        const taxRate = isTaxable ? 0.0075 : 0;
                                        const cgst = (subtotal * taxRate);
                                        const sgst = (subtotal * taxRate);
                                        const grandTotal = subtotal + cgst + sgst;

                                        return (
                                            <>
                                                {isTaxable && (
                                                    <>
                                                        <div className="flex justify-between text-xs text-slate-500 px-1">
                                                            <span>CGST (0.75%)</span>
                                                            <span className="font-mono">{financials.currency} {cgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-slate-500 px-1 border-b border-slate-200 pb-2">
                                                            <span>SGST (0.75%)</span>
                                                            <span className="font-mono">{financials.currency} {sgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </>
                                                )}

                                                <div className="flex justify-between items-center pt-2 px-1">
                                                    <span className="text-sm font-black text-slate-800 uppercase">Final Payable Amount</span>
                                                    <div className="text-right">
                                                        <div className="text-xl font-black text-indigo-600">
                                                            {financials.currency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                        {!isTaxable && (
                                                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                                NO TAX (NON-INR)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {financials.currency !== 'USD' && (
                                                    <div className="text-right text-[10px] text-slate-400 font-medium mt-1">
                                                        = ${(grandTotal / (parseFloat(financials.exchange_rate) || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
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
        </div >
    );
};

export default SalesModal;
