import React, { useState, useEffect, useRef } from 'react';
import { Check, Building2, Plus } from 'lucide-react';
import DiamondService from '../services/diamond.service';

const CompanySelect = ({ value, onChange, placeholder = "Select Company..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState([]);
    const wrapperRef = useRef(null);

    // Fetch Companies on Mount
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await DiamondService.getCompanies();
                // Assuming API returns array of strings ['Company A', 'Company B']
                setOptions(res.data || []);
            } catch (err) {
                console.error("Failed to fetch companies:", err);
            }
        };
        fetchCompanies();
    }, []);

    // Sync query with value on initial load or external change
    useEffect(() => {
        if (value) setQuery(value);
    }, [value]);

    // Filter options based on query
    const filteredOptions = query === ''
        ? options
        : options.filter((company) => {
            return company && company.toLowerCase().includes(query.toLowerCase());
        });

    // Handle outside click to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // If closed and query is not empty but not selected, treat as selection?
                // Ideally, we rely on onChange having been called.
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
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5 block">Company Name</label>
            <div className="relative">
                <div
                    className="w-full flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all"
                >
                    <div className="pl-3 text-slate-400">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <input
                        className="w-full py-2 px-3 text-xs font-bold text-slate-700 bg-transparent outline-none placeholder:font-normal placeholder:text-slate-400"
                        placeholder={placeholder}
                        value={query || ''}
                        onChange={handleChange}
                        onFocus={() => setIsOpen(true)}
                    />
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
                        {filteredOptions.length === 0 ? (
                            <div
                                className="px-4 py-3 cursor-pointer hover:bg-slate-50 text-blue-600 font-bold text-xs flex items-center gap-2"
                                onClick={() => handleSelect(query)}
                            >
                                <Plus className="w-4 h-4" />
                                Add "{query}"
                            </div>
                        ) : (
                            filteredOptions.map((opt, idx) => (
                                <div
                                    key={idx}
                                    className={`px-4 py-2 cursor-pointer hover:bg-slate-50 text-xs font-medium text-slate-700 flex justify-between items-center ${value === opt ? 'bg-blue-50 text-blue-700' : ''}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    <span>{opt}</span>
                                    {value === opt && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                </div>
                            ))
                        )}
                        {/* If we have matches, but user wants to type something new that isn't exactly a match (e.g. "Google Inc" vs "Google"), the input handles it naturally via handleChange. 
                            The dropdown primarily suggests existing. */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanySelect;
