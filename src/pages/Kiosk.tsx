import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import jsQR from 'jsqr';
import { Layout } from '../components/Layout.tsx';
import { LanguageGate } from '../components/LanguageGate.tsx';
import { RouteView } from '../components/RouteView.tsx';
import { Icon } from '../components/Icon.tsx';
import { TokenStatusCard } from '../components/TokenStatus.tsx';
import { DestinationCards } from './Guide.tsx';
import { TokenLookupForm } from './Token.tsx';
import { usePrefs, safeStorage } from '../lib/prefs.tsx';
import { useBackend, useHospital, useToken } from '../lib/store.tsx';
import { stopSpeaking } from '../lib/voice.ts';

type View = { kind: 'home' } | { kind: 'scan' } | { kind: 'type' } | { kind: 'choose' } | { kind: 'route'; dest: string } | { kind: 'token'; id: string } | { kind: 'help' };

const IDLE_MS = 60_000;
const WARN_MS = 10_000;

/** Pull a token id out of a scanned slip QR (".../t/<id>?src=qr"). */
export function tokenIdFromQr(text: string): string | null {
  const m = text.match(/\/t\/([A-Za-z0-9_-]{16})(?:[/?#]|$)/);
  return m ? m[1] : null;
}

function Scanner({ onToken, onFail }: { onToken: (id: string) => void; onFail: () => void }) {
  // Keep the latest callbacks in refs so the camera starts once, not on every kiosk re-render.
  const onTokenRef = useRef(onToken);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onTokenRef.current = onToken;
    onFailRef.current = onFail;
  });
  const { t } = usePrefs();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let failTimer: ReturnType<typeof setTimeout> | undefined;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
    const tick = async () => {
      if (stopped) return;
      const v = videoRef.current;
      if (v && v.readyState >= 2) {
        let text: string | null = null;
        try {
          if (detector) text = (await detector.detect(v))[0]?.rawValue ?? null;
          else if (ctx) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            text = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data ?? null;
          }
        } catch {
          /* keep scanning */
        }
        const id = text ? tokenIdFromQr(text) : null;
        if (id) return onTokenRef.current(id);
      }
      raf = requestAnimationFrame(() => void tick());
    };
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stopped) return stream.getTracks().forEach((tr) => tr.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        void tick();
      } catch {
        setError(t('kiosk.cameraDenied'));
        failTimer = setTimeout(() => !stopped && onFailRef.current(), 1800);
      }
    })();
    return () => {
      stopped = true;
      clearTimeout(failTimer);
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [t]);
  return (
    <div className="grid gap-4">
      <p className="text-3xl font-bold">{t('kiosk.scanHint')}</p>
      {error ? (
        <p role="alert" className="rounded-2xl bg-amber-300 p-5 text-2xl font-bold text-black">
          <Icon name="alert" className="me-2 inline" />
          {error}
        </p>
      ) : (
        <div className="relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-3xl bg-black">
          <video ref={videoRef} className="size-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-[18%] rounded-3xl border-4 border-white/80" />
        </div>
      )}
      <p className="text-lg text-muted">
        <Icon name="lock" className="me-2 inline" />
        {t('kiosk.cameraPrivacy')}
      </p>
    </div>
  );
}

function KioskToken({ id, at }: { id: string; at: string }) {
  const { t } = usePrefs();
  const { data } = useHospital();
  const { view, missing } = useToken(id);
  if (missing && !view) return <p className="text-3xl">{t('token.notFound')}</p>;
  if (!view) return <p className="text-2xl text-muted">{t('common.loading')}</p>;
  return (
    <div className="grid gap-5">
      <TokenStatusCard view={view} data={data} big />
      <RouteView data={data} from={at} dest={view.deptId} kiosk />
    </div>
  );
}

export default function Kiosk() {
  const { t, L, lang, resetLangChoice } = usePrefs();
  const { data } = useHospital();
  const backend = useBackend();
  const [q] = useSearchParams();
  const atQ = q.get('at');
  const at = atQ && data.landmarks.some((l) => l.id === atQ) ? atQ : (data.kiosks[0]?.landmarkId ?? 'entrance');
  const place = data.landmarks.find((l) => l.id === at);
  const [view, setView] = useState<View>({ kind: 'home' });
  const [last, setLast] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [helpSent, setHelpSent] = useState(false);

  useEffect(() => {
    safeStorage.set('wm_here', at, true);
  }, [at]);

  // 60-second idle reset: back to the language screen, nothing from the last visitor stays on screen.
  const reset = useCallback(() => {
    stopSpeaking();
    setView({ kind: 'home' });
    setHelpSent(false);
    resetLangChoice();
    setLast(Date.now());
  }, [resetLangChoice]);
  useEffect(() => {
    const touch = () => setLast(Date.now());
    const evs = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;
    evs.forEach((e) => addEventListener(e, touch, { passive: true }));
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      evs.forEach((e) => removeEventListener(e, touch));
      clearInterval(id);
    };
  }, []);
  const idle = now - last;
  useEffect(() => {
    if (idle >= IDLE_MS) reset();
  }, [idle, reset]);

  const go = (v: View) => {
    if (v.kind !== 'home' && v.kind !== 'route' && v.kind !== 'token') backend.logEvent({ type: 'kiosk_used', channel: 'kiosk', landmarkId: at, lang });
    setView(v);
  };
  const big = 'flex min-h-40 flex-col items-center justify-center gap-3 rounded-[2rem] p-6 text-4xl font-extrabold shadow-xl transition-transform hover:scale-[1.02]';

  return (
    <Layout visitor classic wide>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-xl font-bold text-accent">
          <Icon name="pin" /> {t('kiosk.at', { place: L(place?.name) })}
        </span>
        <span className="ms-auto" />
        {view.kind !== 'home' && (
          <button className="btn min-h-16 text-2xl" onClick={() => setView({ kind: 'home' })}>
            <Icon name="home" /> {t('kiosk.startOver')}
          </button>
        )}
        <button className="btn min-h-16 text-xl" onClick={() => void document.documentElement.requestFullscreen?.().catch(() => undefined)}>
          <Icon name="lock" /> {t('kiosk.fullscreen')}
        </button>
      </div>

      {idle > IDLE_MS - WARN_MS && (
        <div role="alert" className="fixed inset-x-4 top-4 z-50 rounded-3xl bg-navy p-6 text-center text-3xl font-bold text-white shadow-2xl">
          {t('kiosk.reset', { n: Math.max(0, Math.ceil((IDLE_MS - idle) / 1000)) })}
        </div>
      )}

      <LanguageGate big>
        {view.kind === 'home' && (
          <div className="grid gap-5">
            <h1 className="text-5xl font-black">{t('kiosk.title')}</h1>
            <div className="grid gap-5 md:grid-cols-3">
              <button className={`${big} bg-accent text-on-accent`} onClick={() => go({ kind: 'scan' })}>
                <Icon name="qr" size={64} /> {t('kiosk.scan')}
              </button>
              <button className={`${big} glass`} onClick={() => go({ kind: 'type' })}>
                <Icon name="keyboard" size={64} className="text-accent" /> {t('kiosk.type')}
              </button>
              <button className={`${big} glass`} onClick={() => go({ kind: 'choose' })}>
                <Icon name="route" size={64} className="text-accent" /> {t('kiosk.choose')}
              </button>
            </div>
            <button className="flex min-h-24 items-center justify-center gap-3 rounded-[2rem] bg-amber-300 text-4xl font-extrabold text-black shadow-xl" onClick={() => go({ kind: 'help' })}>
              <Icon name="helpdesk" size={48} /> {t('kiosk.help')}
            </button>
          </div>
        )}
        {view.kind === 'scan' && <Scanner onToken={(id) => setView({ kind: 'token', id })} onFail={() => setView({ kind: 'type' })} />}
        {view.kind === 'type' && (
          <div className="glass mx-auto max-w-2xl rounded-[2rem] p-8">
            <TokenLookupForm big onFound={(id) => setView({ kind: 'token', id })} />
          </div>
        )}
        {view.kind === 'choose' && <DestinationCards data={data} from={at} big onPick={(dest) => setView({ kind: 'route', dest })} />}
        {view.kind === 'route' && <RouteView data={data} from={at} dest={view.dest} kiosk />}
        {view.kind === 'token' && <KioskToken id={view.id} at={at} />}
        {view.kind === 'help' && (
          <div className="glass mx-auto grid max-w-3xl gap-5 rounded-[2rem] p-8 text-center">
            <Icon name="helpdesk" size={72} className="mx-auto text-accent" />
            {!helpSent ? (
              <button
                className="btn btn-primary min-h-24 text-3xl"
                onClick={async () => {
                  try {
                    await backend.requestGuide(at, lang);
                  } finally {
                    setHelpSent(true);
                  }
                }}
              >
                <Icon name="users" size={36} /> {t('landmark.askGuide')}
              </button>
            ) : (
              <p role="status" className="text-3xl font-bold">
                {t('kiosk.helpText')}
              </p>
            )}
          </div>
        )}
      </LanguageGate>
    </Layout>
  );
}
