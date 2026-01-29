import React, { useState, useEffect } from 'react';
import diamondService from '../services/diamond.service';
import XLSX from 'xlsx-js-style';
import { Plus, Upload, Search, Trash2, Edit2, ShoppingCart, X, CheckCircle, Filter, ChevronDown, Download, RefreshCw, LayoutGrid, List, DollarSign } from 'lucide-react';
import DiamondForm from '../components/DiamondForm';
import CSVUpload from '../components/CSVUpload';
import SalesModal from '../components/SalesModal';
// import { useCart } from '../context/CartContext';
import { getShapeDisplay } from '../utils/shapeUtils';

// Simple Toast Component
const Toast = ({ message }) => (
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

import authService from '../services/auth.service';


const Inventory = () => {
    const [diamonds, setDiamonds] = useState([]);
    const [loading, setLoading] = useState(false);

    // Admin Staff Filter
    const [staffList, setStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const user = authService.getCurrentUser();
    const isAdmin = user && user.role === 'admin';

    // Cart removed for Trader workflow

    // Modals & Selection
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showSalesModal, setShowSalesModal] = useState(false);
    const [selectedDiamond, setSelectedDiamond] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // Toast
    // const [toastMsg, setToastMsg] = useState('');

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('in_stock');
    const [shapeFilter, setShapeFilter] = useState('');
    const [clarityFilter, setClarityFilter] = useState('');
    const [colorFilter, setColorFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [companies, setCompanies] = useState([]);

    const fetchStaff = async () => {
        try {
            const res = await authService.getAllStaff();
            setStaffList(res);
        } catch (err) {
            console.error("Failed to fetch staff list", err);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await diamondService.getCompanies();
            setCompanies(res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchDiamonds = async () => {
        setLoading(true);
        try {
            const params = {
                certificate: search,
                status: statusFilter,
                shape: shapeFilter,
                clarity: clarityFilter,
                color: colorFilter,
                company: companyFilter
            };
            if (isAdmin && selectedStaffId) {
                params.staffId = selectedStaffId;
            }

            const res = await diamondService.getAll(params);
            setDiamonds(res.data);
            setSelectedIds([]);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        if (isAdmin) fetchStaff();
        fetchCompanies();
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchDiamonds(); }, [statusFilter, shapeFilter, clarityFilter, colorFilter, companyFilter, selectedStaffId]);



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
                // selectedIds.forEach(id => { if (isInCart(id)) removeFromCart(id); });
            } else {
                await diamondService.remove(deleteId);
                // if (isInCart(deleteId)) removeFromCart(deleteId);
            }
            fetchDiamonds();
            setShowDeleteConfirm(false);
            setDeleteId(null);
            setIsBulkDelete(false);
            if (isBulkDelete) setSelectedIds([]);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Failed to delete items. Ensure none are sold or in use.";
            alert(msg);
        }
    };

    const handleSelectAll = (e) => setSelectedIds(e.target.checked ? diamonds.map(d => d.id) : []);
    const handleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);

    const handleSuccess = async (newDiamondId, mode) => {
        setShowAddModal(false);
        setSelectedDiamond(null);
        setShowUploadModal(false);

        // Refresh list
        await fetchDiamonds();

        if (mode === 'ORDER' && newDiamondId) {
            // Immediate Sales Trigger: Ensure the new diamond is in the state (might be filtered out)
            try {
                const res = await diamondService.get(newDiamondId);
                const newDiamond = res.data;

                if (newDiamond) {
                    // Update state ensuring we don't duplicate if already fetched
                    setDiamonds(prev => {
                        const exists = prev.find(d => d.id === newDiamond.id);
                        if (exists) return prev;
                        return [newDiamond, ...prev];
                    });

                    // Wait for next tick to ensure state update propagates? 
                    // React batches, so typically safe. But selection depends on it.
                    // Actually, setSelectedIds depends on `diamonds`? 
                    // No, `handleSelectAll` uses `diamonds`, but `SalesModal` filters `diamonds`.

                    setSelectedIds([newDiamondId]);
                    setShowSalesModal(true);
                }
            } catch (err) {
                console.error("Failed to fetch new diamond for order:", err);
                alert("Order created but failed to load for immediate sale. Please find it in inventory.");
            }
        }
    };

    const isAllSelected = diamonds.length > 0 && selectedIds.length === diamonds.length;

    const handleExportSelected = () => {
        const selectedData = diamonds.filter(d => selectedIds.includes(d.id));
        if (selectedData.length === 0) return;

        // Prepare Data for Excel (All Fields from Add Diamond Form)
        const exportData = selectedData.map(d => {
            // Calculations
            const price = parseFloat(d.price) || 0;
            const discount = parseFloat(d.discount) || 0;
            const netPrice = price * (1 - discount / 100);

            return {
                // 1. Identification
                "Certificate": d.certificate,
                "Certificate Date": d.certificate_date ? new Date(d.certificate_date).toLocaleDateString('en-GB') : '-',
                "Lab": d.lab || '-',
                "Company": d.company || '-',
                "Status": d.status ? d.status.toUpperCase().replace('_', ' ') : '-',

                // 2. Specifications
                "Shape": d.shape,
                "Carat": parseFloat(d.carat) || 0,
                "Color": d.color,
                "Clarity": d.clarity,
                "Cut": d.cut || '-',
                "Polish": d.polish || '-',
                "Symmetry": d.symmetry || '-',
                "Fluorescence": d.fluorescence || '-',

                // 3. Measurements & Ratios
                "Measurements": d.measurements || '-',
                "Table %": d.table_percent || '-',
                "Depth %": d.total_depth_percent || '-',
                "Crown Height": d.crown_height || '-',
                "Pavillion Depth": d.pavilion_depth || '-',
                "Girdle": d.girdle_thickness || '-',
                "Culet": d.culet || '-',

                // 4. Pricing
                "Rap Price ($)": parseFloat(d.rap_price || (d.carat > 0 ? price / d.carat : 0)).toFixed(2),
                "Total Rap ($)": price.toFixed(2),
                "Discount %": discount.toFixed(2),
                "Net Price ($)": netPrice.toFixed(2),
                "Price/Ct ($)": (d.carat > 0 ? netPrice / d.carat : 0).toFixed(2),
                "Currency": d.currency || 'USD',
                "Ex Rate": d.exchange_rate || 1,

                // 5. Inscriptions & Notes
                "Inscription": d.inscription || '-',
                "Comments": d.comments || '-'
            };
        });

        // Create Workbook & Sheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Styling
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" }, name: "Arial", sz: 10 },
            fill: { fgColor: { rgb: "4F46E5" } }, // Indigo-600
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1"; // Header Row
            if (!ws[address]) continue;
            ws[address].s = headerStyle;
        }

        // Auto-width
        const wscols = Object.keys(exportData[0]).map(k => ({ wch: Math.max(k.length + 5, 12) }));
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Inventory Export");
        XLSX.writeFile(wb, `Inventory_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
        <div className="h-[calc(100vh-100px)] flex flex-col bg-white  rounded-2xl shadow-sm border border-slate-200  overflow-hidden animate-fade-in relative transition-colors duration-300">
            {/* {toastMsg && <Toast message={toastMsg} />} */}

            {/* --- TOP BAR: Title & Actions --- */}
            <div className="flex flex-col border-b border-slate-100 bg-white z-20">

                {/* Row 1: Title & Primary Actions */}
                <div className="flex justify-between items-center p-6 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm border border-indigo-100">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inventory</h1>
                            <p className="text-sm text-slate-500 font-medium">
                                {loading ? 'Updating...' : `${diamonds.length} stones found`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30 text-slate-600 hover:text-emerald-700 text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <Upload className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span>Import Excel</span>
                        </button>
                        <button
                            onClick={() => { setSelectedDiamond(null); setShowAddModal(true); }}
                            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span>Add Diamond</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: Search & Filters Toolbar */}
                <div className="px-6 pb-6 pt-2 flex flex-wrap items-center justify-between gap-4">

                    {/* Stock/Sold Toggle */}
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                        <button
                            onClick={() => setStatusFilter('in_stock')}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${statusFilter === 'in_stock' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            In Stock
                        </button>
                        <button
                            onClick={() => setStatusFilter('sold')}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${statusFilter === 'sold' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Sold Out
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium shadow-sm hover:bg-white"
                            placeholder="Search Certificate ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchDiamonds()}
                        />
                    </div>

                    {/* Filter Group */}
                    <div className="flex flex-wrap items-center gap-3">

                        {/* Staff Filter (Admin Only) */}
                        {isAdmin && (
                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 mr-2">
                                <button
                                    onClick={() => setSelectedStaffId('')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!selectedStaffId ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setSelectedStaffId(user.id)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedStaffId === user.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Mine
                                </button>
                            </div>
                        )}

                        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                        {/* Dropdown Filters */}
                        {[
                            { value: shapeFilter, setter: setShapeFilter, options: ['Round', 'Princess', 'Emerald', 'Asscher', 'Marquise', 'Oval', 'Radiant', 'Pear', 'Heart', 'Cushion'], placeholder: 'Shape' },
                            { value: colorFilter, setter: setColorFilter, options: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'], placeholder: 'Color' },
                            { value: clarityFilter, setter: setClarityFilter, options: ['IF', 'VVS 1', 'VVS 2', 'VS 1', 'VS 2', 'SI 1', 'SI 2', 'I 1', 'I 2', 'I 3'], placeholder: 'Clarity' },
                            { value: companyFilter, setter: setCompanyFilter, options: companies, placeholder: 'Company' }
                        ].map((filter, idx) => (
                            <div key={idx} className="relative">
                                <select
                                    value={filter.value}
                                    onChange={(e) => filter.setter(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-sm transition-all min-w-[100px]"
                                >
                                    <option value="">{filter.placeholder}</option>
                                    {filter.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        ))}

                        {/* Admin specific staff dropdown if needed, otherwise hidden in simplified view or integrated above */}
                        {isAdmin && (
                            <div className="relative ml-2">
                                <select
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer w-32 transition-all"
                                >
                                    <option value="">Team...</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}

                    </div>
                </div>
            </div>



            {/* --- ACTION BAR (Conditional) --- */}
            <div className={`flex items-center justify-between px-4 py-2 bg-slate-50/50  border-b border-slate-100  transition-all duration-300 ${selectedIds.length > 0 ? 'h-14 opacity-100' : 'h-0 opacity-0 overflow-hidden py-0 border-none'}`}>
                <div className="flex items-center gap-2 text-sm text-slate-600 ">
                    <CheckCircle className="w-4 h-4 text-indigo-600 " />
                    <span className="font-semibold text-slate-800 ">{selectedIds.length}</span> selected
                </div>
                <div className="flex gap-2">
                    {statusFilter !== 'sold' && (
                        <button onClick={() => setShowSalesModal(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-700 transform hover:-translate-y-0.5 transition-all">
                            <DollarSign className="w-4 h-4" /> Sell Selected
                        </button>
                    )}
                    <button onClick={handleExportSelected} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-violet-200  hover:from-violet-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={confirmBulkDelete} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-rose-200  hover:from-rose-600 hover:to-pink-700 transform hover:-translate-y-0.5 transition-all">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>

            </div >

            {/* --- TABLE AREA (Sticky Headers) --- */}
            < div className="flex-1 overflow-auto relative scrollbar-none bg-white " >
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50  sticky top-0 z-10 shadow-sm shadow-slate-200/50 ">
                        <tr className="text-[10px] font-bold text-slate-500  uppercase tracking-wider">
                            <th className="px-4 py-3 w-8 text-center border-b border-slate-200 ">
                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="rounded border-slate-300  text-indigo-600 focus:ring-indigo-500 h-3 w-3" />
                            </th>
                            <th className="px-2 py-3 w-8 text-center border-b border-slate-200 " title="Status">●</th>
                            {isAdmin && <th className="px-2 py-3 border-b border-slate-200  text-left">Added By</th>}
                            <th className="px-2 py-3 border-b border-slate-200 ">Company</th>
                            <th className="px-2 py-3 border-b border-slate-200 ">Cert #</th>
                            <th className="px-2 py-3 border-b border-slate-200 ">Client</th>
                            <th className="px-2 py-3 border-b border-slate-200 ">Shape</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-right">Cts</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Color</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Clarity</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Cut</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Pol</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Sym</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Fluor</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Lab</th>
                            {/* <th className="px-2 py-3 border-b border-slate-200  text-right">Price</th> */}
                            <th className="px-2 py-3 border-b border-slate-200  text-right">Cost Price</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Disc%</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-right text-emerald-600">Sell Price</th>
                            {/* New Profit Column */}
                            <th className="px-2 py-3 border-b border-slate-200  text-right text-blue-600">Profit</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Buyer Loc</th>
                            <th className="px-2 py-3 border-b border-slate-200  text-center">Seller Loc</th>
                            <th className="px-4 py-3 border-b border-slate-200  text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white  divide-y divide-slate-100 ">
                        {loading ? (
                            <tr><td colSpan={isAdmin ? "20" : "19"} className="text-center py-20 text-slate-400 animate-pulse">Loading diamonds...</td></tr>
                        ) : diamonds.length === 0 ? (
                            <tr><td colSpan={isAdmin ? "20" : "19"} className="text-center py-20 text-slate-400">No diamonds matching your criteria.</td></tr>
                        ) : (
                            (() => {
                                // Group diamonds by Staff Name
                                const groupedDiamonds = diamonds.reduce((acc, d) => {
                                    const staffName = d.creator ? d.creator.name : 'Super Admin';
                                    if (!acc[staffName]) acc[staffName] = [];
                                    acc[staffName].push(d);
                                    return acc;
                                }, {});

                                return Object.entries(groupedDiamonds).map(([staffName, items]) => (
                                    <React.Fragment key={staffName}>
                                        {/* Group Header */}
                                        <tr className="bg-indigo-50/50 border-b border-indigo-100">
                                            <td colSpan={isAdmin ? "20" : "19"} className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-200">
                                                        {staffName.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-slate-800 text-sm">{staffName}</span>
                                                    <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200">
                                                        {items.length} items
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Items */}
                                        {items.map((d) => {
                                            const costPrice = d.price ? (parseFloat(d.price) * (1 - (parseFloat(d.discount) || 0) / 100)) : 0;
                                            const salePrice = d.sale_price ? parseFloat(d.sale_price) : 0;
                                            const profit = salePrice > 0 ? (salePrice - costPrice) : 0;

                                            return (
                                                <tr key={d.id} className={`group transition-colors text-xs font-medium text-slate-600 ${selectedIds.includes(d.id) ? 'bg-indigo-50/60' : d.status === 'sold' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-4 py-2 text-center">
                                                        <input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => handleSelect(d.id)} className="rounded border-slate-300  text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" />
                                                    </td>
                                                    <td className="px-2 py-2"><StatusBadge status={d.status} /></td>
                                                    {isAdmin && (
                                                        <td className="px-2 py-2 font-bold text-slate-800 text-[10px] uppercase">
                                                            {d.creator ? d.creator.name : 'Super Admin'}
                                                        </td>
                                                    )}
                                                    <td className="px-2 py-2 font-medium text-slate-600 truncate max-w-[100px]" title={d.company}>{d.company || '-'}</td>
                                                    <td className="px-2 py-2 font-semibold text-slate-700 ">{d.certificate}</td>
                                                    <td className="px-2 py-2">
                                                        {d.buyer_name ? (
                                                            <div className="flex flex-col">
                                                                <span className={`font-bold text-[10px] uppercase tracking-wide truncate max-w-[80px] ${d.status === 'sold' ? 'text-emerald-700' : 'text-slate-700'}`} title={`Client: ${d.buyer_name}\nMobile: ${d.buyer_mobile || '-'}\nCountry: ${d.buyer_country || '-'}`}>
                                                                    {d.buyer_name}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 ">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-2">{getShapeDisplay(d.shape)}</td>
                                                    <td className="px-2 py-2 text-right font-semibold text-slate-800 ">{d.carat}</td>
                                                    <td className="px-2 py-2 text-center">{d.color}</td>
                                                    <td className="px-2 py-2 text-center">{d.clarity}</td>
                                                    <td className="px-2 py-2 text-center">{d.cut}</td>
                                                    <td className="px-2 py-2 text-center">{d.polish}</td>
                                                    <td className="px-2 py-2 text-center">{d.symmetry}</td>
                                                    <td className="px-2 py-2 text-center">{getFluorescenceShortCode(d.fluorescence)}</td>
                                                    <td className="px-2 py-2 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-bold text-slate-700 ">{d.lab || 'IGI'}</span>
                                                            {d.report_url && (
                                                                <a href={d.report_url} target="_blank" rel="noreferrer" className="text-[9px] text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>View</a>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-2 py-2 text-right font-bold text-indigo-600 ">
                                                        ${costPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-2 py-2 text-center text-orange-500 font-bold">{d.discount ? `${d.discount}%` : '-'}</td>
                                                    <td className="px-2 py-2 text-right font-bold text-emerald-600 ">
                                                        {d.sale_price && Number(d.sale_price) > 0 ? `$${parseFloat(d.sale_price).toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className={`px-2 py-2 text-right font-black ${profit > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                                                        {profit > 0 ? `$${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                                    </td>
                                                    <td className="px-2 py-2 text-center text-xs text-slate-500">{d.buyer_country || '-'}</td>
                                                    <td className="px-2 py-2 text-center text-xs text-slate-500">{d.seller_country || '-'}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(d); }} className="p-1.5 text-slate-500  hover:text-indigo-600  hover:bg-indigo-50  rounded-md transition-colors" title="Edit">
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); confirmDelete(d.id); }} className="p-1.5 text-slate-500  hover:text-red-600  hover:bg-red-50  rounded-md transition-colors" title="Delete">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ));
                            })()
                        )}
                    </tbody>
                </table>
            </div >




            {/* --- MODALS --- */}
            {showSalesModal && (
                <SalesModal
                    selectedDiamonds={diamonds.filter(d => selectedIds.includes(d.id))}
                    onClose={() => setShowSalesModal(false)}
                    onSuccess={() => {
                        handleSuccess();
                        setShowSalesModal(false);
                        setSelectedIds([]);
                    }}
                />
            )}
            {showAddModal && <DiamondForm initialData={selectedDiamond} onClose={() => { setShowAddModal(false); setSelectedDiamond(null); }} onSuccess={handleSuccess} />}
            {showUploadModal && <CSVUpload onClose={() => setShowUploadModal(false)} onSuccess={handleSuccess} />}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60]">
                        <div className="bg-white  p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-slate-800  mb-2">Confirm Deletion</h3>
                            <p className="text-slate-600  mb-6 font-medium">
                                Permanently delete {isBulkDelete ? `${selectedIds.length} diamonds` : 'this item'}?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-slate-500  hover:bg-slate-100  rounded-lg transition-colors font-medium">Cancel</button>
                                <button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md shadow-red-200 ">Delete Forever</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Inventory;
