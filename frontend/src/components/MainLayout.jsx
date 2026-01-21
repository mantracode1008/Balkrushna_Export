import React from 'react';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar Placeholder - will be passed in App */}
            {/* Creating actual structure in App.jsx or here. Let's do it here properly if Sidebar was imported.
             But usually App.jsx handles Router. I'll import Sidebar here. */}
        </div>
    );
};
// Revamping Layout usage. I will put Sidebar inside a LayoutWrapper in App.jsx or similar.
// Actually, let's make Layout.jsx the main wrapper.

import Sidebar from './Sidebar';
import { ShoppingCart } from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const MainLayout = ({ children }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex min-h-screen bg-white dark:bg-slate-900 font-sans transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 ml-64">
                <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 px-8 py-4 flex justify-between items-center transition-colors duration-300">
                    <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Admin Dashboard</h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                            title="Toggle Dark Mode"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm border border-blue-200 dark:border-blue-800">A</div>
                    </div>
                </header>
                <main className="p-8 text-slate-800 dark:text-slate-200">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
