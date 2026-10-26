import { Link } from 'react-router';
import { Layout } from '../components/Layout.tsx';
import { VCard, VTitle } from '../components/VisitorShell.tsx';
import { Icon } from '../components/Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { LANGS } from '../lib/types.ts';
import { LANG_NAMES } from '../lib/i18n/core.ts';

export default function Help() {
  const { t, lang, setLang, large, setLarge } = usePrefs();
  const steps = [t('v.help.h1'), t('v.help.h2'), t('v.help.h3'), t('v.help.h4')];
  return (
    <Layout visitor>
      <VTitle>{t('v.help.title')}</VTitle>
      <div className="v-stagger grid gap-4">
        <VCard>
          <h2 className="mb-3 font-extrabold">{t('v.help.how')}</h2>
          <ol className="grid gap-3">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-on-accent">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
          <Link to="/tour" className="vbtn-2 mt-4">
            <Icon name="play" size={18} className="text-accent" /> {t('v.tour')}
          </Link>
        </VCard>
        <VCard className="flex items-start gap-3">
          <Icon name="users" size={22} className="mt-0.5 shrink-0 text-accent" />
          <p>{t('v.help.staff')}</p>
        </VCard>
        <VCard>
          <h2 className="mb-3 font-extrabold">{t('settings.language')}</h2>
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map((l) => (
              <button key={l} lang={l} aria-pressed={lang === l} onClick={() => setLang(l)} className="vtile min-h-12 rounded-xl border border-line bg-solid font-bold">
                {LANG_NAMES[l]}
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center justify-between gap-3">
            <span className="font-semibold">{t('settings.largerText')}</span>
            <input type="checkbox" className="size-5 accent-[#E0A800]" checked={large} onChange={(e) => setLarge(e.target.checked)} />
          </label>
        </VCard>
        <p className="flex items-start gap-2 rounded-2xl border border-line p-3 text-sm text-muted">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-accent" /> {t('v.help.good')}
        </p>
      </div>
    </Layout>
  );
}
