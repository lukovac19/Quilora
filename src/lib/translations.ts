import { useApp } from '../context/AppContext';
import enTranslations from '../locales/en';
import bsTranslations from '../locales/bs';
import esTranslations from '../locales/es';

export type Language = 'en' | 'bs' | 'es';

type TranslationKeys = typeof enTranslations;

const translations = {
  en: enTranslations,
  bs: bsTranslations,
  es: esTranslations,
};

/**
 * Get nested translation value by dot notation path
 * e.g., "hero.cta.start" => translations[lang].hero.cta.start
 */
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      // Log warning in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Translation key not found: ${path}`);
      }
      return path; // Return the key itself as fallback
    }
  }
  
  return typeof result === 'string' ? result : path;
}

/**
 * Translation function - used with language parameter
 */
export function t(key: string, language: Language): string {
  const langTranslations = translations[language];
  return getNestedValue(langTranslations, key);
}

/**
 * Hook for using translations with current app language
 */
export function useTranslation() {
  const { language } = useApp();
  
  return {
    t: (key: string) => t(key, language),
    language,
  };
}
