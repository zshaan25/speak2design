import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Lang = 'en' | 'ur';

// Key UI labels (#19). Add keys here; missing Urdu falls back to English.
const DICT: Record<string, { en: string; ur: string }> = {
  mainNavigation: { en: 'Main Navigation', ur: 'مرکزی نیویگیشن' },
  workspaceSection: { en: 'Workspace', ur: 'ورک اسپیس' },
  myProjects: { en: 'My Projects', ur: 'میرے پروجیکٹس' },
  recent: { en: 'Recent', ur: 'حالیہ' },
  workspace: { en: 'Workspace', ur: 'ورک اسپیس' },
  marketplace: { en: 'Marketplace', ur: 'مارکیٹ پلیس' },
  favorites: { en: 'Favorites', ur: 'پسندیدہ' },
  drafts: { en: 'Drafts', ur: 'ڈرافٹس' },
  shared: { en: 'Shared with me', ur: 'میرے ساتھ شیئر کردہ' },
  archived: { en: 'Archived', ur: 'محفوظ شدہ' },
  trash: { en: 'Trash', ur: 'ردی' },
  signOut: { en: 'Sign Out', ur: 'سائن آؤٹ' },
  searchEverything: { en: 'Search everything…', ur: 'تلاش کریں…' },
  newProject: { en: 'New Project', ur: 'نیا پروجیکٹ' },
  proPlan: { en: 'Pro Plan', ur: 'پرو پلان' },
  upgradeNow: { en: 'Upgrade Now', ur: 'ابھی اپ گریڈ کریں' },
  unlockUnlimited: { en: 'Unlock unlimited voice projects', ur: 'لامحدود وائس پروجیکٹس کھولیں' },
  freeAccount: { en: 'Free Account', ur: 'مفت اکاؤنٹ' },
  premium: { en: 'Premium', ur: 'پریمیم' },
};

interface LangCtx { lang: Lang; setLang: (l: Lang) => void; toggleLang: () => void; t: (key: string) => string; }
const LanguageContext = createContext<LangCtx>({ lang: 'en', setLang: () => {}, toggleLang: () => {}, t: (k) => k });
const STORAGE_KEY = 'speak2design_ui_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as Lang | null;
    return saved === 'ur' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ } }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState(p => (p === 'en' ? 'ur' : 'en')), []);
  const t = useCallback((key: string) => DICT[key]?.[lang] ?? DICT[key]?.en ?? key, [lang]);

  return <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>{children}</LanguageContext.Provider>;
};

export const useLang = () => useContext(LanguageContext);
