import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, User, Calendar, Download, ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import reportService from '../services/report.service';
import * as XLSX from 'xlsx';

const SellerBuyerGrid = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [endDate, setEndDate] = useState(new Date());

    // UI State
    const [expandedSellers, setExpandedSellers] = useState({});
    const [expandedBuyers, setExpandedBuyers] = useState({});

    // Selection State for Export
    const [selectedSellers, setSelectedSellers] = useState({}); // { sellerId: true }
    const [selectedBuyers, setSelectedBuyers] = useState({}); // { sellerId_buyerId: true }

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await reportService.getSellerBuyerSales({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
            setData(res.data || []);
        } catch (err) {
            console.error("Failed to fetch report", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    // Toggles
    const toggleSeller = (id) => {
        setExpandedSellers(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleBuyer = (sellerId, buyerId) => {
        const key = `${sellerId}_${buyerId}`;
        setExpandedBuyers(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Selection Logic
    const toggleSelectSeller = (sellerId) => {
        const isSelected = !!selectedSellers[sellerId];
        const newSelectedSellers = { ...selectedSellers, [sellerId]: !isSelected };

        // Auto-select/deselect all buyers under this seller
        const seller = data.find(s => s.id === sellerId);
        const newSelectedBuyers = { ...selectedBuyers };

        seller.buyers.forEach(b => {
            newSelectedBuyers[`${sellerId}_${b.id}`] = !isSelected;
        });

        setSelectedSellers(newSelectedSellers);
        setSelectedBuyers(newSelectedBuyers);
    };

    const toggleSelectBuyer = (sellerId, buyerId) => {
        const key = `${sellerId}_${buyerId}`;
        setSelectedBuyers(prev => ({ ...prev, [key]: !prev[key] }));

        // If a buyer is selected, ensure seller is effectively "partially selected" (we treat it as selected for logic simplicity)
        if (!selectedBuyers[key]) {
            setSelectedSellers(prev => ({ ...prev, [sellerId]: true }));
        }
    };

    // Export Logic
    const handleExport = (type) => { // type: 'full' | 'partial'
        const exportData = [];

        // Header
        exportData.push(['Seller', 'Buyer', 'Date', 'Diamond / Item', 'Carat', 'Amount ($)']);

        data.forEach(seller => {
            const isSellerSelected = type === 'full' || selectedSellers[seller.id];

            if (isSellerSelected) {
                // Add Seller Header Row
                exportData.push([seller.name, '', '', '', '', seller.totalAmount]);

                seller.buyers.forEach(buyer => {
                    const isBuyerSelected = type === 'full' || selectedBuyers[`${seller.id}_${buyer.id}`];

                    if (isBuyerSelected) {
                        // Add Buyer Header Row (Indented)
                        exportData.push(['', buyer.name, '', '', '', buyer.totalAmount]);

                        // Add Transactions
                        buyer.transactions.forEach(t => {
                            exportData.push([
                                '',
                                '',
                                new Date(t.date).toLocaleDateString(),
                                `${t.diamond.shape} ${t.diamond.carat}ct (${t.diamond.certificate})`,
                                t.diamond.carat,
                                t.amount
                            ]);
                        });
                    }
                });
                // Spacer
                exportData.push([]);
            }
        });

        // Generate Sheet
        const ws = XLSX.utils.aoa_to_sheet(exportData);

        // Basic Formatting (Widths)
        ws['!cols'] = [
            { wch: 30 }, // Seller
            { wch: 30 }, // Buyer
            { wch: 15 }, // Date
            { wch: 40 }, // Item
            { wch: 10 }, // Carat
            { wch: 15 }  // Amount
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Seller Sales Report");
        XLSX.writeFile(wb, `Seller_Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Formatters
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Briefcase className="text-indigo-600" />
                        Seller Sales Grid
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Track which seller's goods were sold to which buyer</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Date Picker */}
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                        <Calendar size={18} className="text-slate-400" />
                        <DatePicker
                            selected={startDate}
                            onChange={(dates) => {
                                const [start, end] = dates;
                                setStartDate(start);
                                setEndDate(end);
                            }}
                            startDate={startDate}
                            endDate={endDate}
                            selectsRange
                            className="bg-transparent font-bold text-slate-700 outline-none w-52 text-sm"
                            dateFormat="MMM dd, yyyy"
                        />
                    </div>

                    {/* Export Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('partial')}
                            disabled={Object.keys(selectedSellers).length === 0}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm
                                ${Object.keys(selectedSellers).length === 0
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'}
                            `}
                        >
                            <Download size={18} />
                            Export Selected
                        </button>
                        <button
                            onClick={() => handleExport('full')}
                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm shadow-lg shadow-slate-200"
                        >
                            <Download size={18} />
                            Export Full
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 w-12 text-center">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const allSellers = {};
                                                const allBuyers = {};
                                                data.forEach(s => {
                                                    allSellers[s.id] = true;
                                                    s.buyers.forEach(b => allBuyers[`${s.id}_${b.id}`] = true);
                                                });
                                                setSelectedSellers(allSellers);
                                                setSelectedBuyers(allBuyers);
                                            } else {
                                                setSelectedSellers({});
                                                setSelectedBuyers({});
                                            }
                                        }}
                                    />
                                </th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Seller / Buyer</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Carat</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Amount</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-400">Loading sales data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-400 italic">No sales found in this period.</td></tr>
                            ) : (
                                data.map(seller => (
                                    <React.Fragment key={seller.id}>
                                        {/* Seller Row */}
                                        <tr className={`hover:bg-indigo-50/30 transition-colors border-b border-slate-50 ${selectedSellers[seller.id] ? 'bg-indigo-50/50' : ''}`}>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedSellers[seller.id]}
                                                    onChange={() => toggleSelectSeller(seller.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="p-4" onClick={() => toggleSeller(seller.id)}>
                                                <div className="flex items-center gap-3 cursor-pointer">
                                                    <div className={`p-1 rounded-lg transition-colors ${expandedSellers[seller.id] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {expandedSellers[seller.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">{seller.name}</div>
                                                        <div className="text-xs font-medium text-slate-400">{seller.buyers.length} Buyers</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-semibold text-slate-600">{seller.totalCount}</td>
                                            <td className="p-4 text-right font-semibold text-slate-600">{seller.totalCarat.toFixed(2)}</td>
                                            <td className="p-4 text-right font-black text-slate-800">{formatCurrency(seller.totalAmount)}</td>
                                            <td></td>
                                        </tr>

                                        {/* Buyer Rows (Nested) */}
                                        {expandedSellers[seller.id] && seller.buyers.map(buyer => (
                                            <React.Fragment key={`${seller.id}_${buyer.id}`}>
                                                <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100">
                                                    <td className="p-4 text-center">
                                                        {/* Indented checkbox */}
                                                        <div className="flex justify-end pr-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!selectedBuyers[`${seller.id}_${buyer.id}`]}
                                                                onChange={() => toggleSelectBuyer(seller.id, buyer.id)}
                                                                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 opacity-60"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-4 pl-16 cursor-pointer" onClick={() => toggleBuyer(seller.id, buyer.id)}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-0.5 rounded transition-transform ${expandedBuyers[`${seller.id}_${buyer.id}`] ? 'rotate-90 text-indigo-500' : 'text-slate-400'}`}>
                                                                <ChevronRight size={12} />
                                                            </div>
                                                            <span className="font-semibold text-slate-700 text-sm">{buyer.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right text-sm text-slate-500">{buyer.totalCount}</td>
                                                    <td className="p-4 text-right text-sm text-slate-500">{buyer.totalCarat.toFixed(2)}</td>
                                                    <td className="p-4 text-right text-sm font-bold text-slate-700">{formatCurrency(buyer.totalAmount)}</td>
                                                    <td></td>
                                                </tr>

                                                {/* Transaction Rows (Deeply Nested) */}
                                                {expandedBuyers[`${seller.id}_${buyer.id}`] && buyer.transactions.map((t, idx) => (
                                                    <tr key={idx} className="bg-white text-xs text-slate-500 border-b border-slate-50">
                                                        <td colSpan="2" className="p-3 pl-28">
                                                            <div className="flex items-center gap-4">
                                                                <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{t.diamond.certificate}</span>
                                                                <span>{t.diamond.shape} {t.diamond.carat}ct</span>
                                                                <span className="text-slate-400 text-[10px]">{new Date(t.date).toLocaleDateString()}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-right">1</td>
                                                        <td className="p-3 text-right">{t.diamond.carat}</td>
                                                        <td className="p-3 text-right font-medium text-slate-600">{formatCurrency(t.amount)}</td>
                                                        <td></td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                        {/* Footer Totals */}
                        <tfoot>
                            <tr className="bg-slate-900 text-white">
                                <td colSpan="2" className="p-4 font-bold text-right uppercase tracking-wider text-xs">Grand Total</td>
                                <td className="p-4 text-right font-bold">{data.reduce((sum, s) => sum + s.totalCount, 0)}</td>
                                <td className="p-4 text-right font-bold">{data.reduce((sum, s) => sum + s.totalCarat, 0).toFixed(2)}</td>
                                <td className="p-4 text-right font-bold text-lg">{formatCurrency(data.reduce((sum, s) => sum + s.totalAmount, 0))}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SellerBuyerGrid;
