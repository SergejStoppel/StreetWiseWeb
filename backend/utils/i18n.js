/**
 * Backend i18n utility for loading and managing translations
 * Loads the same translation files used by the frontend
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class I18nManager {
  constructor() {
    this.translations = {};
    this.defaultLanguage = 'en';
    this.supportedLanguages = ['en', 'es', 'de'];
    this.localesPath = path.join(__dirname, '../../frontend/public/locales');
    
    // Load all translations on initialization
    this.loadTranslations();
  }

  /**
   * Load all translation files from the frontend locales directory
   */
  loadTranslations() {
    try {
      console.log('DEBUG: i18n - Loading translations from:', this.localesPath);
      console.log('DEBUG: i18n - Locales path exists:', fs.existsSync(this.localesPath));
      
      this.supportedLanguages.forEach(lang => {
        this.translations[lang] = {};
        const langPath = path.join(this.localesPath, lang);
        console.log(`DEBUG: i18n - Checking language path for ${lang}:`, langPath);
        console.log(`DEBUG: i18n - Language path exists for ${lang}:`, fs.existsSync(langPath));
        
        if (fs.existsSync(langPath)) {
          const files = fs.readdirSync(langPath);
          console.log(`DEBUG: i18n - Found files for ${lang}:`, files);
          files.forEach(file => {
            if (file.endsWith('.json')) {
              const namespace = file.replace('.json', '');
              const filePath = path.join(langPath, file);
              try {
                const content = fs.readFileSync(filePath, 'utf8');
                this.translations[lang][namespace] = JSON.parse(content);
                console.log(`DEBUG: i18n - Loaded ${lang}/${namespace} with ${Object.keys(this.translations[lang][namespace]).length} keys`);
                if (namespace === 'reports' && lang === 'de') {
                  console.log('DEBUG: i18n - German reports translation sample:', this.translations[lang][namespace].pdf?.documentTitle);
                }
              } catch (error) {
                logger.error(`Failed to load translation file ${filePath}:`, error);
              }
            }
          });
        } else {
          console.log(`DEBUG: i18n - Language path does not exist for ${lang}:`, langPath);
        }
      });
      
      logger.info('Translations loaded successfully', { 
        languages: this.supportedLanguages,
        namespaces: Object.keys(this.translations.en || {})
      });
    } catch (error) {
      logger.error('Failed to load translations:', error);
    }
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key in format "namespace:key" or "namespace:nested.key"
   * @param {string} language - Language code (en, es, de)
   * @param {object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  t(key, language = this.defaultLanguage, params = {}) {
    try {
      console.log(`DEBUG: i18n.t() called with key="${key}", language="${language}"`);
      
      // Ensure language is supported
      if (!this.supportedLanguages.includes(language)) {
        console.log(`DEBUG: i18n.t() - Language ${language} not supported, falling back to ${this.defaultLanguage}`);
        language = this.defaultLanguage;
      }

      // Parse key into namespace and path
      const [namespace, ...keyParts] = key.split(':');
      const keyPath = keyParts.join(':');
      console.log(`DEBUG: i18n.t() - Parsed namespace="${namespace}", keyPath="${keyPath}"`);

      // Get translation from namespace
      const translations = this.translations[language]?.[namespace];
      console.log(`DEBUG: i18n.t() - Translations for ${language}/${namespace} exists:`, !!translations);
      
      if (!translations) {
        // Fallback to default language
        const fallbackTranslations = this.translations[this.defaultLanguage]?.[namespace];
        console.log(`DEBUG: i18n.t() - Falling back to ${this.defaultLanguage}/${namespace}:`, !!fallbackTranslations);
        if (!fallbackTranslations) {
          console.log(`DEBUG: i18n.t() - No translations found, returning key:`, key);
          return key; // Return key if no translation found
        }
        const result = this.getNestedValue(fallbackTranslations, keyPath, params) || key;
        console.log(`DEBUG: i18n.t() - Fallback result:`, result);
        return result;
      }

      const translation = this.getNestedValue(translations, keyPath, params);
      console.log(`DEBUG: i18n.t() - Found translation:`, translation);
      
      // Fallback to default language if not found
      if (!translation && language !== this.defaultLanguage) {
        const fallbackTranslations = this.translations[this.defaultLanguage]?.[namespace];
        if (fallbackTranslations) {
          const fallbackResult = this.getNestedValue(fallbackTranslations, keyPath, params) || key;
          console.log(`DEBUG: i18n.t() - Using fallback result:`, fallbackResult);
          return fallbackResult;
        }
      }

      const result = translation || key;
      console.log(`DEBUG: i18n.t() - Final result:`, result);
      return result;
    } catch (error) {
      logger.error('Translation error:', { key, language, error: error.message });
      console.log(`DEBUG: i18n.t() - Error occurred, returning key:`, key);
      return key;
    }
  }

  /**
   * Get nested value from object using dot notation
   * @param {object} obj - Object to search
   * @param {string} path - Dot notation path
   * @param {object} params - Parameters for interpolation
   * @returns {string} Value with parameters interpolated
   */
  getNestedValue(obj, path, params = {}) {
    if (!path) return obj;
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    
    // Interpolate parameters
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return this.interpolate(value, params);
    }
    
    return value;
  }

  /**
   * Interpolate parameters into translation string
   * @param {string} text - Text with placeholders
   * @param {object} params - Parameters to interpolate
   * @returns {string} Interpolated text
   */
  interpolate(text, params) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Get formatted date for language
   * @param {Date} date - Date to format
   * @param {string} language - Language code
   * @returns {string} Formatted date
   */
  formatDate(date, language = this.defaultLanguage) {
    try {
      const localeMap = {
        en: 'en-US',
        es: 'es-ES',
        de: 'de-DE'
      };
      
      const locale = localeMap[language] || localeMap[this.defaultLanguage];
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      logger.error('Date formatting error:', { date, language, error: error.message });
      return date.toISOString().split('T')[0];
    }
  }

  /**
   * Get formatted number for language
   * @param {number} number - Number to format
   * @param {string} language - Language code
   * @returns {string} Formatted number
   */
  formatNumber(number, language = this.defaultLanguage) {
    try {
      const localeMap = {
        en: 'en-US',
        es: 'es-ES',
        de: 'de-DE'
      };
      
      const locale = localeMap[language] || localeMap[this.defaultLanguage];
      return new Intl.NumberFormat(locale).format(number);
    } catch (error) {
      logger.error('Number formatting error:', { number, language, error: error.message });
      return number.toString();
    }
  }

  /**
   * Get list of supported languages
   * @returns {Array} Supported language codes
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Check if language is supported
   * @param {string} language - Language code to check
   * @returns {boolean} True if supported
   */
  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language);
  }
}

// Export singleton instance
module.exports = new I18nManager();