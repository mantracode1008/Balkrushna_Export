import React, { useState, useEffect } from 'react';
import diamondService from '../services/diamond.service';
import { Plus, Upload, Search, Trash2, Edit2, ShoppingCart, X, CheckCircle, Filter, ChevronDown, Download, RefreshCw, LayoutGrid, List } from 'lucide-react';
import DiamondForm from '../components/DiamondForm';
import CSVUpload from '../components/CSVUpload';
import { useCart } from '../context/CartContext';
import { getShapeDisplay } from '../utils/shapeUtils';

// Simple Toast Component
const Toast = ({ message, onClose }) => (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto border border-slate-700/50">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-sm tracking-wide">{message}</span>
        </div>
    </div>
);

const getFluorescenceShortCode = (fluorescence) => {
    if (!fluorescence) return '-';
    const normalized = fluorescence.toString().toLowerCase().trim();
    const mapping = { 'none': 'N', 'faint': 'F', 'medium': 'M', 'strong': 'S', 'very strong': 'VS' };
    return mapping[normalized] || fluorescence;
};

const Inventory = () => {
    const [diamonds, setDiamonds] = useState([]);
    const [loading, setLoading] = useState(false);
    // Cart removed for Trader workflow

    // Modals & Selection
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDiamond, setSelectedDiamond] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // Toast
    const [toastMsg, setToastMsg] = useState('');
    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('in_stock');
    const [shapeFilter, setShapeFilter] = useState('');
    const [clarityFilter, setClarityFilter] = useState('');
    const [colorFilter, setColorFilter] = useState('');

    useEffect(() => { fetchDiamonds(); }, [statusFilter, shapeFilter, clarityFilter, colorFilter]);

    const fetchDiamonds = async () => {
        setLoading(true);
        try {
            const res = await diamondService.getAll({
                certificate: search,
                status: statusFilter,
                shape: shapeFilter,
                clarity: clarityFilter,
                color: colorFilter
            });
            setDiamonds(res.data);
            setSelectedIds([]);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleEdit = (diamond) => { setSelectedDiamond(diamond); setShowAddModal(true); };



    // Delete Logic
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    const confirmDelete = (id) => { setDeleteId(id); setIsBulkDelete(false); setShowDeleteConfirm(true); };
    const confirmBulkDelete = () => { if (selectedIds.length === 0) return; setIsBulkDelete(true); setShowDeleteConfirm(true); };

    const executeDelete = async () => {
        try {
            if (isBulkDelete) {
                await diamondService.bulkDelete(selectedIds);
                selectedIds.forEach(id => { if (isInCart(id)) removeFromCart(id); });
            } else {
                await diamondService.remove(deleteId);
                if (isInCart(deleteId)) removeFromCart(deleteId);
            }
            fetchDiamonds();
            setShowDeleteConfirm(false);
            setDeleteId(null);
            setIsBulkDelete(false);
            if (isBulkDelete) setSelectedIds([]);
        } catch (err) { console.error(err); alert("Failed to delete"); }
    };

    const handleSelectAll = (e) => setSelectedIds(e.target.checked ? diamonds.map(d => d.id) : []);
    const handleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    const handleSuccess = () => { setShowAddModal(false); setSelectedDiamond(null); setShowUploadModal(false); fetchDiamonds(); };

    const isAllSelected = diamonds.length > 0 && selectedIds.length === diamonds.length;

    const handleExportSelected = () => {
        const selectedData = diamonds.filter(d => selectedIds.includes(d.id));
        if (selectedData.length === 0) return;

        // Custom CSV Mapping (Only Export User-Relevent Fields)
        const headers = [
            "Certificate", "Date", "Shape", "Carat", "Color", "Clarity",
            "Cut", "Polish", "Symmetry", "Fluorescence", "Table %", "Depth %",
            "Price", "Discount %", "Final Price"
        ];

        const rows = selectedData.map(d => [
            d.certificate,
            d.certificate_date ? new Date(d.certificate_date).toLocaleDateString('en-GB') : '-',
            d.shape,
            d.carat,
            d.color,
            d.clarity,
            d.cut,
            d.polish,
            d.symmetry,
            d.fluorescence,
            d.table_percent,
            d.total_depth_percent,
            d.price,
            d.discount || 0,
            d.price ? (parseFloat(d.price) * (1 - (parseFloat(d.discount) || 0) / 100)).toFixed(2) : 0
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.map(String).map(s => `"${s.replace(/"/g, '""')}"`).join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // --- RENDER HELPERS ---
    const StatusBadge = ({ status }) => {
        const colors = {
            in_stock: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
            sold: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
            in_cart: "bg-blue-500",
            memo: "bg-amber-500"
        };
        const color = colors[status] || "bg-slate-300";
        const title = status?.replace('_', ' ').toUpperCase();

        return (
            <div className="flex justify-center items-center h-full">
                <div title={title} className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in relative transition-colors duration-300">
            {toastMsg && <Toast message={toastMsg} />}

            {/* --- TOP BAR: Title & Actions --- */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-20 gap-4 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-900/40 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Inventory</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {loading ? 'Updating...' : `${diamonds.length} stones found`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Shape Filter */}
                    <select value={shapeFilter} onChange={(e) => setShapeFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20">
                        <option value="">All Shapes</option>
                        {['Round', 'Princess', 'Emerald', 'Asscher', 'Marquise', 'Oval', 'Radiant', 'Pear', 'Heart', 'Cushion'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Color Filter */}
                    <select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20">
                        <option value="">All Colors</option>
                        {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Clarity Filter */}
                    <select value={clarityFilter} onChange={(e) => setClarityFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20">
                        <option value="">All Clarities</option>
                        {['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Quick Search */}
                    <div className="relative group w-full sm:w-48">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg leading-5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                            placeholder="Cert ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchDiamonds()}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer transition-all shadow-sm text-sm"
                        >
                            <option value="in_stock">In Stock</option>
                            <option value="all">All Items</option>
                            <option value="sold">Sold</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* --- ACTION BAR (Conditional) --- */}
            <div className={`flex items-center justify-between px-4 py-2 bg-slate-50/50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-600 transition-all duration-300 ${selectedIds.length > 0 ? 'h-14 opacity-100' : 'h-0 opacity-0 overflow-hidden py-0 border-none'}`}>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedIds.length}</span> selected
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportSelected} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-violet-200 dark:shadow-violet-900/20 hover:from-violet-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={confirmBulkDelete} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-rose-200 dark:shadow-rose-900/20 hover:from-rose-600 hover:to-pink-700 transform hover:-translate-y-0.5 transition-all">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>

            </div>

            {/* --- TABLE AREA (Sticky Headers) --- */}
            <div className="flex-1 overflow-auto relative scrollbar-none bg-white dark:bg-slate-800">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50">
                        <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-3 w-8 text-center border-b border-slate-200 dark:border-slate-700">
                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 h-3 w-3" />
                            </th>
                            <th className="px-2 py-3 w-8 text-center border-b border-slate-200 dark:border-slate-700" title="Status">●</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700">Cert #</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700">Client</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700">Shape</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Cts</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Color</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Clarity</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Cut</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Pol</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Sym</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Fluor</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Table</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Depth</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Lab</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Price</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-right text-emerald-600">Sell Price</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Disc%</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Total</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Buyer Loc</th>
                            <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center">Seller Loc</th>
                            <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                        {loading ? (
                            <tr><td colSpan="18" className="text-center py-20 text-slate-400 animate-pulse">Loading diamonds...</td></tr>
                        ) : diamonds.length === 0 ? (
                            <tr><td colSpan="18" className="text-center py-20 text-slate-400">No diamonds matching your criteria.</td></tr>
                        ) : (
                            diamonds.map((d) => (
                                <tr key={d.id} className={`group transition-colors text-xs font-medium text-slate-600 dark:text-slate-300 ${selectedIds.includes(d.id) ? 'bg-indigo-50/60 dark:bg-indigo-900/30' : d.status === 'sold' ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                    <td className="px-4 py-2 text-center">
                                        <input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => handleSelect(d.id)} className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" />
                                    </td>
                                    <td className="px-2 py-2"><StatusBadge status={d.status} /></td>
                                    <td className="px-2 py-2 font-semibold text-slate-700 dark:text-slate-200">{d.certificate}</td>
                                    <td className="px-2 py-2">
                                        {d.buyer_name ? (
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-[10px] uppercase tracking-wide truncate max-w-[80px] ${d.status === 'sold' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`} title={`Client: ${d.buyer_name}\nMobile: ${d.buyer_mobile || '-'}\nCountry: ${d.buyer_country || '-'}`}>
                                                    {d.buyer_name}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">-</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2">{getShapeDisplay(d.shape)}</td>
                                    <td className="px-2 py-2 text-right font-semibold text-slate-800 dark:text-slate-100">{d.carat}</td>
                                    <td className="px-2 py-2 text-center">{d.color}</td>
                                    <td className="px-2 py-2 text-center">{d.clarity}</td>
                                    <td className="px-2 py-2 text-center">{d.cut}</td>
                                    <td className="px-2 py-2 text-center">{d.polish}</td>
                                    <td className="px-2 py-2 text-center">{d.symmetry}</td>
                                    <td className="px-2 py-2 text-center">{getFluorescenceShortCode(d.fluorescence)}</td>
                                    <td className="px-2 py-2 text-center text-slate-400 dark:text-slate-500">{d.table_percent}</td>
                                    <td className="px-2 py-2 text-center text-slate-400 dark:text-slate-500">{d.total_depth_percent}</td>
                                    <td className="px-2 py-2 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{d.lab || 'IGI'}</span>
                                            {d.report_url && (
                                                <a href={d.report_url} target="_blank" rel="noreferrer" className="text-[9px] text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>View</a>
                                            )}
                                            {d.growth_process && <span className="text-[8px] text-slate-400">{d.growth_process}</span>}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-right text-slate-400 dark:text-slate-500">${d.price ? parseFloat(d.price).toLocaleString() : '-'}</td>
                                    <td className="px-2 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                        {d.sale_price && Number(d.sale_price) > 0 ? `$${parseFloat(d.sale_price).toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-2 py-2 text-center text-orange-500 font-bold">{d.discount ? `${d.discount}%` : '-'}</td>
                                    <td className="px-2 py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                        ${d.price ? (parseFloat(d.price) * (1 - (parseFloat(d.discount) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="px-2 py-2 text-center text-xs text-slate-500">{d.buyer_country || '-'}</td>
                                    <td className="px-2 py-2 text-center text-xs text-slate-500">{d.seller_country || '-'}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(d); }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors" title="Edit">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); confirmDelete(d.id); }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors" title="Delete">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- FOOTER / FLOATING ACTION BUTTONS --- */}
            <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-[50] items-center">
                {/* Import Button */}
                <div className="relative group flex items-center justify-center">
                    <span className="absolute right-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                        Import Excel
                    </span>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 rounded-full shadow-lg border-2 border-emerald-50 dark:border-emerald-900 hover:border-emerald-200 dark:hover:border-emerald-700 hover:scale-110 active:scale-95 transition-all duration-300"
                    >
                        <Upload className="w-5 h-5" />
                    </button>
                </div>

                {/* Add Diamond Button */}
                <div className="relative group flex items-center justify-center">
                    <span className="absolute right-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none mr-1 shadow-xl">
                        Add Diamond
                    </span>
                    <button
                        onClick={() => { setSelectedDiamond(null); setShowAddModal(true); }}
                        className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-white/20 hover:ring-white/40"
                    >
                        <Plus className="w-8 h-8" />
                    </button>
                </div>
            </div>

            {/* --- MODALS --- */}
            {showAddModal && <DiamondForm initialData={selectedDiamond} onClose={() => { setShowAddModal(false); setSelectedDiamond(null); }} onSuccess={handleSuccess} />}
            {showUploadModal && <CSVUpload onClose={() => setShowUploadModal(false)} onSuccess={handleSuccess} />}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60]">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Confirm Deletion</h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 font-medium">
                            Permanently delete {isBulkDelete ? `${selectedIds.length} diamonds` : 'this item'}?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">Cancel</button>
                            <button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md shadow-red-200 dark:shadow-none">Delete Forever</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
