// Printable 80 mm thermal slip. Holds only the token number and department. No personal data.
import type { Department, HospitalData, TokenView } from '../lib/types.ts';
import { findRoute, type RouteStep } from '../lib/route.ts';
import { translate } from '../lib/i18n/core.ts';
import { fmtTime } from '../lib/slots.ts';
import { DeptMark } from './DeptMark.tsx';
import { QRCode } from './QRCode.tsx';
import { Icon } from './Icon.tsx';

const TURN_ICON: Partial<Record<RouteStep['kind'], string>> = {
  straight: 'arrowUp',
  slight_left: 'slightLeft',
  left: 'arrowLeft',
  slight_right: 'slightRight',
  right: 'arrowRight',
  back: 'uturn',
};

export function slipUrl(view: Pick<TokenView, 'id'>) {
  return `${location.origin}/t/${view.id}?src=qr`;
}

export function Slip({ view, dept, data, from = 'registration' }: { view: Pick<TokenView, 'id' | 'label' | 'wait' | 'createdAt'>; dept: Department; data: HospitalData; from?: string }) {
  const route = findRoute(data, data.landmarks.some((l) => l.id === from) ? from : 'entrance', dept.nodeId);
  const turns = (route?.steps ?? []).filter((s) => TURN_ICON[s.kind]).slice(0, 3);
  return (
    <div data-qr={slipUrl(view)} data-testid="slip" className="slip-80 print-slip mx-auto overflow-hidden rounded-xl border border-black/30 shadow-lg print:rounded-none print:border-0 print:shadow-none">
      <div style={{ background: dept.color, height: '9mm' }} />
      <div className="p-[4mm] text-center">
        <div className="flex items-center justify-center gap-2">
          <img src="/icon.svg" alt="" width={24} height={24} />
          <strong>WayMed</strong>
          <span className="text-[12px]">· {data.hospital.shortName}</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <DeptMark dept={dept} size={40} />
          <div className="text-start leading-tight">
            <div className="text-[18px] font-extrabold">{dept.name.en}</div>
            <div className="text-[17px]" lang="ur" dir="rtl">
              {dept.name.ur} · <span lang="sd">{dept.name.sd}</span>
            </div>
          </div>
        </div>
        <div className="ltr my-1 text-[46px] leading-none font-black tracking-tight">{view.label}</div>
        <div className="flex items-center justify-center gap-3">
          <QRCode value={slipUrl(view)} size={128} label={translate('en', 'desk.scanToFollow')} />
          <div className="grid gap-1" aria-label="Route">
            {turns.map((s, i) => (
              <span key={i} className="grid size-9 place-items-center rounded-lg border-2 border-black">
                <Icon name={TURN_ICON[s.kind]!} size={24} strokeWidth={2.8} />
              </span>
            ))}
          </div>
        </div>
        <div className="mt-1 text-[12px] leading-snug">
          {translate('en', 'desk.scanToFollow')}
          <br />
          <span lang="ur">{translate('ur', 'desk.scanToFollow')}</span>
        </div>
        {view.wait && (
          <div className="mt-2 rounded-md border border-black/50 p-1 text-[14px]">
            {translate('en', 'desk.estWait')}: <b>{view.wait.minMin}–{view.wait.maxMin} min</b>
            <br />
            <span lang="ur">
              {translate('ur', 'desk.estWait')}: {view.wait.minMin}–{view.wait.maxMin} منٹ
            </span>
          </div>
        )}
        <div className="mt-2 border-t border-dashed border-black/60 pt-1 text-[12px] font-semibold">
          {translate('en', 'desk.noPersonal')}
          <br />
          <span lang="ur">{translate('ur', 'desk.noPersonal')}</span>
          <br />
          <span lang="sd">{translate('sd', 'desk.noPersonal')}</span>
        </div>
        <div className="mt-1 text-[11px]">
          {fmtTime(view.createdAt)} · {translate('en', 'emergency.title')}: {translate('en', 'emergency.lead')}
        </div>
      </div>
    </div>
  );
}
