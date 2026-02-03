import React, { useState, useEffect } from 'react';
import diamondService from '../services/diamond.service';
import {
    X, Search, Gem, FileText, ChevronDown,
    ArrowRight, Info, ChevronUp, Check, Banknote, ShoppingCart, Edit2, RefreshCw
} from 'lucide-react';
import { SHAPE_OPTIONS, getDisplayShape } from '../utils/shapeUtils';
import CompanySelect from './CompanySelect';
import SellerSelect from './SellerSelect';

// --- ATOMIC COMPONENTS ---

const SectionDivider = ({ title }) => (
    <div className="flex items-center gap-3 my-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{title}</span>
        <div className="h-px w-full bg-slate-100"></div>
    </div>
);

const Label = ({ children, required }) => (
    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
        {children} {required && <span className="text-rose-500">*</span>}
    </label>
);

const Input = ({ label, required, className = "", ...props }) => (
    <div className={`flex flex-col ${className}`}>
        {label && <Label required={required}>{label}</Label>}
        <input
            {...props}
            className="w-full px-2 py-1.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 rounded focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 disabled:bg-slate-50"
        />
    </div>
);

const Select = ({ label, options, required, className = "", ...props }) => (
    <div className={`flex flex-col ${className}`}>
        {label && <Label required={required}>{label}</Label>}
        <div className="relative">
            <select
                {...props}
                className="w-full px-2 py-1.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 rounded focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
                <option value="">--</option>
                {options.map((opt, idx) => (
                    <option key={idx} value={typeof opt === 'object' ? opt.value : opt}>
                        {typeof opt === 'object' ? opt.label : opt}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
        </div>
    </div>
);

const SuccessPopup = ({ message }) => (
    <div className="absolute inset-x-0 top-0 z-[70] flex items-center justify-center p-4 animate-in slide-in-from-top duration-300">
        <div className="bg-emerald-500 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm">
            <Check size={16} /> {message}
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const DiamondForm = ({ onClose, onSuccess, initialData }) => {
    // --- STATE ---
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const [formData, setFormData] = useState({
        certificate: '',
        shape: 'ROUND',
        carat: '',
        color: '', color_code: '',
        clarity: '', clarity_code: '',
        cut: 'Ex',
        polish: 'Ex',
        symmetry: 'Ex',
        fluorescence: 'N',
        measurements: '',
        table_percent: '',
        total_depth_percent: '',
        girdle_thickness: '',
        culet: '',
        pavilion_depth: '',
        seller_id: '',
        company: '',
        price: '',
        rap_price: '',
        discount: '',
        payment_due_date: '',
        payment_status: 'unpaid',
        paid_amount: '',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);
    const [showSellerForm, setShowSellerForm] = useState(false);

    // --- EFFECTS ---
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                carat: initialData.carat || '',
                price: initialData.price || '',
                discount: initialData.discount || '',
                payment_due_date: initialData.payment_due_date ? new Date(initialData.payment_due_date).toISOString().split('T')[0] : ''
            }));
        }
    }, [initialData]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const updates = { ...prev, [name]: value };

            // Auto-calc Paid Amount based on Status
            if (name === 'payment_status') {
                if (value === 'paid') {
                    updates.paid_amount = prev.price || 0;
                } else if (value === 'unpaid') {
                    updates.paid_amount = 0;
                }
            }
            // If Price changes and invalidating paid amount? 
            // Keep simple for now.

            return updates;
        });

        if (error) setError(null);
    };

    const handleFetch = async () => {
        if (!formData.certificate) return;
        setFetching(true);
        setError(null);
        try {
            const res = await diamondService.fetchExternal(formData.certificate);
            const data = res.data;
            console.log("FETCHED DIAMOND DATA:", data);

            if (data) {
                // Calculate price if missing or 0 but rap_price exists
                const fetchedPrice = data.price > 0 ? data.price :
                    (data.rap_price > 0 ? data.rap_price * (parseFloat(data.carat) || 0) : 0);

                console.log("MAPPING DATA TO FORM -> Clarity:", data.clarity, "Price:", fetchedPrice);

                setFormData(prev => {
                    const nextState = {
                        ...prev,
                        shape: getDisplayShape(data.shape) || prev.shape,
                        carat: data.carat || prev.carat,
                        color: data.color || prev.color,
                        clarity: data.clarity || prev.clarity,
                        cut: data.cut || prev.cut,
                        polish: data.polish || prev.polish,
                        symmetry: data.symmetry || prev.symmetry,
                        fluorescence: data.fluorescence || prev.fluorescence,
                        measurements: data.measurements || prev.measurements,
                        table_percent: data.table_percent ? String(data.table_percent).replace('%', '') : prev.table_percent,
                        total_depth_percent: data.total_depth_percent ? String(data.total_depth_percent).replace('%', '') : prev.total_depth_percent,
                        price: fetchedPrice || prev.price,
                        rap_price: data.rap_price || prev.rap_price,
                    };
                    console.log("NEW FORM STATE:", nextState);
                    return nextState;
                });
            }
        } catch (err) {
            setError("Certificate not found.");
        }
        setFetching(false);
    };

    const handleSubmit = async (e, action = 'save') => {
        e?.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (!formData.certificate || !formData.shape || !formData.carat || !formData.price || !formData.seller_id) {
                throw new Error("Required fields missing");
            }
            if (!initialData?.id) {
                const statusRes = await diamondService.checkStatus(formData.certificate);
                if (statusRes.data.exists) throw new Error("Duplicate Certificate!");
            }
            if (!formData.buy_date) formData.buy_date = new Date().toISOString().split('T')[0];

            let response;
            if (initialData?.id) {
                await diamondService.update(initialData.id, formData);
                response = { data: { ...formData, id: initialData.id } };
                setSuccessMsg('Updated');
            } else {
                response = await diamondService.create(formData);
                setSuccessMsg('Added');
            }
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onSuccess(response.data, action);
                onClose();
            }, 1000);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Error saving";
            setError(msg);
            setLoading(false);
        }
    };

    const netCost = (() => {
        const p = parseFloat(formData.price) || 0;
        const d = parseFloat(formData.discount) || 0;
        return p * (1 - d / 100);
    })();

    return (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden border border-slate-200">

                {showSuccess && <SuccessPopup message={successMsg} />}

                {/* Header Row */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Gem size={18} className="text-indigo-500" />
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                            {initialData ? 'Edit Diamond' : 'New Entry'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[85vh]">
                    {error && (
                        <div className="mb-4 p-2 bg-rose-50 border border-rose-100 rounded text-rose-600 text-[11px] font-medium flex items-center gap-2">
                            <Info size={14} /> {error}
                        </div>
                    )}

                    <form className="space-y-6">
                        {/* Row 1: Identity */}
                        <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-4">
                                <Label required>Certificate #</Label>
                                <div className="flex gap-1">
                                    <input
                                        type="text"
                                        name="certificate"
                                        value={formData.certificate}
                                        onChange={handleChange}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleFetch())}
                                        placeholder="GIA/IGI/HRD..."
                                        className="flex-1 px-2 py-1.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 rounded focus:border-indigo-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleFetch}
                                        disabled={fetching}
                                        className="p-2 aspect-square bg-slate-100 hover:bg-slate-200 text-slate-600 rounded flex items-center justify-center disabled:opacity-50"
                                        title="Fetch Details"
                                    >
                                        <Search size={14} className={fetching ? "animate-spin" : ""} />
                                    </button>
                                </div>
                            </div>
                            <div className="col-span-4">
                                <Select
                                    label="Shape"
                                    name="shape"
                                    value={formData.shape}
                                    onChange={handleChange}
                                    required
                                    options={SHAPE_OPTIONS.map(s => ({ label: s, value: s }))}
                                />
                            </div>
                            <div className="col-span-4">
                                <Input label="Carat" name="carat" type="number" step="0.01" value={formData.carat} onChange={handleChange} required placeholder="0.00" />
                            </div>
                        </div>

                        {/* Row 2: Grading */}
                        <div className="grid grid-cols-6 gap-3 pt-2">
                            <Select label="Color" name="color" value={formData.color} onChange={handleChange} options={['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Fancy']} />
                            <Select label="Clarity" name="clarity" value={formData.clarity} onChange={handleChange} options={['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3']} />
                            <Select label="Cut" name="cut" value={formData.cut} onChange={handleChange} options={['Ex', 'VG', 'G', 'F', 'P']} />
                            <Select label="Polish" name="polish" value={formData.polish} onChange={handleChange} options={['Ex', 'VG', 'G', 'F', 'P']} />
                            <Select label="Symm" name="symmetry" value={formData.symmetry} onChange={handleChange} options={['Ex', 'VG', 'G', 'F', 'P']} />
                            <Select label="Fluor" name="fluorescence" value={formData.fluorescence} onChange={handleChange} options={['N', 'F', 'M', 'S', 'VS']} />
                        </div>

                        {/* Row 3: Advanced Measurements (Collapsible) */}
                        <div className="pt-2 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 uppercase tracking-wider mb-2"
                            >
                                {isAdvancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {isAdvancedOpen ? 'Hide Advanced Specs' : 'Show Advanced Specs'}
                            </button>

                            {isAdvancedOpen && (
                                <div className="grid grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-1 duration-200 py-2">
                                    <Input label="Dimensions" name="measurements" className="col-span-2" value={formData.measurements} onChange={handleChange} placeholder="0.00 x 0.00 x 0.00" />
                                    <Input label="Table %" name="table_percent" type="number" value={formData.table_percent} onChange={handleChange} placeholder="57" />
                                    <Input label="Depth %" name="total_depth_percent" type="number" value={formData.total_depth_percent} onChange={handleChange} placeholder="61" />
                                    <Input label="Culet" name="culet" value={formData.culet} onChange={handleChange} placeholder="N" />
                                </div>
                            )}
                        </div>

                        {/* Row 4: Business (Seller & Price) */}
                        <div className="grid grid-cols-12 gap-6 pt-4 border-t border-slate-50 items-end">
                            <div className="col-span-4 space-y-2">
                                <Label required>Seller Source</Label>
                                <SellerSelect
                                    value={formData.seller_id}
                                    onChange={(val, sellerObj) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            seller_id: val,
                                            // Auto-fill company if new seller has one
                                            company: sellerObj?.company || prev.company
                                        }));
                                    }}
                                    onRequestCreate={() => setShowSellerForm(true)}
                                    showCreateForm={showSellerForm}
                                    onCloseCreateForm={() => setShowSellerForm(false)}
                                />
                                <div className="flex justify-between items-center">
                                    <CompanySelect
                                        value={formData.company}
                                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSellerForm(true)}
                                        className="text-[9px] font-bold text-indigo-400 hover:text-indigo-600 uppercase tracking-tighter transition-colors"
                                    >
                                        + Add New Seller
                                    </button>
                                </div>
                            </div>

                            <div className="col-span-8 grid grid-cols-4 gap-3">
                                <Input label="Rap Price ($)" name="rap_price" type="number" value={formData.rap_price} onChange={handleChange} placeholder="0.00" />
                                <Input label="Buy Price ($)" name="price" type="number" value={formData.price} onChange={handleChange} required placeholder="0.00" />
                                <Input label="Discount %" name="discount" type="number" value={formData.discount} onChange={handleChange} placeholder="0.00" />
                                <div className="flex flex-col justify-end pb-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Calculation</span>
                                    <div className="text-xl font-black text-slate-800 tabular-nums">
                                        ${netCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-12 grid grid-cols-3 gap-3 pt-3 border-t border-slate-50 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purchase Date</span>
                                    <div className="text-xs font-medium text-slate-600 h-[38px] flex items-center bg-slate-50 px-3 rounded border border-slate-200">
                                        {formData.buy_date ? new Date(formData.buy_date).toLocaleDateString() : new Date().toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Action Zone */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={(e) => handleSubmit(e, 'save')}
                        disabled={loading}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest rounded hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] flex items-center gap-2"
                    >
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <Gem size={14} />}
                        Add to Inventory
                    </button>
                    <button
                        onClick={(e) => handleSubmit(e, 'sell')}
                        disabled={loading}
                        className="px-8 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-black transition-all shadow-md active:scale-[0.98] flex items-center gap-2"
                    >
                        <ShoppingCart size={14} />
                        Sell Now
                    </button>
                </div>
            </div >
        </div >
    );
};

export default DiamondForm;
