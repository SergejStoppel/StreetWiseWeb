/**
 * Centralized Branding Configuration
 * 
 * This file contains all branding elements that are used across the entire platform,
 * including frontend website, PDF reports, email templates, and any other branded materials.
 * 
 * Update this file to customize the branding for your StreetWiseWeb installation.
 */

const path = require('path');

const brandingConfig = {
  // Company Information
  company: {
    name: "StreetWiseWeb",
    tagline: "Professional Web Accessibility Analysis",
    description: "Making the web accessible for everyone",
    website: "https://streetwiseweb.com",
    email: "contact@streetwiseweb.com",
    phone: "+1 (555) 123-4567",
    address: {
      street: "123 Accessibility Lane",
      city: "Tech City",
      state: "CA",
      zip: "90210",
      country: "United States"
    }
  },

  // Visual Identity
  logo: {
    // Logo files should be placed in /shared/branding/assets/
    primary: {
      light: "logo-light.png",        // Logo for light backgrounds
      dark: "logo-dark.png",          // Logo for dark backgrounds
      pdf: "logo-pdf.png"             // High-resolution logo for PDF
    },
    favicon: "favicon.ico",
    sizes: {
      small: { width: 120, height: 40 },   // Header logo
      medium: { width: 200, height: 67 },  // PDF header
      large: { width: 300, height: 100 }   // Cover page
    }
  },

  // Color Palette
  colors: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe", 
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",  // Main brand color
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a"
    },
    secondary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd", 
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",  // Secondary brand color
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e"
    },
    success: {
      500: "#10b981",
      600: "#059669"
    },
    warning: {
      500: "#f59e0b",
      600: "#d97706"
    },
    error: {
      500: "#ef4444",
      600: "#dc2626"
    },
    neutral: {
      0: "#ffffff",
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827"
    }
  },

  // Typography
  typography: {
    fonts: {
      primary: {
        name: "Inter",
        fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        weights: [400, 500, 600, 700, 800]
      },
      headings: {
        name: "Inter",
        fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
        weights: [600, 700, 800]
      },
      monospace: {
        name: "JetBrains Mono",
        fallback: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace",
        weights: [400, 500, 600]
      }
    },
    scales: {
      // Font sizes in rem units
      xs: "0.75rem",    // 12px
      sm: "0.875rem",   // 14px  
      base: "1rem",     // 16px
      lg: "1.125rem",   // 18px
      xl: "1.25rem",    // 20px
      "2xl": "1.5rem",  // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem"     // 48px
    }
  },

  // Design System
  design: {
    borderRadius: {
      sm: "0.125rem",
      md: "0.375rem", 
      lg: "0.5rem",
      xl: "0.75rem",
      "2xl": "1rem",
      full: "9999px"
    },
    spacing: {
      xs: "0.5rem",
      sm: "1rem",
      md: "1.5rem",
      lg: "2rem",
      xl: "3rem",
      "2xl": "4rem"
    },
    shadows: {
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    }
  },

  // PDF-Specific Settings
  pdf: {
    pageSize: "A4",
    margins: {
      top: 60,
      bottom: 60, 
      left: 50,
      right: 50
    },
    fonts: {
      primary: "Helvetica",
      bold: "Helvetica-Bold",
      italic: "Helvetica-Oblique"
    },
    watermark: {
      enabled: false,
      text: "CONFIDENTIAL",
      opacity: 0.1
    }
  },

  // Legal & Compliance
  legal: {
    footerText: "Professional Web Accessibility Analysis",
    disclaimer: "This report is for informational purposes only and does not constitute legal advice. Consult with a qualified attorney for legal guidance on accessibility compliance.",
    certifications: [
      "WCAG 2.1 AA Compliant Analysis",
      "ADA Title III Assessment", 
      "Section 508 Evaluation"
    ]
  },

  // Social Media & Marketing
  social: {
    linkedin: "https://linkedin.com/company/streetwiseweb",
    twitter: "https://twitter.com/streetwiseweb",
    facebook: "https://facebook.com/streetwiseweb",
    github: "https://github.com/streetwiseweb"
  },

  // Feature Flags for Customization
  features: {
    showLogo: true,
    showTagline: true,
    showSocialLinks: true,
    showCertifications: true,
    enableWatermark: false,
    customFooter: true
  }
};

// Export configuration
module.exports = brandingConfig;

// For ES6 environments
if (typeof window !== 'undefined') {
  window.STREETWISEWEB_BRANDING = brandingConfig;
}