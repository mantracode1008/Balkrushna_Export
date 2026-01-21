import React, { useState, useEffect } from 'react';
import diamondService from '../services/diamond.service';
import { X, Search } from 'lucide-react';
import { SHAPE_MASTER, SHAPE_OPTIONS, getDisplayShape } from '../utils/shapeUtils';

const InputField = ({ label, name, type = "text", required = false, width = "w-full", value, onChange, disabled = false, min, autoFocus = false, inputClassName = "", list, autoComplete }) => (
    <div className={`flex flex-col ${width}`}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{label}</label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            step={type === 'number' ? "0.01" : undefined}
            min={min}
            className={`w-full px-2 py-1 text-xs font-bold text-slate-800 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-slate-100 ${inputClassName}`}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            list={list}
            autoComplete={autoComplete}
        />
    </div>
);

const SelectField = ({ label, name, options, value, onChange, required = false, width = "w-full" }) => (
    <div className={`flex flex-col ${width}`}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{label}</label>
        <select
            name={name}
            value={value || ''}
            onChange={onChange}
            className="w-full px-2 py-1 text-xs font-bold text-slate-800 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
            required={required}
        >
            <option value="">Select...</option>
            {options.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

const DiamondForm = ({ onClose, onSuccess, initialData }) => {
    const [formData, setFormData] = useState({
        certificate: '',
        shape: 'Round',
        carat: '',
        color: '',
        color_code: '',
        S_code: '', // Shape Code
        clarity: '',
        clarity_code: '',
        cut: 'Ex', // Default
        lab: '',
        polish: 'Ex', // Default
        symmetry: 'Ex', // Default
        fluorescence: 'N',
        crown_height: '',
        pavilion_depth: '',
        girdle_thickness: '',
        culet: '',
        total_depth_percent: '',
        table_percent: '',
        inscription: '',
        comments: '',
        price: '', // This is Total Final Price
        discount: '',
        status: 'in_stock',
        quantity: 1, // Fixed to 1
        // New Fields
        diamond_type: '',
        buyer_name: '',
        buyer_country: '',
        buyer_mobile: '',
        sale_price: '',
        growth_process: '',
        report_url: '',
        seller_country: ''
    });


    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);

    const [pricePerCarat, setPricePerCarat] = useState('');
    const [buyers, setBuyers] = useState([]);

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

    // ... (rest of code) ...

    // Also fetch fetchDetails... existing useEffect logic below...
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
            if (initialData.price && initialData.carat && Number(initialData.carat) > 0) {
                setPricePerCarat((Number(initialData.price) / Number(initialData.carat)).toFixed(2));
            }
        }
    }, [initialData]);

    // Auto-Calculate Total Price when Carat or Price/Ct changes
    useEffect(() => {
        const c = parseFloat(formData.carat) || 0;
        const p = parseFloat(pricePerCarat) || 0;
        if (c >= 0 && p >= 0) {
            const total = (c * p).toFixed(2);
            setFormData(prev => ({ ...prev, price: total }));
        }
    }, [formData.carat, pricePerCarat]);

    // Auto-Calculate Codes (Color & Clarity)
    useEffect(() => {
        setFormData(prev => {
            const colorMap = { 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'H': 5, 'I': 6, 'J': 7, 'K': 8, 'L': 9, 'M': 10 };
            const clarityMap = { 'IF': 'Q1', 'VVS1': 'Q2', 'VVS2': 'Q3', 'VS1': 'Q4', 'VS2': 'Q5', 'SI1': 'Q6', 'SI2': 'Q7', 'SI3': 'Q8', 'I1': 'Q9', 'I2': 'Q10', 'I3': 'Q11', 'I4': 'Q12', 'I5': 'Q13', 'I6': 'Q14', 'I7': 'Q15' };

            const colorCode = colorMap[String(prev.color || '').toUpperCase().trim()] || prev.color_code || '';

            // Handle clarity space "VS 1" -> "Q4"
            const cVal = String(prev.clarity || '').toUpperCase().trim();
            const clarityCode = clarityMap[cVal] || clarityMap[cVal.replace(/\s+/g, '')] || prev.clarity_code || '';

            // Only update if changed to avoid loop (well, setFormData callback prevents loop if value same? No, useEffect dep triggers.
            // Wait, infinite loop risk if setFormData triggers useEffect.
            // We should only set if DIFFERENT.
            // But we can't look at "prev" inside useEffect dependency.
            // Actually, better to run this logic ONLY when `formData.color` or `formData.clarity` changes.

            // Just returning the check logic here:
            if (colorCode !== prev.color_code || clarityCode !== prev.clarity_code) {
                return { ...prev, color_code: colorCode, clarity_code: clarityCode };
            }
            return prev;
        });
    }, [formData.color, formData.clarity]);

    // Auto-Fetch Rap Price
    useEffect(() => {
        const { carat, shape, color_code, clarity_code } = formData;

        // Debounce or just check strict existence
        if (carat && shape && color_code && clarity_code) {
            const fetchRap = async () => {
                try {
                    const res = await diamondService.calculateRapPrice({
                        carat: parseFloat(carat),
                        shape: shape,
                        S_code: formData.S_code, // Send precise code
                        color_code: parseInt(color_code),
                        clarity_code: clarity_code
                    });
                    if (res.data && res.data.price) {
                        setPricePerCarat(res.data.price);
                    }
                } catch (err) {
                    console.error("Rap Fetch Error:", err);
                    // Optional: setPricePerCarat('') or keep previous?
                }
            };
            const timer = setTimeout(fetchRap, 500); // Debounce 500ms
            return () => clearTimeout(timer);
        }
    }, [formData.carat, formData.shape, formData.color_code, formData.clarity_code]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

                // Auto-map code for fetched clarity
                const clarityVal = fetched.clarity || prev.clarity || '';
                const map = { 'IF': 'Q1', 'VVS1': 'Q2', 'VVS2': 'Q3', 'VS1': 'Q4', 'VS2': 'Q5', 'SI1': 'Q6', 'SI2': 'Q7', 'SI3': 'Q8', 'I1': 'Q9', 'I2': 'Q10', 'I3': 'Q11', 'I4': 'Q12', 'I5': 'Q13', 'I6': 'Q14', 'I7': 'Q15' };
                const clarityCode = map[clarityVal.toUpperCase()] || map[clarityVal.toUpperCase().replace(/\s+/g, '')] || '';

                setFormData(prev => ({
                    ...prev,
                    ...fetched,
                    cut: newCut || prev.cut || 'Ex', // Default to Ex if missing
                    polish: newPolish || prev.polish || 'Ex',
                    symmetry: newSym || prev.symmetry || 'Ex',
                    price: (fetched.price && Number(fetched.price) > 0) ? fetched.price : prev.price,
                    shape: fetched.shape || prev.shape,
                    shape: fetched.shape || prev.shape,
                    S_code: fetched.S_code || prev.S_code,
                    growth_process: fetched.growth_process || prev.growth_process || '',
                    report_url: fetched.report_url || prev.report_url || '',
                    seller_country: fetched.seller_country || prev.seller_country || ''
                }));

                // Auto-set Rap Price if available from backend
                if (fetched.rap_price && Number(fetched.rap_price) > 0) {
                    setPricePerCarat(fetched.rap_price);
                }
                // Note via context: Fetch usually doesn't give price, but if it does, we assume it's Total if it updates formData.price.
                // Depending on user preference, we might need to reverse-calculate Price/Ct here for the input field.
                // But let's leave it for the useEffect to handle if formData.carat and formData.price change? 
                // Wait, our useEffect goes Carat+Price/Ct -> Total. 
                // If fetch ONE-WAY updates Total, Price/Ct won't update automatically unless we do it here.
                // But typically fetch returns price: 0. So it matters not.
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
            // DEBUG: Check what's being sent
            console.log("Submitting Diamond Data:", formData);
            if (formData.discount) {
                console.log("Discount Value:", formData.discount, "Final Price:", ((parseFloat(formData.price) || 0) * (1 - (parseFloat(formData.discount) || 0) / 100)));
            }

            if (initialData && initialData.id) {
                await diamondService.update(initialData.id, formData);
            } else {
                await diamondService.create(formData);
            }
            if (onSuccess) onSuccess();
            if (formData.status === 'sold') {
                if (window.confirm("Diamond marked as Sold! Go to Invoices to generate a bill?")) {
                    window.location.href = '/invoices'; // Simple redirect, could use useNavigate if available
                }
            }
            if (onClose) onClose();
        } catch (error) {
            console.error("Submit error:", error);
            alert(error.response?.data?.message || "Failed to save diamond. Check console for details.");
        } finally {
            setLoading(false);
        }
    };


    {/* Top Section: Main ID & Price */ }
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">
                        {initialData ? 'Edit Diamond' : 'Add New Diamond'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6">
                    {/* 1. Certificate & Fetch */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Certificate Number (Input / Scan)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="certificate"
                                value={formData.certificate}
                                onChange={handleChange}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFetch(); } }}
                                required
                                autoFocus
                                placeholder="Enter or Scan Certificate ID"
                                className="flex-1 w-full px-4 py-3 text-xl font-black text-slate-800 rounded-lg border-2 border-indigo-500 shadow-lg shadow-indigo-100 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                            />
                            <button
                                type="button"
                                onClick={handleFetch}
                                disabled={fetchLoading}
                                className="px-6 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                                title="Fetch Details from IGI"
                            >
                                {fetchLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                                <span>Fetch</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. Pricing Section (Highlighted) */}
                    <div className="grid grid-cols-12 gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 mb-4 shadow-sm">
                        {/* Price Per Carat - Interactive */}
                        <div className="col-span-6 md:col-span-3">
                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1.5 block">Price / Ct ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={pricePerCarat}
                                onChange={(e) => setPricePerCarat(e.target.value)}
                                className="w-full px-3 py-2 text-lg font-bold text-blue-700 bg-white border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Total Base Price - Auto/Readonly */}
                        <div className="col-span-6 md:col-span-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Total Base ($)</label>
                            <input
                                type="number"
                                value={formData.price}
                                disabled
                                className="w-full px-3 py-2 text-lg font-bold text-slate-600 bg-slate-200/50 border-2 border-transparent rounded-xl cursor-not-allowed"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Discount - Interactive */}
                        <div className="col-span-6 md:col-span-2">
                            <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-1.5 block">Disc %</label>
                            <input
                                type="number"
                                step="0.01"
                                name="discount"
                                value={formData.discount}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-lg font-bold text-orange-600 bg-white border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm"
                                placeholder="0"
                            />
                        </div>

                        {/* Final Price - Highlighted Result */}
                        <div className="col-span-6 md:col-span-4">
                            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5 block">Final Price ($)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={((parseFloat(formData.price) || 0) * (1 - (parseFloat(formData.discount) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    disabled
                                    className="w-full px-4 py-2 text-2xl font-black text-emerald-600 bg-emerald-50 border-2 border-emerald-200 rounded-xl shadow-inner"
                                />
                            </div>
                        </div>
                    </div>


                    {/* 3. Primary Details (Shape, Carat, Diamond Type) */}
                    <div className="grid grid-cols-12 gap-3 mb-4">
                        <div className="col-span-6 md:col-span-4">
                            <SelectField
                                label="Shape"
                                name="shape"
                                options={SHAPE_OPTIONS}
                                value={getDisplayShape(formData.shape)}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, shape: e.target.value }))
                                }}
                            />
                            {/* Hidden S Code */}
                            <input type="hidden" name="S_code" value={formData.S_code} />
                        </div>
                        <div className="col-span-6 md:col-span-4">
                            <InputField label="Carat" name="carat" value={formData.carat} onChange={handleChange} type="number" required />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <SelectField
                                label="Type"
                                name="diamond_type"
                                options={['', 'Type IIa', 'Type IIb', 'Type Ia']} // Common types
                                value={formData.diamond_type}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <SelectField
                                label="Growth"
                                name="growth_process"
                                options={['', 'HPHT', 'CVD', 'Natural']}
                                value={formData.growth_process}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Report URL (Optional) */}
                    <div className="mb-4">
                        <div className="flex gap-2 items-end">
                            <InputField label="Report URL" name="report_url" value={formData.report_url} onChange={handleChange} />
                            {formData.report_url && (
                                <a href={formData.report_url} target="_blank" rel="noreferrer" className="mb-1 text-blue-600 underline text-xs font-bold whitespace-nowrap">
                                    View PDF
                                </a>
                            )}
                        </div>
                    </div>
                    {/* 4. Grade Fields - Compact Grid */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Grading Report</h3>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            <InputField label="Color" name="color" value={formData.color} onChange={handleChange} inputClassName="text-center" />
                            {/* Hidden Color Code */}
                            <input type="hidden" name="color_code" value={formData.color_code} />

                            <InputField label="Clarity" name="clarity" value={formData.clarity} onChange={handleChange} inputClassName="text-center" />
                            {/* Hidden Clarity Code */}
                            <input type="hidden" name="clarity_code" value={formData.clarity_code} />

                            <SelectField
                                label="Cut"
                                name="cut"
                                options={['Ex', 'Vg', 'Gd']}
                                value={formData.cut}
                                onChange={handleChange}
                            />
                            <SelectField
                                label="Polish"
                                name="polish"
                                options={['Ex', 'Vg', 'Gd']}
                                value={formData.polish}
                                onChange={handleChange}
                            />
                            <SelectField
                                label="Sym"
                                name="symmetry"
                                options={['Ex', 'Vg', 'Gd']}
                                value={formData.symmetry}
                                onChange={handleChange}
                            />
                            <SelectField
                                label="Fluor"
                                name="fluorescence"
                                options={['N', 'F', 'M', 'S', 'VS']}
                                value={formData.fluorescence}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* 5. Detailed Specs */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Measurements & Proportions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="col-span-2">
                                <InputField label="Measurements" name="measurements" value={formData.measurements} onChange={handleChange} />
                            </div>
                            <InputField label="Table %" name="table_percent" value={formData.table_percent} onChange={handleChange} />
                            <InputField label="Depth %" name="total_depth_percent" value={formData.total_depth_percent} onChange={handleChange} />
                            <InputField label="Cr Height" name="crown_height" value={formData.crown_height} onChange={handleChange} />
                            <InputField label="Pav Depth" name="pavilion_depth" value={formData.pavilion_depth} onChange={handleChange} />
                            <InputField label="Girdle" name="girdle_thickness" value={formData.girdle_thickness} onChange={handleChange} />
                            <InputField label="Culet" name="culet" value={formData.culet} onChange={handleChange} />
                            <div className="col-span-2">
                                <InputField label="Inscription" name="inscription" value={formData.inscription} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* 6. Description & Comments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <InputField label="Description" name="description" value={formData.description} onChange={handleChange} />
                        <InputField label="Comments" name="comments" value={formData.comments} onChange={handleChange} />
                    </div>

                    {/* 7. Immediate Sale Details (Optional) */}
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Client & Sale Details (Optional)
                            </h3>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide cursor-pointer flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.status === 'sold'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked ? 'sold' : 'in_stock' }))}
                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Mark as Sold
                                </label>
                                {formData.status === 'sold' && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase animate-in fade-in">Sold</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-3">
                            {/* Client Info */}
                            <div className="col-span-12 md:col-span-4">
                                <InputField
                                    label="Client Name"
                                    name="buyer_name"
                                    value={formData.buyer_name}
                                    onChange={handleChange}
                                    placeholder="Client Name"
                                    inputClassName="normal-case"
                                    list="buyer-list"
                                    autoComplete="off"
                                />
                                <datalist id="buyer-list">
                                    {buyers.map((b, i) => (
                                        <option key={i} value={b.buyer_name} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="col-span-6 md:col-span-4">
                                <InputField label="Mobile Number" name="buyer_mobile" value={formData.buyer_mobile} onChange={handleChange} placeholder="Mobile" />
                            </div>
                            <div className="col-span-6 md:col-span-4">
                                <InputField label="Country" name="buyer_country" value={formData.buyer_country} onChange={handleChange} placeholder="Buyer Country" />
                            </div>
                            <div className="col-span-6 md:col-span-4">
                                <InputField label="Seller Country" name="seller_country" value={formData.seller_country} onChange={handleChange} placeholder="Seller Country" />
                            </div>

                            {/* Selling Price - Auto-updates status logic in backend? Or handle here. */}
                            <div className="col-span-12 md:col-span-12 pt-2 border-t border-emerald-100 mt-1">
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1 block">Selling Price ($)</label>
                                        <input
                                            type="number"
                                            name="sale_price"
                                            value={formData.sale_price}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    sale_price: val
                                                    // Removed auto-status change to prevent accidental disappearance from inventory
                                                }));
                                            }}
                                            className="w-full px-3 py-2 text-xl font-bold text-emerald-700 bg-white border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm placeholder:text-emerald-200"
                                            placeholder="Enter Sale Price"
                                        />
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium pb-3 max-w-[50%] leading-tight">
                                        * Check <strong>"Mark as Sold"</strong> above to complete the sale and move this item to history.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm border border-slate-200 rounded-lg hover:bg-white font-medium text-slate-600 transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all font-medium flex items-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {loading ? 'Saving...' : 'Save Diamond'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default DiamondForm;
