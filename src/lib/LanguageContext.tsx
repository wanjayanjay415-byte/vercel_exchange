import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Lang = 'id' | 'en';

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: 'id', setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('lang');
      return (saved as Lang) || 'id';
    } catch (e) {
      return 'id';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export type { Lang };
