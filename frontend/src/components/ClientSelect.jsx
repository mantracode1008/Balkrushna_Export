import React, { useState, useEffect, useRef } from 'react';
import { Check, Building2, Plus, ChevronDown } from 'lucide-react';

const ClientSelect = ({ value, onChange, options = [], placeholder = "Search or select client..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef(null);

    const filteredOptions = query === ''
        ? options
        : options.filter((person) => {
            const name = person.name || person.buyer_name || person.customer_name || '';
            return name.toLowerCase().includes(query.toLowerCase());
        });

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
        onChange({ target: { name: 'buyer_name', value: name } });
        setIsOpen(false);
        setQuery(name);
    };

    return (
        <div className="w-full relative" ref={wrapperRef}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Client Relationship *</label>
            <div className="relative group">
                <div
                    className="w-full flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all shadow-sm shadow-slate-100/50"
                    onClick={() => setIsOpen(true)}
                >
                    <div className="pl-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Building2 size={16} strokeWidth={2.5} />
                    </div>
                    <input
                        className="w-full py-2.5 px-3 text-sm font-semibold text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-300 bg-transparent"
                        placeholder={placeholder}
                        value={isOpen ? query : (value || '')}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => {
                            setQuery(value || '');
                            setIsOpen(true);
                        }}
                    />
                    <div className="pr-4 text-slate-300">
                        <ChevronDown size={14} />
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-64 overflow-auto py-2 animate-in fade-in zoom-in-95 duration-200">
                        {filteredOptions.length === 0 && query !== '' ? (
                            <div
                                className="px-5 py-3 cursor-pointer hover:bg-slate-50 text-indigo-600 font-bold text-xs flex items-center gap-2 border-t border-slate-50 mt-1"
                                onClick={() => handleSelect(query)}
                            >
                                <Plus size={14} strokeWidth={3} />
                                Register "{query}" as New Client
                            </div>
                        ) : (
                            filteredOptions.map((person, idx) => {
                                const name = person.name || person.buyer_name || person.customer_name;
                                const country = person.country || person.buyer_country || person.city || '';
                                return (
                                    <div
                                        key={idx}
                                        className={`px-5 py-2.5 cursor-pointer hover:bg-slate-50 text-xs font-semibold text-slate-600 flex justify-between items-center ${value === name ? 'bg-indigo-50 text-indigo-700' : ''}`}
                                        onClick={() => handleSelect(name)}
                                    >
                                        <span>{name} <span className="text-slate-400 font-normal">{country ? `(${country})` : ''}</span></span>
                                        {value === name && <Check size={14} strokeWidth={3} className="text-indigo-600" />}
                                    </div>
                                );
                            })
                        )}
                        {filteredOptions.length > 0 && query !== '' && !filteredOptions.some(p => p.buyer_name.toLowerCase() === query.toLowerCase()) && (
                            <div
                                className="px-5 py-3 cursor-pointer hover:bg-slate-50 text-indigo-600 font-bold text-xs flex items-center gap-2 border-t border-slate-50 mt-1"
                                onClick={() => handleSelect(query)}
                            >
                                <Plus size={14} strokeWidth={3} />
                                Register "{query}" as New Client
                            </div>
                        )}
                    </div>
                )}
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-1.5 ml-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-indigo-400" />
                Select from vault or type unique name to register
            </p>
        </div>
    );
};

export default ClientSelect;
