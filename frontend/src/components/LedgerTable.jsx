import React, { useState, Fragment } from 'react';
import { ChevronRight, ChevronDown, Minus } from 'lucide-react';

const LedgerTable = ({
    data = [], // Expecting hierarchical structure
    columns = [],
    loading = false,
    emptyMessage = "No records found.",
    onGroupClick = null
}) => {
    const [expanded, setExpanded] = useState({});

    // Filter out hidden columns
    const visibleColumns = columns.filter(col => !col.hidden);

    // Toggle Expand/Collapse
    const toggle = (key) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Helper to format currency
    const fmt = (val) => val ? parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

    if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse font-medium">Loading ledger data...</div>;
    if (!data || data.length === 0) return <div className="p-12 text-center text-slate-400 font-medium">{emptyMessage}</div>;

    const handleGroupToggle = (key, group, e) => {
        // e.stopPropagation(); // Allow bubbling if needed, but here we control logic
        toggle(key);
        if (onGroupClick) onGroupClick(group);
    };

    return (
        <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
            <div className="flex-1 overflow-auto scrollbar-thin">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 border-b border-r border-slate-200 w-12 text-center">#</th>
                            {visibleColumns.map(col => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 border-b border-r border-slate-200 whitespace-nowrap ${col.className || ''}`}
                                    style={{ width: col.width, textAlign: col.align || 'left' }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {data.map((group, groupIdx) => {
                            const isGroupExpanded = expanded[`g-${groupIdx}`] !== false; // Default expanded?

                            return (
                                <Fragment key={`g-${groupIdx}`}>
                                    {/* LEVEL 1: GROUP ROW (Seller or Staff) */}
                                    <tr
                                        className="bg-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors border-b border-slate-200 group-header"
                                        onClick={(e) => handleGroupToggle(`g-${groupIdx}`, group, e)}
                                    >
                                        <td className="px-4 py-2 border-r border-slate-200 text-center">
                                            {isGroupExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </td>
                                        <td colSpan={visibleColumns.length} className="px-4 py-2">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-slate-700 text-sm uppercase group-hover:text-indigo-600 transition-colors">{group.key}</span>
                                                    <span className="text-[10px] font-bold bg-white text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                                                        {group.count} Items
                                                    </span>
                                                </div>

                                                {/* Group Summary */}
                                                <div className="flex items-center gap-6 pr-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Purchase</span>
                                                        <span className="font-bold text-slate-700 font-mono">${fmt(group.totalAmount)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] text-emerald-600/70 font-bold uppercase">Paid</span>
                                                        <span className="font-bold text-emerald-600 font-mono">${fmt(group.totalPaid)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] text-rose-600/70 font-bold uppercase">Due</span>
                                                        <span className="font-bold text-rose-600 font-mono text-sm border-b border-rose-200">${fmt(group.totalDue)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* LEVEL 2: SUBGROUP (Staff or Seller) */}
                                    {isGroupExpanded && group.subGroups && group.subGroups.map((sub, subIdx) => {
                                        const subKey = `g-${groupIdx}-s-${subIdx}`;
                                        const isSubExpanded = expanded[subKey];

                                        return (
                                            <Fragment key={subKey}>
                                                <tr
                                                    className="bg-white hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100"
                                                    onClick={() => toggle(subKey)}
                                                >
                                                    <td className="px-4 py-1.5 border-r border-slate-100 text-center pl-8 text-slate-300">
                                                        {isSubExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                    </td>
                                                    <td colSpan={visibleColumns.length} className="px-4 py-1.5">
                                                        <div className="flex items-center justify-between w-full pl-4 border-l-2 border-indigo-100">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-600 text-xs">{sub.key}</span>
                                                                <span className="text-[9px] text-slate-400">({sub.count})</span>
                                                            </div>
                                                            <div className="flex items-center gap-6 pr-4 opacity-75">
                                                                <span className="font-medium text-slate-600 font-mono w-24 text-right">${fmt(sub.totalAmount)}</span>
                                                                <span className="font-medium text-emerald-600 font-mono w-24 text-right">${fmt(sub.totalPaid)}</span>
                                                                <span className="font-bold text-rose-600 font-mono w-24 text-right">${fmt(sub.totalDue)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* LEVEL 3: DATA ROWS */}
                                                {isSubExpanded && sub.rows.map((row) => (
                                                    <tr key={row.id} className="hover:bg-indigo-50/10 transition-colors border-b border-slate-50 group">
                                                        <td className="px-4 py-2 border-r border-slate-100 text-center text-slate-300 group-hover:text-indigo-300">
                                                            <Minus size={10} />
                                                        </td>
                                                        {visibleColumns.map(col => (
                                                            <td
                                                                key={col.key}
                                                                className={`px-4 py-2 border-r border-slate-100 font-medium text-slate-600 ${col.className || ''}`}
                                                                style={{ textAlign: col.align || 'left' }}
                                                            >
                                                                {col.format ? col.format(row[col.key], row) : (
                                                                    col.render ? col.render(row) : (
                                                                        col.type === 'currency' ? `$${fmt(row[col.key])}` :
                                                                            col.type === 'date' ? new Date(row[col.key]).toLocaleDateString() :
                                                                                row[col.key]
                                                                    )
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </Fragment>
                                        );
                                    })}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LedgerTable;
