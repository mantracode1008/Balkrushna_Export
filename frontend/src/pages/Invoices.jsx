import React, { useState, useEffect } from 'react';
import invoiceService from '../services/invoice.service';
import { Eye, Download, X, Trash2, RefreshCw, Printer, Plus, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { generateInvoiceExcel } from '../utils/excelGenerator';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const loadInvoices = async () => {
        try {
            const res = await invoiceService.getAll();
            setInvoices(res.data);
        } catch (err) {
            console.error("Failed to load invoices", err);
        }
    };

    useEffect(() => { loadInvoices(); }, []);

    const filteredInvoices = invoices.filter(inv => {
        const matchesCustomer = inv.customer_name?.toLowerCase().includes(customerSearch.toLowerCase()) ?? false;
        let matchesDate = true;
        if (startDate) matchesDate = matchesDate && new Date(inv.invoice_date) >= new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && new Date(inv.invoice_date) <= end;
        }
        return matchesCustomer && matchesDate;
    });

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(filteredInvoices.map(i => i.id));
        else setSelectedIds([]);
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    const handleViewDetails = (invoice) => setSelectedInvoice(invoice);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this invoice? Stock will be restored.")) return;
        try {
            await invoiceService.delete(id);
            loadInvoices();
        } catch (err) {
            console.error(err);
            alert("Failed to delete invoice");
        }
    };

    const handleResetAll = async () => {
        try {
            await invoiceService.deleteAll();
            loadInvoices();
            alert("All invoices have been reset.");
        } catch (err) {
            console.error(err);
            alert("Failed to reset invoices");
        }
    };

    // --- NEW LOGIC START ---

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            // Optimistic Update
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, payment_status: newStatus } : inv));
            await invoiceService.updateStatus(id, { payment_status: newStatus });
        } catch (err) {
            console.error("Status update failed", err);
            loadInvoices(); // Revert on fail
        }
    };

    const handleExportExcel = (mode, specificId = null) => {
        let dataToExport = [];
        let fileName = 'Invoices';

        if (mode === 'SINGLE' && specificId) {
            dataToExport = invoices.filter(i => i.id === specificId);
            fileName = `Invoice_${specificId}`;
        } else if (mode === 'SELECTED') {
            dataToExport = invoices.filter(i => selectedIds.includes(i.id));
            fileName = 'Selected_Invoices';
        } else if (mode === 'FILTERED') {
            dataToExport = filteredInvoices;
            fileName = 'Invoices_Filtered';
        } else if (mode === 'ALL') {
            dataToExport = invoices;
            fileName = 'All_Invoices';
        }

        if (dataToExport.length === 0) return alert("No invoices to export.");
        generateInvoiceExcel(dataToExport, fileName);
    };

    // --- NEW LOGIC END ---

    // View PDF Logic (Deprecated by View Details but kept for Print)
    // const handleViewPdf = ... 

    return (
        <div className="space-y-6 relative animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Invoices</h1>

                <div className="flex gap-3">
                    <a href="/invoices/create" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-200">
                        <Plus className="w-5 h-5" /> Create Invoice
                    </a>

                    {/* Export Dropdown Group */}
                    <div className="group relative">
                        <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold shadow-lg shadow-emerald-200">
                            <FileSpreadsheet className="w-5 h-5" />
                            <span>Export Excel</span>
                            <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                            {selectedIds.length > 0 && (
                                <button onClick={() => handleExportExcel('SELECTED')} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors">
                                    Export Selected ({selectedIds.length})
                                </button>
                            )}
                            <button onClick={() => handleExportExcel('FILTERED')} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors">
                                Export Filtered View
                            </button>
                            <button onClick={() => handleExportExcel('ALL')} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors">
                                Export All Data
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => { if (window.confirm("WARNING: RESET ALL DATA?")) handleResetAll(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-100"
                    >
                        <RefreshCw className="w-4 h-4" /> Reset
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-colors">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search Customer</label>
                    <input
                        type="text"
                        placeholder="Customer Name..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder-slate-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 [color-scheme:light]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 [color-scheme:light]"
                    />
                </div>
                <div className="flex items-end">
                    <button onClick={() => { setStartDate(''); setEndDate(''); setCustomerSearch(''); }} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium">Clear Filters</button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-colors">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Invoice ID</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Customer</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Items</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Total Amount</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Profit</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-center">Payment</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.length === 0 ? (
                            <tr><td colSpan="9" className="text-center py-8 text-slate-500">No invoices found</td></tr>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(inv.id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(inv.id)}
                                            onChange={() => handleSelectOne(inv.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">#{inv.id}</td>
                                    <td className="px-6 py-4 text-slate-600">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-600">{inv.customer_name}</td>
                                    <td className="px-6 py-4 text-slate-600 text-center">{inv.items ? inv.items.length : 0}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                        {inv.currency && inv.currency !== 'USD' ? (
                                            <div className="flex flex-col">
                                                <span>{inv.currency} {inv.final_amount_inr || inv.total_amount /* Fallback */}</span>
                                                <span className="text-xs text-slate-400">${inv.total_amount}</span>
                                            </div>
                                        ) : (
                                            `$${inv.total_amount}`
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-600">${inv.total_profit}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => {
                                                const nextStatus = { 'Pending': 'Paid', 'Paid': 'Overdue', 'Overdue': 'Pending' };
                                                handleStatusUpdate(inv.id, nextStatus[inv.payment_status || 'Pending'] || 'Paid');
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-600' :
                                                inv.payment_status === 'Overdue' ? 'bg-rose-100 text-rose-600' :
                                                    'bg-amber-100 text-amber-600'
                                                }`}
                                        >
                                            {inv.payment_status || 'Pending'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleViewDetails(inv)}
                                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => window.open(`/invoices/${inv.id}/print`, '_blank')}
                                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                            title="Print PDF"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleExportExcel(inv.id)} // Single
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                            title="Export Excel"
                                        >
                                            <FileSpreadsheet className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(inv.id)}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                            title="Delete Invoice"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="bg-white  rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative border border-slate-700">
                        <div className="p-6 border-b border-slate-100  flex justify-between items-center bg-slate-50 ">
                            <div>
                                <h3 className="font-bold text-slate-800  text-xl">Invoice #{selectedInvoice.id} Details</h3>
                                <p className="text-sm text-slate-500 ">Customer: {selectedInvoice.customer_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="p-2 hover:bg-slate-200  rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500 " />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-white ">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50  border-b border-slate-200  text-xs uppercase tracking-wide font-bold text-slate-500 ">
                                    <tr>
                                        <th className="px-4 py-3">Certificate</th>
                                        <th className="px-4 py-3">Shape</th>
                                        <th className="px-4 py-3">Color</th>
                                        <th className="px-4 py-3 text-right">Carat</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100  text-sm">
                                    {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 ">
                                            <td className="px-4 py-3 font-semibold text-slate-700 ">
                                                {item.diamond ? item.diamond.certificate : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 ">{item.diamond ? item.diamond.shape : '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 ">{item.diamond ? item.diamond.color : '-'}</td>
                                            <td className="px-4 py-3 text-right text-slate-600 ">{item.diamond ? item.diamond.carat : '-'}</td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-600 ">${item.sale_price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-100  bg-slate-50  text-right">
                            <span className="text-slate-500  text-sm font-semibold uppercase mr-4">Total Amount</span>
                            <span className="text-2xl font-bold text-slate-800 ">${selectedInvoice.total_amount}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Viewer Modal */}
            {selectedPdf && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="bg-white  rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative border border-slate-700">
                        <div className="p-4 border-b border-slate-100  flex justify-between items-center bg-slate-50 ">
                            <h3 className="font-bold text-slate-700 ">Invoice Preview</h3>
                            <button
                                onClick={() => setSelectedPdf(null)}
                                className="p-2 hover:bg-slate-200  rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500 " />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100  p-1">
                            <iframe
                                src={selectedPdf}
                                className="w-full h-full rounded-b-xl border-none"
                                title="PDF Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
