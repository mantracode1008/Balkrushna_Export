import React, { useState } from 'react';
import { Store, ChevronDown, Check, Plus, X } from 'lucide-react';
import useSellers from '../hooks/useSellers';

const SellerSelect = ({ value, onChange, placeholder = "Select Seller", showCreateForm = false, onCloseCreateForm, onRequestCreate }) => {
    const { sellers, loading, createSeller } = useSellers();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Sync external control with internal state
    React.useEffect(() => {
        if (showCreateForm) {
            setIsCreating(true);
            setIsOpen(true);
        }
    }, [showCreateForm]);

    // Extended Seller Form State
    const [newSeller, setNewSeller] = useState({
        name: '',
        company: '',
        mobile: '',
        email: '',
        gst_no: ''
    });

    const handleCreate = async () => {
        if (!newSeller.name.trim()) return;
        try {
            const res = await createSeller(newSeller);
            const created = res.data;
            // Pass value directly, consistent with other selects
            onChange(created.id, created);
            setIsCreating(false);
            setNewSeller({ name: '', company: '', mobile: '', email: '', gst_no: '' });
            setIsOpen(false);
            if (onCloseCreateForm) onCloseCreateForm();
        } catch (err) {
            console.error(err);
            alert("Failed to create seller");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewSeller(prev => ({ ...prev, [name]: value }));
    };

    const selectedSeller = sellers.find(s => s.id === parseInt(value));

    return (
        <div className="flex flex-col relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Store size={10} /> {placeholder}
            </label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer flex justify-between items-center transition-all hover:bg-white hover:border-indigo-300"
            >
                <span className={!selectedSeller ? "text-slate-400 font-medium" : ""}>
                    {selectedSeller ? (
                        <div className="flex flex-col leading-tight">
                            <span className="text-slate-800">{selectedSeller.name}</span>
                            {selectedSeller.company && <span className="text-[10px] text-slate-400 font-normal">{selectedSeller.company}</span>}
                        </div>
                    ) : "Choose a Seller..."}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-full min-w-[280px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[101] max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 p-1">

                        {!isCreating ? (
                            <>
                                <div className="max-h-48 overflow-y-auto">
                                    {sellers.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                onChange(s.id, s); // Pass value directly
                                                setIsOpen(false);
                                            }}
                                            className={`px-4 py-3 rounded-lg text-sm font-bold cursor-pointer transition-colors flex items-center justify-between border-b border-slate-50 last:border-0 ${parseInt(value) === s.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span>{s.name}</span>
                                                <span className="text-[10px] font-normal text-slate-400">{s.company || 'No Company'}</span>
                                            </div>
                                            {parseInt(value) === s.id && <Check size={14} className="text-indigo-600" />}
                                        </div>
                                    ))}
                                    {sellers.length === 0 && (
                                        <div className="px-4 py-6 text-sm text-slate-400 text-center italic">No sellers found</div>
                                    )}
                                </div>
                                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsCreating(true);
                                        }}
                                        className="w-full px-4 py-2.5 text-xs text-white bg-indigo-600 font-bold cursor-pointer hover:bg-indigo-700 rounded-lg text-center flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Plus size={14} strokeWidth={3} /> Add New Seller
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 space-y-3 bg-slate-50/50" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">New Seller Details</h4>
                                    <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                                </div>

                                <input
                                    autoFocus
                                    name="name"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-white"
                                    placeholder="Seller Name *"
                                    value={newSeller.name}
                                    onChange={handleInputChange}
                                />
                                <input
                                    name="company"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-white"
                                    placeholder="Company Name"
                                    value={newSeller.company}
                                    onChange={handleInputChange}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        name="mobile"
                                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-white"
                                        placeholder="Mobile"
                                        value={newSeller.mobile}
                                        onChange={handleInputChange}
                                    />
                                    <input
                                        name="gst_no"
                                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-white"
                                        placeholder="GST No"
                                        value={newSeller.gst_no}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-500 text-xs rounded-lg font-bold hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        className="flex-1 px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg font-bold hover:bg-indigo-700 shadow-sm"
                                    >
                                        Save Seller
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default SellerSelect;
