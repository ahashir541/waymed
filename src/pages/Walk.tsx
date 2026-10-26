import { useState } from 'react';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { Icon } from '../components/Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { PERSONAS, WALKS, MOOD_ICON, MOOD_LABEL, type Mood } from '../data/story.ts';

type Who = keyof typeof WALKS;

function MoodTag({ mood, good }: { mood: Mood; good?: boolean }) {
  const { L } = usePrefs();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-base font-bold ${good ? 'bg-[#15803d] text-white' : 'bg-[#b91c1c] text-white'}`}>
      <Icon name={MOOD_ICON[mood]} size={18} /> {L(MOOD_LABEL[mood])}
    </span>
  );
}

export default function Walk() {
  const { t, L } = usePrefs();
  const [who, setWho] = useState<Who | null>(null);
  const [step, setStep] = useState(0);
  const steps = who ? WALKS[who] : [];
  const done = who !== null && step >= steps.length;

  return (
    <Layout visitor wide>
      <PageTitle icon="users" sub={<span className="font-semibold text-warn">{t('walk.label')}</span>}>
        {t('walk.title')}
      </PageTitle>

      {!who && (
        <>
          <p className="mb-4 text-xl">{t('walk.pick')}</p>
          <div className="grid gap-4 md:grid-cols-3">
            {PERSONAS.filter((p): p is typeof p & { id: Who } => p.id in WALKS).map((p) => (
              <button key={p.id} className="glass fade-up rounded-3xl p-5 text-start transition-transform hover:scale-[1.02]" onClick={() => (setWho(p.id), setStep(0))}>
                <p className="text-3xl font-black">{L(p.name)}</p>
                <p className="text-lg text-muted">
                  {p.code} · {L(p.role)}
                </p>
                <ul className="mt-3 grid gap-1 text-lg">
                  {p.evidence.map((e, i) => (
                    <li key={i}>“{L(e)}”</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </>
      )}

      {who && !done && (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border-2 border-[#b91c1c]/50 bg-[#b91c1c]/10 p-5" aria-label={t('walk.today')}>
              <h2 className="mb-3 text-2xl font-black text-danger">{t('walk.today')}</h2>
              {steps.slice(0, step + 1).map((s, i) => (
                <div key={i} className="fade-up mb-3 rounded-2xl bg-solid/80 p-4 text-lg">
                  <p>{L(s.today.text)}</p>
                  <div className="mt-2">
                    <MoodTag mood={s.today.mood} />
                  </div>
                </div>
              ))}
            </section>
            <section className="rounded-3xl border-2 border-[#15803d]/50 bg-[#15803d]/10 p-5" aria-label={t('walk.with')}>
              <h2 className="mb-3 text-2xl font-black text-ok">{t('walk.with')}</h2>
              {steps.slice(0, step + 1).map((s, i) => (
                <div key={i} className="fade-up mb-3 rounded-2xl bg-solid/80 p-4 text-lg" style={{ animationDelay: '250ms' }}>
                  <p className="mb-1 font-bold text-accent">{L(s.waymed.feature)}</p>
                  <p>{L(s.waymed.text)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <MoodTag mood={s.waymed.mood} good />
                    <span className="text-base text-muted">{t('walk.expected')}</span>
                  </div>
                </div>
              ))}
            </section>
          </div>
          <div className="flex gap-3">
            <button className="btn min-h-14" onClick={() => (step === 0 ? setWho(null) : setStep(step - 1))}>
              <Icon name="arrowLeft" className="rtl:rotate-180" /> {t('common.back')}
            </button>
            <button className="btn btn-primary min-h-14 flex-1 text-xl" onClick={() => setStep(step + 1)}>
              {t('common.next')} <Icon name="arrowRight" className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="grid gap-4">
          <h2 className="text-3xl font-black">{t('walk.summary')}</h2>
          <p className="rounded-2xl bg-amber-300 p-3 text-lg font-bold text-black">{t('walk.label')}</p>
          <div className="glass overflow-x-auto rounded-3xl p-4">
            <table className="w-full text-lg">
              <thead>
                <tr>
                  <th className="p-2 text-start text-danger">{t('walk.today')}</th>
                  <th className="p-2 text-start text-ok">{t('walk.with')}</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((s, i) => (
                  <tr key={i} className="border-t border-line align-top">
                    <td className="p-2">
                      {L(s.today.text)} <MoodTag mood={s.today.mood} />
                    </td>
                    <td className="p-2">
                      <b>{L(s.waymed.feature)}:</b> {L(s.waymed.text)} <MoodTag mood={s.waymed.mood} good />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn min-h-14 w-fit" onClick={() => setWho(null)}>
            <Icon name="users" /> {t('walk.again')}
          </button>
        </div>
      )}
    </Layout>
  );
}
