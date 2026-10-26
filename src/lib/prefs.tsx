// Visitor preferences kept on the device only: language, larger text and theme.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { L10n, Lang } from './types.ts';
import { LANGS } from './types.ts';
import { isRtl, translate, hasDictionary, loadDictionary, type DictKey } from './i18n/core.ts';

export const safeStorage = {
  get(key: string, session = false): string | null {
    try {
      return (session ? sessionStorage : localStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null, session = false) {
    try {
      const s = session ? sessionStorage : localStorage;
      if (value === null) s.removeItem(key);
      else s.setItem(key, value);
    } catch {
      /* storage blocked: preferences simply are not remembered */
    }
  },
};

type Theme = 'light' | 'dark';

interface Prefs {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** True once the visitor picked a language in this tab (entry screens ask first). */
  langChosen: boolean;
  resetLangChoice: () => void;
  large: boolean;
  setLarge: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  L: (s: L10n | undefined) => string;
  dir: 'rtl' | 'ltr';
}

const Ctx = createContext<Prefs | null>(null);

function initialLang(): Lang {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && (LANGS as string[]).includes(q)) return q as Lang;
  const saved = safeStorage.get('wm_lang');
  return saved && (LANGS as string[]).includes(saved) ? (saved as Lang) : 'ur';
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [langChosen, setLangChosen] = useState(() => safeStorage.get('wm_lang_chosen', true) === '1' || new URLSearchParams(location.search).has('lang'));
  const [large, setLargeState] = useState(() => safeStorage.get('wm_large') === '1');
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = safeStorage.get('wm_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Only the visitor's language is loaded before the first paint; the others follow when the page is idle.
  const [dictVersion, setDictVersion] = useState(0);
  const ready = hasDictionary(lang);
  useEffect(() => {
    let alive = true;
    const bump = () => alive && setDictVersion((v) => v + 1);
    if (!hasDictionary(lang)) void loadDictionary(lang).then(bump);
    return () => {
      alive = false;
    };
  }, [lang]);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = isRtl(lang) ? 'rtl' : 'ltr';
    el.classList.toggle('large-text', large);
    el.dataset.theme = theme;
  }, [lang, large, theme]);

  const setLang = useCallback((l: Lang) => {
    if (hasDictionary(l)) setLangState(l);
    else void loadDictionary(l).then(() => setLangState(l));
    setLangChosen(true);
    safeStorage.set('wm_lang', l);
    safeStorage.set('wm_lang_chosen', '1', true);
  }, []);
  const resetLangChoice = useCallback(() => {
    setLangChosen(false);
    safeStorage.set('wm_lang_chosen', null, true);
  }, []);
  const setLarge = useCallback((v: boolean) => {
    setLargeState(v);
    safeStorage.set('wm_large', v ? '1' : '0');
  }, []);
  const setTheme = useCallback((v: Theme) => {
    setThemeState(v);
    safeStorage.set('wm_theme', v);
  }, []);

  const value = useMemo<Prefs>(
    () => ({
      lang,
      setLang,
      langChosen,
      resetLangChoice,
      large,
      setLarge,
      theme,
      setTheme,
      t: (key, vars) => translate(lang, key, vars),
      L: (s) => (s ? s[lang] || s.en : ''),
      dir: isRtl(lang) ? 'rtl' : 'ltr',
    }),
    // dictVersion: re-render when another language's dictionary arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, setLang, langChosen, resetLangChoice, large, setLarge, theme, setTheme, dictVersion],
  );
  // Wait for the visitor's language (a small local chunk) so the first screen is never in the wrong language.
  if (!ready) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): Prefs {
  const v = useContext(Ctx);
  if (!v) throw new Error('PrefsProvider missing');
  return v;
}

/** For screens that show all three languages at once (language picker, Emergency, slips, board...). */
export function useAllLanguages() {
  const [, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    if (LANGS.every((l) => hasDictionary(l))) return;
    void Promise.all(LANGS.map((l) => loadDictionary(l))).then(() => alive && setN((n) => n + 1));
    return () => {
      alive = false;
    };
  }, []);
}
