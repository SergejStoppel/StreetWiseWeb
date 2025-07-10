/**
 * React Hook for Branding System
 * 
 * Provides easy access to branding configuration in React components
 */

import { useMemo } from 'react';

// Import branding configuration
const { branding, getColor, getFont, getCompanyInfo } = require('../shared/branding');

export const useBranding = () => {
  const brandingData = useMemo(() => {
    return {
      // Company information
      company: branding.company,
      
      // Colors
      colors: branding.colors,
      
      // Typography
      typography: branding.typography,
      
      // Design system
      design: branding.design,
      
      // Features
      features: branding.features,
      
      // Helper functions
      getColor,
      
      getLogoUrl: (variant = 'light') => {
        return `/assets/branding/${branding.logo.primary[variant]}`;
      },
      
      getFont,
      
      isFeatureEnabled: (feature) => {
        return branding.features[feature] || false;
      },
      
      getFooterText: () => branding.legal.footerText,
      
      getSocialLinks: () => branding.social
    };
  }, []);

  return brandingData;
};

// Higher-order component for branding
export const withBranding = (Component) => {
  return (props) => {
    const branding = useBranding();
    return <Component {...props} branding={branding} />;
  };
};

// Theme provider for styled-components
export const brandingTheme = {
  colors: branding.colors,
  typography: branding.typography,
  design: branding.design,
  company: branding.company
};

export default useBranding;