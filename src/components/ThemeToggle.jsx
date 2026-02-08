import { useState, useEffect, createContext, useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Theme Provider
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Get saved theme or prefer dark
        const saved = localStorage.getItem('theme');
        if (saved) return saved;

        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0f' : '#ffffff');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Theme Toggle Button Component
const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className={`theme-toggle ${className}`}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <div className="theme-toggle-track">
                <div className={`theme-toggle-thumb ${theme}`}>
                    {theme === 'dark' ? (
                        <Moon size={14} />
                    ) : (
                        <Sun size={14} />
                    )}
                </div>
                <Sun size={12} className="theme-icon sun" />
                <Moon size={12} className="theme-icon moon" />
            </div>
        </button>
    );
};

export default ThemeToggle;

