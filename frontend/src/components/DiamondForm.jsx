import React, { useState, useEffect } from 'react';
import diamondService from '../services/diamond.service';
import {
    X, Search, Gem, DollarSign, Globe, User, Calculator,
    FileText, Check, ChevronDown, Plus, Info, TrendingUp,
    ArrowRight, MapPin, Phone, Mail, Building2, Package
} from 'lucide-react';
import { SHAPE_MASTER, SHAPE_OPTIONS, getDisplayShape } from '../utils/shapeUtils';
import ClientSelect from './ClientSelect';
import CompanySelect from './CompanySelect';
import SellerSelect from './SellerSelect';
import LocationSelect from './LocationSelect';
import ClientForm from './ClientForm';
import invoiceService from '../services/invoice.service';
import api from '../services/api';

// --- ATOMIC COMPONENTS ---

const Card = ({ children, title, icon: Icon, className = "", headerAction }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
        {(title || Icon) && (
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Icon size={18} strokeWidth={2.5} />
                        </div>
                    )}
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
                </div>
                {headerAction}
            </div>
        )}
        <div className="p-6">
            {children}
        </div>
    </div>
);

const Label = ({ children, required }) => (
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
        {children} {required && <span className="text-rose-500">*</span>}
    </label>
);

const Input = ({ label, required, className = "", ...props }) => (
    <div className={`flex flex-col ${className}`}>
        {label && <Label required={required}>{label}</Label>}
        <input
            {...props}
            className="w-full px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium disabled:opacity-60"
        />
    </div>
);

const Select = ({ label, options, required, className = "", ...props }) => (
    <div className={`flex flex-col ${className}`}>
        {label && <Label required={required}>{label}</Label>}
        <div className="relative">
            <select
                {...props}
                className="w-full px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
                <option value="">Select...</option>
                {options.map((opt, idx) => (
                    <option key={idx} value={typeof opt === 'object' ? opt.value : opt}>
                        {typeof opt === 'object' ? opt.label : opt}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
    </div>
);

const SuccessPopup = ({ message }) => (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 slide-in-from-bottom-6 duration-500">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <Check className="w-10 h-10 text-emerald-600" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{message}</h3>
            <div className="h-1.5 w-32 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 w-full animate-[progress_1.5s_ease-in-out_forwards]" />
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const DiamondForm = ({ onClose, onSuccess, initialData }) => {
    // --- STATE ---
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [formData, setFormData] = useState({
        certificate: '',
        shape: 'Round',
        carat: '',
        color: '',
        color_code: '',
        S_code: '',
        clarity: '',
        clarity_code: '',
        cut: 'Ex',
        lab: '',
        polish: 'Ex',
        symmetry: 'Ex',
        fluorescence: 'N',
        crown_height: '',
        pavilion_depth: '',
        girdle_thickness: '',
        culet: '',
        total_depth_percent: '',
        table_percent: '',
        inscription: '',
        comments: '',
        price: '',
        discount: '',
        status: 'in_stock',
        quantity: 1,
        buyer_name: '',
        buyer_mobile: '',
        buyer_country: '',
        seller_country: '',
        sale_price: '',
        commission: '',
        company: '',
        measurements: '',
        // Purchase Info
        seller_id: '',
        buy_price: '',
        buy_date: '',
        payment_due_date: ''
    });

    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [pricePerCarat, setPricePerCarat] = useState('');
    const [dueDays, setDueDays] = useState(''); // New state for due days
    const [buyers, setBuyers] = useState([]);
    const [saleType, setSaleType] = useState('STOCK');
    const [clientData, setClientData] = useState({});
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState('');
    const [commissionINR, setCommissionINR] = useState('');
    const [commissionUSD, setCommissionUSD] = useState('');
    const [statusWarning, setStatusWarning] = useState(null); // { type: 'sold' | 'in_stock', message: string, diamond: obj }

    // --- EFFECTS ---

    useEffect(() => {
        const fetchBuyers = async () => {
            try {
                const res = await diamondService.getBuyers();
                if (res.data) setBuyers(res.data);
            } catch (err) {
                console.error("Failed to load buyers", err);
            }
        };
        fetchBuyers();
    }, []);

    useEffect(() => {
        if (!formData.buyer_name) return;
        const matchedBuyer = buyers.find(b => b.buyer_name.toLowerCase() === formData.buyer_name.toLowerCase());
        if (matchedBuyer) {
            setFormData(prev => ({
                ...prev,
                buyer_mobile: matchedBuyer.buyer_mobile || prev.buyer_mobile,
                seller_country: matchedBuyer.buyer_country || prev.seller_country
            }));
        }
    }, [formData.buyer_name, buyers]);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
            if (initialData.price && initialData.carat && Number(initialData.carat) > 0) {
                setPricePerCarat((Number(initialData.price) / Number(initialData.carat)).toFixed(2));
            }
        }
    }, [initialData]);

    useEffect(() => {
        const c = parseFloat(formData.carat) || 0;
        const p = parseFloat(pricePerCarat) || 0;
        if (c >= 0 && p >= 0) {
            const total = (c * p).toFixed(2);
            setFormData(prev => ({ ...prev, price: total }));
        }
    }, [formData.carat, pricePerCarat]);

    useEffect(() => {
        setFormData(prev => {
            const colorMap = { 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'H': 5, 'I': 6, 'J': 7, 'K': 8, 'L': 9, 'M': 10 };
            const clarityMap = { 'IF': 'Q1', 'VVS1': 'Q2', 'VVS2': 'Q3', 'VS1': 'Q4', 'VS2': 'Q5', 'SI1': 'Q6', 'SI2': 'Q7', 'SI3': 'Q8', 'I1': 'Q9', 'I2': 'Q10', 'I3': 'Q11', 'I4': 'Q12', 'I5': 'Q13', 'I6': 'Q14', 'I7': 'Q15' };
            const colorCode = colorMap[String(prev.color || '').toUpperCase().trim()] || prev.color_code || '';
            const cVal = String(prev.clarity || '').toUpperCase().trim();
            const clarityCode = clarityMap[cVal] || clarityMap[cVal.replace(/\s+/g, '')] || prev.clarity_code || '';
            if (colorCode !== prev.color_code || clarityCode !== prev.clarity_code) {
                return { ...prev, color_code: colorCode, clarity_code: clarityCode };
            }
            return prev;
        });
    }, [formData.color, formData.clarity]);

    useEffect(() => {
        const { carat, shape, color_code, clarity_code } = formData;
        if (carat && shape && color_code && clarity_code) {
            const fetchRap = async () => {
                try {
                    const res = await diamondService.calculateRapPrice({
                        carat: parseFloat(carat),
                        shape: shape,
                        S_code: formData.S_code,
                        color_code: parseInt(color_code),
                        clarity_code: clarity_code
                    });
                    if (res.data && res.data.price) {
                        setPricePerCarat(res.data.price);
                    }
                } catch { }
            };
            const timer = setTimeout(fetchRap, 500);
            return () => clearTimeout(timer);
        }
    }, [formData.carat, formData.shape, formData.color_code, formData.clarity_code]);

    // --- HANDLERS ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const normalizeGrade = (val) => {
        if (!val) return null;
        const lower = val.toString().toLowerCase().trim();
        if (lower.startsWith('ex')) return 'Ex';
        if (lower.startsWith('vg') || lower.startsWith('very')) return 'Vg';
        if (lower.startsWith('gd') || lower.startsWith('good')) return 'Gd';
        return ['Ex', 'Vg', 'Gd'].find(opt => opt.toLowerCase() === lower) || null;
    };

    const handleFetch = async () => {
        if (!formData.certificate) return;
        setFetchLoading(true);
        setStatusWarning(null); // Clear previous warnings

        try {
            // Priority 1: Check Internal Status
            const statusCheck = await diamondService.checkStatus(formData.certificate);
            if (statusCheck.data && statusCheck.data.exists) {
                const { status, diamond } = statusCheck.data;
                if (status === 'sold') {
                    setStatusWarning({
                        type: 'sold',
                        message: `This diamond (Cert: ${formData.certificate}) is already SOLD!`,
                        diamond
                    });
                } else if (status === 'in_stock') {
                    setStatusWarning({
                        type: 'in_stock',
                        message: `This diamond (Cert: ${formData.certificate}) is already IN STOCK!`,
                        diamond
                    });
                }
            }

            const response = await diamondService.fetchExternal(formData.certificate);
            if (response.data) {
                const fetched = response.data;
                Object.keys(fetched).forEach(key => {
                    if (typeof fetched[key] === 'string') fetched[key] = fetched[key].toUpperCase();
                });
                const newCut = normalizeGrade(fetched.cut);
                const newPolish = normalizeGrade(fetched.polish);
                const newSym = normalizeGrade(fetched.symmetry);
                setFormData(prev => ({
                    ...prev,
                    ...fetched,
                    cut: newCut || prev.cut || 'Ex',
                    polish: newPolish || prev.polish || 'Ex',
                    symmetry: newSym || prev.symmetry || 'Ex',
                    price: (fetched.price && Number(fetched.price) > 0) ? fetched.price : prev.price,
                    shape: fetched.shape || prev.shape,
                    S_code: fetched.S_code || prev.S_code,
                }));
                if (fetched.rap_price && Number(fetched.rap_price) > 0) setPricePerCarat(fetched.rap_price);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (formData.status === 'sold') {
                const errors = [];
                if (!formData.buyer_name) errors.push("Client Name is required when marking as sold.");
                if (!formData.sale_price || Number(formData.sale_price) <= 0) errors.push("Valid Sale Price is required when marking as sold.");
                if (errors.length > 0) {
                    alert(errors.join("\n"));
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                ...formData,
                sale_type: saleType,
                currency: currency,
                exchange_rate: parseFloat(exchangeRate) || 1,
                commission_usd: parseFloat(commissionUSD) || 0,
                commission_inr: parseFloat(commissionINR) || 0,
            };

            // 1. Auto-set Buy Price from Calculated Value (Rap Total - Discount)
            const basePrice = parseFloat(formData.price) || 0;
            const disc = parseFloat(formData.discount) || 0;
            const finalBuyPrice = basePrice * (1 - disc / 100);
            payload.buy_price = parseFloat(finalBuyPrice.toFixed(2));

            // 2. Auto-set Dates
            if (payload.seller_id) {
                const today = new Date();
                payload.buy_date = today.toISOString().split('T')[0];

                // Calculate Due Date from Days
                if (dueDays) {
                    const due = new Date(today);
                    due.setDate(today.getDate() + parseInt(dueDays));
                    payload.payment_due_date = due.toISOString().split('T')[0];
                }
            }

            if (initialData && initialData.id) {
                await diamondService.update(initialData.id, payload);
            } else {
                // For New Diamonds
                // If Order Mode, force status to 'in_stock' initially (will sell in next step)
                if (saleType === 'ORDER') {
                    payload.status = 'in_stock';
                    payload.commission = 0;
                }

                const newDiamond = await diamondService.create(payload);

                if (saleType === 'ORDER' && newDiamond.data && newDiamond.data.id) {
                    setSuccessMsg('Asset Created! Opening Sales...');
                    setShowSuccess(true);
                    setTimeout(() => {
                        if (onSuccess) onSuccess(newDiamond.data.id, 'ORDER');
                        if (onClose) onClose();
                    }, 1000);
                    return;
                }
            }

            const isSold = formData.status === 'sold';
            setSuccessMsg(isSold ? 'Diamond Sold Successfully!' : 'Asset Saved Successfully!');
            setShowSuccess(true);
            setTimeout(() => {
                if (isSold) window.location.href = '/invoices';
                else { if (onSuccess) onSuccess(); if (onClose) onClose(); }
            }, 1000);
        } catch (error) {
            console.error("Save Error:", error);
            const msg = error.response?.data?.message || error.message || "Failed to save diamond.";
            alert(`Save Error: ${msg}`);
        } finally { setLoading(false); }
    };

    // --- RENDER ---

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            {showSuccess && <SuccessPopup message={successMsg} />}

            <div className="bg-slate-50 rounded-[28px] w-full max-w-7xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-white/20">

                {/* --- HEADER --- */}
                <header className="px-8 py-6 bg-white border-b border-slate-100 flex justify-between items-center z-20 shadow-sm relative">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Plus size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                                {initialData ? 'Edit Asset' : 'New Diamond Asset'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                                Professional Export Management System
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-rose-500 hover:rotate-90"
                    >
                        <X size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-8 py-10">
                    <div className="grid grid-cols-12 gap-10">

                        {/* --- LEFT COLUMN (65%) --- */}
                        <div className="col-span-12 lg:col-span-8 space-y-8">

                            {/* Section 1: Identification & Certificate */}
                            <Card title="Identification & Certificate" icon={Gem}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <Label required>Certificate Number</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1 group">
                                                <input
                                                    type="text"
                                                    name="certificate"
                                                    value={formData.certificate}
                                                    onChange={handleChange}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFetch(); } }}
                                                    required
                                                    autoFocus
                                                    placeholder="Enter GIA / IGI #..."
                                                    className="w-full pl-12 pr-4 py-3.5 text-lg font-black text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all group-focus-within:shadow-xl group-focus-within:shadow-indigo-500/10"
                                                />
                                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleFetch}
                                                disabled={fetchLoading}
                                                className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
                                            >
                                                {fetchLoading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} strokeWidth={3} />}
                                                <span>FETCH</span>
                                            </button>
                                        </div>
                                        {/* Status Warning UI */}
                                        {statusWarning && (
                                            <div className={`mt-3 px-4 py-3 rounded-xl border-l-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${statusWarning.type === 'sold'
                                                ? 'bg-rose-50 border-rose-500 text-rose-700'
                                                : 'bg-orange-50 border-orange-500 text-orange-700'
                                                }`}>
                                                <div className={`p-1.5 rounded-full ${statusWarning.type === 'sold' ? 'bg-rose-100' : 'bg-orange-100'}`}>
                                                    {statusWarning.type === 'sold'
                                                        ? <X size={14} className="text-rose-600" strokeWidth={3} />
                                                        : <Info size={14} className="text-orange-600" strokeWidth={3} />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-wide">{statusWarning.message}</p>
                                                    {statusWarning.diamond && (
                                                        <p className="text-xs font-semibold opacity-80 mt-0.5">
                                                            {statusWarning.diamond.shape} • {statusWarning.diamond.carat}ct • {statusWarning.diamond.color}/{statusWarning.diamond.clarity} • Loc: {statusWarning.diamond.seller_country || 'N/A'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <CompanySelect value={formData.company} onChange={handleChange} />
                                    </div>
                                    <Select label="Shape" name="shape" options={SHAPE_OPTIONS} value={getDisplayShape(formData.shape)} onChange={(e) => setFormData(prev => ({ ...prev, shape: e.target.value }))} required />
                                    <Input label="Carat Weight" name="carat" value={formData.carat} onChange={handleChange} type="number" required placeholder="0.00" />
                                </div>
                            </Card>

                            {/* Section 2: Grading Report (4Cs) */}
                            <Card title="Grading Report (4Cs)" icon={FileText}>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <Input label="Color" name="color" value={formData.color} onChange={handleChange} placeholder="D-Z" className="text-center" />
                                    <Input label="Clarity" name="clarity" value={formData.clarity} onChange={handleChange} placeholder="VVS1..." className="text-center" />
                                    <Select label="Cut" name="cut" options={['Ex', 'Vg', 'Gd', 'Fr']} value={formData.cut} onChange={handleChange} />
                                    <Select label="Polish" name="polish" options={['Ex', 'Vg', 'Gd', 'Fr']} value={formData.polish} onChange={handleChange} />
                                    <Select label="Symmetry" name="symmetry" options={['Ex', 'Vg', 'Gd', 'Fr']} value={formData.symmetry} onChange={handleChange} />
                                    <Select label="Fluor" name="fluorescence" options={['N', 'F', 'M', 'S', 'VS']} value={formData.fluorescence} onChange={handleChange} />
                                </div>
                            </Card>

                            {/* Section 3: Measurements & Ratios */}
                            <Card title="Measurements & Ratios" icon={Calculator}>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2">
                                        <Input label="Dimensions" name="measurements" value={formData.measurements} onChange={handleChange} placeholder="6.50 x 6.52 x 4.00 mm" />
                                    </div>
                                    <Input label="Table %" name="table_percent" value={formData.table_percent} onChange={handleChange} placeholder="57" />
                                    <Input label="Depth %" name="total_depth_percent" value={formData.total_depth_percent} onChange={handleChange} placeholder="62.5" />

                                    <Input label="Cr Ht" name="crown_height" value={formData.crown_height} onChange={handleChange} placeholder="15.0" />
                                    <Input label="Pv Dp" name="pavilion_depth" value={formData.pavilion_depth} onChange={handleChange} placeholder="43.5" />
                                    <Input label="Girdle" name="girdle_thickness" value={formData.girdle_thickness} onChange={handleChange} placeholder="Med-Thk" />
                                    <Input label="Culet" name="culet" value={formData.culet} onChange={handleChange} placeholder="None" />

                                    <div className="md:col-span-4">
                                        <Input label="Inscription / Comments" name="inscription" value={formData.inscription} onChange={handleChange} placeholder="GIA 12345678, Minor graining..." />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* --- RIGHT COLUMN (35%) --- */}
                        <div className="col-span-12 lg:col-span-4 space-y-8">

                            {/* Sale Mode Toggle */}
                            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex">
                                <button
                                    onClick={() => setSaleType('STOCK')}
                                    className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all tracking-wider ${saleType === 'STOCK' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                >
                                    Stock
                                </button>
                                <button
                                    onClick={() => setSaleType('ORDER')}
                                    className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all tracking-wider ${saleType === 'ORDER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                >
                                    Order
                                </button>
                            </div>

                            {/* Section 4: Pricing & Economics (Highlighted) */}
                            <div className="bg-slate-900 rounded-[24px] overflow-hidden shadow-2xl shadow-indigo-200 border border-slate-800 relative group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
                                <div className="p-8 relative z-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                                            <TrendingUp size={20} strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Pricing & Economics</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rap / Base ($)</label>
                                                <input
                                                    type="number" step="0.01" value={pricePerCarat} onChange={(e) => setPricePerCarat(e.target.value)}
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                                    placeholder="Per Ct"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount %</label>
                                                <input
                                                    type="number" step="0.01" name="discount" value={formData.discount} onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-800/50">
                                            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-3 block">Calculated Value (USD)</label>
                                            <div className="text-5xl font-black text-white tracking-tighter drop-shadow-sm">
                                                <span className="text-emerald-500 text-3xl mr-1">$</span>
                                                {((parseFloat(formData.price) || 0) * (1 - (parseFloat(formData.discount) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-slate-500 bg-white/5 py-2 px-3 rounded-lg w-fit">
                                                <Info size={12} className="text-indigo-400" />
                                                Estimated Export Valuation
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Purchase Info (Admin Only) - Moved here */}
                            <Card title="Purchase Details (Internal)" icon={Building2} className="border-l-4 border-l-blue-500">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <SellerSelect value={formData.seller_id} onChange={handleChange} />
                                    </div>
                                    <Input
                                        label="Payment Terms (Days)"
                                        type="number"
                                        placeholder="e.g. 7"
                                        value={dueDays}
                                        onChange={(e) => setDueDays(e.target.value)}
                                    />
                                    {/* Calculated Due Date Preview (Optional) */}
                                    {dueDays && (
                                        <div className="text-[10px] font-bold text-indigo-500 mt-2 flex items-center gap-1">
                                            Due: {new Date(new Date().setDate(new Date().getDate() + parseInt(dueDays))).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </Card>



                        </div>
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <footer className="px-8 py-5 bg-white border-t border-slate-100 flex justify-between items-center z-20">
                    <div className="hidden md:flex items-center gap-6 text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Auto-Saving Enabled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise Encrypted</span>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 md:flex-none px-10 py-3.5 text-sm font-black text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            CANCEL
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 md:flex-none px-12 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-indigo-400/40 transition-all flex items-center justify-center gap-3 active:scale-95 group disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>COMMIT ASSET</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DiamondForm;
