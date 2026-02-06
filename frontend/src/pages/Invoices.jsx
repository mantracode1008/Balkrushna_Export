import React, { useState, useEffect, useMemo } from 'react';
import invoiceService from '../services/invoice.service';
import ExcelGrid from '../components/ExcelGrid';
import { generateInvoiceExcel } from '../utils/excelGenerator';
import {
    Eye, Download, X, Trash2, RefreshCw, Printer, Plus, FileSpreadsheet,
    Search, Filter, Calendar, DollarSign, CheckCircle, AlertCircle, ChevronDown
} from 'lucide-react';
import { utils, writeFile } from 'xlsx-js-style';

const Invoices = () => {
    // --- STATE ---
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters & View State
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [statusFilter, setStatusFilter] = useState('All');
    const [groupBy, setGroupBy] = useState(null); // 'customer_name', 'creator_name', 'payment_status'

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
            // Flatten/Normalize data for Grid if needed, or handle in formatters
            const processed = res.data.map(inv => ({
                ...inv,
                creator_name: inv.creator?.name || 'Unknown',
                client_company: inv.client?.company_name || '',
                client_gst: inv.client?.gst_number || '',
                // Normalize financial display amounts based on currency
                display_amount: inv.grand_total || inv.total_amount || 0,
                display_currency: inv.currency === 'INR' ? '₹' : '$',
                // For sorting
                invoice_date_ts: new Date(inv.invoice_date).getTime()
            }));
            setInvoices(processed);
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
                (inv.customer_name?.toLowerCase() || '').includes(searchLower) ||
                inv.id.toString().includes(searchQuery) ||
                (inv.creator_name?.toLowerCase() || '').includes(searchLower);

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
            const isINR = inv.currency === 'INR';
            const amount = parseFloat(inv.display_amount || 0);
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

        return { count, totalUSD, totalINR, receivedUSD, receivedINR, pendingUSD, pendingINR };
    }, [filteredInvoices]);

    // --- ACTIONS ---
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            // Optimistic Update
            setInvoices(prev => prev.map(inv => {
                if (inv.id === id) {
                    const total = parseFloat(inv.display_amount);
                    let newPaid = inv.paid_amount;
                    let newBalance = inv.balance_due;

                    if (newStatus === 'Paid') {
                        newPaid = total;
                        newBalance = 0;
                    } else if (newStatus === 'Pending') {
                        newPaid = 0;
                        newBalance = total;
                    }

                    return {
                        ...inv,
                        payment_status: newStatus,
                        payment_date: ['Paid', 'Partial'].includes(newStatus) ? new Date() : null,
                        paid_amount: newPaid,
                        balance_due: newBalance
                    };
                }
                return inv;
            }));
            await invoiceService.updateStatus(id, { payment_status: newStatus });
        } catch (err) {
            console.error("Status update failed", err);
            loadInvoices(); // Revert on failure
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the invoice and restore stock.")) return;
        try {
            await invoiceService.delete(id);
            setInvoices(prev => prev.filter(i => i.id !== id));
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        } catch (err) {
            alert("Failed to delete invoice");
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} invoices? Stock will be restored.`)) return;
        try {
            await invoiceService.bulkDelete(selectedIds);
            setSelectedIds([]);
            loadInvoices();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete invoices");
        }
    };

    const handleBulkExport = () => {
        const dataToExport = invoices.filter(i => selectedIds.includes(i.id));
        if (dataToExport.length === 0) return alert("Select invoices.");
        generateInvoiceExcel(dataToExport, "Selected_Invoices");
    };

    // New: Export Grid View (ExcelGrid logic)
    const handleGridExport = () => {
        const ws = utils.json_to_sheet(filteredInvoices.map(row => ({
            'Invoice #': row.id,
            'Date': new Date(row.invoice_date).toLocaleDateString(),
            'Customer': row.customer_name,
            'Company': row.client_company,
            'Sold By': row.creator_name,
            'Amount': row.display_amount,
            'Paid': row.paid_amount,
            'Due': row.balance_due,
            'Status': row.payment_status,
            'Currency': row.currency
        })));
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Invoices_Ledger");
        writeFile(wb, `Invoices_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // --- GRID COLUMNS ---
    const columns = useMemo(() => [
        { key: 'id', label: 'Inv #', width: 70, type: 'number', className: 'text-slate-500 font-mono' },
        { key: 'invoice_date', label: 'Date', width: 100, type: 'date', sortValue: (row) => new Date(row.invoice_date).getTime() },
        {
            key: 'customer_name',
            label: 'Customer',
            width: 150,
            className: 'font-bold text-slate-700',
            format: (val, row) => (
                <div>
                    <div>{val}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{row.client_company}</div>
                </div>
            )
        },
        { key: 'creator_name', label: 'Sold By', width: 110, className: 'text-indigo-600 font-medium' },
        {
            key: 'display_amount',
            label: 'Amount',
            width: 110,
            type: 'currency',
            className: 'font-bold text-slate-800',
            format: (val, row) => `${row.display_currency}${parseFloat(val).toLocaleString()}`
        },
        {
            key: 'paid_amount',
            label: 'Paid',
            width: 100,
            type: 'number', // manual format
            className: 'text-emerald-600',
            format: (val, row) => `${row.display_currency}${parseFloat(val || 0).toLocaleString()}`
        },
        {
            key: 'balance_due',
            label: 'Due',
            width: 100,
            type: 'number',
            className: 'text-rose-600 font-bold',
            format: (val, row) => {
                const bal = parseFloat(val || 0);
                return bal > 0 ? `${row.display_currency}${bal.toLocaleString()}` : <CheckCircle size={14} className="text-emerald-400" />;
            }
        },
        {
            key: 'payment_status',
            label: 'Status',
            width: 120,
            format: (val, row) => (
                <StatusSelect status={val} onChange={(newS) => handleStatusUpdate(row.id, newS)} />
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            width: 120,
            format: (_, row) => (
                <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedInvoice(row); }} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="View"><Eye size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`/invoices/${row.id}/print`, '_blank'); }} className="p-1 hover:bg-slate-100 rounded text-blue-500" title="Print"><Printer size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); generateInvoiceExcel([row], `Invoice_${row.id}`); }} className="p-1 hover:bg-emerald-50 rounded text-emerald-600" title="Excel"><FileSpreadsheet size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1 hover:bg-rose-50 rounded text-rose-500" title="Delete"><Trash2 size={16} /></button>
                </div>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden pb-16">
            {/* 1. Top Section (Similar to Seller) */}
            <div className="bg-white border-b border-slate-200 flex-none z-10">
                <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoice Ledger</h1>
                        <p className="text-xs text-slate-500 font-medium">Sales, Payments & Dues Tracking</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                        {/* Summary Stats */}
                        <div className="flex gap-6 pr-6 border-r border-slate-100">
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sales</span>
                                <div className="text-sm font-black text-slate-800">${stats.totalUSD.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-400 font-medium">₹{stats.totalINR.toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-rose-500 uppercase">Total Due</span>
                                <div className="text-sm font-black text-rose-600">${stats.pendingUSD.toLocaleString()}</div>
                                <div className="text-[10px] text-rose-400 font-medium">₹{stats.pendingINR.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => window.location.href = '/invoices/create'} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all font-bold text-xs">
                                <Plus size={16} /> New Sale
                            </button>
                            <button onClick={handleGridExport} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors">
                                <Download size={16} /> Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters & Controls */}
                <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="pl-8 pr-3 py-1.5 text-xs font-bold border-slate-200 rounded-lg w-48 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="h-5 w-px bg-slate-200 mx-1"></div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs font-bold border-slate-200 rounded-md px-2 py-1.5 outline-none bg-white"
                    >
                        <option value="All">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                    </select>

                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="text-xs font-bold border-slate-200 rounded-md px-2 py-1.5 outline-none bg-white"
                    />

                    <div className="ml-auto flex gap-2">
                        <button
                            onClick={() => setGroupBy(groupBy === 'customer_name' ? null : 'customer_name')}
                            className={`px-3 py-1 border rounded text-xs font-bold transition-colors ${groupBy === 'customer_name' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white text-slate-500'}`}
                        >
                            Group: Customer
                        </button>
                        <button
                            onClick={() => setGroupBy(groupBy === 'payment_status' ? null : 'payment_status')}
                            className={`px-3 py-1 border rounded text-xs font-bold transition-colors ${groupBy === 'payment_status' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white text-slate-500'}`}
                        >
                            Group: Status
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Grid */}
            <div className="flex-1 overflow-hidden p-4">
                <div className="bg-white rounded-xl shadow border border-slate-200 h-full flex flex-col">
                    <ExcelGrid
                        data={filteredInvoices}
                        columns={columns}
                        loading={loading}
                        groupBy={groupBy}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onRowClick={setSelectedInvoice}
                        emptyMessage="No invoices found."
                        gridId="invoice_ledger"
                    />
                </div>
            </div>

            {/* 3. Bulk Actions */}
            {showBulkActions && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5">
                    <span className="font-semibold text-slate-300 text-xs">{selectedIds.length} Selected</span>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <div className="flex gap-3">
                        <button onClick={handleBulkExport} className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-xs font-bold">
                            <FileSpreadsheet className="w-4 h-4" /> Export
                        </button>
                        <button onClick={handleBulkDelete} className="hover:text-rose-400 transition-colors flex items-center gap-2 text-xs font-bold">
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                    <button onClick={() => setSelectedIds([])} className="ml-2 hover:bg-slate-800 p-1 rounded-full"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* 4. Detail Drawer (Same as before, simplified) */}
            <SideDrawer
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
            />
        </div>
    );
};

// --- Sub Components ---

const StatusSelect = ({ status, onChange }) => {
    const colors = {
        Paid: "bg-emerald-100 text-emerald-700",
        Pending: "bg-amber-100 text-amber-700",
        Partial: "bg-blue-100 text-blue-700",
        Overdue: "bg-rose-100 text-rose-700"
    };
    return (
        <select
            value={status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChange(e.target.value)}
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase outline-none cursor-pointer border-0 w-full ${colors[status] || colors.Pending}`}
        >
            <option value="Paid">PAID</option>
            <option value="Pending">PENDING</option>
            <option value="Partial">PARTIAL</option>
            <option value="Overdue">OVERDUE</option>
        </select>
    );
};

const SideDrawer = ({ invoice, onClose }) => {
    if (!invoice) return null;
    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col animate-in slide-in-from-right duration-300`}>
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Invoice #{invoice.id}</h2>
                        <div className="text-xs text-slate-500">{new Date(invoice.invoice_date).toLocaleDateString()}</div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Financials */}
                    <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase">Total Amount</div>
                                <div className="text-2xl font-black text-white">{invoice.display_currency}{invoice.display_amount}</div>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${invoice.payment_status === 'Paid' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'}`}>
                                {invoice.payment_status}
                            </div>
                        </div>
                        <div className="flex gap-4 border-t border-slate-700 pt-3">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Paid</div>
                                <div className="text-sm font-bold text-emerald-400">{invoice.display_currency}{invoice.paid_amount}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Due</div>
                                <div className="text-sm font-bold text-rose-400">{invoice.display_currency}{invoice.balance_due}</div>
                            </div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Customer Details</h3>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="font-bold text-slate-800">{invoice.customer_name}</div>
                            {invoice.client_company && <div className="text-xs font-medium text-slate-600">{invoice.client_company}</div>}
                            {invoice.client_gst && <div className="text-[10px] text-slate-400 mt-1">GST: {invoice.client_gst}</div>}
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Items Included</h3>
                        <div className="space-y-2">
                            {invoice.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg">
                                    <div className="text-xs font-bold text-slate-700">{item.diamond?.certificate || 'Item'}</div>
                                    <div className="text-xs font-mono text-slate-600">${item.sale_price}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                    <button onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-700 text-xs">Download PDF</button>
                    <button onClick={() => generateInvoiceExcel([invoice], `Invoice_${invoice.id}`)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow hover:bg-slate-50 text-xs">Excel</button>
                </div>
            </div>
        </>
    );
};

export default Invoices;
