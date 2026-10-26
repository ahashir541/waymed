import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LANGS } from '../lib/types.ts';
import { usePrefs } from '../lib/prefs.tsx';
import { useOnline, useStore } from '../lib/store.tsx';
import { STATIC_DEMO } from '../lib/store.tsx';
import { LANG_NAMES } from '../lib/i18n/core.ts';
import { Icon } from './Icon.tsx';
import { lazy, Suspense } from 'react';
import { currentPlace } from '../lib/place.ts';

// The classic (kiosk) layout loads the assistant on demand to keep the shared bundle small.
const Assistant = lazy(() => import('./Assistant.tsx').then((m) => ({ default: m.Assistant })));
import { VisitorShell } from './VisitorShell.tsx';

export function Brand({ small }: { small?: boolean }) {
  const { t } = usePrefs();
  return (
    <span className="inline-flex items-center gap-2">
      <img src="/icon.svg" alt="" width={small ? 32 : 40} height={small ? 32 : 40} className="rounded-xl" />
      <span className="leading-tight">
        <span className="block text-xl font-extrabold tracking-tight">{t('app.name')}</span>
        {!small && <span className="block text-base text-muted">{t('app.tagline')}</span>}
      </span>
    </span>
  );
}

export function LanguageSwitch() {
  const { lang, setLang, t } = usePrefs();
  return (
    <div role="group" aria-label={t('settings.language')} className="flex rounded-2xl border border-line bg-solid p-1">
      {LANGS.map((l) => (
        <button
          key={l}
          lang={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`min-h-11 min-w-[4.4rem] rounded-xl px-2 font-semibold leading-none ${lang === l ? 'bg-accent text-on-accent' : ''}`}
        >
          {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  );
}

export function EmergencyButton() {
  const { t } = usePrefs();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/emergency?from=${currentPlace()}`)}
      className="no-print fixed bottom-4 start-4 z-40 flex min-h-16 items-center gap-2 rounded-full bg-[#b91c1c] px-5 text-lg font-extrabold text-white shadow-xl ring-4 ring-white/70 transition-transform hover:scale-105"
    >
      <Icon name="siren" size={28} strokeWidth={2.4} />
      {t('emergency.button')}
    </button>
  );
}

export function StatusBanners() {
  const { t } = usePrefs();
  const { demo, setDemo } = useStore();
  const online = useOnline();
  const navigate = useNavigate();
  return (
    <>
      {demo && (
        <div className="no-print flex flex-wrap items-center justify-center gap-3 bg-amber-300 px-4 py-2 text-center font-bold text-black">
          <Icon name="play" size={20} /> {t('demo.banner')}
          {!STATIC_DEMO && (
          <button
            className="rounded-lg border border-black/40 px-3 py-1 font-semibold underline"
            onClick={() => {
              setDemo(false);
              navigate('/');
            }}
          >
            {t('demo.exit')}
          </button>
          )}
        </div>
      )}
      {!online && (
        <div role="status" className="no-print flex items-center justify-center gap-2 bg-slate-700 px-4 py-2 text-center font-semibold text-white">
          <Icon name="alert" size={20} /> {t('common.offline')}
        </div>
      )}
    </>
  );
}

interface LayoutProps {
  children: ReactNode;
  /** Visitor screens get the assistant. Every screen gets the Emergency button. */
  visitor?: boolean;
  wide?: boolean;
  hideHeader?: boolean;
  /** Keep the classic large layout (kiosk screens). */
  classic?: boolean;
}

export function Layout({ children, visitor, wide, hideHeader, classic }: LayoutProps) {
  // Visitor screens live in the mobile-first visitor app shell.
  if (visitor && !classic) return <VisitorShell wide={wide}>{children}</VisitorShell>;
  return <ClassicLayout visitor={visitor} wide={wide} hideHeader={hideHeader}>{children}</ClassicLayout>;
}

function ClassicLayout({ children, visitor, wide, hideHeader }: LayoutProps) {
  const { t, large, setLarge, theme, setTheme } = usePrefs();
  const loc = useLocation();
  return (
    <div className="min-h-dvh pb-28">
      <a href="#main" className="sr-only-focusable btn btn-primary absolute start-2 top-2 z-50">
        {t('app.skip')}
      </a>
      <StatusBanners />
      {!hideHeader && (
        <header className="no-print sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--wm-bg)_82%,transparent)] backdrop-blur-md">
          <div className={`mx-auto flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>
            <Link to="/" aria-label={`${t('app.name')} - ${t('common.home')}`} className="me-auto rounded-xl max-sm:basis-full">
              <Brand small={loc.pathname !== '/'} />
            </Link>
            {/* One fixed-width row so the late-loading Urdu/Sindhi font cannot make the header wrap and jump. */}
            <div className="flex flex-nowrap items-center gap-2">
            <LanguageSwitch />
            <button className="btn min-h-11 px-3" aria-pressed={large} onClick={() => setLarge(!large)} title={t('settings.largerText')}>
              <Icon name="text" />
              <span className="sr-only sm:not-sr-only">{t('settings.largerText')}</span>
            </button>
            <button
              className="btn min-h-11 px-3"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? t('settings.light') : t('settings.dark')}
              title={theme === 'dark' ? t('settings.light') : t('settings.dark')}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            </div>
          </div>
        </header>
      )}
      <main id="main" className={`mx-auto px-4 py-5 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>
        {children}
      </main>
      <EmergencyButton />
      {visitor && (
        <Suspense fallback={null}>
          <Assistant />
        </Suspense>
      )}
    </div>
  );
}

export function PageTitle({ icon, children, sub }: { icon?: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
        {icon && (
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon name={icon} size={28} />
          </span>
        )}
        {children}
      </h1>
      {sub && <p className="mt-2 text-lg text-muted">{sub}</p>}
    </div>
  );
}
