import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Download, Calculator, Receipt, Users, Filter as FilterIcon } from 'lucide-react';
import ExcelGrid from '../components/ExcelGrid';
import { utils, writeFile } from 'xlsx-js-style';

const SellerReportGrid = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [groupBy, setGroupBy] = useState('seller_name'); // Default group by seller

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
            const token = localStorage.getItem('token');
            const [sellerRes, staffRes] = await Promise.all([
                axios.get('http://localhost:8080/api/sellers', { headers: { 'x-access-token': token } }),
                axios.get('http://localhost:8080/api/auth/staff', { headers: { 'x-access-token': token } })
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
            const token = localStorage.getItem('token');
            // Build query params
            const params = {};
            if (filters.sellerId.length) params.sellerId = filters.sellerId.join(',');
            if (filters.staffId.length) params.staffId = filters.staffId.join(',');
            if (filters.status.length) params.status = filters.status.join(',');
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.minAmount) params.minAmount = filters.minAmount;
            if (filters.maxAmount) params.maxAmount = filters.maxAmount;

            const response = await axios.get('http://localhost:8080/api/reports/sellers/grid', {
                params,
                headers: { 'x-access-token': token }
            });
            setData(response.data);
        } catch (error) {
            console.error("Error fetching report data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchData();
    };

    const handleClearFilters = () => {
        setFilters({
            sellerId: [],
            staffId: [],
            status: [],
            startDate: '',
            endDate: '',
            minAmount: '', maxAmount: ''
        });
        // Optionally auto-fetch or wait for apply
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
            width: 80,
            format: (val) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${val === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        val === 'Partial' ? 'bg-orange-100 text-orange-700' :
                            'bg-rose-100 text-rose-700'
                    }`}>
                    {val}
                </span>
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
        utils.book_append_sheet(wb, ws, "Seller Report");
        writeFile(wb, `Seller_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
                        onClick={() => setGroupBy(groupBy === 'seller_name' ? null : 'seller_name')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${groupBy ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
                    >
                        <Users size={14} /> Group by Seller
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
                    onClick={handleApplyFilters}
                    className="ml-auto px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700"
                >
                    Apply
                </button>
                <button
                    onClick={handleClearFilters}
                    className="px-3 py-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold"
                >
                    Clear
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-hidden p-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
                    <ExcelGrid
                        data={data}
                        columns={columns}
                        loading={loading}
                        groupBy={groupBy}
                        emptyMessage="No purchases found for selected filters."
                    />
                </div>
            </div>
        </div>
    );
};

export default SellerReportGrid;
