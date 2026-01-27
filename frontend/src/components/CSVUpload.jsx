import React, { useState } from 'react';
import diamondService from '../services/diamond.service';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';

const CSVUpload = ({ onClose, onSuccess }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('upload'); // 'upload' | 'preview'
    const [previewResults, setPreviewResults] = useState([]); // Array of { fileName, validRows, invalidRows, summary }
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handlePreview = async () => {
        if (files.length === 0) return;
        setLoading(true);
        setPreviewResults([]);
        setProgress(0);

        const results = [];
        let processedCount = 0;

        // Process files sequentially to avoid overwhelming server if many
        for (const file of files) {
            try {
                const res = await diamondService.uploadCsv(file);
                results.push({
                    fileName: file.name,
                    validRows: res.data.validRows || [],
                    invalidRows: res.data.invalidRows || [],
                    summary: res.data.summary,
                    status: 'success'
                });
            } catch (err) {
                console.error(`Error processing ${file.name}:`, err);
                results.push({
                    fileName: file.name,
                    validRows: [],
                    invalidRows: [],
                    summary: { validCount: 0, invalidCount: 0, totalFound: 0 },
                    status: 'error',
                    error: err.response?.data?.message || err.message
                });
            }
            processedCount++;
            setProgress(Math.round((processedCount / files.length) * 100));
        }

        setPreviewResults(results);
        setStep('preview');
        setLoading(false);
    };

    const handleImport = async () => {
        const allValidRows = previewResults.flatMap(r => r.validRows);
        if (allValidRows.length === 0) return;

        setLoading(true);
        try {
            await diamondService.bulkCreate(allValidRows);
            onSuccess();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message;
            const details = err.response?.data?.error || err.response?.data?.details || "";
            alert(`Failed to import diamonds:\n${msg}\n${details}`);
        }
        setLoading(false);
    };

    // Calculate Global Stats
    const totalValid = previewResults.reduce((sum, r) => sum + (r.summary?.validCount || 0), 0);
    const totalInvalid = previewResults.reduce((sum, r) => sum + (r.summary?.invalidCount || 0), 0);
    const totalFiles = previewResults.length;
    const failedFiles = previewResults.filter(r => r.status === 'error').length;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className={`bg-white rounded-3xl w-full shadow-2xl p-6 transition-all duration-500 ${step === 'preview' ? 'max-w-5xl h-[85vh] flex flex-col' : 'max-w-lg'}`}>

                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {step === 'upload' ? 'Import Inventory' : 'Review & Import'}
                        </h2>
                        <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-2">
                            {step === 'upload' ? 'Upload Excel or CSV files from RapNet' : 'Check data accuracy before finalizing'}
                            {step === 'upload' && (
                                <a href="/import_template.csv" download className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 ml-2">
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Download Template
                                </a>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === 'upload' ? (
                    <div className="flex flex-col gap-6">
                        {/* Drop Zone */}
                        <div className="relative group">
                            <input
                                type="file"
                                multiple
                                accept=".csv, .xlsx"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                            />
                            <div className={`border-3 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 ${files.length > 0 ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}>
                                {files.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="bg-indigo-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                                            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg">{files.length} Files Selected</p>
                                            <p className="text-sm text-slate-500 font-medium">Ready to analyze</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-2 mt-2 max-h-32 overflow-y-auto px-4 scrollbar-none">
                                            {files.map((f, i) => (
                                                <span key={i} className="text-xs bg-white border border-indigo-100 text-indigo-600 px-2 py-1 rounded-md font-medium shadow-sm truncate max-w-[150px]">
                                                    {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-slate-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-slate-100">
                                            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-700 text-lg">Click to upload</p>
                                            <p className="text-sm text-slate-400 font-medium">or drag and drop multiple files</p>
                                        </div>
                                        <div className="mt-4 flex gap-3 text-xs font-bold text-slate-300 uppercase tracking-widest">
                                            <span>.XLSX</span>
                                            <span>.CSV</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handlePreview}
                            disabled={files.length === 0 || loading}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${files.length === 0 || loading
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-200 hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processing {progress}%...</span>
                                </>
                            ) : (
                                <>
                                    <span>Analyze Files</span>
                                    {files.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded text-sm text-white/90">{files.length}</span>}
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden gap-6">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Files</span>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-slate-700">{totalFiles}</span>
                                    {failedFiles > 0 && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full mb-1">{failedFiles} Failed</span>}
                                </div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between">
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ready to Import</span>
                                <span className="text-3xl font-black text-emerald-600">{totalValid.toLocaleString()}</span>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col justify-between">
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Skipped / Invalid</span>
                                <span className="text-3xl font-black text-amber-600">{totalInvalid.toLocaleString()}</span>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Found</span>
                                <span className="text-3xl font-black text-blue-600">{(totalValid + totalInvalid).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* File Breakdown List */}
                        <div className="flex-1 overflow-hidden border border-slate-200 rounded-2xl flex flex-col bg-slate-50/50">
                            <div className="bg-white px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700 text-sm">File Breakdown</h3>
                                <div className="text-xs text-slate-400 font-medium">{previewResults.length} files processed</div>
                            </div>
                            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {previewResults.map((res, idx) => (
                                    <div key={idx} className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${res.status === 'error' ? 'border-red-200 bg-red-50/20' : res.invalidRows.length > 0 ? 'border-amber-200' : 'border-slate-100'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${res.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{res.fileName}</p>
                                                    {res.status === 'error' ? (
                                                        <span className="text-red-500 text-xs font-bold">{res.error}</span>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 font-medium">Valid: <b>{res.summary.validCount}</b> • Skipped: <b>{res.summary.invalidCount}</b></p>
                                                    )}
                                                </div>
                                            </div>
                                            {res.status !== 'error' && (
                                                <div className="flex gap-2">
                                                    {res.summary.validCount > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Ready</span>}
                                                    {res.summary.invalidCount > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Issues</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Error Details */}
                                        {res.invalidRows.length > 0 && (
                                            <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs border border-slate-100">
                                                <p className="font-bold text-slate-500 mb-2 uppercase tracking-wide">Error Log:</p>
                                                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar text-red-600 font-medium">
                                                    {res.invalidRows.slice(0, 5).map((r, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <span className="text-slate-400">Row {r.rowIndex}:</span>
                                                            <span>{r.errors.join(", ")}</span>
                                                        </div>
                                                    ))}
                                                    {res.invalidRows.length > 5 && <div className="text-slate-400 text-[10px] italic">...and {res.invalidRows.length - 5} more issues</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 justify-end pt-2">
                            <button
                                onClick={() => setStep('upload')}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Back to Upload
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={loading || totalValid === 0}
                                className={`px-8 py-3 rounded-xl font-bold text-white shadow-xl transition-all flex items-center gap-3 ${loading || totalValid === 0
                                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Importing...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Confirm Import ({totalValid})</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CSVUpload;
