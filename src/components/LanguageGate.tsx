import type { ReactNode } from 'react';
import type { Lang } from '../lib/types.ts';
import { LANGS } from '../lib/types.ts';
import { usePrefs, useAllLanguages } from '../lib/prefs.tsx';
import { translate, hasDictionary, LANG_NAMES } from '../lib/i18n/core.ts';
import { speakMany, hasVoice, playClips } from '../lib/voice.ts';
import { Icon } from './Icon.tsx';

/** Language first: every visitor entry screen starts here until a language is chosen in this tab. */
export function LanguageGate({ children, big }: { children: ReactNode; big?: boolean }) {
  const { langChosen } = usePrefs();
  if (langChosen) return <>{children}</>;
  return <LanguagePicker big={big} />;
}

function LanguagePicker({ big }: { big?: boolean }) {
  // The picker shows all three languages at once, so it loads every dictionary.
  useAllLanguages();
  const { setLang } = usePrefs();
  return (
    <section className="mx-auto grid max-w-3xl gap-6 py-6" aria-labelledby="lang-title">
      <div className="text-center">
        <h1 id="lang-title" className={`${big ? 'text-5xl' : 'text-3xl sm:text-4xl'} font-extrabold`}>
          <span lang="en">{translate('en', 'lang.title')}</span>
        </h1>
        {hasDictionary('ur') && (
          <p className="mt-2 text-2xl" lang="ur" dir="rtl">
            {translate('ur', 'lang.title')}
          </p>
        )}
        {hasDictionary('sd') && (
          <p className="text-2xl" lang="sd" dir="rtl">
            {translate('sd', 'lang.title')}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {LANGS.map((l: Lang) => (
          <button
            key={l}
            lang={l}
            dir={l === 'en' ? 'ltr' : 'rtl'}
            onClick={() => setLang(l)}
            className={`glass fade-up flex flex-col items-center justify-center gap-2 rounded-3xl p-6 ${big ? 'min-h-56 text-5xl' : 'min-h-40 text-4xl'} font-bold transition-transform hover:scale-[1.02]`}
          >
            <Icon name="globe" size={big ? 48 : 36} className="text-accent" />
            {LANG_NAMES[l]}
            {l === 'sd' && hasDictionary('sd') && <span className="text-base font-normal text-muted">{translate('sd', 'lang.sdDraft')}</span>}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          className="btn"
          onClick={() => {
            const n = speakMany(LANGS.map((l) => ({ text: translate(l, 'lang.welcome'), lang: l })));
            // No Sindhi voice installed: play the native recording if one has been added.
            if (!hasVoice('sd')) setTimeout(() => void playClips(['welcome']), n ? 6000 : 0);
          }}
        >
          <Icon name="speaker" /> {translate('en', 'lang.hear')} · <span lang="ur">{translate('ur', 'lang.hear')}</span> · <span lang="sd">{translate('sd', 'lang.hear')}</span>
        </button>
      </div>
    </section>
  );
}
