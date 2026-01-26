import React, { useState, useEffect } from 'react';
import invoiceService from '../services/invoice.service';
import diamondService from '../services/diamond.service';
import authService from '../services/auth.service';
import { BadgeDollarSign, CalendarClock, CheckCircle2, ChevronRight, Filter, AlertCircle, Plus, Search, Wallet } from 'lucide-react';

const FinancialBreakdown = ({ selectedStaff }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadSummary = async () => {
            setLoading(true);
            try {
                // Fetch summary with optional staff filter
                const res = await diamondService.getSummary(selectedStaff);
                setSummary(res.data);
            } catch (err) {
                console.error("Summary load failed", err);
            }
            setLoading(false);
        };
        loadSummary();
    }, [selectedStaff]);

    if (loading) return <div className="p-4 text-center text-slate-400 text-xs">Loading Financial Data...</div>;
    if (!summary) return null;

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white mt-6">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Financial Performance (Profit/Loss)</h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3 border-b border-slate-200">Staff / Admin</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-right">Role</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-right">Total Diamonds</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-right">Total Expense</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-right text-emerald-600">Total Profit</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {summary.breakdown.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-700">{row.staff_name || 'Unknown'}</td>
                            <td className="px-4 py-2 text-right text-slate-500 capitalize">{row.role}</td>
                            <td className="px-4 py-2 text-right font-bold">{row.total_count}</td>
                            <td className="px-4 py-2 text-right text-indigo-600 font-mono">
                                ${parseFloat(row.total_expense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2 text-right text-emerald-600 font-bold font-mono">
                                ${parseFloat(row.total_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                    {/* Grand Total Row */}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                        <td className="px-4 py-3 text-slate-800">TOTAL</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right">{summary.grandTotal.total_count}</td>
                        <td className="px-4 py-3 text-right text-indigo-700 font-mono">
                            ${summary.grandTotal.total_expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-700 font-mono">
                            ${summary.grandTotal.total_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const ClientPayments = () => {
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Staff Filter State
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('ALL');

    // Filters
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, OVERDUE, PENDING, PAID
    const [searchClient, setSearchClient] = useState('');

    // Payment Modal
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Bank Transfer');
    const [paymentNote, setPaymentNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Staff if Admin
            if (authService.getCurrentUser()?.role === 'admin') {
                authService.getAllStaff().then(res => setStaffList(res)).catch(e => console.error(e));
            }

            const res = await invoiceService.getAll();
            // Normalize Data for Legacy Invoices
            const normalized = res.data.map(inv => {
                const total = parseFloat(inv.total_amount) || 0;
                const paid = parseFloat(inv.paid_amount) || 0;

                // Fix Balance Due
                let balance = parseFloat(inv.balance_due);
                if (isNaN(balance) || inv.balance_due === null) {
                    if (inv.payment_status === 'Paid') balance = 0;
                    else balance = total - paid;
                }

                // Fix Due Date (Default to Invoice Date + 30 if missing)
                let due = inv.due_date;
                if (!due && inv.invoice_date) {
                    const d = new Date(inv.invoice_date);
                    d.setDate(d.getDate() + 30); // Default Net 30 for legacy
                    due = d.toISOString();
                }

                return {
                    ...inv,
                    balance_due: balance,
                    due_date: due,
                    paid_amount: paid
                };
            });

            setInvoices(normalized);
        } catch (err) {
            console.error("Failed to load invoices", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        let res = invoices;

        // Staff Filter (Client Side)
        if (selectedStaff !== 'ALL') {
            res = res.filter(inv => inv.created_by === parseInt(selectedStaff));
        }

        if (filterStatus === 'OVERDUE') {
            res = res.filter(inv => {
                const isPending = inv.balance_due > 0 && inv.payment_status !== 'Paid';
                const dueDate = new Date(inv.due_date);
                return isPending && dueDate < new Date();
            });
        } else if (filterStatus === 'PENDING') {
            res = res.filter(inv => inv.balance_due > 0);
        } else if (filterStatus === 'PAID') {
            res = res.filter(inv => inv.balance_due <= 0);
        }

        if (searchClient) {
            res = res.filter(inv => inv.customer_name?.toLowerCase().includes(searchClient.toLowerCase()));
        }

        setFilteredInvoices(res);
    }, [invoices, filterStatus, searchClient, selectedStaff]);

    const handleAddPayment = async (e) => {
        e.preventDefault();
        if (!selectedInvoice || !paymentAmount) return;

        setIsSubmitting(true);
        try {
            await invoiceService.addPayment(selectedInvoice.id, {
                amount: paymentAmount,
                mode: paymentMode,
                note: paymentNote,
                date: new Date()
            });

            // Show Success UI
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setIsSubmitting(false);
                setSelectedInvoice(null);
                setPaymentAmount('');
                setPaymentNote('');
                loadData(); // Refresh Data
            }, 1500); // 1.5 Seconds delay for user to see success

        } catch (err) {
            console.error(err);
            alert("Failed to record payment");
            setIsSubmitting(false);
        }
    };

    const openPaymentModal = (inv) => {
        setSelectedInvoice(inv);
        setPaymentAmount(inv.balance_due || '');
        setPaymentMode('Bank Transfer');
        setPaymentNote('');
    };

    // Stats
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (parseFloat(inv.balance_due) || 0), 0);
    const totalOverdue = invoices.reduce((sum, inv) => {
        const isOverdue = (parseFloat(inv.balance_due) > 0) && new Date(inv.due_date) < new Date();
        return sum + (isOverdue ? parseFloat(inv.balance_due) : 0);
    }, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Client Payments</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage outstanding dues and payment history</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase">Total Outstanding</p>
                        <p className="text-2xl font-black text-slate-800">${totalOutstanding.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase">Overdue Amount</p>
                        <p className="text-2xl font-black text-rose-600">${totalOverdue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase">Collected (All Time)</p>
                        <p className="text-2xl font-black text-emerald-600">
                            ${invoices.reduce((sum, inv) => sum + (parseFloat(inv.paid_amount) || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Financial Overview (Admin Only) */}
            {authService.getCurrentUser()?.role === 'admin' && (
                <FinancialBreakdown selectedStaff={selectedStaff} />
            )}



            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search Client..."
                        value={searchClient}
                        onChange={e => setSearchClient(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                </div>

                {/* Staff Filter (Admin Only) */}
                {authService.getCurrentUser()?.role === 'admin' && (
                    <select
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                        <option value="ALL">All Staff</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>
                                {staff.name} {staff.role === 'admin' ? '(Admin)' : ''}
                            </option>
                        ))}
                    </select>
                )}

                <div className="flex gap-2">
                    {['ALL', 'PENDING', 'OVERDUE', 'PAID'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === status ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Client</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Invoice</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Due Date</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs text-right">Total</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs text-right">Paid</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs text-right">Balance</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.map(inv => {
                            const isOverdue = (parseFloat(inv.balance_due) > 0) && new Date(inv.due_date) < new Date();
                            const isPaid = parseFloat(inv.balance_due) <= 0;

                            return (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{inv.customer_name}</div>
                                        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                                            {/* Show Creator Name */}
                                            {inv.creator?.name ? (
                                                <>Sold by: <span className="text-indigo-500">{inv.creator.name}</span></>
                                            ) : (
                                                <span className="text-slate-300">Unknown Seller</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500">#{inv.id}</td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded w-fit ${isPaid ? 'bg-emerald-50 text-emerald-600' : isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <CalendarClock className="w-3 h-3" />
                                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800">${parseFloat(inv.total_amount).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-bold text-emerald-600">${(parseFloat(inv.paid_amount) || 0).toLocaleString()}</div>
                                        {inv.payment_status === 'Partial' && (
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Partially Paid</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                            ${(parseFloat(inv.balance_due) || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!isPaid && (
                                            <button
                                                onClick={() => openPaymentModal(inv)}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                                            >
                                                Add Payment
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredInvoices.length === 0 && (
                            <tr><td colSpan="7" className="text-center py-10 text-slate-400 font-medium">No records found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
                        {isSubmitting && isSuccess ? (
                            <div className="p-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">Payment Successful!</h3>
                                <p className="text-slate-500 font-bold mt-2">Updating records...</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-slate-50 p-6 border-b border-slate-100">
                                    <h3 className="text-lg font-black text-slate-800">Record Payment</h3>
                                    <p className="text-xs font-bold text-slate-500 mt-1">Invoice #{selectedInvoice.id} • Balance: ${selectedInvoice.balance_due}</p>
                                </div>
                                <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Amount ($)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                required
                                                max={selectedInvoice.balance_due}
                                                step="0.01"
                                                value={paymentAmount}
                                                onChange={e => setPaymentAmount(e.target.value)}
                                                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Payment Mode</label>
                                        <select
                                            value={paymentMode}
                                            onChange={e => setPaymentMode(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        >
                                            <option>Bank Transfer</option>
                                            <option>Cash</option>
                                            <option>Cheque</option>
                                            <option>Credit Card</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Note / Reference</label>
                                        <textarea
                                            value={paymentNote}
                                            onChange={e => setPaymentNote(e.target.value)}
                                            placeholder="Transaction ID, Cheque No, etc."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none h-20"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedInvoice(null)}
                                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Saving...' : 'Confirm Payment'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPayments;
