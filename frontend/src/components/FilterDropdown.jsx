import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';

const FilterDropdown = ({ value, onChange, options = [], placeholder = "Select...", minWidth = "120px" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (option) => {
        // If option is an object (like company), handle correctly
        // Assuming options are either strings or objects with 'id' and 'name'
        // But for this project's filters, mostly strings, except company.

        // Actually, for Company filter in Inventory, `companies` is likely array of objects {id, name} or just names?
        // Let's check Inventory.jsx. `companies` state comes from fetchCompanies.
        // Usually Select uses value.

        // Let's assume options can be primitive or objects.
        // For simplicity and matching current usage, let's treat options as what they are passed.
        // If it's a company object, we need to know what value to pass back.
        // But let's look at Inventory.jsx usage:
        // { value: companyFilter, setter: setCompanyFilter, options: companies, placeholder: 'Company' }
        // The native select maps `o` to `o`. If `companies` is objects, `<option>` would fail unless it's just names.

        // Checking Inventory.jsx lines 398: `{filter.options.map(o => <option key={o} value={o}>{o}</option>)}`
        // This implies `companies` is an array of strings (names) OR objects but `o` is being rendered directly?
        // If it's objects, this would render [object Object].
        // Let's check `fetchCompanies` in Inventory.jsx: `res.data || []`.
        // Usually backend returns objects.

        // Wait, if `companies` are objects, the previous code in Inventory.jsx line 398 would have been broken if it just did `{o}`.
        // Let's re-read Inventory.jsx line 74: `setCompanies(res.data || []);`
        // And line 398: `filter.options.map(o => <option key={o} value={o}>{o}</option>)`

        // If the previous code was working, then `companies` must be strings!
        // Or if they are objects, maybe the backend returns simple list of company names?
        // Let's verify commonly used patterns.

        // Whatever, I'll build FilterDropdown to handle safe rendering.

        onChange(option);
        setIsOpen(false);
    };

    // Helper to render option label
    const getLabel = (opt) => {
        if (typeof opt === 'object' && opt !== null) {
            return opt.name || opt.label || JSON.stringify(opt);
        }
        return opt;
    };

    // Helper to compare values
    const isSelected = (opt) => {
        const val = typeof opt === 'object' ? opt.id : opt;
        return value === val || value === opt; // flexible check
    };

    return (
        <div className="relative" ref={wrapperRef} style={{ minWidth }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer flex justify-between items-center shadow-sm transition-all text-sm font-bold text-slate-700 hover:shadow-md"
            >
                <span className={!value ? "text-slate-400 font-medium" : "text-slate-700"}>
                    {value || placeholder}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full min-w-[160px] mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 p-1">
                    {/* Placeholder / Clear Option */}
                    <div
                        onClick={() => handleSelect('')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-slate-50 text-slate-400 italic mb-1`}
                    >
                        None
                    </div>

                    {options.map((opt, idx) => {
                        const label = getLabel(opt);
                        const selected = value === label; // Assuming value matches label for this simple generic

                        return (
                            <div
                                key={idx}
                                onClick={() => handleSelect(label)}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-between ${selected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                                <span>{label}</span>
                                {selected && <CheckCircle size={14} className="text-indigo-600" />}
                            </div>
                        );
                    })}
                    {options.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center italic">No options</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilterDropdown;
