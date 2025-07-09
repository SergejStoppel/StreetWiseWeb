import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* Import Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap');

  /* CSS Custom Properties (Design Tokens) */
  :root {
    /* Primary Colors - SiteCraft Brand */
    --color-primary: #007BFF;
    --color-primary-dark: #003366;
    --color-primary-light: #66B2FF;
    --color-primary-hover: #0056b3;
    
    /* Secondary Colors */
    --color-gray-light: #F8F9FA;
    --color-gray-medium: #6C757D;
    --color-gray-dark: #495057;
    --color-gray-border: #DEE2E6;
    
    /* Accent Colors */
    --color-success: #28A745;
    --color-success-light: #D4EDDA;
    --color-warning: #FFC107;
    --color-warning-light: #FFF3CD;
    --color-error: #DC3545;
    --color-error-light: #F8D7DA;
    --color-info: #17A2B8;
    --color-info-light: #D1ECF1;
    
    /* Neutral Colors */
    --color-white: #FFFFFF;
    --color-black: #212529;
    --color-text-primary: #212529;
    --color-text-secondary: #6C757D;
    --color-text-muted: #ADB5BD;
    
    /* Background Colors */
    --color-bg-primary: #FFFFFF;
    --color-bg-secondary: #F8F9FA;
    --color-bg-tertiary: #E9ECEF;
    
    /* Typography */
    --font-primary: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-secondary: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    /* Font Weights */
    --font-weight-regular: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    
    /* Font Sizes (Responsive using clamp) */
    --font-size-h1: clamp(2.25rem, 5vw, 4rem);
    --font-size-h2: clamp(1.75rem, 4vw, 3rem);
    --font-size-h3: clamp(1.25rem, 3vw, 2rem);
    --font-size-h4: clamp(1.125rem, 2.5vw, 1.5rem);
    --font-size-body: clamp(0.875rem, 2vw, 1.125rem);
    --font-size-small: clamp(0.75rem, 1.5vw, 0.875rem);
    --font-size-button: 1rem;
    
    /* Line Heights */
    --line-height-tight: 1.25;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;
    
    /* Letter Spacing */
    --letter-spacing-tight: -0.025em;
    --letter-spacing-normal: 0;
    --letter-spacing-wide: 0.025em;
    
    /* Spacing Scale */
    --spacing-xs: 0.5rem;
    --spacing-sm: 1rem;
    --spacing-md: 2rem;
    --spacing-lg: 3rem;
    --spacing-xl: 4rem;
    --spacing-2xl: 6rem;
    --spacing-3xl: 8rem;
    
    /* Layout */
    --container-max-width: 1200px;
    --container-padding: var(--spacing-sm);
    --content-max-width: 65ch;
    
    /* Border Radius */
    --border-radius-sm: 4px;
    --border-radius-md: 8px;
    --border-radius-lg: 12px;
    --border-radius-xl: 16px;
    --border-radius-full: 9999px;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    /* Transitions */
    --transition-fast: 150ms ease-in-out;
    --transition-normal: 250ms ease-in-out;
    --transition-slow: 350ms ease-in-out;
    
    /* Z-Index Scale */
    --z-dropdown: 1000;
    --z-sticky: 1020;
    --z-fixed: 1030;
    --z-modal-backdrop: 1040;
    --z-modal: 1050;
    --z-popover: 1060;
    --z-tooltip: 1070;
  }

  /* Dark mode support (for future implementation) */
  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg-primary: #1a202c;
      --color-bg-secondary: #2d3748;
      --color-text-primary: #f7fafc;
      --color-text-secondary: #e2e8f0;
    }
  }

  /* Reset and Base Styles */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-secondary);
    font-size: var(--font-size-body);
    line-height: var(--line-height-normal);
    color: var(--color-text-primary);
    background-color: var(--color-bg-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Typography Base Styles */
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-primary);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    margin-bottom: var(--spacing-sm);
    color: var(--color-text-primary);
  }

  h1 {
    font-size: var(--font-size-h1);
    margin-bottom: var(--spacing-md);
  }

  h2 {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-semibold);
  }

  h3 {
    font-size: var(--font-size-h3);
    font-weight: var(--font-weight-semibold);
  }

  h4 {
    font-size: var(--font-size-h4);
    font-weight: var(--font-weight-medium);
  }

  p {
    margin-bottom: var(--spacing-sm);
    max-width: var(--content-max-width);
  }

  /* Link Styles */
  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  a:hover,
  a:focus {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }

  a:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* List Styles */
  ul, ol {
    margin-bottom: var(--spacing-sm);
    padding-left: var(--spacing-md);
  }

  li {
    margin-bottom: var(--spacing-xs);
  }

  /* Container Utility */
  .container {
    max-width: var(--container-max-width);
    margin: 0 auto;
    padding: 0 var(--container-padding);

    @media (min-width: 640px) {
      padding: 0 var(--spacing-md);
    }
  }

  /* Section Spacing */
  .section {
    padding: var(--spacing-xl) 0;
  }

  .section-sm {
    padding: var(--spacing-lg) 0;
  }

  .section-lg {
    padding: var(--spacing-2xl) 0;
  }

  /* Focus Styles for Accessibility */
  *:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Reduced Motion Support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Common Utility Classes */
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

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }

  .hidden { display: none; }

  @media (max-width: 768px) {
    .hidden-mobile { display: none; }
  }

  @media (min-width: 769px) {
    .hidden-desktop { display: none; }
  }
`;

export default GlobalStyles;