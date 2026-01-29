import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import invoiceService from '../services/invoice.service';
import { Loader2, Printer } from 'lucide-react';

const numberToWords = (num) => {
    if (!num) return '';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
        if ((n = n.toString()).length > 9) return 'overflow';
        let n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n_array) return;
        let str = '';
        str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
        str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
        str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
        str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
        str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
        return str;
    };

    const [bills, paisas] = num.toString().split('.');
    let result = inWords(Number(bills)) + 'Rupees ';
    if (paisas) {
        // Handle 2 decimal places properly
        const p = paisas.padEnd(2, '0').substring(0, 2);
        if (Number(p) > 0) result += 'and ' + inWords(Number(p)) + 'Paise ';
    }
    return result.trim() + ' Only';
};

const InvoicePrint = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await invoiceService.getAll();
                const ids = id.toString().split(',').map(Number); // Handle "1,2,3"

                const foundInvoices = res.data.filter(inv => ids.includes(inv.id));

                if (foundInvoices.length === 0) {
                    setInvoice(null);
                    return;
                }

                if (foundInvoices.length === 1) {
                    setInvoice(foundInvoices[0]);
                } else {
                    // Merge Logic
                    const primary = foundInvoices[0]; // Use first for client details

                    const mergedInvoice = {
                        ...primary,
                        id: ids.join(', '), // Display all IDs
                        // Sum Financials
                        subtotal_amount: foundInvoices.reduce((sum, inv) => sum + parseFloat(inv.subtotal_amount || inv.total_amount || 0), 0),
                        cgst_amount: foundInvoices.reduce((sum, inv) => sum + parseFloat(inv.cgst_amount || 0), 0),
                        sgst_amount: foundInvoices.reduce((sum, inv) => sum + parseFloat(inv.sgst_amount || 0), 0),
                        grand_total: foundInvoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total || inv.total_amount || 0), 0),
                        paid_amount: foundInvoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0),
                        balance_due: foundInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due || 0), 0),
                        // Merge Items
                        items: foundInvoices.flatMap(inv => inv.items || [])
                    };
                    setInvoice(mergedInvoice);
                }
            } catch (err) {
                console.error("Error fetching invoice", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>;
    if (!invoice) return <div className="p-8 text-center text-red-500 font-bold">Invoice not found</div>;

    // Calculations for Summary
    const items = invoice.items || [];

    // Calculate total base and other metrics for display if needed
    // Note: invoice.total_amount is the final amount stored in DB.

    // Helper for Currency Symbol
    const getCurrencySymbol = (currency) => {
        if (!currency) return '₹'; // Default
        if (currency === 'USD') return '$';
        if (currency === 'EUR') return '€';
        if (currency === 'GBP') return '£';
        if (currency === 'INR') return '₹';
        return currency + ' ';
    };

    const currencySymbol = getCurrencySymbol(invoice.currency);

    return (
        <div className="bg-slate-100 min-h-screen p-8 print:p-0 print:bg-white flex justify-center">
            {/* Print Controls (Hidden when printing) */}
            <div className="fixed top-4 right-4 print:hidden z-50">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 font-bold transition-all"
                >
                    <Printer className="w-5 h-5" /> Print Invoice
                </button>
            </div>

            {/* A4 Container */}
            <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-12 relative flex flex-col text-slate-800 font-sans print:w-full print:h-full">

                {/* Header */}
                <header className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                    {/* Company Info (Left for Logo/Name based on prompt "Company Logo (top-left)") */}
                    <div className="w-1/2">
                        {/* Company Logo */}
                        <div className="mb-6">
                            <img src="/logo.png" alt="Company Logo" className="h-24 w-auto object-contain" />
                        </div>
                        <div className="text-xs text-slate-500 leading-relaxed">
                            <p>Opera House, Mumbai, India</p>
                            <p>contact@balkrishnaexports.com</p>
                            <p>+91 98765 43210</p>
                            {invoice.gst_number && (
                                <p className="mt-2 text-slate-700 font-semibold">
                                    <span className="text-slate-400">GST No:</span> {invoice.gst_number}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Invoice Meta (Right) */}
                    <div className="text-right w-1/2">
                        <h2 className="text-4xl font-light text-slate-300 mb-4 tracking-widest">INVOICE</h2>
                        <table className="ml-auto text-sm">
                            <tbody>
                                <tr>
                                    <td className="text-slate-500 py-1 pr-4 font-medium">Invoice No:</td>
                                    <td className="font-bold text-slate-800">#{String(invoice.id).padStart(4, '0')}</td>
                                </tr>
                                <tr>
                                    <td className="text-slate-500 py-1 pr-4 font-medium">Date:</td>
                                    <td className="font-bold text-slate-800">
                                        {new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </header>

                {/* Bill To */}
                <div className="mb-8 bg-slate-50 p-6 rounded-lg border border-slate-100 print:bg-transparent print:border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To</p>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Column - Name & Address */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{invoice.customer_name}</h3>
                            {invoice.client && (
                                <div className="text-xs text-slate-600 space-y-1">
                                    {invoice.client.company_name && invoice.client.company_name !== invoice.customer_name && (
                                        <p className="font-medium">{invoice.client.company_name}</p>
                                    )}
                                    {invoice.client.address && (
                                        <p>{invoice.client.address}</p>
                                    )}
                                    {(invoice.client.city || invoice.client.country) && (
                                        <p>{[invoice.client.city, invoice.client.country].filter(Boolean).join(', ')}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column - Contact Info */}
                        {invoice.client && (invoice.client.contact_number || invoice.client.email) && (
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contact</p>
                                <div className="text-xs text-slate-600 space-y-1">
                                    {invoice.client.contact_number && (
                                        <p><span className="font-medium">Tel:</span> {invoice.client.contact_number}</p>
                                    )}
                                    {invoice.client.email && (
                                        <p><span className="font-medium">Email:</span> {invoice.client.email}</p>
                                    )}
                                    {invoice.client.gst_number && (
                                        <p className="mt-2 pt-2 border-t border-slate-200">
                                            <span className="font-semibold text-slate-700">GST No:</span> {invoice.client.gst_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex-1">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-100 print:bg-slate-100 border-y border-slate-200">
                                <th className="py-3 px-2 font-bold text-slate-600">No.</th>
                                <th className="py-3 px-2 font-bold text-slate-600">Certificate</th>
                                <th className="py-3 px-2 font-bold text-slate-600">Shape</th>
                                <th className="py-3 px-2 font-bold text-slate-600 text-right">Carat</th>
                                <th className="py-3 px-2 font-bold text-slate-600">Color</th>
                                <th className="py-3 px-2 font-bold text-slate-600">Clarity</th>
                                <th className="py-3 px-2 font-bold text-slate-600">Cut</th>
                                <th className="py-3 px-2 font-bold text-slate-600">Polish</th>
                                <th className="py-3 px-2 font-bold text-slate-600">Sym</th>
                                <th className="py-3 px-2 font-bold text-slate-600">Depth %</th>
                                <th className="py-3 px-2 font-bold text-slate-600">Table %</th>
                                <th className="py-3 px-2 font-bold text-slate-600 text-right">Rate / Carat</th>
                                <th className="py-3 px-2 font-bold text-slate-600 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => {
                                const d = item.diamond || {};

                                // Use Billed Values (Client Currency) if available, else derive
                                const carat = parseFloat(item.carat_weight || d.carat) || 0;
                                const exRate = parseFloat(invoice.exchange_rate) || 1;

                                // Client Currency Values
                                const clientAmount = parseFloat(item.billed_amount || (item.sale_price * exRate) || 0);
                                const clientRate = parseFloat(item.billed_rate || (item.rate_per_carat * exRate) || 0);

                                // USD Values (for reference)
                                const usdAmount = parseFloat(item.sale_price || 0);
                                const usdRate = parseFloat(item.rate_per_carat || (carat > 0 ? usdAmount / carat : 0));

                                return (
                                    <tr key={idx} className="border-b border-slate-50 print:border-slate-200">
                                        <td className="py-3 px-2 text-slate-500">{idx + 1}</td>
                                        <td className="py-3 px-2 font-medium bg-slate-50 print:bg-white">{d.certificate}</td>
                                        <td className="py-3 px-2 text-slate-600">{d.shape}</td>
                                        <td className="py-3 px-2 text-right text-slate-600 font-medium">{carat.toFixed(2)}</td>
                                        <td className="py-3 px-2 text-slate-600">{d.color}</td>
                                        <td className="py-3 px-2 text-slate-600">{d.clarity}</td>
                                        <td className="py-3 px-2 text-slate-600 text-xs">{d.cut || '-'}</td>
                                        <td className="py-3 px-2 text-slate-600 text-xs">{d.polish || '-'}</td>
                                        <td className="py-3 px-2 text-slate-600 text-xs">{d.symmetry || '-'}</td>
                                        <td className="py-3 px-2 text-slate-600 text-xs">{d.total_depth_percent || '-'}</td>
                                        <td className="py-3 px-2 text-slate-600 text-xs">{d.table_percent || '-'}</td>
                                        <td className="py-3 px-2 text-right text-slate-700 font-semibold">
                                            <div>{currencySymbol}{clientRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            {invoice.currency !== 'USD' && (
                                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">(${usdRate.toLocaleString(undefined, { minimumFractionDigits: 2 })})</div>
                                            )}
                                        </td>
                                        <td className="py-3 px-2 text-right font-bold text-slate-800">
                                            <div>{currencySymbol}{clientAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            {invoice.currency !== 'USD' && (
                                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">(${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>


                {/* Footer Totals */}
                <div className="flex flex-col items-end mt-8 border-t-2 border-slate-100 pt-6">
                    <div className="w-1/3 min-w-[300px]">
                        <div className="flex justify-between py-2 text-sm">
                            <span className="font-medium text-slate-500">Subtotal (Diamond Amount)</span>
                            <div className="text-right">
                                <div className="font-bold text-slate-800">
                                    {currencySymbol}{parseFloat(invoice.subtotal_amount || ((invoice.subtotal_usd || invoice.total_amount || 0) * (invoice.exchange_rate || 1))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                {invoice.currency !== 'USD' && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                        (${parseFloat(invoice.subtotal_usd || invoice.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                                    </div>
                                )}
                            </div>
                        </div>

                        {((parseFloat(invoice.cgst_amount) || 0) + (parseFloat(invoice.sgst_amount) || 0)) > 0 && (
                            <>
                                <div className="flex justify-between py-1.5 text-sm bg-blue-50/50 px-2 rounded mt-1">
                                    <span className="font-medium text-blue-600">CGST @ {invoice.cgst_rate || 0.75}%</span>
                                    <span className="font-semibold text-blue-600">
                                        {currencySymbol}{parseFloat(invoice.cgst_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5 text-sm bg-blue-50/50 px-2 rounded mt-1">
                                    <span className="font-medium text-blue-600">SGST @ {invoice.sgst_rate || 0.75}%</span>
                                    <span className="font-semibold text-blue-600">
                                        {currencySymbol}{parseFloat(invoice.sgst_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between py-3 text-lg border-t-2 border-slate-300 mt-2 items-center">
                            <span className="font-bold text-slate-800">Grand Total</span>
                            <div className="text-right">
                                <div className="font-black text-blue-900 text-xl">
                                    {currencySymbol}{parseFloat(
                                        invoice.currency === 'USD'
                                            ? invoice.grand_total
                                            : (invoice.subtotal_amount ? invoice.grand_total : (invoice.grand_total || invoice.total_amount || 0) * (invoice.exchange_rate || 1))
                                    ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                {invoice.currency !== 'USD' && (
                                    <div className="text-xs text-slate-500 font-bold opacity-60">
                                        (${parseFloat(invoice.grand_total_usd || ((invoice.grand_total || 0) / (invoice.exchange_rate || 1))).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Details Removed by User Request */}
                    </div>
                </div>

                {/* Amount in Words */}
                <div className="mt-6 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Amount in Words</p>
                    <p className="text-sm font-medium text-slate-700 italic">
                        {numberToWords(parseFloat(
                            invoice.currency === 'USD'
                                ? invoice.grand_total
                                : (invoice.subtotal_amount ? invoice.grand_total : (invoice.grand_total || invoice.total_amount || 0) * (invoice.exchange_rate || 1))
                        ).toFixed(2))}
                    </p>
                </div>

                {/* Signature & Notes */}
                <div className="mt-auto pt-16 flex justify-between items-end">
                    <div className="text-xs text-slate-500 w-1/2">
                        <p className="font-bold text-slate-700 mb-1">Terms & Conditions:</p>
                        <ul className="list-disc pl-3 text-[10px] leading-relaxed">
                            <li>All diamonds are certified natural.</li>
                            <li>Goods once sold will not be taken back.</li>
                            <li>Subject to Mumbai Jurisdiction.</li>
                        </ul>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="h-16 border-b border-slate-300 mb-2"></div>
                        <p className="text-xs font-bold text-slate-800 uppercase">Authorized Signatory</p>
                        <p className="text-[10px] text-slate-400">For Balkrishna Exports</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePrint;
