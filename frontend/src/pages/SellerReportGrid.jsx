import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Download, Calculator, Receipt, Users, Filter as FilterIcon } from 'lucide-react';
import ExcelGrid from '../components/ExcelGrid';
import LedgerTable from '../components/LedgerTable';
import { utils, writeFile } from 'xlsx-js-style';

const SellerReportGrid = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [groupByMode, setGroupByMode] = useState('seller'); // 'seller' or 'staff'
    const [selectedGroupSummary, setSelectedGroupSummary] = useState(null);

    // Filters State
    const [filters, setFilters] = useState({
        sellerId: [],
        staffId: [],
        status: [], // paid, partial, due
        startDate: '',
        endDate: '',
        minAmount: '', maxAmount: ''
    });

    // Options for filters (fetched on mount)
    const [sellers, setSellers] = useState([]);
    const [staff, setStaff] = useState([]);

    useEffect(() => {
        fetchMetadata();
        fetchData();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [sellerRes, staffRes] = await Promise.all([
                api.get('/sellers'),
                api.get('/auth/staff')
            ]);
            setSellers(sellerRes.data || []);
            setStaff(staffRes.data || []);
        } catch (error) {
            console.error("Error fetching metadata", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = {};
            if (filters.sellerId.length) params.sellerId = filters.sellerId.join(',');
            if (filters.staffId.length) params.staffId = filters.staffId.join(',');
            if (filters.status.length) params.status = filters.status.join(',');
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.minAmount) params.minAmount = filters.minAmount;
            if (filters.maxAmount) params.maxAmount = filters.maxAmount;

            const response = await api.get('/reports/sellers/grid', {
                params
            });
            setData(response.data);
        } catch (error) {
            console.error("Error fetching report data", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch when filters change (Debounce for text/dates if needed, but selects are fine)
    useEffect(() => {
        // Debounce fetching to avoid double-firing
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleClearFilters = () => {
        setFilters({
            sellerId: [],
            staffId: [],
            status: [],
            startDate: '',
            endDate: '',
            minAmount: '', maxAmount: ''
        });
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!id) return;
        try {
            await api.put(`/diamonds/${id}`, { payment_status: newStatus });
            fetchData();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const columns = useMemo(() => [
        { key: 'seller_name', label: 'Seller', width: 150, hidden: false },
        { key: 'staff_name', label: 'Staff / User', width: 120, hidden: false },
        { key: 'certificate', label: 'Cert No', width: 100, hidden: false },
        { key: 'shape', label: 'Shape', width: 80 },
        { key: 'carat', label: 'Carat', width: 60, type: 'number' },
        { key: 'rate', label: 'Rate (Buy)', width: 100, type: 'currency' },
        { key: 'buy_price', label: 'Purchase Amt', width: 120, type: 'currency', className: 'text-indigo-700 font-bold' },
        { key: 'paid_amount', label: 'Paid', width: 100, type: 'currency', className: 'text-emerald-600' },
        { key: 'due_amount', label: 'Due', width: 100, type: 'currency', className: 'text-rose-600 font-bold' },
        {
            key: 'due_status',
            label: 'Status',
            width: 100, // Increased width for dropdown
            format: (val, row) => (
                <select
                    value={val === 'Paid' ? 'paid' : 'unpaid'}
                    onChange={(e) => handleStatusChange(row.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Prevent row click if any
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer outline-none border border-transparent hover:border-slate-300 transition-all ${val === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        val === 'Partial' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-rose-50 text-rose-600 border-rose-200'
                        }`}
                >
                    <option value="unpaid">Pending</option>
                    <option value="paid">Paid</option>
                </select>
            )
        },
        {
            key: 'days_outstanding',
            label: 'Days',
            width: 60,
            type: 'number',
            format: (val) => val > 30 ? <span className="text-rose-500 font-bold">{val}</span> : val
        },
        { key: 'buy_date', label: 'Date', width: 90, type: 'date' },
        { key: 'notes', label: 'Notes', width: 150, hidden: true }
    ], []);
    // --- HIERARCHICAL DATA PROCESSING ---
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const groups = {};
        const primaryKey = groupByMode === 'seller' ? 'seller_name' : 'staff_name';
        const secondaryKey = groupByMode === 'seller' ? 'staff_name' : 'seller_name';

        data.forEach(row => {
            const pKey = row[primaryKey] || 'Unknown';
            const sKey = row[secondaryKey] || 'Unknown';

            if (!groups[pKey]) {
                groups[pKey] = {
                    key: pKey,
                    count: 0,
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    subGroups: {}
                };
            }

            // Update Primary Group Totals
            groups[pKey].count += 1;
            groups[pKey].totalAmount += parseFloat(row.buy_price || 0);
            groups[pKey].totalPaid += parseFloat(row.paid_amount || 0);
            groups[pKey].totalDue += parseFloat(row.due_amount || 0);

            if (!groups[pKey].subGroups[sKey]) {
                groups[pKey].subGroups[sKey] = {
                    key: sKey,
                    count: 0,
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    rows: []
                };
            }

            // Update Secondary Group Totals
            groups[pKey].subGroups[sKey].count += 1;
            groups[pKey].subGroups[sKey].totalAmount += parseFloat(row.buy_price || 0);
            groups[pKey].subGroups[sKey].totalPaid += parseFloat(row.paid_amount || 0);
            groups[pKey].subGroups[sKey].totalDue += parseFloat(row.due_amount || 0);

            groups[pKey].subGroups[sKey].rows.push(row);
        });

        // specific function to sort numeric totals desc
        const sortGroups = (obj) => Object.values(obj).sort((a, b) => b.totalDue - a.totalDue);

        return sortGroups(groups).map(g => ({
            ...g,
            subGroups: sortGroups(g.subGroups)
        }));

    }, [data, groupByMode]);

    // Global Totals
    const globalTotals = useMemo(() => {
        return processedData.reduce((acc, g) => ({
            amount: acc.amount + g.totalAmount,
            paid: acc.paid + g.totalPaid,
            due: acc.due + g.totalDue,
            count: acc.count + g.count
        }), { amount: 0, paid: 0, due: 0, count: 0 });
    }, [processedData]);

    const handleExport = () => {
        // Excel Export Logic
        const ws = utils.json_to_sheet(data.map(row => ({
            Seller: row.seller_name,
            Staff: row.staff_name,
            Certificate: row.certificate,
            Shape: row.shape,
            Carat: row.carat,
            Rate: row.rate,
            'Purchase Amount': row.buy_price,
            Paid: row.paid_amount,
            Due: row.due_amount,
            Status: row.due_status,
            'Days Outstanding': row.days_outstanding,
            Date: row.buy_date
            // Add totals row manually if needed or rely on user to sum in Excel
        })));

        // Add formatting here if using xlsx-js-style
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Seller Ledger");
        writeFile(wb, `Seller_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Receipt size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Seller Reports Grid</h1>
                        <p className="text-xs text-slate-500 font-medium">Purchase Analysis & Reconciliation</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setGroupByMode(groupByMode === 'seller' ? 'staff' : 'seller')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white border-slate-200 text-slate-600 hover:text-indigo-600`}
                    >
                        <Users size={14} /> Group by {groupByMode === 'seller' ? 'Seller' : 'Staff'}
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                        <Download size={14} /> Export Excel
                    </button>
                </div>
            </div>

            {/* Simple Filter Bar (Can be expanded to full component) */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-30">
                {/* Seller Select */}
                <select
                    className="text-xs font-bold border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                    onChange={(e) => setFilters({ ...filters, sellerId: e.target.value ? [e.target.value] : [] })}
                    value={filters.sellerId[0] || ''}
                >
                    <option value="">All Sellers</option>
                    {sellers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
                </select>

                {/* Staff Select */}
                <select
                    className="text-xs font-bold border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 outline-none"
                    onChange={(e) => setFilters({ ...filters, staffId: e.target.value ? [e.target.value] : [] })}
                    value={filters.staffId[0] || ''}
                >
                    <option value="">All Staff</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                {/* Status */}
                <select
                    className="text-xs font-bold border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 outline-none"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value ? [e.target.value] : [] })}
                    value={filters.status[0] || ''}
                >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="due">Due</option>
                </select>

                <div className="h-6 w-px bg-slate-200"></div>

                <input
                    type="date"
                    className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                    type="date"
                    className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />

                <button
                    onClick={handleClearFilters}
                    className="px-3 py-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold"
                >
                    Clear
                </button>
            </div>

            {/* TOP SUMMARY STICKY BAR */}
            <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-6">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Purchased</span>
                        <span className="text-xl font-black font-mono tracking-tight">${globalTotals.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-600"></div>
                    <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Total Paid</span>
                        <span className="text-xl font-bold font-mono tracking-tight text-emerald-400">${globalTotals.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-600"></div>
                    <div>
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Total Due</span>
                        <span className="text-xl font-black font-mono tracking-tight text-rose-400">${globalTotals.due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Diamonds</span>
                    <span className="text-lg font-bold text-white">{globalTotals.count}</span>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-hidden p-4 relative">
                <LedgerTable
                    data={processedData}
                    columns={columns}
                    loading={loading}
                    groupByMode={groupByMode}
                    emptyMessage="No ledger entries found."
                    onGroupClick={(group) => setSelectedGroupSummary(group)}
                />

                {/* Selected Group Summary Popup */}
                {selectedGroupSummary && (
                    <div className="absolute bottom-6 right-6 z-50 animate-in slide-in-from-right duration-300">
                        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 w-80 relative overflow-hidden">
                            <button
                                onClick={() => setSelectedGroupSummary(null)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                            >
                                <Users size={14} />
                            </button>
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>

                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1 pr-6 truncate">
                                {selectedGroupSummary.key}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Performance Summary</p>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-500">Total Purchased</span>
                                    <span className="text-sm font-bold text-slate-800">${parseFloat(selectedGroupSummary.totalAmount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-500">Total Paid</span>
                                    <span className="text-sm font-bold text-emerald-600">${parseFloat(selectedGroupSummary.totalPaid).toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <div className="flex justify-between items-center bg-rose-50 p-2 rounded-lg -mx-2">
                                    <span className="text-xs font-bold text-rose-700">Total Due</span>
                                    <span className="text-base font-black text-rose-600">${parseFloat(selectedGroupSummary.totalDue).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Diamonds Count</span>
                                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{selectedGroupSummary.count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerReportGrid;
