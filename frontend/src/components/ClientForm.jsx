import React, { useState, useEffect } from 'react';
import { User, Globe, Phone, Building2, MapPin, Mail, DollarSign } from 'lucide-react';
import api from '../services/api';

const InputField = ({ label, name, type = "text", required = false, width = "w-full", value, onChange, placeholder, icon: Icon }) => (
    <div className={`flex flex-col ${width}`}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon size={14} />
                </div>
            )}
            <input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                className={`w-full ${Icon ? 'pl-9' : 'px-3'} py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:font-normal`}
                required={required}
                placeholder={placeholder}
            />
        </div>
    </div>
);

const ClientForm = ({ value, onChange, readOnly = false }) => {
    // Value prop is the client object { name, company_name, ... }
    const [formData, setFormData] = useState({
        name: '',
        company_name: '',
        country: '',
        address: '',
        city: '',
        contact_number: '',
        email: '',
        currency: 'USD',
        remarks: ''
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                    <User size={14} strokeWidth={3} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900">Client Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                    label="Client Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    icon={User}
                    placeholder="Full Name"
                />
                <InputField
                    label="Company Name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    icon={Building2}
                    placeholder="Business Name"
                />
                <InputField
                    label="Contact Number"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    required
                    icon={Phone}
                    placeholder="+1 234..."
                />
                <InputField
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    icon={Globe}
                    placeholder="e.g. USA, India"
                />
                <InputField
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                />
                <InputField
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    icon={Mail}
                    placeholder="client@email.com"
                />
                <div className="col-span-1 sm:col-span-2">
                    <InputField
                        label="Full Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        icon={MapPin}
                        placeholder="Street Address, Zip Code..."
                    />
                </div>

                {/* Currency Selection */}
                <div className="flex flex-col w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        Preferred Currency
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <DollarSign size={14} />
                        </div>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="w-full pl-9 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="HKD">HKD ($)</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Remarks</label>
                    <input
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        placeholder="Order Reference / Notes"
                    />
                </div>
            </div>
        </div>
    );
};

export default ClientForm;
