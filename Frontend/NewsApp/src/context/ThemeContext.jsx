import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { lightColors, darkColors } from '../theme/colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState(systemScheme || 'light');

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme || 'light');
    });
    return () => listener.remove();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
