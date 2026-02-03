import React, { useState, useEffect } from 'react';
import diamondService from '../services/diamond.service';
import authService from '../services/auth.service';
import XLSX from 'xlsx-js-style';
import { Plus, Upload, LayoutGrid, DollarSign, Download, Trash2, CheckCircle, Layers } from 'lucide-react';
import DiamondForm from '../components/DiamondForm';
import CSVUpload from '../components/CSVUpload';
import SalesModal from '../components/SalesModal';
import FilterPanel from '../components/FilterPanel';
import ExcelGrid from '../components/ExcelGrid';
import { getShapeDisplay } from '../utils/shapeUtils';

const Inventory = () => {
    const [diamonds, setDiamonds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState([]);

    // Filters State
    const [filters, setFilters] = useState({
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
        minDepth: '', maxDepth: '',
        selectedStaffId: ''
    });

    // Selection & Grouping
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedDiamond, setSelectedDiamond] = useState(null); // For Edit
    const [directSellData, setDirectSellData] = useState(null); // For Direct Sell Flow
    const [groupBy, setGroupBy] = useState('');
    const [showGroupMenu, setShowGroupMenu] = useState(false);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showSalesModal, setShowSalesModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    const user = authService.getCurrentUser();
    const isAdmin = user && user.role === 'admin';

    // Grid Columns Configuration
    const columns = [
        { key: 'status', label: 'Status', width: '60px', format: (v) => <StatusBadge status={v} /> },
        { key: 'buy_date', label: 'Date', width: '90px', format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
        isAdmin ? { key: 'creator', label: 'Added By', width: '100px', format: (v) => v ? v.name : 'Admin', sortValue: (row) => row.creator?.name || 'Admin', type: 'string' } : { key: 'hidden_creator', hidden: true },
        { key: 'company', label: 'Company', width: '120px' },
        { key: 'certificate', label: 'Cert No', width: '100px' },
        { key: 'buyer_name', label: 'Client', width: '120px', format: (v) => v || '-' },
        { key: 'shape', label: 'Shape', width: '90px', format: getShapeDisplay },
        { key: 'carat', label: 'Cts', width: '60px', type: 'number' },
        { key: 'color', label: 'Col', width: '50px' },
        { key: 'clarity', label: 'Clar', width: '50px' },
        { key: 'cut', label: 'Cut', width: '50px' },
        { key: 'polish', label: 'Pol', width: '50px' },
        { key: 'symmetry', label: 'Sym', width: '50px' },
        { key: 'fluorescence', label: 'Fluor', width: '60px', format: (v) => v === 'NONE' ? 'N' : (v || '-') },
        { key: 'lab', label: 'Lab', width: '50px' },
        { key: 'price', label: 'Cost Price', width: '100px', type: 'currency' },
        { key: 'discount', label: 'Disc%', width: '60px', type: 'number', format: (v) => v ? `${v}%` : '-' },
        { key: 'sale_price', label: 'Sell Price', width: '100px', type: 'currency', className: 'text-emerald-600 font-bold' },
        {
            key: 'profit', label: 'Profit', width: '90px', type: 'currency', className: 'text-blue-600 font-bold', format: (_, row) => {
                const cost = row.price ? (parseFloat(row.price) * (1 - (parseFloat(row.discount) || 0) / 100)) : 0;
                const sale = row.sale_price ? parseFloat(row.sale_price) : 0;
                return sale > 0 ? `$${(sale - cost).toFixed(2)}` : '-';
            }, sortValue: (row) => {
                const cost = row.price ? (parseFloat(row.price) * (1 - (parseFloat(row.discount) || 0) / 100)) : 0;
                const sale = row.sale_price ? parseFloat(row.sale_price) : 0;
                return sale - cost;
            }
        },
        { key: 'buyer_country', label: 'Buyer Loc', width: '100px' },
        { key: 'seller_country', label: 'Seller Loc', width: '100px', format: (v, r) => r.seller?.address || v || '-' },
        { key: 'table_percent', label: 'Table%', width: '70px', hidden: true },
        { key: 'total_depth_percent', label: 'Depth%', width: '70px', hidden: true },
        { key: 'measurements', label: 'Msmt', width: '120px', hidden: true },
    ].filter(c => !c.hidden || c.hidden === true); // Filter out conditionally nulls if any

    const StatusBadge = ({ status }) => {
        const colors = {
            in_stock: "bg-emerald-500",
            sold: "bg-red-500",
            in_cart: "bg-blue-500",
            memo: "bg-amber-500"
        };
        return <div className={`w-2.5 h-2.5 rounded-full mx-auto ${colors[status] || "bg-slate-300"}`} title={status} />;
    };

    const fetchDiamonds = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            // Default sort could be handled here if API supports it, 
            // but ExcelGrid handles client-side sort. 
            // We'll trust the grid or backend default.

            if (isAdmin && filters.selectedStaffId) {
                params.staffId = filters.selectedStaffId;
            }

            const res = await diamondService.getAll(params);

            // Client-side default sort by Date Descending
            const sortedData = (res.data || []).sort((a, b) => {
                return new Date(b.buy_date || b.createdAt) - new Date(a.buy_date || a.createdAt);
            });

            setDiamonds(sortedData);
            setSelectedIds([]); // Clear selection on re-fetch
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const fetchCompanies = async () => {
        try {
            const res = await diamondService.getCompanies();
            setCompanies(res.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        // Debounce search slightly
        const timer = setTimeout(() => {
            fetchDiamonds();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]); // Re-fetch when any filter changes

    const handleEdit = (diamond) => {
        setSelectedDiamond(diamond);
        setShowAddModal(true);
    };

    const confirmDelete = (id) => { setDeleteId(id); setIsBulkDelete(false); setShowDeleteConfirm(true); };
    const confirmBulkDelete = () => { if (selectedIds.length === 0) return; setIsBulkDelete(true); setShowDeleteConfirm(true); };

    const executeDelete = async () => {
        try {
            if (isBulkDelete) {
                await diamondService.bulkDelete(selectedIds);
            } else {
                await diamondService.remove(deleteId);
            }
            fetchDiamonds();
            setShowDeleteConfirm(false);
            setDeleteId(null);
            setIsBulkDelete(false);
            if (isBulkDelete) setSelectedIds([]);
        } catch (err) {
            alert("Failed to delete items.");
        }
    };

    const handleSuccess = async (newData, action) => {
        setShowAddModal(false);
        setSelectedDiamond(null);
        setShowUploadModal(false);

        await fetchDiamonds();

        if (action === 'sell' && newData) {
            setDirectSellData(newData);
            setShowSalesModal(true);
        }
    };

    // State to track column visibility from ExcelGrid
    const [activeColumnVisibility, setActiveColumnVisibility] = useState({});

    const handleExportSelected = () => {
        const dataToExport = selectedIds.length > 0
            ? diamonds.filter(d => selectedIds.includes(d.id))
            : diamonds;

        // Filter valid columns based on current visibility
        const exportableColumns = columns.filter(col => activeColumnVisibility[col.key]);

        const exportData = dataToExport.map(d => {
            const row = {};
            exportableColumns.forEach(col => {
                let val = d[col.key];

                // Custom handling for specific fields or formatting
                if (col.key === 'shape') val = getShapeDisplay(val);
                else if (col.key === 'buy_date' && val) val = new Date(val).toLocaleDateString();
                else if (col.key === 'fluorescence') val = val === 'NONE' ? 'N' : val;
                else if (col.key === 'discount' && val) val = `${val}%`;
                else if (col.type === 'currency' && val) val = `$${parseFloat(val).toFixed(2)}`;
                else if (col.key === 'seller_country' && d.seller?.address) val = d.seller.address;
                else if (col.key === 'creator') val = d.creator?.name || 'Admin';
                else if (col.key === 'profit') {
                    // Re-calculate profit logic
                    const cost = d.price ? (parseFloat(d.price) * (1 - (parseFloat(d.discount) || 0) / 100)) : 0;
                    const sale = d.sale_price ? parseFloat(d.sale_price) : 0;
                    val = sale > 0 ? `$${(sale - cost).toFixed(2)}` : '-';
                }

                // Fallback for objects/nulls
                if (val === null || val === undefined) val = '';
                if (typeof val === 'object') val = JSON.stringify(val); // Safety net

                row[col.label] = val;
            });
            return row;
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Auto-width columns
        const wscols = exportableColumns.map(c => ({ wch: 15 }));
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Inventory");
        XLSX.writeFile(wb, "Inventory.xlsx");
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 gap-4 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Inventory</h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <div className="relative">
                        <button
                            onClick={() => setShowGroupMenu(!showGroupMenu)}
                            className={`flex-1 sm:flex-none justify-center px-3 py-2 border rounded-xl flex items-center gap-2 transition-all text-xs font-bold ${groupBy ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Layers size={14} /> {groupBy ? `Group: ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1).replace('_', ' ')}` : 'Group By'}
                        </button>
                        {showGroupMenu && (
                            <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95">
                                {[
                                    { label: 'None', value: '' },
                                    { label: 'Added By', value: 'creator' },
                                    { label: 'Status', value: 'status' },
                                    { label: 'Shape', value: 'shape' },
                                    { label: 'Company', value: 'company' },
                                    { label: 'Lab', value: 'lab' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setGroupBy(opt.value); setShowGroupMenu(false); }}
                                        className={`px-3 py-2 text-xs font-bold text-left rounded-lg transition-colors ${groupBy === opt.value ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowUploadModal(true)} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all">
                        <Upload size={14} /> Import
                    </button>
                    <button onClick={() => { setSelectedDiamond(null); setShowAddModal(true); }} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all">
                        <Plus size={14} /> Add
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <FilterPanel
                filters={filters}
                setFilters={setFilters}
                onSearch={fetchDiamonds}
                loading={loading}
                companies={companies}
            />

            {/* Action Bar (Selection) */}
            <div className={`flex flex-col sm:flex-row items-center justify-between px-4 py-2 bg-indigo-50/50 border-b border-indigo-100 transition-all ${selectedIds.length > 0 ? 'h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden p-0 border-none'}`}>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 mb-2 sm:mb-0">
                    <CheckCircle size={14} /> {selectedIds.length} Selected
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setShowSalesModal(true)} className="flex-1 sm:flex-none justify-center px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 flex items-center gap-1">
                        <DollarSign size={12} /> Sell
                    </button>
                    <button onClick={handleExportSelected} className="flex-1 sm:flex-none justify-center px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-violet-700 flex items-center gap-1">
                        <Download size={12} /> Export
                    </button>
                    <button onClick={confirmBulkDelete} className="flex-1 sm:flex-none justify-center px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-rose-700 flex items-center gap-1">
                        <Trash2 size={12} /> Delete
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <ExcelGrid
                data={diamonds}
                columns={columns}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowClick={(row) => handleEdit(row)}
                loading={loading}
                groupBy={groupBy || null}
                gridId="inventory-grid"
                onColumnVisibilityChange={setActiveColumnVisibility}
            />

            {/* Modals */}
            {showSalesModal && (
                <SalesModal
                    selectedDiamonds={directSellData ? [directSellData] : diamonds.filter(d => selectedIds.includes(d.id))}
                    onClose={() => { setShowSalesModal(false); setDirectSellData(null); }}
                    onSuccess={() => { handleSuccess(); setSelectedIds([]); setShowSalesModal(false); setDirectSellData(null); }}
                />
            )}
            {showAddModal && <DiamondForm initialData={selectedDiamond} onClose={() => { setShowAddModal(false); setSelectedDiamond(null); }} onSuccess={handleSuccess} />}
            {showUploadModal && <CSVUpload onClose={() => setShowUploadModal(false)} onSuccess={handleSuccess} />}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Confirmation</h3>
                        <p className="text-slate-600 text-sm mb-6">Are you sure you want to delete {isBulkDelete ? `${selectedIds.length} items` : 'this item'}?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={executeDelete} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
