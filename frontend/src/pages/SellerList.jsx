import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Download, Plus, Filter, Wallet, Receipt, Calendar, CreditCard, ChevronRight, X, Check, Edit2, Trash2, Users, Save } from 'lucide-react';
import ExcelGrid from '../components/ExcelGrid';
import { utils, writeFile } from 'xlsx-js-style';
import sellerService from '../services/seller.service';

const SellerList = () => {
    // Data States
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [groupBy, setGroupBy] = useState('seller_name');

    // Metadata for filters
    const [sellers, setSellers] = useState([]);
    const [staff, setStaff] = useState([]);

    // Filter State
    const [filters, setFilters] = useState({
        sellerId: [],
        staffId: [],
        status: [],
        startDate: '',
        endDate: '',
        minAmount: '', maxAmount: ''
    });

    // --- MANAGE SELLERS STATE ---
    const [isManageSellersOpen, setIsManageSellersOpen] = useState(false);
    const [editingSellerId, setEditingSellerId] = useState(null);
    const [sellerFormData, setSellerFormData] = useState({ name: '', company: '', mobile: '', email: '', gst_no: '' });
    // ---------------------------

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'Bank Transfer',
        reference: '',
        notes: ''
    });
    const [selectedDiamond, setSelectedDiamond] = useState(null);

    useEffect(() => {
        fetchMetadata();
        fetchGridData();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [sellerRes, staffRes] = await Promise.all([
                api.get('/sellers'),
                api.get('/auth/staff')
            ]);
            setSellers(sellerRes.data || []);
            setStaff(staffRes.data || []);
        } catch (error) {
            console.error("Error fetching metadata", error);
        }
    };

    const fetchGridData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.sellerId.length) params.sellerId = filters.sellerId.join(',');
            if (filters.staffId.length) params.staffId = filters.staffId.join(',');
            if (filters.status.length) params.status = filters.status.join(',');
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const response = await api.get('/reports/sellers/grid', {
                params
            });
            setData(response.data);
        } catch (error) {
            console.error("Error fetching grid data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => fetchGridData();
    const handleClearFilters = () => {
        setFilters({ sellerId: [], staffId: [], status: [], startDate: '', endDate: '', minAmount: '', maxAmount: '' });
    };

    // Calculate Top Stats from Data (Instant Update)
    const stats = useMemo(() => {
        return data.reduce((acc, row) => ({
            purchased: acc.purchased + (parseFloat(row.buy_price) || 0),
            paid: acc.paid + (parseFloat(row.paid_amount) || 0),
            due: acc.due + (parseFloat(row.due_amount) || 0)
        }), { purchased: 0, paid: 0, due: 0 });
    }, [data]);

    // --- SELLER CRUD OPERATIONS ---

    const resetSellerForm = () => {
        setSellerFormData({ name: '', company: '', mobile: '', email: '', gst_no: '' });
        setEditingSellerId(null);
    };

    const handleSaveSeller = async (e) => {
        e.preventDefault();
        try {
            if (editingSellerId) {
                // Update
                await sellerService.update(editingSellerId, sellerFormData);
                // alert("Seller Updated");
            } else {
                // Create
                await sellerService.create(sellerFormData);
                // alert("Seller Created");
            }
            resetSellerForm();
            fetchMetadata(); // Refresh lists
        } catch (err) {
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const handleEditClick = (seller) => {
        setEditingSellerId(seller.id);
        setSellerFormData({
            name: seller.name,
            company: seller.company || '',
            mobile: seller.mobile || '',
            email: seller.email || '',
            gst_no: seller.gst_no || ''
        });
    };

    const handleDeleteSeller = async (id) => {
        if (!window.confirm("Are you sure you want to delete this seller?")) return;
        try {
            const res = await sellerService.remove(id);
            if (res.data.message) alert(res.data.message);
            fetchMetadata();
        } catch (err) {
            alert("Delete Failed: " + (err.response?.data?.message || err.message));
        }
    };
    // -----------------------------

    // Open Payment Modal
    const openPaymentModal = (row) => {
        setSelectedDiamond(row);
        setPaymentData({
            amount: row.due_amount, // Pre-fill with due amount
            date: new Date().toISOString().split('T')[0],
            mode: 'Bank Transfer',
            reference: '',
            notes: ''
        });
        setIsPaymentOpen(true);
    };

    // Submit Payment
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDiamond) return;

        try {
            const payload = {
                seller_id: selectedDiamond.seller_id,
                amount: paymentData.amount,
                payment_date: paymentData.date,
                payment_mode: paymentData.mode,
                reference_number: paymentData.reference,
                notes: paymentData.notes,
                allocations: [
                    { diamond_id: selectedDiamond.id, amount: paymentData.amount }
                ]
            };

            await api.post('/seller-payments', payload);

            setIsPaymentOpen(false);
            fetchGridData(); // Refresh grid
        } catch (err) {
            alert("Payment Failed: " + (err.response?.data?.message || err.message));
        }
    };

    // Export Logic
    const handleExport = () => {
        const ws = utils.json_to_sheet(data.map(row => ({
            Seller: row.seller_name,
            Staff: row.staff_name,
            'Cert No': row.certificate,
            Shape: row.shape,
            Carat: row.carat,
            Rate: row.rate,
            'Purchase Amount': row.buy_price,
            Paid: row.paid_amount,
            Due: row.due_amount,
            Status: row.due_status,
            Date: row.buy_date
        })));
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Seller Ledger");
        writeFile(wb, `Seller_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Grid Columns
    const columns = useMemo(() => [
        { key: 'seller_name', label: 'Seller', width: 150 },
        { key: 'staff_name', label: 'Staff', width: 120 },
        { key: 'certificate', label: 'Cert No', width: 100 },
        { key: 'shape', label: 'Shape', width: 80 },
        { key: 'carat', label: 'Cts', width: 60, type: 'number' },
        { key: 'rate', label: 'Rate/Ct', width: 90, type: 'currency' },
        { key: 'buy_price', label: 'Purchase Amt', width: 110, type: 'currency', className: 'font-bold text-slate-700' },
        { key: 'paid_amount', label: 'Paid', width: 100, type: 'currency', className: 'text-emerald-600' },
        { key: 'due_amount', label: 'Due', width: 100, type: 'currency', className: 'text-rose-600 font-bold' },
        {
            key: 'due_status',
            label: 'Status',
            width: 80,
            format: (val, row) => {
                if (val === 'Paid') {
                    return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">PAID</span>;
                }
                return (
                    <select
                        className={`px-1 py-0.5 rounded text-[10px] font-bold uppercase outline-none cursor-pointer border-0 w-full ${val === 'Partial' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'
                            }`}
                        value={val}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            if (e.target.value === 'Paid') {
                                openPaymentModal(row);
                            }
                        }}
                    >
                        <option value={val}>{val}</option>
                        <option value="Paid">PAID</option>
                    </select>
                );
            }
        },
        {
            key: 'days_outstanding',
            label: 'Days',
            width: 50,
            type: 'number',
            format: (val) => val > 0 ? <span className={val > 30 ? 'text-rose-600 font-bold' : 'text-slate-500'}>{val}</span> : '-'
        },
        { key: 'buy_date', label: 'Date', width: 90, type: 'date' },
        {
            key: 'actions',
            label: 'Action',
            width: 100,
            format: (_, row) => (
                row.due_amount > 0.9 ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); openPaymentModal(row); }}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md text-[10px] font-bold border border-indigo-200 transition-colors"
                    >
                        PAY
                    </button>
                ) : <span className="text-emerald-500 font-bold text-[10px]"><Check size={14} className="inline" /> PAID</span>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* 1. Header & Overview */}
            <div className="bg-white border-b border-slate-200">
                <div className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Seller Ledger</h1>
                        <p className="text-xs text-slate-500 font-medium">Master Purchase & Payment Tracking</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 sm:gap-6 sm:mr-4 border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 pr-0 sm:pr-6 w-full sm:w-auto">
                            <div className="text-left sm:text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Purchased</span>
                                <div className="text-sm font-black text-slate-700">${stats.purchased.toLocaleString()}</div>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">Paid</span>
                                <div className="text-sm font-black text-emerald-600">${stats.paid.toLocaleString()}</div>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className="text-[10px] font-bold text-rose-500 uppercase">Due</span>
                                <div className="text-sm font-black text-rose-600">${stats.due.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleExport}
                                className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
                            >
                                <Download size={16} /> Export
                            </button>
                            <button
                                onClick={() => setIsManageSellersOpen(true)}
                                className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-md"
                            >
                                <Users size={16} /> Manage Sellers
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Filter Bar */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-3">
                    <Filter size={14} className="text-slate-400 mr-1" />

                    <select
                        className="text-xs font-bold border-slate-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                        onChange={(e) => setFilters({ ...filters, sellerId: e.target.value ? [e.target.value] : [] })}
                        value={filters.sellerId[0] || ''}
                    >
                        <option value="">All Sellers</option>
                        {sellers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
                    </select>

                    <select
                        className="text-xs font-bold border-slate-200 rounded-md px-2 py-1.5 outline-none"
                        onChange={(e) => setFilters({ ...filters, staffId: e.target.value ? [e.target.value] : [] })}
                        value={filters.staffId[0] || ''}
                    >
                        <option value="">All Staff</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <select
                        className="text-xs font-bold border-slate-200 rounded-md px-2 py-1.5 outline-none"
                        onChange={(e) => setFilters({ ...filters, status: e.target.value ? [e.target.value] : [] })}
                        value={filters.status[0] || ''}
                    >
                        <option value="">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="due">Due</option>
                        <option value="partial">Partial</option>
                    </select>

                    <div className="h-5 w-px bg-slate-300 mx-1"></div>

                    <div className="flex items-center gap-1">
                        <input type="date" className="text-xs border-slate-200 rounded px-2 py-1" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                        <span className="text-slate-400">-</span>
                        <input type="date" className="text-xs border-slate-200 rounded px-2 py-1" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>

                    <button onClick={handleApplyFilters} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold ml-2">Apply</button>
                    <button onClick={handleClearFilters} className="px-3 py-1 text-slate-500 hover:text-rose-500 text-xs font-bold">Clear</button>

                    <button
                        onClick={() => setGroupBy(groupBy ? null : 'seller_name')}
                        className={`ml-auto px-3 py-1 border rounded text-xs font-bold transition-colors ${groupBy ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white text-slate-600'}`}
                    >
                        {groupBy ? 'Ungroup' : 'Group by Seller'}
                    </button>
                </div>
            </div>

            {/* 3. Main Grid */}
            <div className="flex-1 overflow-hidden p-4">
                <div className="bg-white rounded-xl shadow border border-slate-200 h-full flex flex-col">
                    <ExcelGrid
                        data={data}
                        columns={columns}
                        loading={loading}
                        groupBy={groupBy}
                        emptyMessage="No ledger entries found."
                    />
                </div>
            </div>

            {/* --- MANAGE SELLERS MODAL --- */}
            {isManageSellersOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl h-[80vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Users size={20} className="text-indigo-600" /> Manage Sellers
                            </h2>
                            <button onClick={() => setIsManageSellersOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Left: Seller List */}
                            <div className="flex-1 overflow-y-auto p-4 border-r border-slate-100 bg-white">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="p-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                                            <th className="p-3 text-xs font-bold text-slate-500 uppercase">Contact</th>
                                            <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sellers.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-3">
                                                    <div className="font-bold text-sm text-slate-800">{s.name}</div>
                                                    <div className="text-xs text-slate-400">{s.company}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-xs font-medium text-slate-600">{s.mobile}</div>
                                                    <div className="text-[10px] text-slate-400">{s.email}</div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditClick(s)}
                                                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSeller(s.id)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {sellers.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="p-8 text-center text-slate-400 text-sm">No sellers found. Add one!</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Right: Add/Edit Form */}
                            <div className="w-80 bg-slate-50 p-6 shadow-[inset_4px_0_10px_-5px_rgba(0,0,0,0.05)] overflow-y-auto">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    {editingSellerId ? <Edit2 size={16} /> : <Plus size={16} />}
                                    {editingSellerId ? 'Edit Seller' : 'Add New Seller'}
                                </h3>

                                <form onSubmit={handleSaveSeller} className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Seller Name *</label>
                                        <input
                                            required
                                            className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                            placeholder="Ex. John Doe"
                                            value={sellerFormData.name}
                                            onChange={e => setSellerFormData({ ...sellerFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Company</label>
                                        <input
                                            className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white font-semibold outline-none"
                                            placeholder="Ex. JD Diamonds"
                                            value={sellerFormData.company}
                                            onChange={e => setSellerFormData({ ...sellerFormData, company: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Mobile</label>
                                        <input
                                            className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white font-semibold outline-none"
                                            placeholder="Ex. 9876543210"
                                            value={sellerFormData.mobile}
                                            onChange={e => setSellerFormData({ ...sellerFormData, mobile: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                                        <input
                                            type="email"
                                            className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white font-semibold outline-none"
                                            placeholder="Ex. john@example.com"
                                            value={sellerFormData.email}
                                            onChange={e => setSellerFormData({ ...sellerFormData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">GST No (Optional)</label>
                                        <input
                                            className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-white font-semibold outline-none"
                                            placeholder="GSTIN..."
                                            value={sellerFormData.gst_no}
                                            onChange={e => setSellerFormData({ ...sellerFormData, gst_no: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-2">
                                        {editingSellerId && (
                                            <button
                                                type="button"
                                                onClick={resetSellerForm}
                                                className="px-3 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-white shadow-lg transition-all ${editingSellerId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                                        >
                                            <Save size={14} /> {editingSellerId ? 'Update Changes' : 'Save Seller'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentOpen && selectedDiamond && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
                        <button onClick={() => setIsPaymentOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full"><Wallet size={24} /></div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800">Record Payment</h2>
                                <p className="text-xs text-slate-500">For {selectedDiamond.certificate} ({selectedDiamond.carat}ct)</p>
                            </div>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        className="w-full pl-7 pr-4 py-2 border rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none border-slate-200"
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                        max={selectedDiamond.due_amount}
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-right text-rose-500 mt-1 font-bold">Max Due: ${selectedDiamond.due_amount.toLocaleString()}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-slate-700 border-slate-200"
                                        value={paymentData.date}
                                        onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Mode</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-slate-700 border-slate-200 bg-white"
                                        value={paymentData.mode}
                                        onChange={e => setPaymentData({ ...paymentData, mode: e.target.value })}
                                    >
                                        <option>Bank Transfer</option>
                                        <option>Cash</option>
                                        <option>Cheque</option>
                                        <option>USDT / Crypto</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Reference / Note</label>
                                <input
                                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-slate-700 border-slate-200"
                                    placeholder="Txn ID or Notes..."
                                    value={paymentData.reference}
                                    onChange={e => setPaymentData({ ...paymentData, reference: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all mt-2">
                                Confirm Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerList;
