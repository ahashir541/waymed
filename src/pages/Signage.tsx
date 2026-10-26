import { useState } from 'react';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { RequireStaff } from '../components/RequireStaff.tsx';
import { QRCode } from '../components/QRCode.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { Slip } from '../components/Slip.tsx';
import { Icon } from '../components/Icon.tsx';
import { usePrefs, useAllLanguages } from '../lib/prefs.tsx';
import { useHospital } from '../lib/store.tsx';
import { translate } from '../lib/i18n/core.ts';

type Part = 'stickers' | 'signs' | 'slip' | 'poster';

function Kit() {
  useAllLanguages();
  const { t } = usePrefs();
  const { data } = useHospital();
  const [part, setPart] = useState<Part>('stickers');
  const origin = location.origin;
  return (
    <>
      <PageTitle icon="printer">{t('admin.signage')}</PageTitle>
      <div className="no-print mb-4 flex flex-wrap gap-2">
        {(
          [
            ['stickers', t('admin.printStickers')],
            ['signs', t('admin.printSigns')],
            ['poster', t('home.whereTo')],
            ['slip', t('admin.printSlip')],
          ] as [Part, string][]
        ).map(([k, label]) => (
          <button key={k} className={`chip ${part === k ? 'bg-accent text-on-accent' : ''}`} aria-pressed={part === k} onClick={() => setPart(k)}>
            {label}
          </button>
        ))}
        <button className="btn btn-primary ms-auto" onClick={() => window.print()}>
          <Icon name="printer" /> {t('common.print')}
        </button>
      </div>

      <div className="print-area grid gap-4 bg-white p-2 text-black">
        {part === 'stickers' && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {data.landmarks
              .filter((l) => l.hasSticker)
              .map((l) => (
                <div key={l.id} className="flex flex-col items-center rounded-2xl border-4 border-[#0b1e3f] p-3 text-center" style={{ breakInside: 'avoid' }}>
                  <div className="mb-1 flex items-center gap-2 font-black">
                    <img src="/icon.svg" alt="" width={26} height={26} /> WayMed
                  </div>
                  <QRCode value={`${origin}/w/${l.id}?src=qr`} size={170} label={l.name.en} />
                  <div className="mt-2 text-xl font-black">{l.name.en}</div>
                  <div className="text-lg" lang="ur" dir="rtl">
                    {l.name.ur}
                  </div>
                  <div className="text-lg" lang="sd" dir="rtl">
                    {l.name.sd}
                  </div>
                  <div className="mt-1 text-base font-semibold">
                    {translate('en', 'landmark.title')} · <span lang="ur">{translate('ur', 'landmark.title')}</span> · <span lang="sd">{translate('sd', 'landmark.title')}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
        {part === 'signs' &&
          data.departments.map((d) => (
            <div key={d.id} className="page-break flex items-center gap-6 rounded-3xl border-8 p-6" style={{ borderColor: d.color, breakInside: 'avoid' }}>
              <DeptMark dept={d} size={180} />
              <div>
                <div className="text-6xl font-black">{d.name.en}</div>
                <div className="text-5xl" lang="ur" dir="rtl">
                  {d.name.ur}
                </div>
                <div className="text-5xl" lang="sd" dir="rtl">
                  {d.name.sd}
                </div>
                <div className="ltr mt-2 text-3xl font-bold">{d.code}</div>
              </div>
            </div>
          ))}
        {part === 'poster' && (
          <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border-8 border-[#0f766e] p-8 text-center">
            <img src="/icon.svg" alt="" width={64} height={64} />
            <div className="mt-2 text-5xl font-black">{translate('en', 'home.whereTo')}</div>
            <div className="text-4xl" lang="ur" dir="rtl">
              {translate('ur', 'home.whereTo')}
            </div>
            <div className="text-4xl" lang="sd" dir="rtl">
              {translate('sd', 'home.whereTo')}
            </div>
            <div className="my-4">
              <QRCode value={`${origin}/g?src=qr`} size={300} label="WayMed" />
            </div>
            <div className="text-xl font-semibold">{translate('en', 'home.privacy')}</div>
          </div>
        )}
        {part === 'slip' && data.departments[1] && (
          <div>
            <p className="no-print mb-2 font-bold text-[#92400e]">{t('common.sample')}</p>
            <Slip view={{ id: 'SAMPLEsample0000', label: `${data.departments[1].code}-007`, wait: { minMin: 10, maxMin: 20, measured: false }, createdAt: Date.now() }} dept={data.departments[1]} data={data} />
          </div>
        )}
      </div>
    </>
  );
}

export default function Signage() {
  return (
    <Layout wide>
      <RequireStaff roles={['admin']}>{() => <Kit />}</RequireStaff>
    </Layout>
  );
}
