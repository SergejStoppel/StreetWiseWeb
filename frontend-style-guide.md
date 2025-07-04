# Frontend Style Guide - SiteCraft

## Overview
This style guide defines the design system, color palette, typography, spacing, and component guidelines for SiteCraft. It ensures consistent UI across the application and makes it easy to maintain and update the design.

## Color Palette

### Primary Colors
```css
:root {
  /* Primary Brand Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;  /* Main primary */
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;
}
```

### Secondary Colors
```css
:root {
  /* Secondary/Accent Colors */
  --color-secondary-50: #f0f9ff;
  --color-secondary-100: #e0f2fe;
  --color-secondary-200: #bae6fd;
  --color-secondary-300: #7dd3fc;
  --color-secondary-400: #38bdf8;
  --color-secondary-500: #0ea5e9;  /* Main secondary */
  --color-secondary-600: #0284c7;
  --color-secondary-700: #0369a1;
  --color-secondary-800: #075985;
  --color-secondary-900: #0c4a6e;
  --color-secondary-950: #082f49;
}
```

### Success Colors
```css
:root {
  /* Success/Green Colors */
  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-200: #bbf7d0;
  --color-success-300: #86efac;
  --color-success-400: #4ade80;
  --color-success-500: #22c55e;  /* Main success */
  --color-success-600: #16a34a;
  --color-success-700: #15803d;
  --color-success-800: #166534;
  --color-success-900: #14532d;
  --color-success-950: #052e16;
}
```

### Warning Colors
```css
:root {
  /* Warning/Orange Colors */
  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-200: #fde68a;
  --color-warning-300: #fcd34d;
  --color-warning-400: #fbbf24;
  --color-warning-500: #f59e0b;  /* Main warning */
  --color-warning-600: #d97706;
  --color-warning-700: #b45309;
  --color-warning-800: #92400e;
  --color-warning-900: #78350f;
  --color-warning-950: #451a03;
}
```

### Error Colors
```css
:root {
  /* Error/Red Colors */
  --color-error-50: #fef2f2;
  --color-error-100: #fee2e2;
  --color-error-200: #fecaca;
  --color-error-300: #fca5a5;
  --color-error-400: #f87171;
  --color-error-500: #ef4444;  /* Main error */
  --color-error-600: #dc2626;
  --color-error-700: #b91c1c;
  --color-error-800: #991b1b;
  --color-error-900: #7f1d1d;
  --color-error-950: #450a0a;
}
```

### Neutral Colors
```css
:root {
  /* Neutral/Gray Colors */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f4f4f5;
  --color-neutral-200: #e4e4e7;
  --color-neutral-300: #d4d4d8;
  --color-neutral-400: #a1a1aa;
  --color-neutral-500: #71717a;
  --color-neutral-600: #52525b;
  --color-neutral-700: #3f3f46;
  --color-neutral-800: #27272a;
  --color-neutral-900: #18181b;
  --color-neutral-950: #09090b;
}
```

## Typography

### Font Families
```css
:root {
  /* Font Families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-secondary: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-mono: 'Fira Code', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
}
```

### Font Sizes
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 3.75rem;    /* 60px */
  --text-7xl: 4.5rem;     /* 72px */
}
```

### Font Weights
```css
:root {
  /* Font Weights */
  --font-thin: 100;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;
}
```

### Line Heights
```css
:root {
  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

## Spacing

### Spacing Scale
```css
:root {
  /* Spacing Scale */
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0-5: 0.125rem;  /* 2px */
  --spacing-1: 0.25rem;     /* 4px */
  --spacing-1-5: 0.375rem;  /* 6px */
  --spacing-2: 0.5rem;      /* 8px */
  --spacing-2-5: 0.625rem;  /* 10px */
  --spacing-3: 0.75rem;     /* 12px */
  --spacing-3-5: 0.875rem;  /* 14px */
  --spacing-4: 1rem;        /* 16px */
  --spacing-5: 1.25rem;     /* 20px */
  --spacing-6: 1.5rem;      /* 24px */
  --spacing-7: 1.75rem;     /* 28px */
  --spacing-8: 2rem;        /* 32px */
  --spacing-9: 2.25rem;     /* 36px */
  --spacing-10: 2.5rem;     /* 40px */
  --spacing-11: 2.75rem;    /* 44px */
  --spacing-12: 3rem;       /* 48px */
  --spacing-14: 3.5rem;     /* 56px */
  --spacing-16: 4rem;       /* 64px */
  --spacing-20: 5rem;       /* 80px */
  --spacing-24: 6rem;       /* 96px */
  --spacing-28: 7rem;       /* 112px */
  --spacing-32: 8rem;       /* 128px */
  --spacing-36: 9rem;       /* 144px */
  --spacing-40: 10rem;      /* 160px */
  --spacing-44: 11rem;      /* 176px */
  --spacing-48: 12rem;      /* 192px */
  --spacing-52: 13rem;      /* 208px */
  --spacing-56: 14rem;      /* 224px */
  --spacing-60: 15rem;      /* 240px */
  --spacing-64: 16rem;      /* 256px */
  --spacing-72: 18rem;      /* 288px */
  --spacing-80: 20rem;      /* 320px */
  --spacing-96: 24rem;      /* 384px */
}
```

## Border Radius

### Radius Scale
```css
:root {
  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 0.125rem;    /* 2px */
  --radius-base: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;    /* 6px */
  --radius-lg: 0.5rem;      /* 8px */
  --radius-xl: 0.75rem;     /* 12px */
  --radius-2xl: 1rem;       /* 16px */
  --radius-3xl: 1.5rem;     /* 24px */
  --radius-full: 9999px;    /* Full rounded */
}
```

## Shadows

### Shadow Scale
```css
:root {
  /* Box Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
}
```

## Layout

### Container Widths
```css
:root {
  /* Container Max Widths */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}
```

### Breakpoints
```css
:root {
  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

## Animation

### Transitions
```css
:root {
  /* Transitions */
  --transition-none: none;
  --transition-all: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-colors: color 150ms cubic-bezier(0.4, 0, 0.2, 1), 
                       background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), 
                       border-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-opacity: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-transform: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Easing Functions
```css
:root {
  /* Easing Functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Z-Index Scale

### Z-Index Layers
```css
:root {
  /* Z-Index Scale */
  --z-0: 0;
  --z-10: 10;
  --z-20: 20;
  --z-30: 30;
  --z-40: 40;
  --z-50: 50;
  --z-auto: auto;
  
  /* Semantic Z-Index */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 1080;
}
```

## Component-Specific Variables

### Button Variables
```css
:root {
  /* Button Sizes */
  --btn-height-sm: 2rem;      /* 32px */
  --btn-height-md: 2.5rem;    /* 40px */
  --btn-height-lg: 3rem;      /* 48px */
  --btn-height-xl: 3.5rem;    /* 56px */
  
  /* Button Padding */
  --btn-padding-sm: 0.5rem 0.75rem;
  --btn-padding-md: 0.625rem 1rem;
  --btn-padding-lg: 0.75rem 1.5rem;
  --btn-padding-xl: 1rem 2rem;
}
```

### Input Variables
```css
:root {
  /* Input Sizes */
  --input-height-sm: 2rem;     /* 32px */
  --input-height-md: 2.5rem;   /* 40px */
  --input-height-lg: 3rem;     /* 48px */
  
  /* Input Padding */
  --input-padding-sm: 0.5rem 0.75rem;
  --input-padding-md: 0.625rem 0.75rem;
  --input-padding-lg: 0.75rem 1rem;
}
```

### Card Variables
```css
:root {
  /* Card Padding */
  --card-padding-sm: 1rem;
  --card-padding-md: 1.5rem;
  --card-padding-lg: 2rem;
  
  /* Card Background */
  --card-bg: var(--color-neutral-50);
  --card-border: var(--color-neutral-200);
}
```

## Implementation

### Global CSS File (globals.css)
Create `src/styles/globals.css` with all the CSS variables:

```css
/* SiteCraft Global Styles */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');

:root {
  /* All CSS variables from above sections */
  /* Primary Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  /* ... (include all variables) */
}

/* Base Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-neutral-900);
  background-color: var(--color-neutral-50);
}

body {
  min-height: 100vh;
  font-feature-settings: 'cv11', 'ss01';
  font-variation-settings: 'opsz' 32;
}

/* Utility Classes */
.text-primary { color: var(--color-primary-600); }
.text-secondary { color: var(--color-secondary-600); }
.text-success { color: var(--color-success-600); }
.text-warning { color: var(--color-warning-600); }
.text-error { color: var(--color-error-600); }

.bg-primary { background-color: var(--color-primary-600); }
.bg-secondary { background-color: var(--color-secondary-600); }
.bg-success { background-color: var(--color-success-600); }
.bg-warning { background-color: var(--color-warning-600); }
.bg-error { background-color: var(--color-error-600); }

/* Focus Styles */
.focus-ring {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-neutral-50: #09090b;
    --color-neutral-100: #18181b;
    --color-neutral-200: #27272a;
    --color-neutral-300: #3f3f46;
    --color-neutral-400: #52525b;
    --color-neutral-500: #71717a;
    --color-neutral-600: #a1a1aa;
    --color-neutral-700: #d4d4d8;
    --color-neutral-800: #e4e4e7;
    --color-neutral-900: #f4f4f5;
    --color-neutral-950: #fafafa;
  }
}
```

### Tailwind Configuration
Update `tailwind.config.js` to use custom variables:

```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)',
        },
        secondary: {
          50: 'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          200: 'var(--color-secondary-200)',
          300: 'var(--color-secondary-300)',
          400: 'var(--color-secondary-400)',
          500: 'var(--color-secondary-500)',
          600: 'var(--color-secondary-600)',
          700: 'var(--color-secondary-700)',
          800: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)',
          950: 'var(--color-secondary-950)',
        },
        // ... repeat for success, warning, error, neutral
      },
      fontFamily: {
        primary: ['var(--font-primary)', 'sans-serif'],
        secondary: ['var(--font-secondary)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        '6xl': 'var(--text-6xl)',
        '7xl': 'var(--text-7xl)',
      },
      spacing: {
        '0.5': 'var(--spacing-0-5)',
        '1': 'var(--spacing-1)',
        '1.5': 'var(--spacing-1-5)',
        '2': 'var(--spacing-2)',
        '2.5': 'var(--spacing-2-5)',
        '3': 'var(--spacing-3)',
        '3.5': 'var(--spacing-3-5)',
        '4': 'var(--spacing-4)',
        '5': 'var(--spacing-5)',
        '6': 'var(--spacing-6)',
        '7': 'var(--spacing-7)',
        '8': 'var(--spacing-8)',
        '9': 'var(--spacing-9)',
        '10': 'var(--spacing-10)',
        '11': 'var(--spacing-11)',
        '12': 'var(--spacing-12)',
        '14': 'var(--spacing-14)',
        '16': 'var(--spacing-16)',
        '20': 'var(--spacing-20)',
        '24': 'var(--spacing-24)',
        '28': 'var(--spacing-28)',
        '32': 'var(--spacing-32)',
        '36': 'var(--spacing-36)',
        '40': 'var(--spacing-40)',
        '44': 'var(--spacing-44)',
        '48': 'var(--spacing-48)',
        '52': 'var(--spacing-52)',
        '56': 'var(--spacing-56)',
        '60': 'var(--spacing-60)',
        '64': 'var(--spacing-64)',
        '72': 'var(--spacing-72)',
        '80': 'var(--spacing-80)',
        '96': 'var(--spacing-96)',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        base: 'var(--radius-base)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-base)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'var(--shadow-inner)',
      },
      transitionTimingFunction: {
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      zIndex: {
        '0': 'var(--z-0)',
        '10': 'var(--z-10)',
        '20': 'var(--z-20)',
        '30': 'var(--z-30)',
        '40': 'var(--z-40)',
        '50': 'var(--z-50)',
        'auto': 'var(--z-auto)',
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
        'toast': 'var(--z-toast)',
      },
    },
  },
  plugins: [],
}
```

## Usage Guidelines

### Component Development
1. **Always use CSS variables** instead of hardcoded values
2. **Use semantic color names** (primary, secondary, success, warning, error)
3. **Follow spacing scale** for consistent margins and padding
4. **Use predefined font sizes** and weights
5. **Apply consistent border radius** across similar components

### Color Usage
- **Primary**: Main brand actions (CTA buttons, links, active states)
- **Secondary**: Supporting actions, secondary buttons
- **Success**: Positive feedback, success states
- **Warning**: Caution, warning states
- **Error**: Error states, destructive actions
- **Neutral**: Text, backgrounds, borders

### Responsive Design
- Use container widths and breakpoints consistently
- Test on all breakpoint sizes
- Ensure proper mobile experience
- Use spacing scale for responsive padding/margins

### Accessibility
- Maintain proper color contrast ratios
- Use semantic HTML elements
- Implement focus management
- Provide alternative text for images
- Use ARIA attributes where appropriate

This style guide ensures consistent, maintainable, and professional-looking UI across the entire SiteCraft application. 