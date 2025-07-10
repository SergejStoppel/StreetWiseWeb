import React, { createContext, useContext, useEffect, useState } from 'react';

// Create the theme context
const ThemeContext = createContext();

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Get system preference
const getSystemPreference = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
  }
  return THEMES.LIGHT;
};

// Get stored theme preference
const getStoredTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem('sitecraft-theme');
    return stored && Object.values(THEMES).includes(stored) ? stored : THEMES.SYSTEM;
  }
  return THEMES.SYSTEM;
};

// Apply theme to document
const applyTheme = (theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    
    // Remove existing theme attributes
    root.removeAttribute('data-theme');
    
    // Apply new theme
    if (theme === THEMES.LIGHT) {
      root.setAttribute('data-theme', 'light');
    } else if (theme === THEMES.DARK) {
      root.setAttribute('data-theme', 'dark');
    }
    // For system theme, we don't set data-theme attribute, 
    // so CSS media queries handle it automatically
  }
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState(THEMES.SYSTEM);
  const [actualTheme, setActualTheme] = useState(THEMES.LIGHT);

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = getStoredTheme();
    const systemTheme = getSystemPreference();
    
    setThemePreference(storedTheme);
    
    // Calculate actual theme based on preference
    const newActualTheme = storedTheme === THEMES.SYSTEM ? systemTheme : storedTheme;
    setActualTheme(newActualTheme);
    applyTheme(newActualTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        if (themePreference === THEMES.SYSTEM) {
          const newSystemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
          setActualTheme(newSystemTheme);
          applyTheme(newSystemTheme);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themePreference]);

  // Set theme preference
  const setTheme = (newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}`);
      return;
    }

    setThemePreference(newTheme);
    
    // Store preference
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('sitecraft-theme', newTheme);
    }

    // Calculate and apply actual theme
    const systemTheme = getSystemPreference();
    const newActualTheme = newTheme === THEMES.SYSTEM ? systemTheme : newTheme;
    setActualTheme(newActualTheme);
    applyTheme(newActualTheme);
  };

  // Toggle between light and dark (skipping system)
  const toggleTheme = () => {
    const newTheme = actualTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setTheme(newTheme);
  };

  // Get current theme info
  const isLight = actualTheme === THEMES.LIGHT;
  const isDark = actualTheme === THEMES.DARK;
  const isSystem = themePreference === THEMES.SYSTEM;

  // Theme context value
  const value = {
    // Current theme state
    theme: actualTheme,
    themePreference,
    isLight,
    isDark,
    isSystem,
    
    // Theme controls
    setTheme,
    toggleTheme,
    
    // Theme options
    themes: THEMES,
    
    // Utility functions
    getSystemPreference,
    
    // CSS class helpers
    getThemeClasses: () => ({
      light: isLight,
      dark: isDark,
      system: isSystem
    })
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// HOC for components that need theme
export const withTheme = (Component) => {
  return (props) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

// Theme utility functions
export const themeUtils = {
  // Get CSS variable value
  getCSSVariable: (variable) => {
    if (typeof document !== 'undefined') {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
    }
    return '';
  },
  
  // Set CSS variable value
  setCSSVariable: (variable, value) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(variable, value);
    }
  },
  
  // Get color with opacity
  getColorWithOpacity: (colorVar, opacity) => {
    const color = themeUtils.getCSSVariable(colorVar);
    if (color && opacity !== undefined) {
      // Convert hex to rgba if needed
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      // For rgb/rgba colors, we might need more complex parsing
      return color;
    }
    return color;
  }
};

export default ThemeContext; 