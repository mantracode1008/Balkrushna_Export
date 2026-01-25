import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Check, ArrowLeft, RefreshCw, ShoppingBag, CreditCard, Sparkles, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import invoiceService from '../services/invoice.service';
import diamondService from '../services/diamond.service';

// Toast Component
const Toast = ({ message }) => (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto border border-slate-700/50">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-sm tracking-wide">{message}</span>
        </div>
    </div>
);

const Order = () => {
    const { cartItems, removeFromCart, clearCart } = useCart();
    const navigate = useNavigate();

    // State for enriched items
    const [orderItems, setOrderItems] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Toast & Removing State
    const [toastMsg, setToastMsg] = useState('');
    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };
    const [removingId, setRemovingId] = useState(null);

    // Auto-redirect on success
    useEffect(() => {
        if (showSuccessModal) {
            const timer = setTimeout(() => {
                clearCart();
                setShowSuccessModal(false);
                navigate('/'); // Redirect to Dashboard
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [showSuccessModal, navigate, clearCart]);

    // Initialize orderItems from cartItems
    useEffect(() => {
        if (cartItems.length !== orderItems.length) {
            const items = cartItems.map(item => {
                const baseTotal = parseFloat(item.price) || 0;
                const carat = parseFloat(item.carat) || 0;
                const baseRate = carat > 0 ? baseTotal / carat : 0;
                const discount = item.discount ? parseFloat(item.discount) : 0;

                // Initial calculation: Final = Base * (1 - D/100)
                const afterDisc = baseTotal * (1 - discount / 100);
                const final = afterDisc;

                return {
                    ...item,
                    discountPercent: discount,
                    commissionPercent: 0,
                    baseRate,
                    baseTotal,
                    finalAmount: final,
                    isCalculated: true
                };
            });
            setOrderItems(items);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartItems]);

    const handlePriceChange = (index, field, value) => {
        const newItems = [...orderItems];
        const item = newItems[index];
        const val = parseFloat(value) || 0;

        if (field === 'discountPercent') item.discountPercent = val;
        if (field === 'commissionPercent') item.commissionPercent = val;

        if (item.baseTotal) {
            const afterDiscount = item.baseTotal * (1 - (item.discountPercent / 100));
            const afterCommission = afterDiscount * (1 + (item.commissionPercent / 100));
            item.finalAmount = afterCommission;
        }

        setOrderItems(newItems);
    };

    const handleRemove = async (item) => {
        setRemovingId(item.id);
        try {
            await diamondService.updateStatus(item.id, 'in_stock');
            removeFromCart(item.id);
            showToast("Item returned to Inventory");
        } catch (err) {
            console.error(err);
            alert("Failed to remove from cart");
        }
        setRemovingId(null);
    };

    const handlePlaceOrder = async () => {
        if (orderItems.length === 0) return;
        if (!customerName) {
            alert("Please enter Customer Name");
            return;
        }

        setLoading(true);
        try {
            const payloadItems = orderItems.map(item => {
                const afterDiscount = item.baseTotal * (1 - (item.discountPercent / 100));
                const commissionAmount = afterDiscount * (item.commissionPercent / 100);

                return {
                    diamondId: item.id,
                    quantity: 1, // Fixed to 1
                    salePrice: item.finalAmount,
                    commission: commissionAmount
                };
            });

            await invoiceService.create({
                customerName,
                items: payloadItems
            });

            setShowSuccessModal(true);

        } catch (err) {
            console.error(err);
            alert("Failed to place order: " + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.finalAmount || 0), 0);
    const totalCarat = orderItems.reduce((acc, i) => acc + (parseFloat(i.carat) || 0), 0);

    // Empty State
    if (cartItems.length === 0 && !showSuccessModal) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                <div className="relative z-10 flex flex-col items-center text-center p-8 bg-white/40  backdrop-blur-xl rounded-3xl border border-white/50  shadow-xl">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 transition-transform hover:rotate-6">
                        <ShoppingBag className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800  mb-3">Your Cart is Empty</h2>
                    <p className="text-slate-500  mb-8 max-w-xs leading-relaxed">
                        Looks like you haven't added any diamonds yet. Explore our inventory to find the perfect gems.
                    </p>
                    <Link
                        to="/inventory"
                        className="group flex items-center gap-2 px-8 py-4 bg-slate-900  text-white rounded-xl font-semibold hover:bg-slate-800  transition-all shadow-xl shadow-slate-900/20  hover:shadow-2xl hover:-translate-y-1"
                    >
                        <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-12 relative">
            {toastMsg && <Toast message={toastMsg} />}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/inventory" className="p-3 bg-white  hover:bg-slate-50  rounded-xl shadow-sm border border-slate-100  transition-colors text-slate-600 ">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 ">Shopping Cart</h1>
                        <p className="text-slate-500  text-sm">{orderItems.length} items selected</p>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        if (!window.confirm("Are you sure you want to clear the cart?")) return;
                        setLoading(true);
                        try {
                            await diamondService.bulkUpdateStatus(orderItems.map(i => i.id), 'in_stock');
                            clearCart();
                        } catch (err) { console.error(err); }
                        setLoading(false);
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear Cart
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Items List */}
                <div className="flex-1 space-y-6">
                    {orderItems.map((item, idx) => (
                        <div key={item.id} className="group bg-white  rounded-2xl p-5 shadow-sm border border-slate-100  hover:shadow-md transition-all duration-300 relative overflow-hidden">
                            {/* Item Gradient Border */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                {/* Diamond Icon/Image */}
                                <div className="w-16 h-16 bg-blue-50  rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-8 h-8 text-blue-500  opacity-80" />
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-bold text-slate-800 ">{item.certificate}</h3>
                                        <span className="px-3 py-1 bg-slate-100  text-slate-600  rounded-full text-xs font-bold font-mono">
                                            {item.carat} CT
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500  mb-3">
                                        {item.shape} &bull; {item.color} &bull; {item.clarity}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="bg-slate-50  px-3 py-1.5 rounded-lg border border-slate-100 ">
                                            <span className="text-slate-400  mr-2 text-xs uppercase font-bold">Base</span>
                                            <span className="font-mono text-slate-700 ">${item.baseTotal?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex flex-row md:flex-col gap-4 items-end min-w-[140px]">
                                    <div className="flex items-center gap-3 w-full justify-end">
                                        <div className="flex flex-col items-end">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Discount %</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.discountPercent}
                                                onChange={(e) => handlePriceChange(idx, 'discountPercent', e.target.value)}
                                                className="w-20 px-2 py-1 text-right border border-slate-200   rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600  text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Comm %</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.commissionPercent}
                                                onChange={(e) => handlePriceChange(idx, 'commissionPercent', e.target.value)}
                                                className="w-20 px-2 py-1 text-right border border-slate-200   rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold text-purple-600  text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full justify-between md:justify-end border-t border-slate-50  pt-3 md:border-0 md:pt-0">
                                        <span className="md:hidden text-sm font-bold text-slate-700 ">Final Price:</span>
                                        <div className="text-xl font-bold text-emerald-600  font-mono">
                                            ${item.finalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRemove(item)}
                                    disabled={removingId === item.id}
                                    className="absolute top-4 right-4 p-2 text-slate-300  hover:text-red-500  transition-colors disabled:opacity-50"
                                >
                                    {/* Spinner logic for removing state */}
                                    {removingId === item.id ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Summary Panel */}
                <div className="lg:w-96">
                    <div className="sticky top-8 space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white  rounded-3xl p-6 shadow-xl shadow-slate-200/50  border border-slate-100  overflow-hidden relative transition-colors">
                            {/* Decorative Top */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                            <h3 className="text-xl font-bold text-slate-800  mb-6 mt-2">Order Summary</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-slate-600 ">
                                    <span>Total Items</span>
                                    <span className="font-semibold text-slate-900 ">{orderItems.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 ">
                                    <span>Total Carats</span>
                                    <span className="font-semibold text-slate-900 ">{totalCarat.toFixed(2)} cts</span>
                                </div>
                                <div className="h-px bg-slate-100  my-4"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-slate-700 ">Total</span>
                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600  ">
                                        ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500  uppercase tracking-wider mb-2 block">Customer Name</label>
                                    <input
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        placeholder="Enter Client Name"
                                        className="w-full px-4 py-3 bg-slate-50  border border-slate-200  rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900  placeholder-slate-400"
                                    />
                                </div>

                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="w-full py-4 bg-slate-900  text-white rounded-xl font-bold text-lg hover:bg-slate-800  transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <CreditCard className="w-5 h-5" />
                                            Place Order
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Security Badge / Trust */}
                        <div className="flex items-center justify-center gap-2 text-slate-400  text-xs font-medium">
                            <Check className="w-3 h-3" /> Secure Transaction
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white  rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all animate-in zoom-in-95 duration-300 relative overflow-hidden text-center border border-white/20 ">
                        <div className="w-20 h-20 bg-green-100  rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <Check className="w-10 h-10 text-green-600 " strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900  mb-2">Order Confirmed!</h2>
                        <p className="text-slate-500  mb-8">
                            Redirecting to Dashboard...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Order;
