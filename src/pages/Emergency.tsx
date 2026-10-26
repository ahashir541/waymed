import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Layout } from '../components/Layout.tsx';
import { RouteView } from '../components/RouteView.tsx';
import { Icon } from '../components/Icon.tsx';
import { currentPlace } from '../lib/place.ts';
import { usePrefs, useAllLanguages } from '../lib/prefs.tsx';
import { useHospital } from '../lib/store.tsx';
import { emergencyDept } from '../lib/route.ts';
import { LANGS } from '../lib/types.ts';
import { translate, hasDictionary } from '../lib/i18n/core.ts';
import { speak } from '../lib/voice.ts';

/** Emergency: no language step, no slip. Fastest route plus "tell staff" in all three languages. */
export function Emergency() {
  useAllLanguages();
  const { t, L, lang } = usePrefs();
  const { data } = useHospital();
  const [q] = useSearchParams();
  const navigate = useNavigate();
  const fromQ = q.get('from');
  const from = fromQ && data.landmarks.some((l) => l.id === fromQ) ? fromQ : currentPlace();
  const em = emergencyDept(data);
  useEffect(() => {
    // Speak only after a tap (the Emergency button). Opened directly, the Listen button is there instead.
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua?.hasBeenActive) void speak(translate(lang, 'emergency.speak'), lang, ['emergency']);
  }, [lang]);

  return (
    <Layout visitor wide>
      <section className="mb-5 rounded-3xl bg-[#b91c1c] p-5 text-white shadow-xl sm:p-6" aria-labelledby="em-h">
        <h1 id="em-h" className="flex items-center gap-3 text-4xl font-black sm:text-5xl">
          <Icon name="siren" size={48} strokeWidth={2.4} /> {t('emergency.title')}
        </h1>
        <p className="mt-3 text-2xl font-bold">{t('emergency.lead')}</p>
        <p className="mt-2 flex items-start gap-2 text-xl">
          <Icon name="users" className="mt-1 shrink-0" /> {t('emergency.callStaff')}
        </p>
        <div className="mt-4 grid gap-1 border-t border-white/30 pt-3 text-lg opacity-95">
          {LANGS.filter((l) => l !== lang && hasDictionary(l)).map((l) => (
            <p key={l} lang={l} dir={l === 'en' ? 'ltr' : 'rtl'}>
              {translate(l, 'emergency.lead')} {translate(l, 'emergency.callStaff')}
            </p>
          ))}
        </div>
      </section>
      <div className="no-print mb-4">
        <p className="mb-2 text-lg font-bold">{t('emergency.where')}</p>
        <div className="flex flex-wrap gap-2">
          {data.landmarks
            .filter((l) => l.kind === 'landmark')
            .map((l) => (
              <button key={l.id} className={`chip ${l.id === from ? 'bg-accent text-on-accent' : ''}`} aria-pressed={l.id === from} onClick={() => navigate(`/emergency?from=${l.id}`, { replace: true })}>
                <Icon name="pin" size={20} /> {L(l.name)}
              </button>
            ))}
        </div>
      </div>
      {em && <RouteView data={data} from={from} dest={em.id} emergency />}
    </Layout>
  );
}
