import React, { useState, useEffect, useRef } from 'react';
import { Check, Building2, Plus, ChevronDown } from 'lucide-react';
import DiamondService from '../services/diamond.service';

const CompanySelect = ({ value, onChange, placeholder = "Select Company..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState([]);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await DiamondService.getCompanies();
                setOptions(res.data || []);
            } catch (err) {
                console.error("Failed to fetch companies:", err);
            }
        };
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (value) setQuery(value);
    }, [value]);

    const filteredOptions = query === ''
        ? options
        : options.filter((company) => company && company.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (name) => {
        onChange({ target: { name: 'company', value: name } });
        setIsOpen(false);
        setQuery(name);
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange({ target: { name: 'company', value: val } });
        setIsOpen(true);
    };

    return (
        <div className="w-full relative" ref={wrapperRef}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Company Entity</label>
            <div className="relative group">
                <div
                    className="w-full flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all shadow-sm shadow-slate-100/50"
                >
                    <div className="pl-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Building2 size={16} strokeWidth={2.5} />
                    </div>
                    <input
                        className="w-full py-2.5 px-3 text-sm font-semibold text-slate-700 bg-transparent outline-none placeholder:font-medium placeholder:text-slate-300"
                        placeholder={placeholder}
                        value={query || ''}
                        onChange={handleChange}
                        onFocus={() => setIsOpen(true)}
                    />
                    <div className="pr-4 text-slate-300">
                        <ChevronDown size={14} />
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute z-[100] w-full min-w-[240px] mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-64 overflow-auto py-2 animate-in fade-in zoom-in-95 duration-200">
                        {filteredOptions.length === 0 ? (
                            <div
                                className="px-5 py-3 cursor-pointer hover:bg-slate-50 text-indigo-600 font-bold text-xs flex items-center gap-2 border-t border-slate-50 mt-1"
                                onClick={() => handleSelect(query)}
                            >
                                <Plus size={14} strokeWidth={3} />
                                Add "{query}" as New Entity
                            </div>
                        ) : (
                            filteredOptions.map((opt, idx) => (
                                <div
                                    key={idx}
                                    className={`px-5 py-2.5 cursor-pointer hover:bg-slate-50 text-xs font-semibold text-slate-600 flex justify-between items-center ${value === opt ? 'bg-indigo-50 text-indigo-700' : ''}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    <span>{opt}</span>
                                    {value === opt && <Check size={14} strokeWidth={3} className="text-indigo-600" />}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanySelect;
