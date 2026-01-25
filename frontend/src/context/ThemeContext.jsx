import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Force Light Mode Always
    const theme = 'light';

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    const toggleTheme = () => {
        // No-op
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
