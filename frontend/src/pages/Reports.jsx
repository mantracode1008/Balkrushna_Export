import React, { useEffect, useState } from 'react';
import reportService from '../services/report.service';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Calendar, Download, TrendingUp, DollarSign, Package } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

import { useTheme } from '../context/ThemeContext';

const Reports = () => {
    const { theme } = useTheme();
    const [range, setRange] = useState('daily');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState([]);
    const [topSelling, setTopSelling] = useState([]);
    const [metrics, setMetrics] = useState({ revenue: 0, profit: 0, margin: 0 });

    const loadData = async () => {
        try {
            const params = { range };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const results = await Promise.allSettled([
                reportService.getReports(params),
                reportService.getTopSellingItems()
            ]);

            const reportRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
            if (results[0].status === 'rejected') console.error("Reports API Failed", results[0].reason);

            const topRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
            if (results[1].status === 'rejected') console.error("Top Selling API Failed", results[1].reason);

            setReportData(reportRes.data);
            setTopSelling(topRes.data);

            // Calculate Metrics
            const totalRev = reportRes.data.reduce((acc, curr) => acc + (parseFloat(curr.revenue) || 0), 0);
            const totalProf = reportRes.data.reduce((acc, curr) => acc + (parseFloat(curr.profit) || 0), 0);
            const margin = totalRev > 0 ? ((totalProf / totalRev) * 100).toFixed(1) : 0;

            setMetrics({
                revenue: totalRev,
                profit: totalProf,
                margin: margin
            });

        } catch (err) {
            console.error("Failed to load reports", err);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range, startDate, endDate]);



    const handleExport = () => {
        // Convert reportData to CSV
        if (!reportData.length) return alert("No data to export");

        const headers = ["Date", "Revenue", "Profit"];
        const rows = reportData.map(d => [d.date, d.revenue, d.profit]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `financial_report_${range}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // Creative Chart Config
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                    usePointStyle: true,
                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                }
            },
            tooltip: {
                backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                bodyColor: theme === 'dark' ? '#94a3b8' : '#475569',
                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                usePointStyle: true,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b', font: { family: "'Inter', sans-serif" } }
            },
            y: {
                grid: { color: theme === 'dark' ? '#334155' : '#f1f5f9', borderDash: [4, 4] },
                ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b', font: { family: "'Inter', sans-serif" }, callback: (val) => '$' + val }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    const lineChartData = {
        labels: reportData.map(d => d.date),
        datasets: [
            {
                label: 'Total Revenue',
                data: reportData.map(d => d.revenue),
                borderColor: '#3b82f6', // Blue 500
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6
            },
            {
                label: 'Net Profit',
                data: reportData.map(d => d.profit),
                borderColor: '#10b981', // Emerald 500
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6
            }
        ]
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Financial Insights
                    </h1>
                    <p className="text-slate-500 mt-1">Track your business performance and growth.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range Picker (Simplistic) */}
                    <div className="flex items-center gap-2 bg-white  px-3 py-2 rounded-xl border border-slate-200  shadow-sm text-sm transition-colors">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            className="outline-none text-slate-600  bg-transparent w-32 [color-scheme:light] "
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setRange('custom'); }}
                        />
                        <span className="text-slate-300 ">|</span>
                        <input
                            type="date"
                            className="outline-none text-slate-600  bg-transparent w-32 [color-scheme:light] "
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setRange('custom'); }}
                        />
                    </div>

                    <div className="bg-white  rounded-xl border border-slate-200  p-1 flex shadow-sm transition-colors">
                        {['daily', 'monthly', 'yearly'].map(r => (
                            <button
                                key={r}
                                onClick={() => { setRange(r); setStartDate(''); setEndDate(''); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${range === r ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200  font-medium text-sm"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/70  backdrop-blur-xl p-6 rounded-2xl border border-white/20  shadow-lg shadow-slate-200/50  hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50  rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-emerald-200/50  transition-colors"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-emerald-50  rounded-xl">
                            <DollarSign className="w-6 h-6 text-emerald-600 " />
                        </div>
                        <span className="text-emerald-600  bg-emerald-50  px-2 py-1 rounded-lg text-xs font-bold">+12.5%</span>
                    </div>
                    <h3 className="text-slate-500  font-medium text-sm mb-1">Total Revenue</h3>
                    <p className="text-3xl font-bold text-slate-800 ">${metrics.revenue.toLocaleString()}</p>
                </div>

                <div className="bg-white/70  backdrop-blur-xl p-6 rounded-2xl border border-white/20  shadow-lg shadow-slate-200/50  hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50  rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-blue-200/50  transition-colors"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-blue-50  rounded-xl">
                            <TrendingUp className="w-6 h-6 text-blue-600 " />
                        </div>
                        <span className="text-blue-600  bg-blue-50  px-2 py-1 rounded-lg text-xs font-bold">+8.2%</span>
                    </div>
                    <h3 className="text-slate-500  font-medium text-sm mb-1">Net Profit</h3>
                    <p className="text-3xl font-bold text-slate-800 ">${metrics.profit.toLocaleString()}</p>
                </div>

                <div className="bg-white/70  backdrop-blur-xl p-6 rounded-2xl border border-white/20  shadow-lg shadow-slate-200/50  hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/50  rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-purple-200/50  transition-colors"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-purple-50  rounded-xl">
                            <Package className="w-6 h-6 text-purple-600 " />
                        </div>
                        <span className="text-purple-600  bg-purple-50  px-2 py-1 rounded-lg text-xs font-bold">Good</span>
                    </div>
                    <h3 className="text-slate-500  font-medium text-sm mb-1">Profit Margin</h3>
                    <p className="text-3xl font-bold text-slate-800 ">{metrics.margin}%</p>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white  p-6 rounded-2xl shadow-md border border-slate-100  transition-colors">
                    <h3 className="font-bold text-slate-800  text-lg mb-6">Revenue & Profit Trends</h3>
                    <div className="h-[350px]">
                        <Line data={lineChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Top Selling Items (Mini Table) */}
                <div className="bg-white  p-6 rounded-2xl shadow-md border border-slate-100  flex flex-col transition-colors">
                    <h3 className="font-bold text-slate-800  text-lg mb-4">Top Sold Items</h3>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50  text-xs font-bold text-slate-500  uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Diamond</th>
                                    <th className="px-4 py-3 text-right">Profit</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Rev</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50  text-sm">
                                {topSelling.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50  group transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-800 ">{item.diamond ? item.diamond.shape : 'Unknown'}</div>
                                            <div className="text-xs text-slate-400">{item.diamond ? `${item.diamond.carat}ct • ${item.diamond.color}` : '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-600 ">
                                            ${item.totalProfit}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-600 ">
                                            ${item.totalRevenue}
                                        </td>
                                    </tr>
                                ))}
                                {topSelling.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8 text-slate-400">No sales data yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="w-full mt-4 py-2 text-sm text-indigo-600  font-medium hover:bg-indigo-50  rounded-lg transition-colors">
                        View All Sales
                    </button>
                </div>
            </div>

            {/* Detailed Data Table */}
            <div className="bg-white  rounded-2xl shadow-sm border border-slate-100  overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-slate-100  flex justify-between items-center bg-slate-50/50 ">
                    <h3 className="font-bold text-slate-800 ">Detailed Report Data</h3>
                    <span className="text-xs font-medium bg-slate-200  text-slate-600  px-2 py-1 rounded-md">{reportData.length} records</span>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50  border-b border-slate-100  text-slate-500  font-semibold text-sm">
                        <tr>
                            <th className="px-6 py-4">Date/Period</th>
                            <th className="px-6 py-4">Revenue</th>
                            <th className="px-6 py-4">Profit</th>
                            <th className="px-6 py-4 text-right">Margin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100  text-sm">
                        {reportData.map((row, idx) => {
                            const rowMargin = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : 0;
                            return (
                                <tr key={idx} className="hover:bg-slate-50  transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700 ">{row.date}</td>
                                    <td className="px-6 py-4 text-slate-600 ">${row.revenue}</td>
                                    <td className="px-6 py-4 text-emerald-600  font-semibold">+ ${row.profit}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${rowMargin > 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {rowMargin}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {reportData.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-slate-400">
                                    No data available for the selected range.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
