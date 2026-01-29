import React, { useState, useEffect, useMemo } from 'react';
import invoiceService from '../services/invoice.service';
import {
    Eye, Download, X, Trash2, RefreshCw, Printer, Plus, FileSpreadsheet,
    ChevronDown, Search, Filter, Calendar, DollarSign, TrendingUp,
    CreditCard, CalendarClock, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight, User
} from 'lucide-react';
import { generateInvoiceExcel } from '../utils/excelGenerator';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Invoices = () => {
    // --- STATE ---
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [statusFilter, setStatusFilter] = useState('All');

    // Selection
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null); // For Drawer
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [error, setError] = useState(null);

    // --- DATA LOADING ---
    const loadInvoices = async () => {
        setLoading(true);
        try {
            const res = await invoiceService.getAll();
            setInvoices(res.data);
        } catch (err) {
            console.error("Failed to load invoices", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadInvoices(); }, []);

    // --- DERIVED DATA & FILTERING ---
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                inv.customer_name?.toLowerCase().includes(searchLower) ||
                inv.id.toString().includes(searchQuery) ||
                inv.creator?.name?.toLowerCase().includes(searchLower); // Added Staff Search

            let matchesDate = true;
            if (dateRange.start) matchesDate = matchesDate && new Date(inv.invoice_date) >= new Date(dateRange.start);
            if (dateRange.end) {
                const end = new Date(dateRange.end);
                end.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && new Date(inv.invoice_date) <= end;
            }

            const matchesStatus = statusFilter === 'All' || inv.payment_status === statusFilter;

            return matchesSearch && matchesDate && matchesStatus;
        });
    }, [invoices, searchQuery, dateRange, statusFilter]);

    // Update bulk action visibility
    useEffect(() => {
        setShowBulkActions(selectedIds.length > 0);
    }, [selectedIds]);

    // --- STATS CALCULATION ---
    const stats = useMemo(() => {
        const data = filteredInvoices;
        const count = data.length;

        let totalUSD = 0, totalINR = 0;
        let receivedUSD = 0, receivedINR = 0;
        let pendingUSD = 0, pendingINR = 0;

        data.forEach(inv => {
            // Determine currency - assume USD if not specified
            const isINR = inv.currency === 'INR';

            // Amounts
            // Use grand_total if available, otherwise total_amount
            // Note: DB typically stores 'total_amount' as the base amount. 
            // 'grand_total' might be the calculated total. 
            // In the `loadInvoices` or API, we might need to be careful.
            // Using logic from `handleStatusUpdate` -> `baseTotal` is `total_amount`.
            // Let's rely on standard fields.
            const amount = parseFloat(inv.grand_total || inv.total_amount || 0);
            const paid = parseFloat(inv.paid_amount || 0);
            const due = parseFloat(inv.balance_due || 0);

            if (isINR) {
                totalINR += amount;
                receivedINR += paid;
                pendingINR += due;
            } else {
                totalUSD += amount;
                receivedUSD += paid;
                pendingUSD += due;
            }
        });

        const pendingCount = data.filter(inv => ['Pending', 'Partial', 'Due', 'Overdue'].includes(inv.payment_status)).length;

        return { count, totalUSD, totalINR, receivedUSD, receivedINR, pendingUSD, pendingINR, pendingCount };
    }, [filteredInvoices]);

    // --- ACTIONS ---
    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(filteredInvoices.map(i => i.id));
        else setSelectedIds([]);
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            // Optimistic
            setInvoices(prev => prev.map(inv => {
                if (inv.id === id) {
                    // Use grand_total (Client Currency) if available, else derive from Base USD
                    const rate = parseFloat(inv.exchange_rate || 85);
                    const baseTotal = parseFloat(inv.total_amount || 0);
                    const grandClient = parseFloat(inv.grand_total || 0);

                    const total = grandClient > 0
                        ? grandClient
                        : (inv.currency === 'INR' ? baseTotal * rate : baseTotal);

                    let newPaid = inv.paid_amount;
                    let newBalance = inv.balance_due;

                    if (newStatus === 'Paid') {
                        newPaid = total;
                        newBalance = 0;
                    } else if (newStatus === 'Pending') {
                        newPaid = 0;
                        newBalance = total;
                    }

                    const updatedInv = {
                        ...inv,
                        payment_status: newStatus,
                        payment_date: ['Paid', 'Partial'].includes(newStatus) ? new Date() : null,
                        paid_amount: newPaid,
                        balance_due: newBalance
                    };

                    // Update drawer if open
                    if (selectedInvoice && selectedInvoice.id === id) {
                        setSelectedInvoice(updatedInv);
                    }

                    return updatedInv;
                }
                return inv;
            }));
            await invoiceService.updateStatus(id, { payment_status: newStatus });
        } catch (err) {
            console.error("Status update failed", err);
            loadInvoices();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the invoice and restore stock.")) return;
        try {
            await invoiceService.delete(id);
            loadInvoices();
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        } catch (err) {
            alert("Failed to delete invoice");
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} invoices? This will restore stock for all items.`)) return;
        try {
            await invoiceService.bulkDelete(selectedIds);
            setSelectedIds([]);
            loadInvoices();
        } catch (err) {
            console.error("Bulk delete failed", err);
            alert(err.response?.data?.message || "Failed to delete selected invoices");
        }
    };

    const handleExportExcel = (mode, specificId = null) => {
        let dataToExport = [];
        let fileName = 'Invoices';

        if (mode === 'SINGLE' && specificId) {
            dataToExport = invoices.filter(i => i.id === specificId);
            fileName = `Invoice_${specificId}`;
        } else if (mode === 'SELECTED') {
            dataToExport = invoices.filter(i => selectedIds.includes(i.id));
            fileName = 'Selected_Invoices';
        } else if (mode === 'FILTERED') {
            dataToExport = filteredInvoices;
            fileName = 'Invoices_Filtered';
        } else if (mode === 'ALL') {
            dataToExport = invoices;
            fileName = 'All_Invoices';
        }

        if (dataToExport.length === 0) return alert("No invoices to export.");
        generateInvoiceExcel(dataToExport, fileName);
    };

    const handleBulkPrint = () => {
        const selectedInvoices = invoices.filter(i => selectedIds.includes(i.id));
        const clients = new Set(selectedInvoices.map(i => i.customer_name));

        if (clients.size > 1) {
            setError("Cannot print merged invoice: Selected invoices must belong to the SAME Client.");
            setTimeout(() => setError(null), 4000);
            return;
        }

        const ids = selectedIds.join(',');
        window.open(`/invoices/${ids}/print`, '_blank');
    };

    // --- HELPERS ---
    const getDaysRemaining = (dueDate) => {
        if (!dueDate) return null;
        const diff = new Date(dueDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* 1. Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Invoice Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage sales and track payments.</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => window.location.href = '/invoices/create'} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all font-semibold transform hover:-translate-y-0.5">
                        <Plus className="w-5 h-5" /> New Invoice
                    </button>
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium shadow-sm">
                            <Download className="w-5 h-5" /> Export <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-1 hidden group-hover:block z-20">
                            <button onClick={() => handleExportExcel('FILTERED')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Export Current View</button>
                            <button onClick={() => handleExportExcel('ALL')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Export All Data</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Invoices"
                    value={stats.count}
                    icon={FileSpreadsheet}
                    color="blue"
                    subtext="Selected Range"
                />
                <StatCard
                    title="Total Sales"
                    value={
                        <div className="flex flex-col leading-tight">
                            <span>${stats.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-medium text-slate-500">₹{stats.totalINR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                        </div>
                    }
                    icon={DollarSign}
                    color="indigo"
                // subtext={`$${stats.totalSalesUSD.toLocaleString()}`}
                />
                <StatCard
                    title="Received Amount"
                    value={
                        <div className="flex flex-col leading-tight">
                            <span>${stats.receivedUSD.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-medium text-emerald-600">₹{stats.receivedINR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                        </div>
                    }
                    icon={CheckCircle}
                    color="emerald"
                    // subtext={`$${stats.receivedAmountUSD.toLocaleString()}`}
                    highlight
                />
                <StatCard
                    title="Pending Amount"
                    value={
                        <div className="flex flex-col leading-tight">
                            <span>${stats.pendingUSD.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-medium text-rose-600">₹{stats.pendingINR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                        </div>
                    }
                    icon={AlertCircle}
                    color="rose"
                    // subtext={`$${stats.pendingAmountUSD.toLocaleString()}`}
                    warning
                />
            </div>

            {/* 3. Advanced Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Customer, ID or Staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent text-sm text-slate-700 outline-none w-32"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent text-sm text-slate-700 outline-none w-32"
                        />
                    </div>
                    <div className="min-w-[140px]">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => { setSearchQuery(''); setDateRange({ start: '', end: '' }); setStatusFilter('All'); }}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                    <RefreshCw className="w-3 h-3" /> Reset
                </button>
            </div>

            {/* 4. Enhanced Invoice Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sold By</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Profit</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Date</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="11" className="p-8 text-center text-slate-400">Loading invoices...</td></tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr><td colSpan="11" className="p-8 text-center text-slate-400">No invoices match your filters.</td></tr>
                            ) : (
                                filteredInvoices.map(inv => {
                                    const daysRemaining = getDaysRemaining(inv.due_date);
                                    const isSelected = selectedIds.includes(inv.id);
                                    const balanceDue = parseFloat(inv.balance_due || 0);
                                    const symbol = inv.currency === 'INR' ? '₹' : '$';
                                    const amount = parseFloat(inv.grand_total || inv.total_amount || 0);

                                    return (
                                        <tr key={inv.id} className={`group hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(inv.id)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="p-4 font-medium text-slate-700">#{inv.id}</td>
                                            <td className="p-4 text-sm text-slate-600">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                            <td className="p-4 text-sm font-medium text-slate-700">{inv.customer_name}</td>
                                            <td className="p-4 text-sm font-semibold text-indigo-600">
                                                {inv.creator ? inv.creator.name : <span className="text-slate-400 italic">Unknown</span>}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{symbol}{amount.toLocaleString()}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className={`font-bold ${balanceDue > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {symbol}{balanceDue.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-emerald-600">+${parseFloat(inv.total_profit).toLocaleString()}</td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-600">{inv.payment_date ? new Date(inv.payment_date).toLocaleDateString() : '-'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className={`text-sm ${inv.payment_status === 'Paid' ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}>
                                                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
                                                </div>
                                                {daysRemaining !== null && balanceDue > 0 && (
                                                    <div className={`text-xs font-bold ${daysRemaining < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                        {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <StatusBadge status={inv.payment_status} onClick={() => {
                                                    const next = inv.payment_status === 'Paid' ? 'Pending' : 'Paid';
                                                    handleStatusUpdate(inv.id, next);
                                                }} />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ActionBtn icon={Eye} onClick={() => setSelectedInvoice(inv)} label="View" />
                                                    <ActionBtn icon={FileSpreadsheet} onClick={() => handleExportExcel('SINGLE', inv.id)} label="Excel" />
                                                    <ActionBtn icon={Printer} onClick={() => window.open(`/invoices/${inv.id}/print`, '_blank')} label="Print" />
                                                    <ActionBtn icon={Trash2} onClick={() => handleDelete(inv.id)} label="Delete" color="text-red-500 hover:bg-red-50" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* 6. Side Drawer (Detail Preview) */}
            < SideDrawer
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
            />

            {/* 7. Bulk Action Floating Bar */}
            {
                showBulkActions && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5">
                        <span className="font-semibold text-slate-300">{selectedIds.length} Selected</span>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <div className="flex gap-2">
                            <button onClick={() => handleExportExcel('SELECTED')} className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-sm font-medium">
                                <FileSpreadsheet className="w-4 h-4" /> Export
                            </button>
                            <button onClick={handleBulkPrint} className="hover:text-blue-400 transition-colors flex items-center gap-2 text-sm font-medium">
                                <Printer className="w-4 h-4" /> Print
                            </button>
                            <button onClick={handleBulkDelete} className="hover:text-red-400 transition-colors flex items-center gap-2 text-sm font-medium">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                        <button onClick={() => setSelectedIds([])} className="ml-2 hover:bg-slate-800 p-1 rounded-full"><X className="w-4 h-4" /></button>
                    </div>
                )
            }

            {/* Error Popup */}
            {
                error && (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-top-5 duration-300">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-semibold text-sm whitespace-nowrap">{error}</span>
                        <button onClick={() => setError(null)} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )
            }
        </div >
    );
};

// --- SUB COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color, subtext, highlight, warning }) => (
    <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${highlight ? 'bg-emerald-50 border-emerald-100' : warning ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg ${highlight ? 'bg-emerald-100 text-emerald-600' : warning ? 'bg-rose-100 text-rose-600' : `bg-${color}-100 text-${color}-600`}`}>
                <Icon className="w-5 h-5" />
            </div>
            {highlight && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">+12%</span>}
        </div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-xs font-medium text-slate-500 mt-1">{title}</div>
        {subtext && <div className={`text-xs mt-2 ${highlight ? 'text-emerald-600' : warning ? 'text-rose-600' : 'text-slate-400'}`}>{subtext}</div>}
    </div>
);

const StatusBadge = ({ status, onClick }) => {
    const styles = {
        Paid: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
        Pending: "bg-amber-100 text-amber-700 hover:bg-amber-200",
        Overdue: "bg-rose-100 text-rose-700 hover:bg-rose-200",
        Partial: "bg-blue-100 text-blue-700 hover:bg-blue-200"
    };
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${styles[status] || styles.Pending}`}
        >
            {status || 'Pending'}
        </button>
    );
};

const ActionBtn = ({ icon: Icon, onClick, label, color = "text-slate-500 hover:bg-slate-100" }) => (
    <button onClick={onClick} className={`p-2 rounded-lg transition-colors ${color}`} title={label}>
        <Icon className="w-4 h-4" />
    </button>
);

const SideDrawer = ({ invoice, onClose }) => {
    if (!invoice) return null;
    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-300 ${invoice ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800">Invoice #{invoice.id}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Summary */}
                        <div className="space-y-4">
                            <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                                <span className="text-slate-500">Total Amount</span>
                                <span className="text-lg font-bold text-slate-900">${invoice.total_amount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Status</span>
                                <StatusBadge status={invoice.payment_status} />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Due Date</span>
                                <span className="text-sm font-medium text-slate-900">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Sold By</span>
                                <span className="text-sm font-bold text-indigo-600">{invoice.creator?.name || 'Unknown'}</span>
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Items ({invoice.items?.length || 0})</h3>
                            <div className="space-y-3">
                                {invoice.items?.map((item, i) => (
                                    <div key={i} className="p-3 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-slate-800">{item.diamond?.certificate || 'N/A'}</span>
                                            <span className="font-bold text-emerald-600">${item.sale_price}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 flex gap-2">
                                            <span>{item.diamond?.shape}</span> •
                                            <span>{item.diamond?.carat}ct</span> •
                                            <span>{item.diamond?.color}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Customer</h3>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="font-medium text-slate-900">{invoice.customer_name}</div>
                                <div className="text-sm text-slate-500 mt-1">Has bought {invoice.items?.length} items in this invoice.</div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 flex gap-3">
                        <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                            Send Invoice
                        </button>
                        <button className="px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold">
                            Print
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Invoices;
