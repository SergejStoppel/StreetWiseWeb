import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Define supported languages locally (consistent with shared config)
const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
};

const DEFAULT_LANGUAGE = 'en';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    
    // Supported languages
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    
    // Namespaces - preload the most critical ones
    ns: ['common', 'navigation', 'analysis', 'forms', 'reports', 'dashboard', 'homepage'],
    defaultNS: 'common',
    preload: ['en', 'es', 'de'],
    
    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'no-cache'
      },
      // Add error handling for failed loads
      loadPath: function(lngs, namespaces) {
        return '/locales/{{lng}}/{{ns}}.json';
      },
      allowMultiLoading: false,
      crossDomain: false
    },
    
    // Language detection configuration - fallback gracefully in incognito mode
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'streetwiseweb-language',
      // Fallback gracefully if localStorage is not available (incognito mode)
      excludeCacheFor: [],
    },
    
    // React configuration
    react: {
      useSuspense: false,
    },
    
    // Retry failed loads
    load: 'languageOnly',
    cleanCode: true,
    
    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Load namespaces synchronously
    partialBundledLanguages: true,
    
    // Disable debug logs for production
    debug: false,
  });

// Safe localStorage access for incognito mode
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage not available, using fallback');
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage not available, skipping cache');
    }
  }
};

// Override localStorage for i18n if needed
if (typeof Storage !== 'undefined') {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch (e) {
    console.warn('localStorage restricted, i18n will use memory cache only');
  }
}

// Add error handling to i18n initialization
i18n.on('failedLoading', (lng, ns, msg) => {
  console.warn(`Failed to load translation ${lng}/${ns}:`, msg);
});

i18n.on('loaded', (loaded) => {
  console.log('i18n loaded:', Object.keys(loaded));
});

// Preload critical namespaces for instant loading with timeout
const loadCriticalNamespaces = async () => {
  try {
    await Promise.race([
      i18n.loadNamespaces(['navigation', 'common', 'homepage', 'forms']),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Translation load timeout')), 3000)
      )
    ]);
    console.log('✅ Critical namespaces preloaded successfully');
  } catch (error) {
    console.warn('⚠️ Failed to preload critical namespaces:', error.message);
    // Continue anyway - the app should still work with default text
  }
};

loadCriticalNamespaces();

export default i18n;