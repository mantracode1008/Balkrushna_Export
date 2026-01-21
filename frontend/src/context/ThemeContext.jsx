import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 1. Initialize logic: Check localStorage first, then system preference
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                return savedTheme;
            }
            // return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            return 'light'; // Force default light as requested
        }
        return 'light';
    });

    // 2. Effect to apply class to HTML element
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'dark' ? 'light' : 'dark';
            // Force immediate update to DOM before React effect if possible, or assume effect handles it.
            // But user complained about delay. Let's do DOM manipulation here too for instant feedback.
            const root = window.document.documentElement;
            if (newTheme === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');

            // Force reflow
            void root.offsetHeight;

            return newTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
