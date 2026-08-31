// context/LanguageContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import en from '@/locales/en.json';
import am from '@/locales/am.json';

export type Language = 'en' | 'am';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('site_lang') as Language | null;
      if (stored === 'en' || stored === 'am') {
        setLanguageState(stored);
      }
    } catch (e) {
      console.error('Error reading language from storage:', e);
    }

    const handleLanguageEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail === 'en' || customEvent.detail === 'am') {
        setLanguageState(customEvent.detail);
      } else {
        try {
          const stored = localStorage.getItem('site_lang') as Language | null;
          if (stored === 'en' || stored === 'am') {
            setLanguageState(stored);
          }
        } catch {}
      }
    };

    window.addEventListener('language-change', handleLanguageEvent);
    window.addEventListener('storage', handleLanguageEvent);

    return () => {
      window.removeEventListener('language-change', handleLanguageEvent);
      window.removeEventListener('storage', handleLanguageEvent);
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('site_lang', lang);
      window.dispatchEvent(new CustomEvent('language-change', { detail: lang }));
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === 'en' ? 'am' : 'en';
      try {
        localStorage.setItem('site_lang', next);
        window.dispatchEvent(new CustomEvent('language-change', { detail: next }));
      } catch {}
      return next;
    });
  }, []);

  const currentTranslations = useMemo(() => {
    return {
      en,
      am,
    };
  }, []);

  // Nested key resolver helper (e.g. t('contact.form_title'))
  const t = useCallback(
    (key: string, fallback?: string): string => {
      try {
        const keys = key.split('.');
        const activeDict = currentTranslations[language] || currentTranslations.en;
        let current: any = activeDict;

        for (const k of keys) {
          if (current && typeof current === 'object' && k in current) {
            current = current[k];
          } else {
            // Fallback to English if translation is missing in Amharic
            let fallbackEn: any = currentTranslations.en;
            for (const f of keys) {
              if (fallbackEn && typeof fallbackEn === 'object' && f in fallbackEn) {
                fallbackEn = fallbackEn[f];
              } else {
                return fallback || key;
              }
            }
            return typeof fallbackEn === 'string' ? fallbackEn : fallback || key;
          }
        }

        return typeof current === 'string' ? current : fallback || key;
      } catch (err) {
        return fallback || key;
      }
    },
    [language, currentTranslations]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, setLanguage, toggleLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
