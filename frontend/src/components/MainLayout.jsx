import React from 'react';
import Sidebar from './Sidebar';
import authService from '../services/auth.service';

const MainLayout = ({ children }) => {
    const user = authService.getCurrentUser();
    const displayName = (user && user.name) ? user.name : 'Guest';
    const displayRole = user ? (user.role === 'admin' ? 'Administrator' : 'Staff Member') : 'Guest';
    const initial = (user && user.name) ? user.name.charAt(0).toUpperCase() : '?';


    return (
        <div className="flex min-h-screen bg-[#F8FAFC] font-sans transition-colors duration-300 relative">
            <Sidebar />

            {/* Background Watermark - High Key Light Visualization */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
                {/* Ambient Light Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-slate-100/50"></div>

                {/* Large Diamond Symbol Watermark */}
                <div className="relative w-[85vh] h-[85vh] opacity-[0.02] transform rotate-[-8deg] blur-[0.5px] select-none scale-125 mix-blend-multiply">
                    <img
                        src="/logo.png"
                        alt=""
                        className="w-full h-full object-cover object-[center_top]"
                    />
                </div>

                {/* Diamond Refraction Sheen (Light Theme) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.8)_0%,_rgba(219,234,254,0.3)_40%,_transparent_70%)] opacity-60"></div>
            </div>

            <div className="flex-1 ml-20 transition-all duration-300 ease-in-out z-10 relative">
                <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-8 py-4 flex justify-between items-center transition-colors duration-300">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Dashboard</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-sm font-bold text-slate-700">{displayName}</span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{displayRole}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-200 shadow-sm">
                            {initial}
                        </div>
                    </div>
                </header>
                <main className="p-8 text-slate-800 max-w-[1920px] mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
