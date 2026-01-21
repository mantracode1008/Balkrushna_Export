import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Diamond, FileText, BarChart3, LogOut, Hexagon, ShoppingCart } from 'lucide-react';
import authService from '../services/auth.service';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/inventory', label: 'Inventory', icon: Diamond },
        { path: '/invoices', label: 'Invoices', icon: FileText },
        { path: '/history', label: 'History', icon: Hexagon }, // Reuse Hexagon or other icon
        { path: '/reports', label: 'Reports', icon: BarChart3 },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white fixed left-0 top-0 flex flex-col shadow-2xl z-50 font-sans border-r border-slate-800">
            <div className="p-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl flex flex-col items-center text-center gap-2">
                <div className="relative group cursor-default">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative">
                        <h1 className="text-2xl font-black tracking-tighter animate-shimmer leading-tight pb-1">
                            BALKRISHNA
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase transform transition-all duration-300 group-hover:text-blue-400 group-hover:tracking-[0.4em]">
                            Exports
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
