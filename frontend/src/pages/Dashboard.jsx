import React, { useEffect, useState } from 'react';
import reportService from '../services/report.service';
import { DollarSign, Diamond, TrendingUp, Package, Layers } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Modern Color Palette
const COLORS = {
    primary: '#4F46E5', // Indigo
    secondary: '#10B981', // Emerald
    accent: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    info: '#3B82F6', // Blue
    purple: '#8B5CF6', // Violet
    teal: '#14B8A6', // Teal
    background: '#F8FAFC', // Slate 50
    card: '#FFFFFF',
    textMain: '#1E293B',
    textSub: '#64748B'
};

const Loading = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [shapeData, setShapeData] = useState(null);
    const [colorData, setColorData] = useState(null);
    const [clarityData, setClarityData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const statsRes = await reportService.getDashboardStats();
            setStats(statsRes.data);

            if (statsRes.data.shapeDistribution) prepareShapeChart(statsRes.data.shapeDistribution);
            if (statsRes.data.colorDistribution) prepareColorChart(statsRes.data.colorDistribution);
            if (statsRes.data.clarityDistribution) prepareClarityChart(statsRes.data.clarityDistribution);

        } catch (err) {
            console.error(err);
        }
    };

    const prepareShapeChart = (data) => {
        if (!data || data.length === 0) { setShapeData(null); return; }
        const labels = data.map(d => d.shape || 'Unknown');
        const counts = data.map(d => parseInt(d.count) || 0);

        setShapeData({
            labels,
            datasets: [{
                label: 'Quantity',
                data: counts,
                backgroundColor: 'rgba(79, 70, 229, 0.7)', // Indigo
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(79, 70, 229, 0.9)'
            }]
        });
    };

    const prepareColorChart = (data) => {
        if (!data || data.length === 0) { setColorData(null); return; }
        const labels = data.map(d => d.color || 'Unknown');
        const counts = data.map(d => parseInt(d.count) || 0);

        // Creative Gradient-like palette
        const bgColors = [
            '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#059669', '#047857'
        ];

        setColorData({
            labels,
            datasets: [{
                label: 'Quantity',
                data: counts,
                backgroundColor: bgColors.slice(0, labels.length % bgColors.length + 1),
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4
            }]
        });
    };

    const prepareClarityChart = (data) => {
        if (!data || data.length === 0) { setClarityData(null); return; }
        const labels = data.map(d => d.clarity || 'Unknown');
        const counts = data.map(d => parseInt(d.count) || 0);

        const bgColors = [
            '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#7C3AED', '#6D28D9'
        ];

        setClarityData({
            labels,
            datasets: [{
                label: 'Quantity',
                data: counts,
                backgroundColor: bgColors.slice(0, labels.length % bgColors.length + 1),
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4
            }]
        });
    };

    if (!stats) return <Loading />;

    const cards = [
        { title: 'Total Stones', value: stats.inventoryCount, icon: Diamond, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', shadow: 'shadow-indigo-100' },
        { title: 'Inventory Value', value: `$${stats.inventoryValue?.toLocaleString()}`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', shadow: 'shadow-blue-100' },
        { title: 'Total Sold', value: stats.soldCount, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', shadow: 'shadow-purple-100' },
        { title: 'Total Revenue', value: `$${stats.totalRevenue?.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', shadow: 'shadow-emerald-100' },
        { title: 'Total Profit', value: `$${stats.totalProfit?.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', shadow: 'shadow-amber-100' },
    ];

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, padding: 20, font: { family: "'Inter', sans-serif" } }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleFont: { family: "'Inter', sans-serif", size: 13 },
                bodyFont: { family: "'Inter', sans-serif", size: 13 },
                padding: 10,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        return ` ${context.label}: ${context.raw} pcs`;
                    }
                }
            }
        }
    };

    // Specific options for Bar chart to show value on top if possible (requires plugin, but we can use Tooltip for now as user asked for "visualise")
    // Note: Chart.js core doesn't support labels ON bars without a plugin. 
    // We will ensure the Tooltip is very clear and the Y-axis is granular.

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
                    Dashboard
                    <span className="block text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">Real-time inventory and financial insights</span>
                </h1>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            className={`relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl border ${card.border} dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 ${card.color} transition-opacity`}>
                                <Icon className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                            </div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg} dark:bg-slate-700/50 ${card.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mt-1">{card.value}</h3>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Shape Wise - Bar Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-3 xl:col-span-1 hover:shadow-md transition-all">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <Diamond className="w-5 h-5 text-indigo-500" />
                        Inventory by Shape
                    </h3>
                    <div className="h-80">
                        {shapeData ? <Bar data={shapeData} options={{
                            ...chartOptions,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: '#334155', borderDash: [5, 5] }, // Darker grid for dark mode
                                    ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } }
                                }
                            }
                        }} /> : <p className="text-center text-slate-400 mt-20">No data available</p>}
                    </div>
                </div>

                {/* Color Wise - Donut */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Inventory by Color
                    </h3>
                    <div className="h-80 flex items-center justify-center">
                        {colorData ? <Doughnut data={colorData} options={{
                            ...chartOptions,
                            cutout: '60%',
                            plugins: {
                                ...chartOptions.plugins,
                                legend: { ...chartOptions.plugins.legend, labels: { color: '#94a3b8' } } // Fix legend color
                            }
                        }} /> : <p className="text-center text-slate-400">No data available</p>}
                    </div>
                </div>

                {/* Clarity Wise - Donut (NEW) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-violet-500" />
                        Inventory by Clarity
                    </h3>
                    <div className="h-80 flex items-center justify-center">
                        {clarityData ? <Doughnut data={clarityData} options={{
                            ...chartOptions,
                            cutout: '60%',
                            plugins: {
                                ...chartOptions.plugins,
                                legend: { ...chartOptions.plugins.legend, labels: { color: '#94a3b8' } }
                            }
                        }} /> : <p className="text-center text-slate-400">No data available</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
