// One dictionary for the whole product: the browser app and the server assistant both use it.
// English is always present. Urdu and Sindhi are registered by the server at start-up, and loaded
// on demand in the browser (only the visitor's language first), so phones download less up front.
import type { Lang } from '../types.ts';
import { en, type DictKey } from './en.ts';

export type { DictKey };
export type Dictionary = Record<DictKey, string>;
export const dictionaries: Partial<Record<Lang, Dictionary>> = { en };

export function registerDictionary(lang: Lang, dict: Dictionary) {
  dictionaries[lang] = dict;
}

export function hasDictionary(lang: Lang) {
  return Boolean(dictionaries[lang]);
}

/** Browser: fetch a language's dictionary chunk (precached by the service worker for offline use). */
export async function loadDictionary(lang: Lang): Promise<void> {
  if (dictionaries[lang]) return;
  if (lang === 'ur') registerDictionary('ur', (await import('./ur.ts')).ur);
  if (lang === 'sd') registerDictionary('sd', (await import('./sd.ts')).sd);
}

export const isRtl = (lang: Lang) => lang !== 'en';

export const LANG_NAMES: Record<Lang, string> = { en: 'English', ur: 'اردو', sd: 'سنڌي' };
/** BCP 47 tags for speech. Sindhi falls back to Urdu for recognition (see voice.ts). */
export const SPEECH_TAGS: Record<Lang, string> = { en: 'en-PK', ur: 'ur-PK', sd: 'sd-PK' };

export function translate(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
  let s: string = dictionaries[lang]?.[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export function isDictKey(k: string): k is DictKey {
  return k in en;
}
