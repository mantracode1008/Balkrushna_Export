import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import sellerService from '../services/seller.service';
import sellerPaymentService from '../services/sellerPayment.service';
import diamondService from '../services/diamond.service';

// --- PAYMENT MODAL ---
const PaymentModal = ({ sellerId, isOpen, onClose, onSuccess }) => {
    const [unpaid, setUnpaid] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]); // Default Today
    const [mode, setMode] = useState('Bank Transfer');
    const [ref, setRef] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && sellerId) {
            sellerPaymentService.getUnpaidDiamonds(sellerId).then(res => {
                setUnpaid(res.data || []);
            });
            setPaymentDate(new Date().toISOString().split('T')[0]); // Reset date on open
        }
    }, [isOpen, sellerId]);

    // ... (keep handleToggle and AutoAllocate same) ...
    const handleToggle = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const AutoAllocate = () => {
        const total = unpaid.filter(d => selectedIds.includes(d.id)).reduce((sum, d) => sum + parseFloat(d.due_amount), 0);
        setAmount(total.toFixed(2));
    };

    useEffect(() => {
        if (selectedIds.length > 0) AutoAllocate();
    }, [selectedIds]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return alert("Enter valid amount");

        setLoading(true);
        try {
            if (selectedIds.length === 0) {
                alert("Please select at least one diamond to allocate payment to.");
                setLoading(false);
                return;
            }

            const allocations = [];
            let remaining = parseFloat(amount);
            const selectedDiamonds = unpaid.filter(d => selectedIds.includes(d.id));

            selectedDiamonds.forEach(d => {
                if (remaining <= 0) return;
                const pay = Math.min(remaining, d.due_amount);
                allocations.push({ diamond_id: d.id, amount: pay });
                remaining -= pay;
            });

            const payload = {
                seller_id: sellerId,
                amount: parseFloat(amount),
                payment_date: paymentDate, // Send selected date
                payment_mode: mode,
                reference_number: ref,
                notes: notes,
                allocations: allocations
            };

            await sellerPaymentService.create(payload);
            onSuccess();
            onClose();
        } catch (err) {
            alert("Payment Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8 flex flex-col max-h-[90vh]">
                <h2 className="text-2xl font-black text-slate-800 mb-6">Record Payment</h2>

                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Select Unpaid Diamonds</h3>
                    <div className="space-y-2">
                        {unpaid.length === 0 ? <p className="text-sm italic text-slate-400">No unpaid diamonds.</p> : unpaid.map(d => (
                            <div key={d.id}
                                onClick={() => handleToggle(d.id)}
                                className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${selectedIds.includes(d.id) ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.includes(d.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                        {selectedIds.includes(d.id) && <CheckCircle size={12} className="text-white" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-700">{d.certificate} <span className="text-slate-400 font-normal">({d.shape})</span></p>
                                        <p className="text-xs text-slate-500">Due: <span className="text-rose-600 font-bold">${d.due_amount}</span></p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-800">${d.buy_price}</p>
                                    {d.payment_due_date && <p className="text-[10px] text-slate-400">Due: {d.payment_due_date}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Payment Date</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Total Amount ($)</label>
                            <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 text-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={amount} onChange={e => setAmount(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Payment Mode</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none"
                                value={mode} onChange={e => setMode(e.target.value)}>
                                <option>Cash</option>
                                <option>Bank Transfer</option>
                                <option>Cheque</option>
                                <option>USDT</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 outline-none"
                            placeholder="Reference / Transaction ID" value={ref} onChange={e => setRef(e.target.value)} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3.5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-70">
                            {loading ? 'Processing...' : 'Confirm Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN DETAILS COMPONENT ---
const SellerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [seller, setSeller] = useState(null);
    const [diamonds, setDiamonds] = useState([]);
    const [payments, setPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('purchases'); // purchases | payments
    const [filter, setFilter] = useState('all'); // all | pending | completed
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [sRes, dRes, pRes] = await Promise.all([
                sellerService.get(id),
                diamondService.getAll({ seller_id: id, status: 'all' }),
                sellerPaymentService.getAll(id)
            ]);

            setSeller(sRes.data);
            setDiamonds(dRes.data || []);
            setPayments(pRes.data || []);

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (!seller) return <div className="p-10 text-center animate-pulse">Loading Seller Data...</div>;

    // Filter Logic
    const filteredDiamonds = diamonds.filter(d => {
        const due = (parseFloat(d.buy_price) || 0) - (parseFloat(d.paid_amount) || 0);
        const isPaid = due <= 0.01; // Tolerance for float
        if (filter === 'pending') return !isPaid;
        if (filter === 'completed') return isPaid;
        return true;
    });

    const totalDue = diamonds.reduce((sum, d) => sum + Math.max(0, (parseFloat(d.buy_price) || 0) - (parseFloat(d.paid_amount) || 0)), 0);
    const totalPaid = diamonds.reduce((sum, d) => sum + (parseFloat(d.paid_amount) || 0), 0);


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/sellers')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-500" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">{seller.name}</h1>
                    <p className="text-slate-500 font-medium">{seller.company}</p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex gap-4">
                        <div className="text-right bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Total Settled</span>
                            <div className="text-xl font-black text-emerald-600">${totalPaid.toLocaleString()}</div>
                        </div>
                        <div className="text-right bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block">Outstanding Due</span>
                            <div className="text-xl font-black text-rose-500">${totalDue.toLocaleString()}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPayModalOpen(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                        Record Payment
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'purchases' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Purchase Ledger
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'payments' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Payment History
                </button>
            </div>

            {/* Content */}
            {activeTab === 'purchases' && (
                <div className="space-y-4">
                    {/* Sub-Filters */}
                    <div className="flex gap-2">
                        {['all', 'completed', 'pending'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {f === 'all' ? 'All Records' : f === 'completed' ? 'Completed Records' : 'Pending Payment'}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset / Cert</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Buy Price</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Paid</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Due</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Purchased Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredDiamonds.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-10 text-center text-slate-400 italic">No records found.</td></tr>
                                ) : filteredDiamonds.map(d => {
                                    const buyPrice = parseFloat(d.buy_price) || 0;
                                    const paid = parseFloat(d.paid_amount) || 0;
                                    const due = Math.max(0, buyPrice - paid);
                                    const isPaid = due <= 0.01;

                                    return (
                                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                {isPaid && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mx-auto shadow-[0_0_8px_rgba(16,185,129,0.4)]" title="Fully Paid"></div>}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{d.certificate}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">${buyPrice.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-emerald-600 text-right">${paid.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-rose-500 text-right">${due.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                                {d.payment_due_date ? <span className="flex items-center gap-1"><AlertCircle size={10} className={isPaid ? "text-slate-300" : "text-rose-400"} /> {new Date(d.payment_due_date).toLocaleDateString()}</span> : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                                {d.buy_date ? <span className="flex items-center gap-1"><Clock size={10} /> {new Date(d.buy_date).toLocaleDateString()}</span> : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mode</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payments.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400 italic">No payments recorded.</td></tr>
                            ) : payments.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{new Date(p.payment_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{p.reference_number || '-'}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{p.payment_mode}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{p.notes}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">${parseFloat(p.amount).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <PaymentModal
                sellerId={id}
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                onSuccess={() => { fetchData(); }}
            />
        </div>
    );
};

export default SellerDetails;
