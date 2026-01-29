import React, { useEffect, useState } from 'react';
import diamondService from '../services/diamond.service';
import authService from '../services/auth.service';
import { DollarSign, Diamond, Users, Briefcase, TrendingUp, Activity, ArrowUpRight, BarChart3, PieChart, ShieldCheck } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chart Data States
    const [profitData, setProfitData] = useState(null);
    const [inventoryDistribution, setInventoryDistribution] = useState(null);

    const user = authService.getCurrentUser();
    const isAdmin = user && user.role === 'admin';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [summaryRes, staffRes] = await Promise.all([
                    diamondService.getSummary(),
                    isAdmin ? authService.getAllStaff() : Promise.resolve([])
                ]);

                if (summaryRes.data) {
                    processDashboardData(summaryRes.data, staffRes);
                }
            } catch (err) {
                console.error("Dashboard Load Error:", err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const processDashboardData = (data, staff) => {
        setSummary(data);
        setStaffList(staff);

        // 1. Profit by Staff Chart
        if (data.breakdown) {
            const labels = data.breakdown.map(b => b.staff_name || 'Unknown');
            const profits = data.breakdown.map(b => parseFloat(b.total_profit) || 0);
            const expenses = data.breakdown.map(b => parseFloat(b.total_expense) || 0);

            setProfitData({
                labels,
                datasets: [
                    {
                        label: 'Total Expense ($)',
                        data: expenses,
                        backgroundColor: '#6366F1', // Indigo
                        borderRadius: 6,
                        barPercentage: 0.6,
                        // hidden: true <-- Removed hidden: true
                    }
                ]
            });
        }

        // 2. Mock Inventory Distribution (or derive if data allows)
        // Since getSummary doesn't give shape breakdown, we use the breakdown we have: Count by Staff
        if (data.breakdown) {
            const labels = data.breakdown.map(b => b.staff_name || 'Unknown');
            const counts = data.breakdown.map(b => parseInt(b.total_count) || 0);
            const bgColors = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];

            setInventoryDistribution({
                labels,
                datasets: [{
                    data: counts,
                    backgroundColor: bgColors.slice(0, labels.length % bgColors.length + 1),
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!summary) return <div className="p-8 text-center text-slate-500">Failed to load dashboard data.</div>;

    // Metrics Calculation
    const staffCount = staffList.filter(s => s.role === 'staff').length;
    const adminCount = staffList.filter(s => s.role === 'admin').length;

    return (
        <div className="space-y-8 animate-fade-in pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        {isAdmin ? "Executive Dashboard" : "My Dashboard"}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        System Status: <span className="text-emerald-600 font-bold">Operational</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4" /> System Health
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4" /> Generate Report
                    </button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Inventory Value */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Inventory Value</p>
                            <h3 className="text-2xl font-black text-slate-800 mt-2">
                                ${summary.grandTotal.total_expense?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <Briefcase className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[70%] rounded-full"></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">70% of budget utilized</p>
                </div>

                {/* Total Stones */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total Stones</p>
                            <h3 className="text-2xl font-black text-slate-800 mt-2">
                                {summary.grandTotal.total_count}
                            </h3>
                        </div>
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                            <Diamond className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[45%] rounded-full"></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">45% High Value Items</p>
                </div>

                {/* Staff / Clients */}
                {/* Staff / Clients - Only for Admin */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Team Overview</p>
                                <h3 className="text-2xl font-black text-slate-800 mt-2 flex items-baseline gap-1">
                                    {staffCount} <span className="text-sm font-medium text-slate-400 mr-2">Staff</span>
                                    <span className="text-slate-200">/</span>
                                    <span className="ml-1">{adminCount}</span> <span className="text-sm font-medium text-slate-400">Admins</span>
                                </h3>
                            </div>
                            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex -space-x-2">
                            {[...Array(Math.min(5, staffList.length))].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                            {staffList.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                                    +{staffList.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Profit by Staff Chart (Big) */}
                <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-500" />
                                {isAdmin ? "Expense Overview by Staff" : "My Expenses"}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {isAdmin ? "Total expenses per staff member" : "Your expense analysis"}
                            </p>
                        </div>
                        <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-600 outline-none">
                            <option>This Month</option>
                            <option>Last Quarter</option>
                            <option>All Time</option>
                        </select>
                    </div>
                    <div className="h-[350px]">
                        {profitData ? <Bar data={profitData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: "'Inter', sans-serif" } } },
                                tooltip: {
                                    backgroundColor: '#1e293b',
                                    padding: 12,
                                    cornerRadius: 8,
                                    callbacks: { label: (c) => ` ${c.dataset.label}: $${c.raw.toLocaleString()}` }
                                }
                            },
                            scales: {
                                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: (v) => '$' + v / 1000 + 'k' } },
                                x: { grid: { display: false } }
                            }
                        }} /> : <div className="h-full flex items-center justify-center text-slate-400">Loading Chart...</div>}
                    </div>
                </div>

                {/* Inventory Distribution (Small) - Only for Admin */}
                {isAdmin && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-purple-500" />
                                Inventory Ownership
                            </h3>
                            <p className="text-sm text-slate-400">
                                Stock distribution by staff
                            </p>
                        </div>
                        <div className="h-[250px] flex items-center justify-center relative">
                            {inventoryDistribution ? <Doughnut data={inventoryDistribution} options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                cutout: '70%',
                                plugins: {
                                    legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } }
                                }
                            }} /> : <div className="text-slate-400">No Data</div>}
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-3xl font-black text-slate-800">{summary.grandTotal.total_count}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stones</span>
                            </div>
                        </div>

                        {/* Quick Stat */}
                        <div className="mt-8 bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-600">Top Performer</span>
                            <span className="text-sm font-black text-emerald-600">
                                {/* Simple logic to find top performer name from data */}
                                {summary.breakdown && summary.breakdown.length > 0
                                    ? summary.breakdown.reduce((prev, current) => (parseFloat(prev.total_profit) > parseFloat(current.total_profit)) ? prev : current).staff_name
                                    : "N/A"}
                            </span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Dashboard;
