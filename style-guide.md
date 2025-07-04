# Frontend Style Guide - SiteCraft

## Overview
This style guide defines a practical, context-specific design system for SiteCraft. Variables are named based on their actual usage in the interface for easier development.

## Semantic Color System

### Background Colors
```css
:root {
  /* Page & Layout Backgrounds */
  --bg-page: #fafafa;                    /* Main page background */
  --bg-card: #ffffff;                    /* Card/panel backgrounds */
  --bg-sidebar: #f8fafc;                 /* Sidebar background */
  --bg-header: #ffffff;                  /* Header background */
  --bg-footer: #1e293b;                  /* Footer background */
  --bg-overlay: rgba(0, 0, 0, 0.5);      /* Modal overlay */
  
  /* Interactive Backgrounds */
  --bg-button-primary: #2563eb;          /* Primary action buttons */
  --bg-button-secondary: #e2e8f0;        /* Secondary buttons */
  --bg-button-danger: #dc2626;           /* Destructive actions */
  --bg-button-success: #16a34a;          /* Success actions */
  --bg-input: #ffffff;                   /* Form inputs */
  --bg-input-disabled: #f1f5f9;          /* Disabled inputs */
  
  /* State Backgrounds */
  --bg-hover-light: #f1f5f9;             /* Light hover state */
  --bg-hover-primary: #1d4ed8;           /* Primary hover state */
  --bg-selected: #dbeafe;                /* Selected item background */
  --bg-focus: #eff6ff;                   /* Focus state background */
  
  /* Status Backgrounds */
  --bg-success-light: #f0fdf4;           /* Success message background */
  --bg-warning-light: #fffbeb;           /* Warning message background */
  --bg-error-light: #fef2f2;             /* Error message background */
  --bg-info-light: #eff6ff;              /* Info message background */
}
```

### Text Colors
```css
:root {
  /* Primary Text */
  --text-primary: #0f172a;               /* Main headings and important text */
  --text-secondary: #475569;             /* Body text and descriptions */
  --text-muted: #64748b;                 /* Subtle text and labels */
  --text-disabled: #cbd5e1;              /* Disabled text */
  
  /* Interactive Text */
  --text-link: #2563eb;                  /* Links and clickable text */
  --text-link-hover: #1d4ed8;            /* Link hover state */
  --text-button-primary: #ffffff;        /* Text on primary buttons */
  --text-button-secondary: #374151;      /* Text on secondary buttons */
  
  /* Status Text */
  --text-success: #16a34a;               /* Success messages */
  --text-warning: #d97706;               /* Warning messages */
  --text-error: #dc2626;                 /* Error messages */
  --text-info: #2563eb;                  /* Info messages */
  
  /* Special Text */
  --text-brand: #2563eb;                 /* Brand/logo text */
  --text-inverse: #ffffff;               /* Text on dark backgrounds */
  --text-placeholder: #94a3b8;           /* Input placeholder text */
}
```

### Border Colors
```css
:root {
  /* Structural Borders */
  --border-light: #e2e8f0;               /* Subtle borders and dividers */
  --border-medium: #cbd5e1;              /* Standard borders */
  --border-strong: #94a3b8;              /* Emphasized borders */
  
  /* Interactive Borders */
  --border-input: #d1d5db;               /* Input field borders */
  --border-input-focus: #2563eb;         /* Focused input borders */
  --border-input-error: #dc2626;         /* Error state borders */
  --border-button: #d1d5db;              /* Button borders */
  
  /* Status Borders */
  --border-success: #16a34a;             /* Success state borders */
  --border-warning: #d97706;             /* Warning state borders */
  --border-error: #dc2626;               /* Error state borders */
  --border-info: #2563eb;                /* Info state borders */
}
```

### Accent Colors
```css
:root {
  /* Brand Accents */
  --accent-brand: #2563eb;               /* Primary brand color */
  --accent-brand-light: #dbeafe;         /* Light brand accent */
  --accent-brand-dark: #1e40af;          /* Dark brand accent */
  
  /* Feature Accents */
  --accent-audit: #8b5cf6;               /* Website audit feature */
  --accent-content: #06b6d4;             /* Content generation feature */
  --accent-reports: #f59e0b;             /* Reports feature */
  --accent-premium: #7c3aed;             /* Premium features */
  
  /* Interactive Accents */
  --accent-score-excellent: #22c55e;     /* Score 90-100 */
  --accent-score-good: #84cc16;          /* Score 70-89 */
  --accent-score-fair: #f59e0b;          /* Score 50-69 */
  --accent-score-poor: #ef4444;          /* Score 0-49 */
}
```

## Typography

### Font Families
```css
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
}
```

### Contextual Font Sizes
```css
:root {
  /* Page Structure */
  --text-page-title: 2.25rem;        /* Main page headings */
  --text-section-title: 1.875rem;    /* Section headings */
  --text-card-title: 1.25rem;        /* Card/component titles */
  --text-label: 0.875rem;            /* Form labels */
  
  /* Content Text */
  --text-body: 1rem;                 /* Main body text */
  --text-body-large: 1.125rem;       /* Large body text */
  --text-body-small: 0.875rem;       /* Small body text */
  --text-caption: 0.75rem;           /* Captions and fine print */
  
  /* Interface Text */
  --text-button: 0.875rem;           /* Button text */
  --text-nav: 0.875rem;              /* Navigation text */
  --text-tab: 0.875rem;              /* Tab text */
  --text-badge: 0.75rem;             /* Badge text */
  
  /* Data Display */
  --text-metric-large: 2.25rem;      /* Large metrics/scores */
  --text-metric-medium: 1.5rem;      /* Medium metrics */
  --text-metric-small: 1.125rem;     /* Small metrics */
  --text-table-header: 0.875rem;     /* Table headers */
  --text-table-data: 0.875rem;       /* Table data */
}
```

### Font Weights
```css
:root {
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Line Heights
```css
:root {
  --leading-tight: 1.25;    /* Headings and titles */
  --leading-normal: 1.5;    /* Body text */
  --leading-relaxed: 1.625; /* Large text blocks */
}
```

## Spacing System

### Layout Spacing
```css
:root {
  /* Page Layout */
  --space-page-x: 1.5rem;            /* Page horizontal padding */
  --space-page-y: 2rem;              /* Page vertical padding */
  --space-section: 4rem;             /* Between major sections */
  --space-container: 1.5rem;         /* Container padding */
  
  /* Component Spacing */
  --space-card: 1.5rem;              /* Card internal padding */
  --space-button-x: 1.5rem;          /* Button horizontal padding */
  --space-button-y: 0.75rem;         /* Button vertical padding */
  --space-input: 0.75rem;            /* Input field padding */
  --space-form-gap: 1rem;            /* Between form elements */
  
  /* Element Spacing */
  --space-stack-tight: 0.5rem;       /* Tight vertical spacing */
  --space-stack-normal: 1rem;        /* Normal vertical spacing */
  --space-stack-loose: 1.5rem;       /* Loose vertical spacing */
  --space-inline-tight: 0.5rem;      /* Tight horizontal spacing */
  --space-inline-normal: 1rem;       /* Normal horizontal spacing */
  --space-inline-loose: 1.5rem;      /* Loose horizontal spacing */
}
```

## Visual Effects

### Shadows
```css
:root {
  /* Component Shadows */
  --shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-card-hover: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-dropdown: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-modal: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-button: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-input-focus: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

### Border Radius
```css
:root {
  /* Component Radius */
  --radius-button: 0.375rem;         /* Button corners */
  --radius-input: 0.375rem;          /* Input field corners */
  --radius-card: 0.5rem;             /* Card corners */
  --radius-modal: 0.5rem;            /* Modal corners */
  --radius-badge: 0.25rem;           /* Badge corners */
  --radius-avatar: 50%;              /* Avatar/profile images */
  --radius-full: 9999px;             /* Pills and full rounded */
}
```

### Z-Index Layers
```css
:root {
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-header: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-tooltip: 1070;
  --z-toast: 1080;
}
```

## Usage Examples

### Practical Component Classes
```css
/* Page Layout */
.page-container {
  background-color: var(--bg-page);
  color: var(--text-primary);
  padding: var(--space-page-y) var(--space-page-x);
}

/* Card Component */
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-card);
  padding: var(--space-card);
  box-shadow: var(--shadow-card);
}

.card:hover {
  box-shadow: var(--shadow-card-hover);
}

/* Button Variants */
.btn-primary {
  background-color: var(--bg-button-primary);
  color: var(--text-button-primary);
  padding: var(--space-button-y) var(--space-button-x);
  border-radius: var(--radius-button);
  font-size: var(--text-button);
  font-weight: var(--font-medium);
  box-shadow: var(--shadow-button);
}

.btn-primary:hover {
  background-color: var(--bg-hover-primary);
}

.btn-secondary {
  background-color: var(--bg-button-secondary);
  color: var(--text-button-secondary);
  border: 1px solid var(--border-button);
}

/* Form Elements */
.form-input {
  background-color: var(--bg-input);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-input);
  padding: var(--space-input);
  font-size: var(--text-body);
  color: var(--text-primary);
}

.form-input:focus {
  border-color: var(--border-input-focus);
  box-shadow: var(--shadow-input-focus);
}

.form-input::placeholder {
  color: var(--text-placeholder);
}

/* Status Messages */
.alert-success {
  background-color: var(--bg-success-light);
  border: 1px solid var(--border-success);
  color: var(--text-success);
  padding: var(--space-card);
  border-radius: var(--radius-card);
}

.alert-error {
  background-color: var(--bg-error-light);
  border: 1px solid var(--border-error);
  color: var(--text-error);
  padding: var(--space-card);
  border-radius: var(--radius-card);
}

/* Audit Score Display */
.score-excellent {
  color: var(--accent-score-excellent);
}

.score-good {
  color: var(--accent-score-good);
}

.score-fair {
  color: var(--accent-score-fair);
}

.score-poor {
  color: var(--accent-score-poor);
}
```

## Implementation Guidelines

1. **Context-First**: Use semantic variable names that describe purpose, not appearance
2. **Consistency**: Always use CSS variables instead of hardcoded values
3. **Maintainability**: Group related variables together for easy updates
4. **Accessibility**: Ensure color contrast meets WCAG 2.1 AA standards
5. **Performance**: Minimize CSS custom property changes for better performance

## Integration with Components

This style guide provides semantic variables that map directly to component props and design patterns:

- **Backgrounds**: Easy to apply contextually appropriate colors
- **Text**: Clear hierarchy and purpose-driven sizing
- **Spacing**: Consistent layout patterns across components
- **Interactive States**: Unified hover, focus, and active states
- **Status Indicators**: Clear visual feedback for different states 