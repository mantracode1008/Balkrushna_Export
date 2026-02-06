import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Save, Search, AlertCircle, Eye } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import api from '../services/api'; // Use configured API instead of raw axios
import authService from '../services/auth.service';

import StaffManagement from './StaffManagement';

const ReadingManagement = () => {
    const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'invoice_layout'

    // --- Invoice Layout & Company State ---
    const [layoutLoading, setLayoutLoading] = useState(false);
    const [layoutSuccess, setLayoutSuccess] = useState('');

    // Company Profile Default
    const [companyDetails, setCompanyDetails] = useState({
        name: 'BALKRISHNA EXPORTS',
        tagline: 'Premium Diamond Exporters',
        address: 'Opera House, Mumbai, India',
        contact: 'contact@balkrishnaexports.com',
        logoUrl: ''
    });

    // Updated Columns to match new simplified invoice structure
    const [columns, setColumns] = useState([
        { key: 'no', label: 'No', checked: true },
        { key: 'desc', label: 'Description', checked: true },
        { key: 'cert', label: 'Certificate', checked: true },
        { key: 'shape', label: 'Shape', checked: true },
        { key: 'color', label: 'Color', checked: true },
        { key: 'clarity', label: 'Clarity', checked: true },
        { key: 'cut', label: 'Cut', checked: true },
        { key: 'pol', label: 'Polish', checked: true },
        { key: 'sym', label: 'Symmetry', checked: true },
        { key: 'dp', label: 'Depth %', checked: true },
        { key: 'tab', label: 'Table %', checked: true },
        { key: 'price_cts', label: 'Price/Ct', checked: true },
        { key: 'sale_price', label: 'Sale Price', checked: true },
        { key: 'amount', label: 'Amount', checked: true }
    ]);

    useEffect(() => {
        if (activeTab === 'invoice_layout') {
            fetchLayoutSettings();
            fetchCompanySettings();
        }
    }, [activeTab]);

    // --- Handlers ---
    const fetchCompanySettings = async () => {
        try {
            // API interceptor handles token
            const res = await api.get('/settings/company_profile');
            if (res.data && Object.keys(res.data).length > 0) {
                setCompanyDetails(prev => ({ ...prev, ...res.data }));
            }
        } catch (err) { console.error("Error fetching company settings:", err); }
    };

    const fetchLayoutSettings = async () => {
        setLayoutLoading(true);
        try {
            const res = await api.get('/settings/invoice_layout');
            if (res.data && Array.isArray(res.data)) {
                // Format: [{ key, label, visible }, ...]
                const savedMap = {};
                res.data.forEach(item => savedMap[item.key] = item);

                setColumns(cols => cols.map(c => {
                    const saved = savedMap[c.key];
                    if (saved) {
                        return { ...c, label: saved.label, checked: saved.visible !== false };
                    }
                    return c;
                }));
            } else if (res.data && res.data.columns) {
                // Backward compatibility
                setColumns(cols => cols.map(c => ({
                    ...c,
                    checked: res.data.columns.includes(c.key)
                })));
            }
        } catch (err) { console.error("Error fetching layout:", err); }
        finally { setLayoutLoading(false); }
    };

    const saveSettings = async () => {
        setLayoutLoading(true);
        try {
            // 1. Save Company Profile
            await api.post('/settings/company_profile', companyDetails);

            // 2. Save Layout (Full Object)
            const layoutData = columns.map(c => ({
                key: c.key,
                label: c.label,
                visible: c.checked
            }));

            await api.post('/settings/invoice_layout', layoutData);

            setLayoutSuccess('All settings saved successfully!');
            setTimeout(() => setLayoutSuccess(''), 3000);
        } catch (err) {
            console.error("Save Error:", err);
            if (err.response?.status === 403) {
                alert("Access Denied: Only Admins can save settings.");
            } else {
                alert("Failed to save settings");
            }
        }
        finally { setLayoutLoading(false); }
    };

    const toggleColumn = (key) => {
        setColumns(cols => cols.map(c => c.key === key ? { ...c, checked: !c.checked } : c));
    };

    const updateLabel = (key, newLabel) => {
        setColumns(cols => cols.map(c => c.key === key ? { ...c, label: newLabel } : c));
    };

    return (
        <MainLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Management</h1>
                        <p className="text-slate-500 font-medium mt-2">Configure system users and operational settings.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-6">
                    <button onClick={() => setActiveTab('staff')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'staff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Users size={16} /> Staff Management
                    </button>
                    <button onClick={() => setActiveTab('invoice_layout')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'invoice_layout' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <FileText size={16} /> Reading Management
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'staff' ? (
                    <StaffManagement />
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-6xl animate-in fade-in slide-in-from-bottom-2">

                        {/* Company Settings Section */}
                        <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Invoice Headers & Company Info</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                                    <input
                                        value={companyDetails.name}
                                        onChange={e => setCompanyDetails({ ...companyDetails, name: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tagline</label>
                                    <input
                                        value={companyDetails.tagline}
                                        onChange={e => setCompanyDetails({ ...companyDetails, tagline: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address (Line 1, City, Country)</label>
                                    <input
                                        value={companyDetails.address}
                                        onChange={e => setCompanyDetails({ ...companyDetails, address: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Info (Email / Phone)</label>
                                    <input
                                        value={companyDetails.contact}
                                        onChange={e => setCompanyDetails({ ...companyDetails, contact: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Invoice PDF Columns</h2>
                                <p className="text-sm text-slate-500">Configure visible columns and rename them as needed.</p>
                            </div>
                            <div className="hidden md:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                <Eye size={14} /> Live Preview Active
                            </div>
                        </div>

                        {layoutSuccess && (
                            <div className="mb-6 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                                <CheckCircle size={16} /> {layoutSuccess}
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
                            {columns.map(col => (
                                <div key={col.key} className={`flex flex-col gap-1 p-2 border rounded-lg transition-colors ${col.checked ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${col.checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                            {col.checked && <CheckCircle size={10} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={col.checked}
                                            onChange={() => toggleColumn(col.key)}
                                        />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${col.checked ? 'text-indigo-700' : 'text-slate-500'}`}>{col.key}</span>
                                    </label>
                                    <input
                                        value={col.label}
                                        onChange={(e) => updateLabel(col.key, e.target.value)}
                                        className={`w-full text-xs font-semibold bg-transparent border-b border-dashed focus:border-indigo-500 outline-none px-0.5 py-0.5 ${col.checked ? 'border-indigo-300' : 'border-slate-200 text-slate-400'}`}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Live Preview Section */}
                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Live Preview</h3>
                                    <p className="text-xs text-slate-400">Real-time preview of the PDF table structure</p>
                                </div>
                                <button
                                    onClick={saveSettings}
                                    disabled={layoutLoading}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-50 text-sm"
                                >
                                    <Save size={16} /> {layoutLoading ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm ring-4 ring-slate-50">
                                {/* Header Preview (New) */}
                                <div className="p-6 border-b border-slate-100 flex justify-between">
                                    <div className="space-y-1">
                                        <h1 className="text-xl font-bold text-[#1e3a8a]">{companyDetails.name || 'COMPANY NAME'}</h1>
                                        <p className="text-xs text-slate-500">{companyDetails.tagline}</p>
                                        <p className="text-xs text-slate-500">{companyDetails.address}</p>
                                        <p className="text-xs text-slate-500">{companyDetails.contact}</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-2xl font-bold text-slate-800">INVOICE</h2>
                                        <p className="text-xs text-slate-500"># INV-001</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#1e3a8a] text-white text-[10px] uppercase tracking-wider">
                                                {columns.filter(c => c.checked).map(col => (
                                                    <th key={col.key} className="p-3 font-bold whitespace-nowrap border-r border-indigo-800/30 last:border-0">{col.label}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] text-slate-700">
                                            {[1, 2, 3].map(rowId => (
                                                <tr key={rowId} className={rowId % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                                                    {columns.filter(c => c.checked).map(col => {
                                                        // Dummy Data Logic to mimic real content
                                                        let val = '-';
                                                        const isRow1 = rowId === 1;

                                                        if (col.key === 'no') val = rowId;
                                                        if (col.key === 'desc') val = isRow1 ? '1.01ct' : (rowId === 2 ? '0.90ct' : '1.50ct');
                                                        if (col.key === 'cert') val = isRow1 ? 'GIA-12345' : (rowId === 2 ? 'IGI-67890' : 'HRD-11223');
                                                        if (col.key === 'shape') val = isRow1 ? 'RND' : (rowId === 2 ? 'OVAL' : 'PEAR');
                                                        if (col.key === 'color') val = isRow1 ? 'D' : (rowId === 2 ? 'E' : 'F');
                                                        if (col.key === 'clarity') val = isRow1 ? 'VVS1' : (rowId === 2 ? 'VS1' : 'SI1');
                                                        if (col.key === 'cut') val = 'EX';
                                                        if (col.key === 'pol') val = 'EX';
                                                        if (col.key === 'sym') val = 'EX';
                                                        if (col.key === 'dp') val = isRow1 ? '61.5' : '62.0';
                                                        if (col.key === 'tab') val = isRow1 ? '57.0' : '58.0';

                                                        // New Dummy Data Logic
                                                        if (col.key === 'price_cts') val = isRow1 ? '4,455.00' : (rowId === 2 ? '4,666.00' : '5,000.00');
                                                        if (col.key === 'sale_price') val = isRow1 ? '4,500.00' : (rowId === 2 ? '4,200.00' : '7,500.00');
                                                        if (col.key === 'amount') val = isRow1 ? '4,500.00' : (rowId === 2 ? '4,200.00' : '7,500.00');

                                                        const alignRight = ['price_cts', 'sale_price', 'amount'].includes(col.key);

                                                        return (
                                                            <td key={col.key} className={`p-2 border-r border-slate-100 last:border-0 whitespace-nowrap ${alignRight ? 'text-right' : ''}`}>
                                                                {col.key === 'cert' || col.key === 'net' ? <strong>{val}</strong> : val}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-slate-50 p-3 text-center text-[10px] text-slate-400 border-t border-slate-100 uppercase tracking-widest font-semibold">
                                    Preview Mode • Actual layout depends on paper size
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default ReadingManagement;
