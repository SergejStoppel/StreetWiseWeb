import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

const GlobalStyles = createGlobalStyle`
  :root {
    /* Color Variables */
    --color-primary-50: ${theme.colors.primary[50]};
    --color-primary-100: ${theme.colors.primary[100]};
    --color-primary-200: ${theme.colors.primary[200]};
    --color-primary-300: ${theme.colors.primary[300]};
    --color-primary-400: ${theme.colors.primary[400]};
    --color-primary-500: ${theme.colors.primary[500]};
    --color-primary-600: ${theme.colors.primary[600]};
    --color-primary-700: ${theme.colors.primary[700]};
    --color-primary-800: ${theme.colors.primary[800]};
    --color-primary-900: ${theme.colors.primary[900]};
    
    --color-secondary-50: ${theme.colors.secondary[50]};
    --color-secondary-100: ${theme.colors.secondary[100]};
    --color-secondary-200: ${theme.colors.secondary[200]};
    --color-secondary-300: ${theme.colors.secondary[300]};
    --color-secondary-400: ${theme.colors.secondary[400]};
    --color-secondary-500: ${theme.colors.secondary[500]};
    --color-secondary-600: ${theme.colors.secondary[600]};
    --color-secondary-700: ${theme.colors.secondary[700]};
    --color-secondary-800: ${theme.colors.secondary[800]};
    --color-secondary-900: ${theme.colors.secondary[900]};
    
    --color-neutral-0: ${theme.colors.neutral[0]};
    --color-neutral-50: ${theme.colors.neutral[50]};
    --color-neutral-100: ${theme.colors.neutral[100]};
    --color-neutral-200: ${theme.colors.neutral[200]};
    --color-neutral-300: ${theme.colors.neutral[300]};
    --color-neutral-400: ${theme.colors.neutral[400]};
    --color-neutral-500: ${theme.colors.neutral[500]};
    --color-neutral-600: ${theme.colors.neutral[600]};
    --color-neutral-700: ${theme.colors.neutral[700]};
    --color-neutral-800: ${theme.colors.neutral[800]};
    --color-neutral-900: ${theme.colors.neutral[900]};
    
    --color-success-50: ${theme.colors.success[50]};
    --color-success-100: ${theme.colors.success[100]};
    --color-success-200: ${theme.colors.success[200]};
    --color-success-300: ${theme.colors.success[300]};
    --color-success-400: ${theme.colors.success[400]};
    --color-success-500: ${theme.colors.success[500]};
    --color-success-600: ${theme.colors.success[600]};
    --color-success-700: ${theme.colors.success[700]};
    --color-success-800: ${theme.colors.success[800]};
    --color-success-900: ${theme.colors.success[900]};
    
    --color-warning-50: ${theme.colors.warning[50]};
    --color-warning-100: ${theme.colors.warning[100]};
    --color-warning-200: ${theme.colors.warning[200]};
    --color-warning-300: ${theme.colors.warning[300]};
    --color-warning-400: ${theme.colors.warning[400]};
    --color-warning-500: ${theme.colors.warning[500]};
    --color-warning-600: ${theme.colors.warning[600]};
    --color-warning-700: ${theme.colors.warning[700]};
    --color-warning-800: ${theme.colors.warning[800]};
    --color-warning-900: ${theme.colors.warning[900]};
    
    --color-error-50: ${theme.colors.error[50]};
    --color-error-100: ${theme.colors.error[100]};
    --color-error-200: ${theme.colors.error[200]};
    --color-error-300: ${theme.colors.error[300]};
    --color-error-400: ${theme.colors.error[400]};
    --color-error-500: ${theme.colors.error[500]};
    --color-error-600: ${theme.colors.error[600]};
    --color-error-700: ${theme.colors.error[700]};
    --color-error-800: ${theme.colors.error[800]};
    --color-error-900: ${theme.colors.error[900]};
    
    --color-info-50: ${theme.colors.info[50]};
    --color-info-100: ${theme.colors.info[100]};
    --color-info-200: ${theme.colors.info[200]};
    --color-info-300: ${theme.colors.info[300]};
    --color-info-400: ${theme.colors.info[400]};
    --color-info-500: ${theme.colors.info[500]};
    --color-info-600: ${theme.colors.info[600]};
    --color-info-700: ${theme.colors.info[700]};
    --color-info-800: ${theme.colors.info[800]};
    --color-info-900: ${theme.colors.info[900]};
    
    /* Typography */
    --font-primary: ${theme.fonts.primary};
    --font-mono: ${theme.fonts.mono};
    
    /* Spacing */
    --spacing-1: ${theme.spacing[1]};
    --spacing-2: ${theme.spacing[2]};
    --spacing-3: ${theme.spacing[3]};
    --spacing-4: ${theme.spacing[4]};
    --spacing-5: ${theme.spacing[5]};
    --spacing-6: ${theme.spacing[6]};
    --spacing-8: ${theme.spacing[8]};
    --spacing-10: ${theme.spacing[10]};
    --spacing-12: ${theme.spacing[12]};
    --spacing-16: ${theme.spacing[16]};
    --spacing-20: ${theme.spacing[20]};
    --spacing-24: ${theme.spacing[24]};
    --spacing-32: ${theme.spacing[32]};
    
    /* Border Radius */
    --radius-sm: ${theme.borderRadius.sm};
    --radius-base: ${theme.borderRadius.base};
    --radius-md: ${theme.borderRadius.md};
    --radius-lg: ${theme.borderRadius.lg};
    --radius-xl: ${theme.borderRadius.xl};
    --radius-2xl: ${theme.borderRadius['2xl']};
    --radius-3xl: ${theme.borderRadius['3xl']};
    --radius-full: ${theme.borderRadius.full};
    
    /* Shadows */
    --shadow-sm: ${theme.shadows.sm};
    --shadow-base: ${theme.shadows.base};
    --shadow-md: ${theme.shadows.md};
    --shadow-lg: ${theme.shadows.lg};
    --shadow-xl: ${theme.shadows.xl};
    --shadow-2xl: ${theme.shadows['2xl']};
    
    /* Transitions */
    --transition-default: ${theme.transitions.default};
    --transition-fast: ${theme.transitions.fast};
    --transition-slow: ${theme.transitions.slow};
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: ${theme.lineHeights.normal};
    color: var(--color-neutral-800);
    background-color: var(--color-neutral-50);
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: inherit;
    
    &:disabled {
      cursor: not-allowed;
    }
  }

  a {
    color: inherit;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  input, textarea, select {
    font-family: inherit;
    outline: none;
    border: none;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    
    @media (min-width: 768px) {
      padding: 0 2rem;
    }
  }

  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }

  .mb-1 { margin-bottom: 0.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-3 { margin-bottom: 0.75rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-5 { margin-bottom: 1.25rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .mb-8 { margin-bottom: 2rem; }
  .mb-10 { margin-bottom: 2.5rem; }
  .mb-12 { margin-bottom: 3rem; }

  .mt-1 { margin-top: 0.25rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-3 { margin-top: 0.75rem; }
  .mt-4 { margin-top: 1rem; }
  .mt-5 { margin-top: 1.25rem; }
  .mt-6 { margin-top: 1.5rem; }
  .mt-8 { margin-top: 2rem; }
  .mt-10 { margin-top: 2.5rem; }
  .mt-12 { margin-top: 3rem; }

  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .font-medium { font-weight: 500; }
  .font-normal { font-weight: 400; }

  .text-sm { font-size: 0.875rem; }
  .text-base { font-size: 1rem; }
  .text-lg { font-size: 1.125rem; }
  .text-xl { font-size: 1.25rem; }
  .text-2xl { font-size: 1.5rem; }
  .text-3xl { font-size: 1.875rem; }
  .text-4xl { font-size: 2.25rem; }
  .text-5xl { font-size: 3rem; }

  .text-neutral-400 { color: var(--color-neutral-400); }
  .text-neutral-500 { color: var(--color-neutral-500); }
  .text-neutral-600 { color: var(--color-neutral-600); }
  .text-neutral-700 { color: var(--color-neutral-700); }
  .text-neutral-800 { color: var(--color-neutral-800); }
  .text-neutral-900 { color: var(--color-neutral-900); }

  .text-primary-500 { color: var(--color-primary-500); }
  .text-primary-600 { color: var(--color-primary-600); }
  .text-primary-700 { color: var(--color-primary-700); }
  
  .text-error-500 { color: var(--color-error-500); }
  .text-error-600 { color: var(--color-error-600); }
  .text-success-500 { color: var(--color-success-500); }
  .text-success-600 { color: var(--color-success-600); }
  .text-warning-500 { color: var(--color-warning-500); }
  .text-warning-600 { color: var(--color-warning-600); }
  .text-info-500 { color: var(--color-info-500); }
  .text-info-600 { color: var(--color-info-600); }

  .bg-white { background-color: var(--color-neutral-0); }
  .bg-neutral-50 { background-color: var(--color-neutral-50); }
  .bg-neutral-100 { background-color: var(--color-neutral-100); }
  .bg-neutral-200 { background-color: var(--color-neutral-200); }
  .bg-primary-50 { background-color: var(--color-primary-50); }
  .bg-primary-500 { background-color: var(--color-primary-500); }
  .bg-primary-600 { background-color: var(--color-primary-600); }

  .border { border: 1px solid var(--color-neutral-200); }
  .border-neutral-200 { border-color: var(--color-neutral-200); }
  .border-neutral-300 { border-color: var(--color-neutral-300); }
  .border-primary-500 { border-color: var(--color-primary-500); }

  .rounded { border-radius: 0.25rem; }
  .rounded-md { border-radius: 0.375rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-xl { border-radius: 0.75rem; }
  .rounded-2xl { border-radius: 1rem; }

  .shadow { box-shadow: var(--shadow-base); }
  .shadow-sm { box-shadow: var(--shadow-sm); }
  .shadow-md { box-shadow: var(--shadow-md); }
  .shadow-lg { box-shadow: var(--shadow-lg); }
  .shadow-xl { box-shadow: var(--shadow-xl); }
  .shadow-2xl { box-shadow: var(--shadow-2xl); }

  .hidden { display: none; }
  .block { display: block; }
  .inline { display: inline; }
  .inline-block { display: inline-block; }
  .flex { display: flex; }
  .grid { display: grid; }

  .items-center { align-items: center; }
  .items-start { align-items: flex-start; }
  .items-end { align-items: flex-end; }

  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .justify-start { justify-content: flex-start; }
  .justify-end { justify-content: flex-end; }

  .w-full { width: 100%; }
  .h-full { height: 100%; }
  .min-h-screen { min-height: 100vh; }

  .p-1 { padding: 0.25rem; }
  .p-2 { padding: 0.5rem; }
  .p-3 { padding: 0.75rem; }
  .p-4 { padding: 1rem; }
  .p-5 { padding: 1.25rem; }
  .p-6 { padding: 1.5rem; }
  .p-8 { padding: 2rem; }

  .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
  .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .px-8 { padding-left: 2rem; padding-right: 2rem; }

  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
  .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
  .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
  .py-8 { padding-top: 2rem; padding-bottom: 2rem; }

  @media (max-width: 768px) {
    .mobile-hidden { display: none; }
    .mobile-block { display: block; }
  }

  @media (min-width: 768px) {
    .desktop-hidden { display: none; }
    .desktop-block { display: block; }
  }
`;

export default GlobalStyles;