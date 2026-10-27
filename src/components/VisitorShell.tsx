// Mobile-first visitor app frame. On a phone it fills the screen; on a desktop or projector it sits
// centred inside a phone frame. Header (language, text size, Emergency), optional journey progress,
// animated content area and a 4-item bottom navigation.
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

// The assistant is loaded only when a visitor screen first renders its button.
const Assistant = lazy(() => import('./Assistant.tsx').then((m) => ({ default: m.Assistant })));
import { Link, useLocation, useNavigate } from 'react-router';
import { LANGS } from '../lib/types.ts';
import { usePrefs, safeStorage } from '../lib/prefs.tsx';
import { useHospital, useOnline, useStore } from '../lib/store.tsx';
import { STATIC_DEMO } from '../lib/store.tsx';
import { LANG_NAMES } from '../lib/i18n/core.ts';
import { CHAPTERS, chapterPath, useVisit, type Chapter } from '../lib/visit.ts';
import { Icon } from './Icon.tsx';
import { BUILT_BY } from '../data/story.ts';

export function LanguageChip() {
  const { lang, setLang, t } = usePrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    addEventListener('pointerdown', close);
    return () => removeEventListener('pointerdown', close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button className="vchip" aria-haspopup="listbox" aria-expanded={open} aria-label={`${t('settings.language')}: ${LANG_NAMES[lang]}`} onClick={() => setOpen(!open)}>
        <Icon name="globe" size={18} />
        <span lang={lang}>{LANG_NAMES[lang]}</span>
      </button>
      {open && (
        <ul role="listbox" aria-label={t('settings.language')} className="v-pop absolute start-0 top-full z-30 mt-2 w-40 overflow-hidden rounded-2xl border border-line bg-solid p-1 shadow-2xl">
          {LANGS.map((l) => (
            <li key={l}>
              <button
                role="option"
                aria-selected={l === lang}
                lang={l}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${l === lang ? 'bg-accent text-on-accent' : 'hover:bg-white/5'}`}
                onClick={() => {
                  setLang(l);
                  setOpen(false);
                }}
              >
                {LANG_NAMES[l]}
                {l === lang && <Icon name="check" size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function JourneyProgress({ chapter }: { chapter: Chapter }) {
  const { t } = usePrefs();
  const idx = CHAPTERS.indexOf(chapter);
  return (
    <nav aria-label={t('v.progress', { n: idx + 1 })}>
      <ol className="flex items-center gap-1.5">
        {CHAPTERS.map((c, i) => (
          <li key={c} className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="v-bar h-full rounded-full bg-accent" style={{ transform: `scaleX(${i <= idx ? 1 : 0})` }} />
            </div>
            <span className={`mt-1 block truncate text-center text-xs ${i === idx ? 'font-bold text-accent' : 'text-muted'}`} aria-current={i === idx ? 'step' : undefined}>
              {t(`v.ch.${c}`)}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function useNavItems() {
  const { t } = usePrefs();
  const { pathname } = useLocation();
  const visit = useVisit();
  const journeyTo = visit ? chapterPath(visit.chapter) : '/';
  return [
    { to: journeyTo, icon: 'route', label: t('v.nav.journey'), active: pathname === '/' || pathname.startsWith('/visit/') || pathname.startsWith('/t/') },
    { to: '/g', icon: 'pin', label: t('v.nav.map'), active: pathname.startsWith('/g') || pathname.startsWith('/w/') },
    { to: '/more', icon: 'plus', label: t('v.nav.more'), active: ['/more', '/book', '/prepare', '/followup', '/assistant', '/demo/walk', '/tour'].some((p) => pathname.startsWith(p)) },
    { to: '/help', icon: 'helpdesk', label: t('v.nav.help'), active: pathname.startsWith('/help') },
  ];
}

/** Top navigation for desktop and tablet screens. */
function TopNav() {
  const items = useNavItems();
  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              to={it.to}
              aria-current={it.active ? 'page' : undefined}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${it.active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-white/5 hover:text-ink'}`}
            >
              <Icon name={it.icon} size={17} strokeWidth={it.active ? 2.4 : 2} />
              <span className="sr-only lg:not-sr-only">{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Bottom navigation, only on narrow screens. "Ask" opens the voice assistant, so no floating
 *  button ever covers page content on a phone. */
function BottomNav({ ask }: { ask: boolean }) {
  const { t } = usePrefs();
  const items = useNavItems();
  const [askOpen, setAskOpen] = useState(false);
  useEffect(() => {
    const on = (e: Event) => setAskOpen(Boolean((e as CustomEvent<boolean>).detail));
    addEventListener('wm:ask-state', on);
    return () => removeEventListener('wm:ask-state', on);
  }, []);
  return (
    <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[#111] pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className={`grid ${ask ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {items.map((it) => (
          <li key={it.label}>
            <Link to={it.to} aria-current={it.active ? 'page' : undefined} className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${it.active ? 'text-accent' : 'text-muted hover:text-ink'}`}>
              <Icon name={it.icon} size={20} strokeWidth={it.active ? 2.4 : 2} />
              {it.label}
            </Link>
          </li>
        ))}
        {ask && (
          <li>
            <button
              type="button"
              onClick={() => dispatchEvent(new Event('wm:ask'))}
              aria-expanded={askOpen}
              aria-controls="wm-assistant"
              aria-label={t('assistant.open')}
              className={`flex min-h-[58px] w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold ${askOpen ? 'text-accent' : 'text-muted hover:text-ink'}`}
            >
              <span className={`grid size-7 place-items-center rounded-full ${askOpen ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent'}`}>
                <Icon name={askOpen ? 'x' : 'mic'} size={16} strokeWidth={2.4} />
              </span>
              {t('v.nav.ask')}
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

interface Props {
  children: ReactNode;
  /** Wider content area (map, demo tour). Most pages use a comfortable reading width. */
  wide?: boolean;
  hideNav?: boolean;
}

export function VisitorShell({ children, wide, hideNav }: Props) {
  const { t, L, large, setLarge } = usePrefs();
  const { data } = useHospital();
  const { demo, setDemo } = useStore();
  const online = useOnline();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const chapter = pathname.startsWith('/visit/') ? (pathname.split('/')[2] as Chapter) : null;
  const visit = useVisit();

  useEffect(() => {
    const el = document.documentElement;
    el.classList.add('vmode');
    return () => el.classList.remove('vmode');
  }, []);

  return (
    <div className="vbackdrop min-h-dvh overflow-x-clip pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-24">
      <a href="#vmain" className="sr-only-focusable btn btn-primary absolute start-2 top-2 z-50">
        {t('app.skip')}
      </a>
      {demo && (
        <div className="flex items-center justify-center gap-2 bg-accent px-4 py-1.5 text-sm font-bold text-on-accent">
          <Icon name="play" size={14} /> {t('common.simulation')} · {t('v.demoData')}
          {!STATIC_DEMO && (
          <button
            className="ms-1 underline"
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
        <div role="status" className="flex items-center justify-center gap-2 bg-[#2a2a2a] px-4 py-1.5 text-sm font-semibold text-ink">
          <Icon name="alert" size={14} /> {t('common.offline')}
        </div>
      )}
      <header className="no-print sticky top-0 z-30 border-b border-line bg-[#0b0b0b]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <Link to="/" aria-label={`${t('app.name')} - ${t('common.home')}`} className="flex shrink-0 items-center gap-2 rounded-xl">
            <img src="/icon.svg" alt="" width={34} height={34} className="rounded-[9px]" />
            <span className={`hidden leading-tight sm:block ${hideNav ? '' : 'md:hidden lg:block'}`}>
              <span className="block text-base font-extrabold tracking-tight">{t('app.name')}</span>
              <span className="block max-w-[14rem] truncate text-xs text-muted">{L(data.hospital.name)}</span>
            </span>
          </Link>
          {!hideNav && (
            <div className="md:ms-1 lg:ms-4">
              <TopNav />
            </div>
          )}
          <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageChip />
            <button className="vchip px-2.5" aria-pressed={large} onClick={() => setLarge(!large)} aria-label={t('settings.largerText')} title={t('settings.largerText')}>
              <span aria-hidden="true" className="text-sm font-black leading-none">
                A<span className="text-[10px]">A</span>
              </span>
            </button>
            <Link
              to={`/emergency?from=${visit?.here ?? safeStorage.get('wm_here', true) ?? 'entrance'}`}
              className="v-sos inline-flex h-10 items-center gap-1.5 rounded-full bg-[#D92D20] px-3.5 text-sm font-bold text-white"
            >
              <Icon name="siren" size={17} strokeWidth={2.4} /> {t('emergency.button')}
            </Link>
          </div>
        </div>
      </header>
      {chapter && CHAPTERS.includes(chapter) && (
        <div className="mx-auto max-w-2xl px-4 pt-5 md:px-6">
          <JourneyProgress chapter={chapter} />
        </div>
      )}
      <main id="vmain" className={`vshell mx-auto px-4 pt-6 md:px-6 md:pt-7 ${wide ? 'max-w-6xl' : 'max-w-xl'}`}>
        <div key={pathname} className="v-enter">
          {children}
        </div>
      </main>
      {/* Credit on every visitor page. */}
      <footer className="no-print mx-auto mt-10 max-w-6xl px-4 text-center text-xs text-muted md:px-6">
        WayMed · {t('v.story.builtBy')} <span className="ltr font-semibold text-ink">{BUILT_BY}</span>
      </footer>
      {!hideNav && <BottomNav ask={!pathname.startsWith('/assistant') && !pathname.startsWith('/tour')} />}
      {!hideNav && !pathname.startsWith('/assistant') && !pathname.startsWith('/tour') && (
        <Suspense fallback={null}>
          <Assistant floating />
        </Suspense>
      )}
    </div>
  );
}

/** Standard card used across the visitor app. */
export function VCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</div>;
}

export function VTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4 mt-1">
      <h1 className="text-2xl font-extrabold leading-tight">{children}</h1>
      {sub && <p className="mt-1 text-muted">{sub}</p>}
    </div>
  );
}
