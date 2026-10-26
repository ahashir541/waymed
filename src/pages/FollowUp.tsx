import { useState } from 'react';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { Icon } from '../components/Icon.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { usePrefs, useAllLanguages } from '../lib/prefs.tsx';
import { useHospital } from '../lib/store.tsx';
import { translate } from '../lib/i18n/core.ts';
import type { DictKey } from '../lib/i18n/core.ts';

const REMINDERS: DictKey[] = ['followup.r1', 'followup.r2', 'followup.r3', 'followup.r4'];

/** "DD/MM/YYYY" while typing: digits only, slashes added for the visitor. */
function asDate(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
}

/**
 * Follow-up card for the visitor and family, in their language plus English. General reminders only,
 * no medical advice. The date and department are optional; nothing is saved or sent anywhere.
 */
export function FollowUp() {
  useAllLanguages();
  const { t, L, lang } = usePrefs();
  const { data } = useHospital();
  const [date, setDate] = useState('');
  const [deptId, setDeptId] = useState('');
  const dept = data.departments.find((d) => d.id === deptId);
  const langs = lang === 'en' ? (['en'] as const) : ([lang, 'en'] as const);
  const both = (k: DictKey) => langs.map((l) => translate(l, k)).join(' · ');
  return (
    <Layout visitor>
      <PageTitle icon="calendar" sub={t('followup.staffNote')}>
        {t('followup.title')}
      </PageTitle>
      <div className="no-print mb-5 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
        <label className="grid gap-1 font-semibold">
          {t('followup.next')}
          <input className="field ltr" inputMode="numeric" placeholder="DD/MM/YYYY" value={date} maxLength={10} onChange={(e) => setDate(asDate(e.target.value))} />
        </label>
        <label className="grid gap-1 font-semibold">
          {t('followup.dept')}
          <select className="field" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
            <option value="">—</option>
            {data.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {L(d.name)}
              </option>
            ))}
          </select>
        </label>
        <button className="vbtn-2 sm:col-span-2" onClick={() => window.print()}>
          <Icon name="printer" size={18} className="text-accent" /> {t('followup.printOptional')}
        </button>
      </div>

      <article className="print-area mx-auto max-w-2xl rounded-3xl border-2 border-black/80 bg-white p-4 text-black sm:p-6">
        <header className="border-b-2 border-black/60 pb-3">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" width={36} height={36} />
            <strong className="text-2xl">WayMed</strong>
          </div>
          <p className="mt-1 text-base">{L(data.hospital.name)}</p>
        </header>
        <div className="mt-4 grid gap-3 text-lg sm:grid-cols-2">
          <div className="rounded-xl border border-black/50 p-3">
            <div className="text-base font-semibold">{both('followup.next')}</div>
            <div className="ltr mt-2 min-h-10 text-2xl font-black">{date || '__ / __ / ____'}</div>
          </div>
          <div className="rounded-xl border border-black/50 p-3">
            <div className="text-base font-semibold">{both('followup.dept')}</div>
            <div className="mt-2 flex min-h-10 items-center gap-2 text-xl font-bold">
              {dept ? (
                <>
                  <DeptMark dept={dept} size={32} /> {L(dept.name)}
                </>
              ) : (
                '______________'
              )}
            </div>
          </div>
        </div>
        {langs.map((l) => (
          <section key={l} lang={l} dir={l === 'en' ? 'ltr' : 'rtl'} className="mt-4 border-t border-black/30 pt-3">
            <p className="font-bold">{translate(l, 'followup.lead')}</p>
            <ul className={`mt-2 grid gap-1 ${l === 'en' ? 'text-base' : 'text-xl'}`}>
              {REMINDERS.map((k, i) => (
                <li key={k} className={`flex items-start gap-2 ${i === 3 ? 'font-black' : ''}`}>
                  <span aria-hidden="true">{i === 3 ? '⚠' : '•'}</span>
                  {translate(l, k)}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </Layout>
  );
}
