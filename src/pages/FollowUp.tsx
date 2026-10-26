import { useState } from 'react';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { Icon } from '../components/Icon.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { usePrefs, useAllLanguages } from '../lib/prefs.tsx';
import { useHospital } from '../lib/store.tsx';
import { translate } from '../lib/i18n/core.ts';
import type { DictKey } from '../lib/i18n/core.ts';

const REMINDERS: DictKey[] = ['followup.r1', 'followup.r2', 'followup.r3', 'followup.r4'];

/**
 * Follow-up helper card in simple Urdu and Sindhi (plus English). General reminders only, no medical advice.
 * Staff may fill in a date and department to print; nothing is saved or sent anywhere.
 */
export function FollowUp() {
  useAllLanguages();
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const [date, setDate] = useState('');
  const [deptId, setDeptId] = useState('');
  const dept = data.departments.find((d) => d.id === deptId);
  return (
    <Layout visitor>
      <PageTitle icon="calendar" sub={t('followup.staffNote')}>
        {t('followup.title')}
      </PageTitle>
      <div className="no-print glass mb-5 grid gap-3 rounded-3xl p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-lg font-semibold">
          {t('followup.next')}
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="grid gap-1 text-lg font-semibold">
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
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Icon name="printer" /> {t('common.print')}
        </button>
      </div>

      <article className="print-area mx-auto max-w-2xl rounded-3xl border-2 border-black/80 bg-white p-6 text-black">
        <header className="flex items-center justify-between gap-3 border-b-2 border-black/60 pb-3">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" width={40} height={40} />
            <strong className="text-2xl">WayMed</strong>
          </div>
          <span className="text-lg">{data.hospital.name.en}</span>
        </header>
        <div className="mt-4 grid grid-cols-2 gap-3 text-lg">
          <div className="rounded-xl border border-black/50 p-3">
            <div className="font-semibold">
              {translate('ur', 'followup.next')} · <span lang="sd">{translate('sd', 'followup.next')}</span> · {translate('en', 'followup.next')}
            </div>
            <div className="mt-2 min-h-10 text-2xl font-black">{date || '______________'}</div>
          </div>
          <div className="rounded-xl border border-black/50 p-3">
            <div className="font-semibold">
              {translate('ur', 'followup.dept')} · <span lang="sd">{translate('sd', 'followup.dept')}</span> · {translate('en', 'followup.dept')}
            </div>
            <div className="mt-2 flex min-h-10 items-center gap-2 text-xl font-bold">
              {dept ? (
                <>
                  <DeptMark dept={dept} size={32} /> {dept.name.ur} / <span lang="sd">{dept.name.sd}</span>
                </>
              ) : (
                '______________'
              )}
            </div>
          </div>
        </div>
        {(['ur', 'sd', 'en'] as const).map((l) => (
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
