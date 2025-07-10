import React from 'react';
import styled from 'styled-components';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { useTheme, THEMES } from '../theme/ThemeContext';

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--color-surface-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
  
  &:hover {
    background-color: var(--color-surface-tertiary);
    color: var(--color-text-primary);
    border-color: var(--color-border-focus);
    transform: translateY(-1px);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    width: 1.125rem;
    height: 1.125rem;
    transition: all var(--transition-fast);
  }
`;

const ActiveToggleButton = styled(ToggleButton)`
  background-color: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  border-color: var(--color-interactive-primary);
  
  &:hover {
    background-color: var(--color-interactive-primary-hover);
    color: var(--color-text-on-brand);
    border-color: var(--color-interactive-primary-hover);
  }
`;

const ThemeLabel = styled.span`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ThemeToggle = ({ showLabel = true, showSystemOption = true }) => {
  const { theme, themePreference, setTheme, themes } = useTheme();

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const getThemeIcon = (themeType) => {
    switch (themeType) {
      case THEMES.LIGHT:
        return <FaSun />;
      case THEMES.DARK:
        return <FaMoon />;
      case THEMES.SYSTEM:
        return <FaDesktop />;
      default:
        return <FaSun />;
    }
  };

  const getThemeLabel = () => {
    switch (themePreference) {
      case THEMES.LIGHT:
        return 'Light';
      case THEMES.DARK:
        return 'Dark';
      case THEMES.SYSTEM:
        return 'System';
      default:
        return 'Light';
    }
  };

  return (
    <ToggleContainer>
      {showLabel && (
        <ThemeLabel>
          {getThemeLabel()}
        </ThemeLabel>
      )}
      
      {/* Light Mode Button */}
      {themePreference === THEMES.LIGHT ? (
        <ActiveToggleButton
          onClick={() => handleThemeChange(THEMES.DARK)}
          title="Switch to Dark Mode"
          aria-label="Switch to Dark Mode"
        >
          {getThemeIcon(THEMES.LIGHT)}
        </ActiveToggleButton>
      ) : (
        <ToggleButton
          onClick={() => handleThemeChange(THEMES.LIGHT)}
          title="Switch to Light Mode"
          aria-label="Switch to Light Mode"
        >
          {getThemeIcon(THEMES.LIGHT)}
        </ToggleButton>
      )}
      
      {/* Dark Mode Button */}
      {themePreference === THEMES.DARK ? (
        <ActiveToggleButton
          onClick={() => handleThemeChange(THEMES.LIGHT)}
          title="Switch to Light Mode"
          aria-label="Switch to Light Mode"
        >
          {getThemeIcon(THEMES.DARK)}
        </ActiveToggleButton>
      ) : (
        <ToggleButton
          onClick={() => handleThemeChange(THEMES.DARK)}
          title="Switch to Dark Mode"
          aria-label="Switch to Dark Mode"
        >
          {getThemeIcon(THEMES.DARK)}
        </ToggleButton>
      )}
      
      {/* System Mode Button (Optional) */}
      {showSystemOption && (
        <>
          {themePreference === THEMES.SYSTEM ? (
            <ActiveToggleButton
              onClick={() => handleThemeChange(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)}
              title="Using System Theme - Click to Override"
              aria-label="Using System Theme - Click to Override"
            >
              {getThemeIcon(THEMES.SYSTEM)}
            </ActiveToggleButton>
          ) : (
            <ToggleButton
              onClick={() => handleThemeChange(THEMES.SYSTEM)}
              title="Use System Theme"
              aria-label="Use System Theme"
            >
              {getThemeIcon(THEMES.SYSTEM)}
            </ToggleButton>
          )}
        </>
      )}
    </ToggleContainer>
  );
};

// Simple toggle button that only switches between light and dark
export const SimpleThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <ToggleButton
      onClick={toggleTheme}
      title={`Switch to ${theme === THEMES.LIGHT ? 'Dark' : 'Light'} Mode`}
      aria-label={`Switch to ${theme === THEMES.LIGHT ? 'Dark' : 'Light'} Mode`}
    >
      {theme === THEMES.LIGHT ? <FaSun /> : <FaMoon />}
    </ToggleButton>
  );
};

export default ThemeToggle; 