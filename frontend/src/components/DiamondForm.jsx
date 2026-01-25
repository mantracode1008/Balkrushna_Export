import React, { useState, useEffect } from 'react';
import diamondService from '../services/diamond.service';
import { X, Search, Gem, DollarSign, Globe, User, Calculator, FileText } from 'lucide-react';
import { SHAPE_MASTER, SHAPE_OPTIONS, getDisplayShape } from '../utils/shapeUtils';
import ClientSelect from './ClientSelect';
import CompanySelect from './CompanySelect';
import ClientForm from './ClientForm';
import invoiceService from '../services/invoice.service';
import api from '../services/api';

const InputField = ({ label, name, type = "text", required = false, width = "w-full", value, onChange, disabled = false, min, autoFocus = false, inputClassName = "", list, autoComplete, placeholder }) => (
    <div className={`flex flex-col ${width}`}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">{label} {required && <span className="text-red-500">*</span>}</label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            step={type === 'number' ? "0.01" : undefined}
            min={min}
            className={`w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed ${inputClassName}`}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            list={list}
            autoComplete={autoComplete}
            placeholder={placeholder}
        />
    </div>
);

const SelectField = ({ label, name, options, value, onChange, required = false, width = "w-full" }) => (
    <div className={`flex flex-col ${width}`}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">{label} {required && <span className="text-red-500">*</span>}</label>
        <select
            name={name}
            value={value || ''}
            onChange={onChange}
            className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all cursor-pointer hover:bg-slate-100"
            required={required}
        >
            <option value="">Select...</option>
            {options.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

const SectionHeader = ({ icon: Icon, title, color = "text-slate-800" }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <div className={`p-1.5 rounded-lg ${color.replace('text-', 'bg-').replace('800', '100')} ${color}`}>
            <Icon size={14} strokeWidth={3} />
        </div>
        <h3 className={`text-xs font-black uppercase tracking-widest ${color}`}>{title}</h3>
    </div>
);

const SuccessPopup = ({ message }) => (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300">
        <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <Gem className="w-8 h-8 text-emerald-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{message}</h3>
            <div className="h-1 w-24 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full animate-[progress_1s_ease-in-out_forwards]" />
            </div>
        </div>
    </div>
);

const DiamondForm = ({ onClose, onSuccess, initialData }) => {
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
        // Refactored Fields
        buyer_name: '',
        buyer_mobile: '',
        // Removed buyer_country from client, moved to logistics with seller_country
        buyer_country: '',
        seller_country: '',
        sale_price: '',
        commission: '',
        company: '',
        // Removed: diamond_type, growth_process, report_url
    });

    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [pricePerCarat, setPricePerCarat] = useState('');
    const [buyers, setBuyers] = useState([]);

    // Advanced Sales Flow State
    const [saleType, setSaleType] = useState('STOCK'); // 'STOCK' | 'ORDER'
    const [clientData, setClientData] = useState({}); // For New Client in Order Mode

    // Financials
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState('');
    const [commissionINR, setCommissionINR] = useState('');
    const [commissionUSD, setCommissionUSD] = useState('');

    const [currencySymbol, setCurrencySymbol] = useState('$');

    // Effect: Sync Currency Symbol
    useEffect(() => {
        setCurrencySymbol(currency === 'INR' ? '₹' : (currency === 'EUR' ? '€' : '$'));
    }, [currency]);

    // Effect: Commission Bidirectional Sync
    // We use commissionUSD as source of truth for saving, but UI allows both.
    // Logic moved to handlers to avoid loop.

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
                seller_country: matchedBuyer.buyer_country || prev.seller_country // Auto-fill 'Buyer Location' (which maps to seller_country DB field)
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
        const matched = ['Ex', 'Vg', 'Gd'].find(opt => opt.toLowerCase() === lower);
        return matched || null;
    };

    const handleFetch = async () => {
        if (!formData.certificate) return;
        setFetchLoading(true);
        try {
            const response = await diamondService.fetchExternal(formData.certificate);
            if (response.data) {
                const fetched = response.data;
                Object.keys(fetched).forEach(key => {
                    if (typeof fetched[key] === 'string') {
                        fetched[key] = fetched[key].toUpperCase();
                    }
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

                if (fetched.rap_price && Number(fetched.rap_price) > 0) {
                    setPricePerCarat(fetched.rap_price);
                }
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

            if (initialData && initialData.id) {
                await diamondService.update(initialData.id, formData);
                // Update Logic handled in service
            } else {
                // Prepare Payload
                const payload = {
                    ...formData,
                    sale_type: saleType,
                    // Financials
                    currency: currency,
                    exchange_rate: parseFloat(exchangeRate) || 1,
                    commission_usd: parseFloat(commissionUSD) || 0,
                    commission_inr: parseFloat(commissionINR) || 0,
                    // If Order Mode, include Client Data
                    ...(saleType === 'ORDER' ? {
                        client: clientData,
                        status: 'sold' // Force sold
                    } : {
                        status: 'in_stock'
                    })
                };

                // If Order Mode, Create Client first? Or handle in backend?
                // Backend 'create' doesn't support nested client creation in one go easily unless we modify it heavily.
                // Better approach: If Order Mode, create Client first, then Diamond.

                if (saleType === 'ORDER') {
                    // 1. Create Client
                    try {
                        const clientRes = await api.post('/clients', clientData);
                        payload.client_id = clientRes.data.id;
                        payload.buyer_name = clientData.name;
                        payload.buyer_country = clientData.country;
                        payload.buyer_mobile = clientData.contact_number;
                    } catch (cErr) {
                        alert("Failed to create Client. Please check details.");
                        setLoading(false);
                        return;
                    }
                }

                const newDiamond = await diamondService.create(payload);

                // Invoice Logic for Order Mode
                if (saleType === 'ORDER' && newDiamond.data && newDiamond.data.id) {
                    try {
                        const totalUSD = parseFloat(payload.price) || 0; // Cost? Or Sale Price?
                        // Actually in Order Mode, we should have a Final Sale Price.
                        // Let's assume 'price' field in form is COST, and we need a SALE PRICE field.
                        // formData.sale_price should be used.

                        await invoiceService.create({
                            customerName: clientData.name,
                            client_id: payload.client_id,
                            customer_name: clientData.name,
                            items: [{
                                diamondId: newDiamond.data.id,
                                quantity: 1,
                                salePrice: parseFloat(formData.sale_price) || 0
                            }],
                            currency: currency,
                            exchange_rate: payload.exchange_rate,
                            commission_total_usd: payload.commission_usd,
                            commission_total_inr: payload.commission_inr,
                            final_amount_usd: parseFloat(formData.sale_price) || 0,
                            // ... other fields
                        });
                    } catch (invErr) {
                        console.error("Auto-Invoice Failed:", invErr);
                    }
                }
            }

            // Determine Success Message & Action
            const isSold = formData.status === 'sold';
            const msg = isSold ? 'Diamond Sold Successfully!' : 'Diamond Saved Successfully!';

            setSuccessMsg(msg);
            setShowSuccess(true);

            setTimeout(() => {
                if (isSold) {
                    // Optional: If you want to force redirect, or just close.
                    // User flow previously asked confirmation. Now we just do it?
                    // Let's assume we redirect if sold, or just close if that's preferred.
                    // Previous code: confirm -> redirect.
                    // New code: Just redirect after popup.
                    window.location.href = '/invoices';
                } else {
                    if (onSuccess) onSuccess();
                    if (onClose) onClose();
                }
            }, 1000);

        } catch (error) {
            console.error("Submit error:", error);
            alert(error.response?.data?.message || "Failed to save diamond.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            {showSuccess && <SuccessPopup message={successMsg} />}
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200">
                {/* 1. Modern Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 bg-white z-10 sticky top-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {initialData ? 'Edit Inventory' : 'Add Inventory'}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Diamond Details Entry</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                        <X className="w-6 h-6 text-slate-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="grid grid-cols-12 gap-8">

                        {/* LEFT COLUMN: Identification & Grading */}
                        <div className="col-span-12 lg:col-span-7 space-y-6">

                            {/* Panel: Identification */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                                <SectionHeader icon={Gem} title="Identification & Certificate" color="text-indigo-600" />

                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                name="certificate"
                                                value={formData.certificate}
                                                onChange={handleChange}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFetch(); } }}
                                                required
                                                autoFocus
                                                placeholder="Certificate No."
                                                className="w-full px-4 py-3 text-lg font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleFetch}
                                            disabled={fetchLoading}
                                            className="px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                        >
                                            {fetchLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                                            <span>Fetch</span>
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <CompanySelect value={formData.company} onChange={handleChange} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <SelectField label="Shape" name="shape" options={SHAPE_OPTIONS} value={getDisplayShape(formData.shape)} onChange={(e) => setFormData(prev => ({ ...prev, shape: e.target.value }))} />
                                        <InputField label="Carat Weight" name="carat" value={formData.carat} onChange={handleChange} type="number" required />
                                    </div>
                                </div>
                            </div>

                            {/* Panel: Grading (4Cs) */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                                <SectionHeader icon={FileText} title="Grading Report (4Cs)" color="text-blue-600" />
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    <InputField label="Color" name="color" value={formData.color} onChange={handleChange} inputClassName="text-center" />
                                    <InputField label="Clarity" name="clarity" value={formData.clarity} onChange={handleChange} inputClassName="text-center" />
                                    <SelectField label="Cut" name="cut" options={['Ex', 'Vg', 'Gd']} value={formData.cut} onChange={handleChange} />
                                    <SelectField label="Polish" name="polish" options={['Ex', 'Vg', 'Gd']} value={formData.polish} onChange={handleChange} />
                                    <SelectField label="Sym" name="symmetry" options={['Ex', 'Vg', 'Gd']} value={formData.symmetry} onChange={handleChange} />
                                    <SelectField label="Fluor" name="fluorescence" options={['N', 'F', 'M', 'S', 'VS']} value={formData.fluorescence} onChange={handleChange} />
                                </div>
                            </div>

                            {/* Panel: Proportions */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                                <SectionHeader icon={Calculator} title="Measurements & Ratios" color="text-slate-600" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="col-span-2"><InputField label="Measurements" name="measurements" value={formData.measurements} onChange={handleChange} placeholder="e.g. 6.50 x 6.52 x 4.00" /></div>
                                    <InputField label="Table %" name="table_percent" value={formData.table_percent} onChange={handleChange} />
                                    <InputField label="Depth %" name="total_depth_percent" value={formData.total_depth_percent} onChange={handleChange} />
                                    <InputField label="Cr Ht" name="crown_height" value={formData.crown_height} onChange={handleChange} />
                                    <InputField label="Pav Dp" name="pavilion_depth" value={formData.pavilion_depth} onChange={handleChange} />
                                    <InputField label="Girdle" name="girdle_thickness" value={formData.girdle_thickness} onChange={handleChange} />
                                    <InputField label="Culet" name="culet" value={formData.culet} onChange={handleChange} />
                                </div>
                                <div className="mt-4">
                                    <InputField label="Inscription / Comments" name="inscription" value={formData.inscription} onChange={handleChange} placeholder="Laser Inscription" />
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Economics, Logistics, Sales */}
                        <div className="col-span-12 lg:col-span-5 space-y-6">

                            {/* Panel: Economics */}
                            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <SectionHeader icon={DollarSign} title="Pricing & Economics" color="text-blue-400" />

                                <div className="space-y-4 relative z-10">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Rap / Base ($)</label>
                                            <input
                                                type="number" step="0.01" value={pricePerCarat} onChange={(e) => setPricePerCarat(e.target.value)}
                                                className="w-full px-3 py-2 text-sm font-bold bg-slate-800 border-slate-700 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border outline-none" placeholder="Per Ct"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Disc %</label>
                                            <input
                                                type="number" step="0.01" name="discount" value={formData.discount} onChange={handleChange}
                                                className="w-full px-3 py-2 text-sm font-bold bg-slate-800 border-slate-700 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border outline-none" placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-800 mt-2">
                                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1 block">Final Total Price ($)</label>
                                        <div className="text-3xl font-black text-white tracking-tight">
                                            ${((parseFloat(formData.price) || 0) * (1 - (parseFloat(formData.discount) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Panel: Logistics */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                                <SectionHeader icon={Globe} title="Logistics & Sales Mode" color="text-slate-600" />

                                {/* Business Mode Selection */}
                                <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-3 block">Business Type</label>
                                    <div className="flex bg-white rounded-lg p-1 border border-indigo-200 shadow-sm relative">
                                        <div className={`absolute top-1 bottom-1 w-[48%] bg-indigo-600 rounded-md transition-all duration-300 ${saleType === 'ORDER' ? 'left-[50%]' : 'left-1'}`}></div>
                                        <button
                                            onClick={() => setSaleType('STOCK')}
                                            className={`flex-1 py-2 text-xs font-bold uppercase relative z-10 transition-colors ${saleType === 'STOCK' ? 'text-white' : 'text-slate-500 hover:text-indigo-600'}`}
                                        >
                                            Stock Based
                                        </button>
                                        <button
                                            onClick={() => setSaleType('ORDER')}
                                            className={`flex-1 py-2 text-xs font-bold uppercase relative z-10 transition-colors ${saleType === 'ORDER' ? 'text-white' : 'text-slate-500 hover:text-indigo-600'}`}
                                        >
                                            Order Based
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-indigo-400 mt-2 font-medium px-1">
                                        {saleType === 'STOCK' ? 'Item will be added to Inventory.' : 'Item will be marked SOLD immediately & Order created.'}
                                    </p>
                                </div>

                                {/* Dynamic Fields based on Mode */}
                                {saleType === 'STOCK' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Stock Location (Seller)" name="buyer_country" value={formData.buyer_country} onChange={handleChange} placeholder="e.g. India" />
                                        <InputField label="Buyer Location (Dst)" name="seller_country" value={formData.seller_country} onChange={handleChange} placeholder="e.g. USA" />
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                        <ClientForm value={clientData} onChange={setClientData} />
                                    </div>
                                )}
                            </div>

                            {/* Panel: Client & Sales (Creative Section) */}
                            <div className={`p-6 rounded-2xl border transition-all ${formData.status === 'sold' ? 'bg-emerald-50 border-emerald-200 shadow-lg' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-black/5">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${formData.status === 'sold' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                                            <User size={14} strokeWidth={3} />
                                        </div>
                                        <h3 className={`text-xs font-black uppercase tracking-widest ${formData.status === 'sold' ? 'text-emerald-800' : 'text-slate-600'}`}>Client & Sale</h3>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Mark Sold</span>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={formData.status === 'sold'} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked ? 'sold' : 'in_stock' }))} />
                                            <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${formData.status === 'sold' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform ${formData.status === 'sold' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    {/* Financial Calculations (Unified) */}
                                    <div className="space-y-4">
                                        {/* Currency & Exchange */}
                                        <div className="bg-white/60 p-4 rounded-xl border border-black/5 flex flex-col gap-3">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Calculator size={10} /> Currency & Commission</span>

                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="text-[9px] font-bold text-slate-400 mb-1 block">Currency</label>
                                                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-2 py-1.5 text-xs font-bold border rounded uppercase bg-white h-9">
                                                        <option value="USD">USD</option>
                                                        <option value="INR">INR</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[9px] font-bold text-slate-400 mb-1 block">Rate (1$)</label>
                                                    <input type="number" placeholder="85.0" className="w-full px-2 py-1.5 text-xs font-bold border rounded h-9" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
                                                </div>
                                            </div>

                                            {/* Commission Bidirectional */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[9px] font-bold text-slate-400 mb-1 block">Comm ($)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-2 py-1.5 text-xs font-bold border rounded bg-white text-emerald-600"
                                                        placeholder="0"
                                                        value={commissionUSD}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setCommissionUSD(val);
                                                            // Auto Calc INR
                                                            if (exchangeRate && val) setCommissionINR((parseFloat(val) * parseFloat(exchangeRate)).toFixed(2));
                                                            else if (!val) setCommissionINR('');
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-slate-400 mb-1 block">Comm (₹)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-2 py-1.5 text-xs font-bold border rounded bg-white text-emerald-600"
                                                        placeholder="0"
                                                        value={commissionINR}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setCommissionINR(val);
                                                            // Auto Calc USD
                                                            if (exchangeRate && val) setCommissionUSD((parseFloat(val) / parseFloat(exchangeRate)).toFixed(2));
                                                            else if (!val) setCommissionUSD('');
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Final Pricing */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-bold text-emerald-600 uppercase">Final Sale Price</label>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    (Base: ${parseFloat(formData.price || 0).toLocaleString()} - Disc: {formData.discount}%)
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</div>
                                                <input
                                                    type="number"
                                                    name="sale_price"
                                                    value={formData.sale_price}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                                                    className="w-full pl-7 px-4 py-3 text-xl font-bold text-emerald-700 bg-white border-2 border-emerald-300 rounded-xl focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200/50"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            {/* Exchange Calculation Display */}
                                            {exchangeRate && formData.sale_price && (
                                                <div className="text-right text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                                                    ~ ₹ {(parseFloat(formData.sale_price) * parseFloat(exchangeRate)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white z-10">
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 active:scale-95"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {loading ? 'Saving Inventory...' : 'Save Diamond'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiamondForm;
