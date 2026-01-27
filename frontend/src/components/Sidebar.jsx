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
        <div className="h-screen bg-white border-r border-slate-200 text-slate-800 fixed left-0 top-0 flex flex-col shadow-sm z-50 font-sans transition-all duration-300 ease-in-out w-20 hover:w-72 group overflow-hidden">
            {/* Logo Section */}
            <div className="h-44 flex items-center justify-center border-b border-slate-100 bg-white transition-all duration-300 relative overflow-hidden">
                <div className="relative flex items-center justify-center w-full h-full">
                    {/* Collapsed State: Focused Diamond Symbol */}
                    <div className="absolute opacity-100 group-hover:opacity-0 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 flex items-center justify-center rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-0.5">
                            <img
                                src="/logo.png"
                                alt="Diamond Symbol"
                                className="w-full h-full object-contain scale-[2] transform -translate-y-[10%]"
                            />
                        </div>
                    </div>

                    {/* Expanded State: Full Brand Logo - Maximized */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center w-full px-4">
                        <img
                            src="/logo.png"
                            alt="Balkrushna Exports"
                            className="w-full h-auto max-h-40 object-contain scale-110"
                        />
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2 overflow-x-hidden overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={item.label}
                            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group/item relative
                                ${isActive
                                    ? 'bg-slate-100 text-slate-900 font-bold'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                        >
                            {/* Active Side Indicator */}
                            {isActive && (
                                <div className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"></div>
                            )}

                            <div className={`min-w-[1.5rem] flex justify-center items-center relative z-10 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover/item:text-slate-600'}`}>
                                <Icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]' : ''}`} />
                            </div>
                            <span className={`text-[15px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 ${isActive ? 'font-bold tracking-tight text-slate-900' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 space-y-1 bg-slate-50/50">
                {user && user.role === 'admin' && (
                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex items-center gap-4 w-full px-3 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all duration-200 group/settings"
                    >
                        <div className="min-w-[1.5rem] flex justify-center items-center text-slate-400 group-hover/settings:text-slate-600">
                            <Settings className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Settings
                        </span>
                    </button>
                )}

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full px-3 py-3 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200 group/logout"
                >
                    <div className="min-w-[1.5rem] flex justify-center items-center text-slate-400 group-hover/logout:text-rose-500">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
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
