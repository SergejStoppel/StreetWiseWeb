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
    },
    
    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'streetwiseweb-language',
    },
    
    // React configuration
    react: {
      useSuspense: false,
    },
    
    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Load namespaces synchronously
    partialBundledLanguages: true,
    
    // Disable debug logs
    debug: false,
  });

// Preload navigation namespace for all languages to avoid missing key errors
i18n.loadNamespaces(['navigation', 'common'], () => {
  console.log('✅ Critical namespaces loaded');
});

export default i18n;