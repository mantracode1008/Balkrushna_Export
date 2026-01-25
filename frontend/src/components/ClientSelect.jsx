import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';

const ClientSelect = ({ value, onChange, options = [], placeholder = "Select Client..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef(null);

    // Filter options based on query
    const filteredOptions = query === ''
        ? options
        : options.filter((person) => {
            return person.buyer_name.toLowerCase().includes(query.toLowerCase());
        });

    // Handle outside click to close
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
        onChange({ target: { name: 'buyer_name', value: name } }); // Mock event object to match existing handleChange signature
        setIsOpen(false);
        setQuery(name);
    };

    return (
        <div className="w-full relative" ref={wrapperRef}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5 block">Client Name *</label>
            <div className="relative">
                <div
                    className="w-full flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all"
                    onClick={() => setIsOpen(true)}
                >
                    <div className="pl-3 text-slate-400">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <input
                        className="w-full py-2 px-3 text-xs font-bold text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400"
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
                    {/* Arrow Icon */}
                    {/* <div className="pr-2 text-slate-400">
                        <ChevronsUpDown className="w-4 h-4" />
                    </div> */}
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
                        {filteredOptions.length === 0 && query !== '' ? (
                            <div
                                className="px-4 py-3 cursor-pointer hover:bg-slate-50 text-blue-600 font-bold text-xs flex items-center gap-2 border-t border-slate-100"
                                onClick={() => handleSelect(query)}
                            >
                                <Plus className="w-4 h-4" />
                                Add "{query}"
                            </div>
                        ) : (
                            filteredOptions.map((person, idx) => (
                                <div
                                    key={idx}
                                    className={`px-4 py-2 cursor-pointer hover:bg-slate-50 text-xs font-medium text-slate-700 flex justify-between items-center ${value === person.buyer_name ? 'bg-blue-50 text-blue-700' : ''}`}
                                    onClick={() => handleSelect(person.buyer_name)}
                                >
                                    <span>{person.buyer_name}</span>
                                    {value === person.buyer_name && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                </div>
                            ))
                        )}
                        {/* Always show Add New option at bottom if query is unique? User request implies showing it specifically when no results. */}
                    </div>
                )}
            </div>
            {/* Helper text */}
            <p className="text-[9px] text-slate-400 mt-0.5 ml-1">Select existing or type to add new.</p>
        </div>
    );
};

export default ClientSelect;
