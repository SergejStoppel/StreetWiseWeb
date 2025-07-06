import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.6;
    color: #1a202c;
    background-color: #f8fafc;
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

  .text-gray-500 { color: #6b7280; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-700 { color: #374151; }
  .text-gray-800 { color: #1f2937; }
  .text-gray-900 { color: #111827; }

  .text-red-500 { color: #ef4444; }
  .text-red-600 { color: #dc2626; }
  .text-green-500 { color: #10b981; }
  .text-green-600 { color: #059669; }
  .text-blue-500 { color: #3b82f6; }
  .text-blue-600 { color: #2563eb; }
  .text-yellow-500 { color: #f59e0b; }
  .text-yellow-600 { color: #d97706; }

  .bg-white { background-color: #ffffff; }
  .bg-gray-50 { background-color: #f9fafb; }
  .bg-gray-100 { background-color: #f3f4f6; }
  .bg-gray-200 { background-color: #e5e7eb; }

  .border { border: 1px solid #e5e7eb; }
  .border-gray-200 { border-color: #e5e7eb; }
  .border-gray-300 { border-color: #d1d5db; }

  .rounded { border-radius: 0.25rem; }
  .rounded-md { border-radius: 0.375rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-xl { border-radius: 0.75rem; }
  .rounded-2xl { border-radius: 1rem; }

  .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
  .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
  .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
  .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }

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