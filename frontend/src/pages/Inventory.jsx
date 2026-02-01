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
    const [isGrouped, setIsGrouped] = useState(false);

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

            if (isAdmin && filters.selectedStaffId) {
                params.staffId = filters.selectedStaffId;
            }

            const res = await diamondService.getAll(params);
            setDiamonds(res.data);
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

    const handleSuccess = async () => {
        setShowAddModal(false);
        setSelectedDiamond(null);
        setShowUploadModal(false);
        await fetchDiamonds();
    };

    const handleExportSelected = () => {
        const dataToExport = selectedIds.length > 0
            ? diamonds.filter(d => selectedIds.includes(d.id))
            : diamonds;

        const exportData = dataToExport.map(d => {
            return {
                Certificate: d.certificate,
                Shape: d.shape,
                Carat: d.carat,
                Color: d.color,
                Clarity: d.clarity,
                Price: d.price,
                Status: d.status
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Inventory");
        XLSX.writeFile(wb, "Inventory.xlsx");
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Inventory</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            {loading ? 'Updating...' : `${diamonds.length} stones`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsGrouped(!isGrouped)}
                        className={`px-3 py-2 border rounded-xl flex items-center gap-2 transition-all text-xs font-bold ${isGrouped ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Layers size={14} /> Group by Staff
                    </button>
                    <button onClick={() => setShowUploadModal(true)} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all">
                        <Upload size={14} /> Import
                    </button>
                    <button onClick={() => { setSelectedDiamond(null); setShowAddModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all">
                        <Plus size={14} /> Add Diamond
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
            <div className={`flex items-center justify-between px-4 py-2 bg-indigo-50/50 border-b border-indigo-100 transition-all ${selectedIds.length > 0 ? 'h-12 opacity-100' : 'h-0 opacity-0 overflow-hidden p-0 border-none'}`}>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                    <CheckCircle size={14} /> {selectedIds.length} Selected
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSalesModal(true)} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 flex items-center gap-1">
                        <DollarSign size={12} /> Sell
                    </button>
                    <button onClick={handleExportSelected} className="px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-violet-700 flex items-center gap-1">
                        <Download size={12} /> Export
                    </button>
                    <button onClick={confirmBulkDelete} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-rose-700 flex items-center gap-1">
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
                groupBy={isGrouped ? 'creator' : null}
            />

            {/* Modals */}
            {showSalesModal && (
                <SalesModal
                    selectedDiamonds={diamonds.filter(d => selectedIds.includes(d.id))}
                    onClose={() => setShowSalesModal(false)}
                    onSuccess={() => { handleSuccess(); setSelectedIds([]); setShowSalesModal(false); }}
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
