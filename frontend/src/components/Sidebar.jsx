import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Diamond, FileText, BarChart3, LogOut, Hexagon, ShoppingCart, Users, Settings, CheckCircle2 } from 'lucide-react';
import authService from '../services/auth.service';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const user = authService.getCurrentUser();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/inventory', label: 'Inventory', icon: Diamond },
        { path: '/invoices', label: 'Invoices', icon: FileText },
        { path: '/history', label: 'History', icon: Hexagon }, // Reuse Hexagon or other icon
    ];

    // Add Staff Management for Admins
    if (user && user.role === 'admin') {
        navItems.push({ path: '/staff', label: 'Manage Staff', icon: Users });
    } else if (user && !user.role) {
        // Fallback for old admin without role
        navItems.push({ path: '/staff', label: 'Manage Staff', icon: Users });
    }

    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className="h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#020617] text-white fixed left-0 top-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.4)] z-50 font-sans border-r border-white/5 transition-all duration-300 ease-in-out w-20 hover:w-72 group overflow-hidden">
            {/* Logo Section */}
            {/* Logo Section */}
            <div className="h-40 flex items-center justify-center border-b border-slate-800/50 bg-slate-900/90 backdrop-blur-xl transition-all duration-300 relative overflow-hidden">
                <div className="relative flex items-center justify-center w-full h-full">
                    {/* Collapsed State: Static Diamond Symbol */}
                    <div className="absolute opacity-100 group-hover:opacity-0 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 flex items-center justify-center rounded-xl overflow-hidden">
                            {/* Crop to show only the Diamond symbol (Top of the image) */}
                            <div className="w-full h-full relative">
                                <img
                                    src="/logo.png"
                                    alt="Diamond Symbol"
                                    className="w-[180%] max-w-none absolute top-[-5%] left-1/2 -translate-x-1/2 object-contain"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Expanded State: Full Brand Logo - High Clarity */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center px-4 w-full h-full">
                        <img
                            src="/logo.png"
                            alt="Balkrushna Exports"
                            className="w-56 h-auto max-h-32 object-contain drop-shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-3 overflow-x-hidden overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={item.label}
                            className={`flex items-center gap-4 px-3 py-3.5 rounded-xl transition-all duration-300 group/item relative overflow-hidden
                                ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 translate-x-1'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                                }`}
                        >
                            {/* Hover Shine Effect */}
                            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/item:animate-[shimmer_1.5s_infinite] ${isActive ? 'opacity-20' : 'opacity-0'}`}></div>

                            <div className={`min-w-[1.5rem] flex justify-center items-center relative z-10 ${isActive ? 'text-white' : 'text-slate-500 group-hover/item:text-blue-400 transition-colors'}`}>
                                <Icon className={`w-6 h-6 ${isActive ? 'drop-shadow-md' : ''}`} />
                            </div>
                            <span className={`font-medium text-[15px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 relative z-10 ${isActive ? 'font-semibold tracking-wide' : ''}`}>
                                {item.label}
                            </span>

                            {/* Active Indicator (Right Side) */}
                            {isActive && (
                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5 space-y-2 bg-slate-900/50 backdrop-blur-md">
                {/* Admin Settings Button */}
                {user && user.role === 'admin' && (
                    <button
                        onClick={() => setShowSettings(true)}
                        title="Settings"
                        className="flex items-center gap-4 w-full px-3 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group/settings"
                    >
                        <div className="min-w-[1.5rem] flex justify-center items-center text-slate-500 group-hover/settings:text-blue-400 transition-colors">
                            <Settings className="w-5 h-5" />
                        </div>
                        <span className="font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                            Settings
                        </span>
                    </button>
                )}

                <button
                    onClick={handleLogout}
                    title="Logout"
                    className="flex items-center gap-4 w-full px-3 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group/logout"
                >
                    <div className="min-w-[1.5rem] flex justify-center items-center text-slate-500 group-hover/logout:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                        Logout
                    </span>
                </button>
            </div>

            <AdminSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    );
};

// Concise Internal Modal Component for Admin Settings
const AdminSettingsModal = ({ isOpen, onClose }) => {
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');

    if (!isOpen) return null;

    const auth = authService.getCurrentUser();
    if (!auth || auth.role !== 'admin') return null;

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await authService.updateSelf(auth.id, pin || undefined, password || undefined);
            setMsg('Updated Successfully!');
            setTimeout(() => { setMsg(''); onClose(); }, 1500);
        } catch (err) {
            setMsg('Failed: ' + (err.response?.data?.message || 'Error'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white text-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold mb-4">Update Admin Credentials</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">New PIN (Optional)</label>
                        <input type="text" maxLength="8" placeholder="Leave blank to keep current" className="w-full border rounded-lg p-2 mt-1" value={pin} onChange={e => setPin(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">New Password (Optional)</label>
                        <input type="password" placeholder="Leave blank to keep current" className="w-full border rounded-lg p-2 mt-1" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    {msg && <p className={`text-xs font-bold ${msg.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 bg-slate-100 p-2 rounded-lg text-sm font-bold">Cancel</button>
                        <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg text-sm font-bold">Update</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Sidebar;
