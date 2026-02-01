import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, ChevronDown, Check, RefreshCw } from 'lucide-react';

const MultiSelect = ({ label, options, selected = [], onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const toggleOption = (opt) => {
        const newSelected = selected.includes(opt)
            ? selected.filter(s => s !== opt)
            : [...selected, opt];
        onChange(newSelected);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all min-w-[100px] ${selected.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
                <div className="flex items-center gap-1 overflow-hidden">
                    <span className="truncate max-w-[80px]">
                        {selected.length === 0 ? label : `${selected.length} ${label}`}
                    </span>
                </div>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-[100] max-h-64 overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-50 mb-1 uppercase">
                        Select {label}
                    </div>
                    {options.map((opt) => (
                        <div
                            key={opt}
                            onClick={() => toggleOption(opt)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${selected.includes(opt) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                            <span>{opt}</span>
                            {selected.includes(opt) && <Check size={12} className="text-indigo-600" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const RangeInput = ({ label, min, max, onMinChange, onMaxChange, placeholderMin = "Min", placeholderMax = "Max" }) => (
    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase w-8">{label}</span>
        <input
            type="number"
            value={min}
            onChange={(e) => onMinChange(e.target.value)}
            className="w-12 text-xs font-bold text-slate-700 focus:outline-none text-right"
            placeholder={placeholderMin}
        />
        <span className="text-slate-300">-</span>
        <input
            type="number"
            value={max}
            onChange={(e) => onMaxChange(e.target.value)}
            className="w-12 text-xs font-bold text-slate-700 focus:outline-none text-right"
            placeholder={placeholderMax}
        />
    </div>
);

const FilterPanel = ({ filters, setFilters, onSearch, loading, companies = [] }) => {

    const handleMultiChange = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: val }));
    };

    const handleRangeChange = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: val }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: 'in_stock',
            shape: [],
            color: [],
            clarity: [],
            lab: [],
            company: [],
            minCarat: '', maxCarat: '',
            minPrice: '', maxPrice: '',
            minTable: '', maxTable: '',
            minDepth: '', maxDepth: ''
        });
    };

    const activeFilterCount = Object.entries(filters).reduce((acc, [key, val]) => {
        // Ignored defaults
        if (key === 'status' && (val === 'in_stock' || !val)) return acc;
        if (key === 'search' && !val) return acc;
        if (Array.isArray(val) && val.length === 0) return acc;
        if ((key.startsWith('min') || key.startsWith('max')) && (val === '' || val === null || val === undefined)) return acc;
        // Special ignore for empty strings on non-range defaults? (Usually cleared to '' by clearFilters)
        if (typeof val === 'string' && val === '') return acc;

        return acc + 1;
    }, 0);

    return (
        <div className="flex flex-col gap-3 p-4 bg-slate-50/50 border-b border-slate-200">
            {/* Row 1: Primary Filters */}
            <div className="flex flex-wrap items-center gap-3">

                {/* Search */}
                <div className="relative group w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs font-bold shadow-sm"
                        placeholder="Search Cert / ID..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    />
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                {/* Status Toggle */}
                <div className="flex bg-slate-200/50 p-1 rounded-lg">
                    {['in_stock', 'sold', 'all'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilters(prev => ({ ...prev, status }))}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${filters.status === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                {/* Multi Selects */}
                <MultiSelect
                    label="Shape"
                    options={['ROUND', 'PRINCESS', 'EMERALD', 'ASSCHER', 'MARQUISE', 'OVAL', 'RADIANT', 'PEAR', 'HEART', 'CUSHION']}
                    selected={filters.shape}
                    onChange={(val) => handleMultiChange('shape', val)}
                />
                <MultiSelect
                    label="Color"
                    options={['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'Fancy']}
                    selected={filters.color}
                    onChange={(val) => handleMultiChange('color', val)}
                />
                <MultiSelect
                    label="Clarity"
                    options={['FL', 'IF', 'VVS 1', 'VVS 2', 'VS 1', 'VS 2', 'SI 1', 'SI 2', 'I 1', 'I 2', 'I 3']}
                    selected={filters.clarity}
                    onChange={(val) => handleMultiChange('clarity', val)}
                />

                {/* Action Buttons */}
                <div className="ml-auto flex items-center gap-2">
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            <X size={12} /> Clear ({activeFilterCount})
                        </button>
                    )}
                    <button
                        onClick={onSearch}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 active:translate-y-0.5 transition-all"
                    >
                        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Filter size={12} />}
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Row 2: Advanced Ranges */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Advanced:</span>

                <RangeInput
                    label="Carat"
                    min={filters.minCarat} max={filters.maxCarat}
                    onMinChange={(val) => handleRangeChange('minCarat', val)}
                    onMaxChange={(val) => handleRangeChange('maxCarat', val)}
                />

                <RangeInput
                    label="Price"
                    min={filters.minPrice} max={filters.maxPrice}
                    onMinChange={(val) => handleRangeChange('minPrice', val)}
                    onMaxChange={(val) => handleRangeChange('maxPrice', val)}
                />

                <RangeInput
                    label="Table"
                    min={filters.minTable} max={filters.maxTable}
                    onMinChange={(val) => handleRangeChange('minTable', val)}
                    onMaxChange={(val) => handleRangeChange('maxTable', val)}
                />

                <RangeInput
                    label="Depth"
                    min={filters.minDepth} max={filters.maxDepth}
                    onMinChange={(val) => handleRangeChange('minDepth', val)}
                    onMaxChange={(val) => handleRangeChange('maxDepth', val)}
                />

                <MultiSelect
                    label="Lab"
                    options={['GIA', 'IGI', 'HRD', 'FM']}
                    selected={filters.lab}
                    onChange={(val) => handleMultiChange('lab', val)}
                />
                {companies.length > 0 && (
                    <MultiSelect
                        label="Company"
                        options={companies}
                        selected={filters.company}
                        onChange={(val) => handleMultiChange('company', val)}
                    />
                )}
            </div>
        </div>
    );
};

export default FilterPanel;
