import React, { useState, useEffect } from 'react';
import invoiceService from '../services/invoice.service';
import { Eye, Download, X, Trash2, RefreshCw, Printer, Plus } from 'lucide-react'; // Added icons

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [selectedPdf, setSelectedPdf] = useState(null); // URL or ID for viewing
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const res = await invoiceService.getAll();
            setInvoices(res.data);
        } catch (err) {
            console.error("Failed to load invoices", err);
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesCustomer = inv.customer_name.toLowerCase().includes(customerSearch.toLowerCase());

        let matchesDate = true;
        if (startDate) {
            matchesDate = matchesDate && new Date(inv.invoice_date) >= new Date(startDate);
        }
        if (endDate) {
            // Include the whole end day
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && new Date(inv.invoice_date) <= end;
        }

        return matchesCustomer && matchesDate;
    });

    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const handleViewPdf = async (id) => {
        // Option 1: Serve statically if setup
        // const url = `http://localhost:8081/invoices/invoice-${id}.pdf`;

        // Option 2: Fetch blob and create URL (more secure/robust if auth needed later)
        try {
            const res = await invoiceService.getPdf(id);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            setSelectedPdf(url);
        } catch (err) {
            console.error("Error fetching PDF", err);
            alert("Could not load PDF");
        }
    };

    const handleViewDetails = (invoice) => {
        setSelectedInvoice(invoice);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this invoice? Stock will be restored.")) return;
        try {
            await invoiceService.delete(id);
            // Reload
            loadInvoices();
        } catch (err) {
            console.error("Failed to delete invoice", err);
            alert("Failed to delete invoice");
        }
    };

    const handleResetAll = async () => {
        try {
            await invoiceService.deleteAll();
            loadInvoices();
            alert("All invoices have been reset.");
        } catch (err) {
            console.error("Failed to reset invoices", err);
            alert("Failed to reset invoices");
        }
    };

    return (
        <div className="space-y-6 relative animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Invoices</h1>

                <div className="flex gap-3">
                    <a
                        href="/invoices/create"
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                    >
                        <Plus className="w-5 h-5" /> Create Invoice
                    </a>
                    <button
                        onClick={() => {
                            if (window.confirm("WARNING: This will delete ALL invoices and reset data. Are you sure?")) {
                                handleResetAll();
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-100"
                    >
                        <RefreshCw className="w-4 h-4" /> Reset All
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Search Customer</label>
                    <input
                        type="text"
                        placeholder="Customer Name..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Invoice ID</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Customer</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Items</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Total Amount</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Profit</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredInvoices.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-8 text-slate-500 dark:text-slate-400">No invoices found</td></tr>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">#{inv.id}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{inv.customer_name}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-center">{inv.items ? inv.items.length : 0}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-emerald-400">${inv.total_amount}</td>
                                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-500">${inv.total_profit}</td>
                                    <td className="px-6 py-4 flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleViewDetails(inv)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                                        >
                                            <Eye className="w-4 h-4" /> Details
                                        </button>
                                        <button
                                            onClick={() => handleViewPdf(inv.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                                        >
                                            <Download className="w-4 h-4" /> PDF
                                        </button>
                                        <button
                                            onClick={() => window.open(`/invoices/${inv.id}/print`, '_blank')}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
                                        >
                                            <Printer className="w-4 h-4" /> Print
                                        </button>
                                        <button
                                            onClick={() => handleDelete(inv.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
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
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative border border-slate-700">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">Invoice #{selectedInvoice.id} Details</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Customer: {selectedInvoice.customer_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-white dark:bg-slate-800">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3">Certificate</th>
                                        <th className="px-4 py-3">Shape</th>
                                        <th className="px-4 py-3">Color</th>
                                        <th className="px-4 py-3 text-right">Carat</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                                    {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                                                {item.diamond ? item.diamond.certificate : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.diamond ? item.diamond.shape : '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.diamond ? item.diamond.color : '-'}</td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{item.diamond ? item.diamond.carat : '-'}</td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">${item.sale_price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-right">
                            <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase mr-4">Total Amount</span>
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">${selectedInvoice.total_amount}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Viewer Modal */}
            {selectedPdf && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative border border-slate-700">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200">Invoice Preview</h3>
                            <button
                                onClick={() => setSelectedPdf(null)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-1">
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
