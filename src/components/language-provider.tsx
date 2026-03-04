"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Locale, defaultLocale, getTranslations, Translations } from "@/lib/i18n";

interface LanguageContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Store preference in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("faceprep-locale", newLocale);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    const newLocale = locale === "zh" ? "en" : "zh";
    setLocale(newLocale);
  }, [locale, setLocale]);

  const t = getTranslations(locale);

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale, toggleLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
