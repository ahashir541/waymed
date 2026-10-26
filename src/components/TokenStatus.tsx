import { useEffect, useRef, useState } from 'react';
import type { HospitalData, TokenView } from '../lib/types.ts';
import { usePrefs, safeStorage } from '../lib/prefs.tsx';
import { useBackend } from '../lib/store.tsx';
import { fmtTime } from '../lib/slots.ts';
import { speak } from '../lib/voice.ts';
import { DeptMark } from './DeptMark.tsx';
import { Icon } from './Icon.tsx';

const STATUS_ICON = { waiting: 'clock', next: 'bell', called: 'check', done: 'flag', skipped: 'alert' } as const;

export function TokenStatusCard({ view, data, big, announce = true }: { view: TokenView; data: HospitalData; big?: boolean; announce?: boolean }) {
  const { t, L, lang } = usePrefs();
  const dept = data.departments.find((d) => d.id === view.deptId);
  const prev = useRef<{ status: string; recalledAt: number | null } | null>(null);

  // Vibrate and speak when it becomes the visitor's turn, or when staff press Recall.
  useEffect(() => {
    const p = prev.current;
    prev.current = { status: view.status, recalledAt: view.recalledAt };
    if (!p || !announce) return;
    const nowCalled = view.status === 'called' && (p.status !== 'called' || view.recalledAt !== p.recalledAt);
    const nowNext = view.status === 'next' && p.status !== 'next';
    if (nowCalled) {
      navigator.vibrate?.([400, 150, 400, 150, 400]);
      void speak(`${t('token.status.called')}. ${t('token.goNow', { dept: L(dept?.name) })}`, lang, ['your_turn']);
    } else if (nowNext) {
      navigator.vibrate?.(250);
      void speak(t('token.status.next'), lang, ['you_are_next']);
    }
  }, [view.status, view.recalledAt, announce, t, L, dept, lang]);

  const called = view.status === 'called';
  const tone =
    view.status === 'called'
      ? 'bg-[#15803d] text-white turn-pulse'
      : view.status === 'next'
        ? 'bg-amber-300 text-black'
        : view.status === 'skipped'
          ? 'bg-[#b91c1c] text-white'
          : 'bg-solid text-ink';

  return (
    <section className="glass overflow-hidden rounded-3xl" aria-live="polite" aria-atomic="true">
      <div className="h-3" style={{ background: dept?.color }} />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg text-muted">{t('token.label')}</p>
            <p className={`ltr font-black tracking-tight ${big ? 'text-8xl' : 'text-6xl sm:text-7xl'}`}>{view.label}</p>
          </div>
          {dept && (
            <div className="flex items-center gap-3">
              <DeptMark dept={dept} size={big ? 72 : 56} />
              <span className="text-2xl font-bold">{L(dept.name)}</span>
            </div>
          )}
        </div>

        <div className={`mt-5 flex items-center gap-4 rounded-2xl p-5 ${tone}`} role="status">
          <Icon name={STATUS_ICON[view.status]} size={big ? 52 : 40} strokeWidth={2.5} />
          <div>
            <p className={`${big ? 'text-5xl' : 'text-3xl sm:text-4xl'} font-extrabold`}>{t(`token.status.${view.status}`)}</p>
            {called && <p className="mt-1 text-xl font-semibold">{t('token.goNow', { dept: L(dept?.name) })}</p>}
            {called && view.recalledAt && <p className="mt-1 text-lg">{t('token.recalled')}</p>}
          </div>
        </div>

        {(view.status === 'waiting' || view.status === 'next') && (
          <div className="mt-4 grid gap-1 text-xl">
            <p className="font-bold">{view.ahead === 0 ? t('token.aheadNone') : view.ahead === 1 ? t('token.aheadOne') : t('token.ahead', { n: view.ahead })}</p>
            {view.slotStart && view.slotEnd ? (
              <p>{t('token.appointment', { start: fmtTime(view.slotStart), end: fmtTime(view.slotEnd + (view.slotEnd - view.slotStart)) })}</p>
            ) : (
              view.wait && (
                <>
                  <p>{t('token.wait', { min: view.wait.minMin, max: view.wait.maxMin })}</p>
                  <p className="text-base text-muted">{view.wait.measured ? t('token.waitMeasured') : t('token.waitConfig')}</p>
                </>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Optional browser notification when about 3 tokens away (works while the page is open or in a background tab). */
export function NotifyToggle({ view, deptName }: { view: TokenView; deptName: string }) {
  const { t } = usePrefs();
  const key = `wm_notify_${view.id}`;
  const [on, setOn] = useState(() => safeStorage.get(key) === '1');
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    if (!on || view.status !== 'waiting' || view.ahead > 3) return;
    if (safeStorage.get(`${key}_sent`)) return;
    safeStorage.set(`${key}_sent`, '1');
    const body = t('token.notifyMsg', { label: view.label, dept: deptName });
    navigator.vibrate?.(300);
    navigator.serviceWorker?.getRegistration().then((reg) => {
      if (reg) void reg.showNotification('WayMed', { body, tag: view.id, icon: '/icon-192.png' });
      else if ('Notification' in window) new Notification('WayMed', { body, tag: view.id });
    });
  }, [on, view, key, t, deptName]);
  if (!('Notification' in window)) return null;
  return (
    <div>
      <button
        className="btn"
        aria-pressed={on}
        onClick={async () => {
          if (on) {
            setOn(false);
            safeStorage.set(key, '0');
            return;
          }
          const p = await Notification.requestPermission();
          if (p === 'granted') {
            setOn(true);
            safeStorage.set(key, '1');
          } else setDenied(true);
        }}
      >
        <Icon name="bell" /> {on ? t('token.notifyOn') : t('token.notify')}
      </button>
      {denied && <p className="mt-1 text-base text-muted">{t('token.notifyDenied')}</p>}
    </div>
  );
}

export function ShareButton({ url, title, text }: { url: string; title: string; text: string }) {
  const { t } = usePrefs();
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn"
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url });
            return;
          } catch {
            /* cancelled: fall through to copy */
          }
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          prompt(t('common.copy'), url);
        }
      }}
    >
      <Icon name="share" /> {copied ? t('common.copied') : title}
    </button>
  );
}

export function Feedback({ tokenId }: { tokenId: string }) {
  const { t, lang } = usePrefs();
  const backend = useBackend();
  const key = `wm_fb_${tokenId}`;
  const [done, setDone] = useState(() => safeStorage.get(key) === '1');
  if (done)
    return (
      <p role="status" className="glass rounded-2xl p-4 text-lg">
        <Icon name="check" className="me-2 inline text-ok" />
        {t('feedback.thanks')}
      </p>
    );
  const answer = (value: 'yes' | 'no') => {
    backend.logEvent({ type: 'feedback', value, lang });
    safeStorage.set(key, '1');
    setDone(true);
  };
  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="fb-q">
      <h2 id="fb-q" className="text-xl font-bold">
        {t('feedback.question')}
      </h2>
      <div className="mt-3 flex gap-3">
        <button className="btn btn-primary min-h-14 flex-1 text-xl" onClick={() => answer('yes')}>
          <Icon name="check" /> {t('common.yes')}
        </button>
        <button className="btn min-h-14 flex-1 text-xl" onClick={() => answer('no')}>
          <Icon name="x" /> {t('common.no')}
        </button>
      </div>
    </section>
  );
}

export function OfflineSince({ online, updatedAt }: { online: boolean; updatedAt: number | null }) {
  const { t } = usePrefs();
  if (online || !updatedAt) return null;
  return (
    <p role="status" className="rounded-2xl border border-line bg-solid/80 p-3 text-lg text-muted">
      <Icon name="clock" className="me-2 inline" />
      {t('common.offlineSince', { time: fmtTime(updatedAt) })}
    </p>
  );
}
