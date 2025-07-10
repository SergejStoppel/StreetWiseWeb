/**
 * Branding Utilities
 * 
 * Helper functions for working with the branding system across different environments
 */

const branding = require('./index');
const path = require('path');

class BrandingUtils {
  /**
   * Get logo path for different contexts
   */
  static getLogoPath(type = 'primary', variant = 'light', context = 'web') {
    const logoFile = branding.logo[type][variant];
    
    if (context === 'pdf' || context === 'backend') {
      return path.join(__dirname, 'assets', logoFile);
    }
    
    // For web/frontend context
    return `/shared/branding/assets/${logoFile}`;
  }

  /**
   * Get company information with fallbacks
   */
  static getCompanyInfo() {
    return {
      name: branding.company.name,
      tagline: branding.company.tagline,
      website: branding.company.website,
      email: branding.company.email,
      phone: branding.company.phone,
      address: branding.company.address
    };
  }

  /**
   * Get color value by path (e.g., 'primary.500', 'neutral.800')
   */
  static getColor(colorPath) {
    const [category, shade] = colorPath.split('.');
    return branding.colors[category]?.[shade] || null;
  }

  /**
   * Get CSS variable name for a color
   */
  static getColorVar(colorPath) {
    const [category, shade] = colorPath.split('.');
    return `--brand-${category}-${shade}`;
  }

  /**
   * Get font family with fallbacks
   */
  static getFont(type = 'primary') {
    const font = branding.typography.fonts[type];
    return `"${font.name}", ${font.fallback}`;
  }

  /**
   * Get PDF-specific configuration
   */
  static getPDFConfig() {
    return {
      pageSize: branding.pdf.pageSize,
      margins: branding.pdf.margins,
      fonts: branding.pdf.fonts,
      watermark: branding.pdf.watermark
    };
  }

  /**
   * Generate CSS custom properties string
   */
  static generateCSSVariables() {
    let css = ':root {\n';
    
    // Colors
    Object.entries(branding.colors).forEach(([category, shades]) => {
      Object.entries(shades).forEach(([shade, value]) => {
        css += `  --brand-${category}-${shade}: ${value};\n`;
      });
    });
    
    // Typography
    css += `  --brand-font-primary: ${this.getFont('primary')};\n`;
    css += `  --brand-font-headings: ${this.getFont('headings')};\n`;
    css += `  --brand-font-monospace: ${this.getFont('monospace')};\n`;
    
    // Font sizes
    Object.entries(branding.typography.scales).forEach(([size, value]) => {
      css += `  --brand-text-${size}: ${value};\n`;
    });
    
    css += '}\n';
    return css;
  }

  /**
   * Get branded footer text
   */
  static getFooterText() {
    return `${branding.legal.footerText} • ${branding.company.website}`;
  }

  /**
   * Get social media links
   */
  static getSocialLinks() {
    return branding.social;
  }

  /**
   * Check if a feature is enabled
   */
  static isFeatureEnabled(feature) {
    return branding.features[feature] || false;
  }

  /**
   * Get legal disclaimer text
   */
  static getLegalDisclaimer() {
    return branding.legal.disclaimer;
  }

  /**
   * Get certification badges
   */
  static getCertifications() {
    return branding.legal.certifications;
  }

  /**
   * Get responsive logo sizes
   */
  static getLogoSizes() {
    return branding.logo.sizes;
  }

  /**
   * Generate email signature HTML
   */
  static generateEmailSignature() {
    const company = this.getCompanyInfo();
    const primaryColor = this.getColor('primary.500');
    
    return `
      <div style="font-family: ${this.getFont('primary')}; color: #374151;">
        <div style="border-top: 2px solid ${primaryColor}; padding-top: 16px; margin-top: 16px;">
          <h4 style="margin: 0; color: ${primaryColor}; font-size: 16px;">${company.name}</h4>
          <p style="margin: 4px 0; font-size: 14px; color: #6B7280;">${company.tagline}</p>
          <p style="margin: 8px 0 0 0; font-size: 14px;">
            <a href="${company.website}" style="color: ${primaryColor}; text-decoration: none;">${company.website}</a> | 
            <a href="mailto:${company.email}" style="color: ${primaryColor}; text-decoration: none;">${company.email}</a>
          </p>
        </div>
      </div>
    `;
  }
}

module.exports = BrandingUtils;