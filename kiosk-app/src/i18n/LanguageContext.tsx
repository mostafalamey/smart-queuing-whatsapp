import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Language, Translations, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'kiosk-language';

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  defaultLanguage = 'en' 
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Load saved language from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') {
        return saved;
      }
    }
    return defaultLanguage;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  // Update document direction when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t: translations[language],
    isRTL: language === 'ar',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper hook to get localized name from an object with name and name_ar
export const useLocalizedName = () => {
  const { language } = useLanguage();
  
  return useCallback((item: { name: string; name_ar?: string | null }) => {
    if (language === 'ar' && item.name_ar) {
      return item.name_ar;
    }
    return item.name;
  }, [language]);
};

// Helper hook to get localized description from an object
export const useLocalizedDescription = () => {
  const { language } = useLanguage();
  
  return useCallback((item: { description?: string | null; description_ar?: string | null }) => {
    if (language === 'ar' && item.description_ar) {
      return item.description_ar;
    }
    return item.description || '';
  }, [language]);
};
