import React, { useState } from 'react';
import diamondService from '../services/diamond.service';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const CSVUpload = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('upload'); // 'upload' | 'preview'
    const [previewData, setPreviewData] = useState(null); // { validRows, invalidRows, summary }

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handlePreview = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const res = await diamondService.uploadCsv(file);
            setPreviewData(res.data);
            setStep('preview');
        } catch (err) {
            console.error(err);
            alert("Failed to analyze file: " + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const handleImport = async () => {
        if (!previewData || !previewData.validRows || previewData.validRows.length === 0) return;
        setLoading(true);
        try {
            await diamondService.bulkCreate(previewData.validRows);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Failed to import diamonds: " + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-2xl w-full shadow-2xl p-6 transition-all duration-300 ${step === 'preview' ? 'max-w-4xl max-h-[90vh] flex flex-col' : 'max-w-md'}`}>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {step === 'upload' ? 'Import Excel / CSV' : 'Import Preview'}
                        </h2>
                        {step === 'preview' && (
                            <p className="text-sm text-slate-500 mt-1">Review your data before final import</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {step === 'upload' ? (
                    <>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-400 transition-colors cursor-pointer relative bg-slate-50 hover:bg-white">
                            <input
                                type="file"
                                accept=".csv, .xlsx"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <>
                                    <FileText className="w-12 h-12 text-blue-500 mb-3" />
                                    <p className="font-medium text-slate-700">{file.name}</p>
                                    <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                                </>
                            ) : (
                                <div className="text-center">
                                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                                    <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                                        <span className="font-semibold text-blue-600">Click to upload</span>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Excel (.xlsx) or CSV</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handlePreview}
                                disabled={!file || loading}
                                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${!file || loading
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                                    }`}
                            >
                                {loading ? 'Analyzing...' : 'Next: Preview Data'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Valid Rows</p>
                                <p className="text-2xl font-bold text-emerald-700">{previewData?.summary?.validCount || 0}</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Skipped / Invalid</p>
                                <p className="text-2xl font-bold text-red-700">{previewData?.summary?.invalidCount || 0}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Total Found</p>
                                <p className="text-2xl font-bold text-blue-700">{previewData?.summary?.totalFound || 0}</p>
                            </div>
                        </div>

                        {/* Invalid Rows Alert (if any) */}
                        {previewData?.invalidRows?.length > 0 && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 custom-scrollbar overflow-y-auto max-h-32 text-sm">
                                <div className="flex items-center gap-2 font-bold text-red-700 mb-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Issues Found ({previewData.invalidRows.length}):
                                </div>
                                <ul className="list-disc pl-5 space-y-1 text-red-600">
                                    {previewData.invalidRows.slice(0, 5).map((row, idx) => (
                                        <li key={idx}>Row {row.rowIndex}: {row.errors.join(", ")}</li>
                                    ))}
                                    {previewData.invalidRows.length > 5 && (
                                        <li>...and {previewData.invalidRows.length - 5} more rows.</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Preview Table */}
                        <div className="flex-1 border rounded-xl overflow-hidden shadow-sm relative text-sm">
                            <div className="absolute inset-0 overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-2 font-semibold text-slate-600">Row</th>
                                            <th className="px-4 py-2 font-semibold text-slate-600">Certificate</th>
                                            <th className="px-4 py-2 font-semibold text-slate-600">Shape</th>
                                            <th className="px-4 py-2 font-semibold text-slate-600">Carat</th>
                                            <th className="px-4 py-2 font-semibold text-slate-600">Color</th>
                                            <th className="px-4 py-2 font-semibold text-slate-600">Clarity</th>
                                            <th className="px-4 py-2 font-semibold text-slate-600">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {previewData?.validRows?.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center py-8 text-slate-400">No valid rows found to import.</td></tr>
                                        ) : (
                                            previewData.validRows.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                                                    <td className="px-4 py-2 font-medium text-slate-800">{row.certificate}</td>
                                                    <td className="px-4 py-2 text-slate-600">{row.shape}</td>
                                                    <td className="px-4 py-2 text-slate-600">{row.carat}</td>
                                                    <td className="px-4 py-2 text-slate-600">{row.color}</td>
                                                    <td className="px-4 py-2 text-slate-600">{row.clarity}</td>
                                                    <td className="px-4 py-2 font-mono text-slate-600">${row.price}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setStep('upload')}
                                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={loading || !previewData?.validRows?.length}
                                className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${!previewData?.validRows?.length ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                                    }`}
                            >
                                {loading ? 'Importing...' : <><CheckCircle className="w-5 h-5" /> Import {previewData?.validRows?.length} Diamonds</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CSVUpload;
