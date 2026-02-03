import React, { useState, useMemo, useEffect } from 'react';
import './ExcelGrid.css';
import { Settings, ChevronDown, ChevronRight, Calculator, Layers } from 'lucide-react';

/**
 * Enhanced ExcelGrid Component
 */
const ExcelGrid = ({
    data = [],
    columns = [],
    selectedIds = [],
    onSelectionChange,
    onRowClick = null,
    loading = false,
    emptyMessage = "No data available",
    groupBy = null, // key to group by
    gridId = null, // unique ID for persistence
    onColumnVisibilityChange = null // callback for visibility changes
}) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState(() => {
        // Try to load from localStorage if gridId is provided
        if (gridId) {
            try {
                const saved = localStorage.getItem(`grid_cols_${gridId}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Merge saved preferences with current columns to handle schema changes
                    // If a column is in 'columns' but not in 'parsed', default to !hidden
                    // If a column is in 'parsed', use that value
                    const initial = columns.reduce((acc, col) => ({ ...acc, [col.key]: !col.hidden }), {});
                    return { ...initial, ...parsed };
                }
            } catch (error) {
                console.error("Failed to load grid columns preference:", error);
            }
        }
        // Default initialization
        return columns.reduce((acc, col) => ({ ...acc, [col.key]: !col.hidden }), {});
    });

    const [showColMenu, setShowColMenu] = useState(false);

    // Group Expansion State
    const [expandedGroups, setExpandedGroups] = useState({});

    // Sync when columns prop changes (only for new columns)
    useEffect(() => {
        setVisibleColumns(prev => {
            const next = { ...prev };
            let changed = false;
            columns.forEach(col => {
                if (next[col.key] === undefined) {
                    next[col.key] = !col.hidden;
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [columns]);

    // Save to localStorage and notify parent when visibleColumns changes
    useEffect(() => {
        if (gridId) {
            localStorage.setItem(`grid_cols_${gridId}`, JSON.stringify(visibleColumns));
        }
        if (onColumnVisibilityChange) {
            onColumnVisibilityChange(visibleColumns);
        }
    }, [visibleColumns, gridId, onColumnVisibilityChange]);

    const handleSort = (columnKey) => {
        setSortConfig(prev => ({
            key: columnKey,
            direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortValue = (row, col) => {
        if (col.sortValue) return col.sortValue(row);
        return row[col.key];
    };

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return data;
        const col = columns.find(c => c.key === sortConfig.key);

        return [...data].sort((a, b) => {
            const aVal = getSortValue(a, col);
            const bVal = getSortValue(b, col);

            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return sortConfig.direction === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
    }, [data, sortConfig, columns]);

    const formatCellValue = (value, column, row) => {
        if (value == null || value === '') return '-';
        if (column.format) return column.format(value, row); // Custom formatter
        switch (column.type) {
            case 'currency': return `$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            case 'number': return parseFloat(value).toLocaleString();
            case 'percentage': return `${value}%`;
            case 'date': return new Date(value).toLocaleDateString();
            default: return value;
        }
    };

    // Grouping Logic
    const groupedData = useMemo(() => {
        if (!groupBy) return null;

        // Use sortedData so items inside groups are sorted
        return sortedData.reduce((groups, row) => {
            // Resolver for group key label
            const col = columns.find(c => c.key === groupBy);

            // Allow column to specify specific grouping value/label if needed, 
            // e.g. for Object 'creator', we want 'name'.
            // Using formatCellValue might give JSX, which is bad for keys.
            // Using getSortValue might give 'Admin'.
            // Prefer sortValue if available, or raw value?

            let groupKeyLabel = 'Other';
            if (col) {
                if (col.sortValue) groupKeyLabel = col.sortValue(row);
                else groupKeyLabel = row[col.key];
            } else {
                groupKeyLabel = row[groupBy]; // Fallback raw access
            }

            // Handle if label is object (shouldn't happen if using sortValue correctly)
            const groupKey = String(groupKeyLabel || 'Other');

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(row);
            return groups;
        }, {});
    }, [sortedData, groupBy, columns]);

    // Initialize all groups as expanded when groups change
    useEffect(() => {
        if (groupedData) {
            const initial = Object.keys(groupedData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
            setExpandedGroups(initial);
        }
    }, [groupedData]);

    const toggleGroup = (groupKey) => {
        setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };

    // Totals Calculation (Global)
    const totals = useMemo(() => {
        const t = {};
        columns.forEach(col => {
            if (col.type === 'number' || col.type === 'currency') {
                t[col.key] = data.reduce((sum, row) => sum + (parseFloat(row[col.key]) || 0), 0);
            }
        });
        return t;
    }, [data, columns]);

    const allSelected = data.length > 0 && selectedIds.length === data.length;

    const toggleSelectAll = () => {
        if (allSelected) onSelectionChange([]);
        else onSelectionChange(data.map(d => d.id));
    };

    const toggleSelectRow = (id) => {
        if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(sid => sid !== id));
        else onSelectionChange([...selectedIds, id]);
    };

    const Settings16 = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
    );

    const renderRows = (rows) => rows.map(row => (
        <tr
            key={row.id}
            onClick={() => onRowClick && onRowClick(row)}
            className={`group hover:bg-slate-50 transition-colors ${selectedIds.includes(row.id) ? 'bg-indigo-50/50' : 'even:bg-slate-50/30'}`}
        >
            <td className="px-2 py-1.5 text-center border-b border-r border-slate-100" onClick={(e) => { e.stopPropagation(); toggleSelectRow(row.id); }}>
                <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => { }} className="rounded border-slate-300 text-indigo-600" />
            </td>
            {columns.map(col => visibleColumns[col.key] && (
                <td
                    key={col.key}
                    className={`px-3 py-1.5 text-xs font-medium text-slate-700 border-b border-r border-slate-100 whitespace-nowrap ${col.className || ''}`}
                    style={{ textAlign: col.type === 'number' || col.type === 'currency' ? 'right' : 'left' }}
                >
                    {formatCellValue(row[col.key], col, row)}
                </td>
            ))}
        </tr>
    ));

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Column Manager */}
            <div className="relative border-b border-slate-200 bg-slate-50 px-2 py-1 flex justify-end">
                <button onClick={() => setShowColMenu(!showColMenu)} className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors">
                    <Settings16 /> Columns
                </button>
                {showColMenu && (
                    <div className="absolute top-full right-2 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Show/Hide Columns</div>
                        {columns.map(col => (
                            <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns[col.key]}
                                    onChange={(e) => setVisibleColumns({ ...visibleColumns, [col.key]: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                />
                                <span className="text-xs font-medium text-slate-700">{col.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-auto relative scrollbar-thin">
                <table className="excel-grid w-full">
                    <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm">
                        <tr>
                            <th className="w-10 px-2 py-2 text-center border-b border-r border-slate-200 bg-slate-100">
                                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-slate-300 text-indigo-600" />
                            </th>
                            {columns.map(col => visibleColumns[col.key] && (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className="px-3 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-r border-slate-200 bg-slate-100 hover:bg-slate-200 cursor-pointer select-none whitespace-nowrap group text-left"
                                    style={{ width: col.width, minWidth: col.width }}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <span>{col.label}</span>
                                        {sortConfig.key === col.key && (
                                            <span className="text-[10px] text-indigo-500">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {loading && (
                            <tr><td colSpan={columns.length + 1} className="py-20 text-center text-slate-400 animate-pulse">Loading data...</td></tr>
                        )}
                        {!loading && sortedData.length === 0 && (
                            <tr><td colSpan={columns.length + 1} className="py-20 text-center text-slate-400">{emptyMessage}</td></tr>
                        )}

                        {!loading && groupBy && groupedData && (
                            Object.entries(groupedData).map(([groupName, items]) => (
                                <React.Fragment key={groupName}>
                                    <tr
                                        className="bg-slate-100 cursor-pointer hover:bg-slate-200/80 transition-colors"
                                        onClick={() => toggleGroup(groupName)}
                                    >
                                        <td
                                            colSpan={Object.values(visibleColumns).filter(Boolean).length + 1}
                                            className="px-4 py-1.5 border-b border-indigo-100/50 sticky left-0 z-10 bg-slate-100"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ChevronRight size={14} className={`text-slate-500 transition-transform ${expandedGroups[groupName] ? 'rotate-90' : ''}`} />
                                                <span className="text-secondary text-xs font-bold uppercase tracking-wider text-slate-500">{groupName}</span>
                                                <span className="bg-white text-[10px] font-bold text-indigo-600 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{items.length}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedGroups[groupName] && renderRows(items)}
                                </React.Fragment>
                            ))
                        )}

                        {!loading && !groupBy && renderRows(sortedData)}

                    </tbody>
                    <tfoot className="sticky bottom-0 z-30 bg-slate-800 text-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <tr>
                            <td className="w-10 px-2 py-2 text-center text-[10px] font-bold border-r border-slate-700 bg-slate-800">
                                {sortedData.length}
                            </td>
                            {columns.map(col => visibleColumns[col.key] && (
                                <td
                                    key={col.key}
                                    className="px-3 py-2 text-xs font-bold border-r border-slate-700 whitespace-nowrap bg-slate-800"
                                    style={{
                                        textAlign: col.type === 'number' || col.type === 'currency' ? 'right' : 'left'
                                    }}
                                >
                                    {col.key === 'certificate' ? 'TOTALS' : (
                                        ['number', 'currency'].includes(col.type)
                                            ? (col.type === 'currency' ? `$${totals[col.key]?.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : totals[col.key]?.toLocaleString(undefined, { minimumFractionDigits: 2 }))
                                            : ''
                                    )}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div >
    );
};

export default ExcelGrid;
