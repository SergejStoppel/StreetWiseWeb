/**
 * Internationalization Configuration
 * 
 * This module defines the core i18n configuration including supported languages,
 * default settings, and common utilities for both frontend and backend.
 * Designed to be modular and easily extensible for additional languages.
 */

const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
    currency: 'USD'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'es-ES',
    currency: 'EUR'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'de-DE',
    currency: 'EUR'
  }
};

const I18N_CONFIG = {
  // Default language when none is specified
  defaultLanguage: 'en',
  
  // Fallback language if translation is missing
  fallbackLanguage: 'en',
  
  // Supported languages
  supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
  
  // Language detection settings
  detection: {
    // Order of language detection methods
    order: ['localStorage', 'navigator', 'header', 'default'],
    
    // Cache language selection
    caches: ['localStorage'],
    
    // Local storage key
    storageKey: 'sitecraft_language'
  },
  
  // Namespace configuration for organized translations
  namespaces: {
    common: 'common',           // Common UI elements
    navigation: 'navigation',   // Navigation and menus
    forms: 'forms',            // Form labels and validation
    analysis: 'analysis',      // Accessibility analysis terms
    reports: 'reports',        // Report generation and content
    dashboard: 'dashboard',    // User dashboard
    auth: 'auth',             // Authentication pages
    pricing: 'pricing',       // Pricing and plans
    errors: 'errors',         // Error messages
    emails: 'emails'          // Email templates
  },
  
  // Default namespace to use
  defaultNamespace: 'common',
  
  // How to handle missing translations
  fallbackNS: 'common',
  
  // Translation interpolation settings
  interpolation: {
    escapeValue: false,  // React already does escaping
    format: function(value, format, lng) {
      if (format === 'number') {
        const locale = SUPPORTED_LANGUAGES[lng]?.numberFormat || 'en-US';
        return new Intl.NumberFormat(locale).format(value);
      }
      if (format === 'currency') {
        const locale = SUPPORTED_LANGUAGES[lng]?.numberFormat || 'en-US';
        const currency = SUPPORTED_LANGUAGES[lng]?.currency || 'USD';
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency
        }).format(value);
      }
      if (format === 'date') {
        const locale = SUPPORTED_LANGUAGES[lng]?.numberFormat || 'en-US';
        return new Intl.DateTimeFormat(locale).format(new Date(value));
      }
      return value;
    }
  }
};

/**
 * Get language configuration by code
 */
function getLanguageConfig(languageCode) {
  return SUPPORTED_LANGUAGES[languageCode] || SUPPORTED_LANGUAGES[I18N_CONFIG.defaultLanguage];
}

/**
 * Check if a language is supported
 */
function isLanguageSupported(languageCode) {
  return I18N_CONFIG.supportedLanguages.includes(languageCode);
}

/**
 * Get the best matching language from browser preferences
 */
function detectBrowserLanguage(acceptLanguageHeader) {
  if (!acceptLanguageHeader) return I18N_CONFIG.defaultLanguage;
  
  const languages = acceptLanguageHeader
    .split(',')
    .map(lang => {
      const [code, quality = '1'] = lang.trim().split(';q=');
      return { code: code.split('-')[0], quality: parseFloat(quality) };
    })
    .sort((a, b) => b.quality - a.quality);
  
  for (const lang of languages) {
    if (isLanguageSupported(lang.code)) {
      return lang.code;
    }
  }
  
  return I18N_CONFIG.defaultLanguage;
}

/**
 * Get localized date format
 */
function getLocalizedDate(date, languageCode, options = {}) {
  const config = getLanguageConfig(languageCode);
  const locale = config.numberFormat;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(new Date(date));
}

/**
 * Get localized number format
 */
function getLocalizedNumber(number, languageCode, options = {}) {
  const config = getLanguageConfig(languageCode);
  const locale = config.numberFormat;
  
  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Get resource path for a language and namespace
 */
function getResourcePath(languageCode, namespace) {
  return `/locales/${languageCode}/${namespace}.json`;
}

module.exports = {
  SUPPORTED_LANGUAGES,
  I18N_CONFIG,
  getLanguageConfig,
  isLanguageSupported,
  detectBrowserLanguage,
  getLocalizedDate,
  getLocalizedNumber,
  getResourcePath
};