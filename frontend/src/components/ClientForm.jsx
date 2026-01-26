import React, { useState, useEffect } from 'react';
import { User, Globe, MapPin, Mail, DollarSign, ChevronDown, Phone } from 'lucide-react';

const Label = ({ children, required }) => (
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
        {children} {required && <span className="text-rose-500">*</span>}
    </label>
);

const InputField = ({ label, name, type = "text", required = false, value, onChange, placeholder, icon: Icon }) => (
    <div className="flex flex-col w-full">
        {label && <Label required={required}>{label}</Label>}
        <div className="relative group">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Icon size={16} strokeWidth={2.5} />
                </div>
            )}
            <input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                className={`w-full ${Icon ? 'pl-11' : 'px-4'} py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:font-medium placeholder:text-slate-300 shadow-sm shadow-slate-100/50`}
                required={required}
                placeholder={placeholder}
            />
        </div>
    </div>
);

const ClientForm = ({ value, onChange }) => {
    const [formData, setFormData] = useState({
        name: '',
        country: '',
        address: '',
        email: '',
        contact_number: '',
        currency: 'USD'
    });

    useEffect(() => {
        if (value) {
            setFormData(prev => ({ ...prev, ...value }));
        }
    }, [value]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newData = { ...formData, [name]: value };
        setFormData(newData);
        if (onChange) onChange(newData);
    };

    return (
        <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                    <User size={18} strokeWidth={3} />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-800">Client Details</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Essential Trading Information</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    icon={User}
                    placeholder="e.g. Robert Oppenheimer"
                />

                <InputField
                    label="Contact Number"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    required
                    icon={Phone}
                    placeholder="+1 234 567 890"
                />

                <InputField
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    icon={Globe}
                    placeholder="e.g. Belgium / USA"
                />

                <InputField
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    icon={Mail}
                    placeholder="trading@firm.com"
                />

                {/* Currency Selection */}
                <div className="flex flex-col w-full">
                    <Label>Preferred Currency</Label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <DollarSign size={16} strokeWidth={2.5} />
                        </div>
                        {!['USD', 'INR', 'EUR', 'HKD', 'AED', ''].includes(formData.currency || 'USD') ? (
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={(e) => handleChange({ target: { name: 'currency', value: e.target.value.toUpperCase() } })}
                                    placeholder="e.g. GBP"
                                    className="w-full pl-11 pr-10 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all shadow-sm uppercase"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleChange({ target: { name: 'currency', value: 'USD' } })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <ChevronDown size={14} className="rotate-180" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <select
                                    name="currency"
                                    value={formData.currency || 'USD'}
                                    onChange={(e) => {
                                        if (e.target.value === 'OTHER') {
                                            handleChange({ target: { name: 'currency', value: 'GBP' } }); // Default val for custom to switch mode
                                        } else {
                                            handleChange(e);
                                        }
                                    }}
                                    className="w-full pl-11 pr-10 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none appearance-none cursor-pointer transition-all shadow-sm"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="HKD">HKD ($)</option>
                                    <option value="AED">AED (Dh)</option>
                                    <option value="OTHER">+ Add Custom</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </>
                        )}
                    </div>
                </div>

                <div className="col-span-1 sm:col-span-2">
                    <InputField
                        label="Registered Business Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        icon={MapPin}
                        placeholder="Suite 404, Diamond District..."
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                <Info size={14} />
                Client Name & Contact Number are mandatory.
            </div>
        </div>
    );
};

const Info = ({ size }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

export default ClientForm;
