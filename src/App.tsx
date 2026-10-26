import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { PrefsProvider, usePrefs } from './lib/prefs.tsx';
import { BackendProvider, useStore } from './lib/store.tsx';
import { Home } from './pages/Home.tsx';
// Every page is its own chunk: a phone that scans a QR downloads only what that screen needs.
// The service worker still precaches all of them for offline use.
const GuideHome = lazy(() => import('./pages/Guide.tsx').then((m) => ({ default: m.GuideHome })));
const GuideRoute = lazy(() => import('./pages/Guide.tsx').then((m) => ({ default: m.GuideRoute })));
const TokenLookup = lazy(() => import('./pages/Token.tsx').then((m) => ({ default: m.TokenLookup })));
const TokenPage = lazy(() => import('./pages/Token.tsx').then((m) => ({ default: m.TokenPage })));
const Family = lazy(() => import('./pages/Family.tsx').then((m) => ({ default: m.Family })));
const LandmarkPage = lazy(() => import('./pages/Landmark.tsx').then((m) => ({ default: m.LandmarkPage })));
const Emergency = lazy(() => import('./pages/Emergency.tsx').then((m) => ({ default: m.Emergency })));
const Prepare = lazy(() => import('./pages/Prepare.tsx').then((m) => ({ default: m.Prepare })));
const FollowUp = lazy(() => import('./pages/FollowUp.tsx').then((m) => ({ default: m.FollowUp })));
const VisitPage = lazy(() => import('./pages/Visit.tsx'));
const More = lazy(() => import('./pages/More.tsx'));
const AssistantPage = lazy(() => import('./pages/AssistantPage.tsx'));
const Help = lazy(() => import('./pages/Help.tsx'));
const Tour = lazy(() => import('./pages/Tour.tsx'));
const Book = lazy(() => import('./pages/Book.tsx').then((m) => ({ default: m.Book })));
import { NotFound } from './pages/NotFound.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Staff, display and demo screens load on demand so visitor pages stay small and fast.
const Kiosk = lazy(() => import('./pages/Kiosk.tsx'));
const Board = lazy(() => import('./pages/Board.tsx'));
const Desk = lazy(() => import('./pages/Desk.tsx'));
const Staff = lazy(() => import('./pages/Staff.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Admin = lazy(() => import('./pages/Admin.tsx'));
const Signage = lazy(() => import('./pages/Signage.tsx'));
const Insights = lazy(() => import('./pages/Insights.tsx'));
const DemoHub = lazy(() => import('./pages/DemoHub.tsx'));
const Show = lazy(() => import('./pages/Show.tsx'));
const Walk = lazy(() => import('./pages/Walk.tsx'));
const Health = lazy(() => import('./pages/Health.tsx'));

function Loading() {
  const { t } = usePrefs();
  return (
    <p role="status" className="p-10 text-center text-xl text-muted">
      {t('common.loading')}
    </p>
  );
}

/** Entering any /demo page switches this tab to the in-browser demo backend. */
function DemoSwitch() {
  const loc = useLocation();
  const { setDemo } = useStore();
  useEffect(() => {
    // Always persist the flag (the initial state may already be true from the URL).
    if (loc.pathname.startsWith('/demo')) setDemo(true);
  }, [loc.pathname, setDemo]);
  return null;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const L = ({ children }: { children: ReactNode }) => <Suspense fallback={<Loading />}>{children}</Suspense>;

export function App() {
  return (
    <PrefsProvider>
      <BrowserRouter>
        <BackendProvider>
          <DemoSwitch />
          <ScrollTop />
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/visit/:chapter" element={<L><VisitPage /></L>} />
            <Route path="/more" element={<L><More /></L>} />
            <Route path="/assistant" element={<L><AssistantPage /></L>} />
            <Route path="/help" element={<L><Help /></L>} />
            <Route path="/tour" element={<L><Tour /></L>} />
            <Route path="/g" element={<L><GuideHome /></L>} />
            <Route path="/g/:dest" element={<L><GuideRoute /></L>} />
            <Route path="/t" element={<L><TokenLookup /></L>} />
            <Route path="/t/:id" element={<L><TokenPage /></L>} />
            <Route path="/f/:id" element={<L><Family /></L>} />
            <Route path="/w/:landmark" element={<L><LandmarkPage /></L>} />
            <Route path="/emergency" element={<L><Emergency /></L>} />
            <Route path="/prepare" element={<L><Prepare /></L>} />
            <Route path="/followup" element={<L><FollowUp /></L>} />
            <Route path="/book" element={<L><Book /></L>} />
            <Route path="/kiosk" element={<L><Kiosk /></L>} />
            <Route path="/board" element={<L><Board /></L>} />
            <Route path="/register" element={<L><Desk /></L>} />
            <Route path="/staff" element={<L><Staff /></L>} />
            <Route path="/login" element={<L><Login /></L>} />
            <Route path="/admin" element={<L><Admin /></L>} />
            <Route path="/admin/signage" element={<L><Signage /></L>} />
            <Route path="/insights" element={<L><Insights /></L>} />
            <Route path="/demo" element={<L><DemoHub /></L>} />
            <Route path="/demo/show" element={<L><Show /></L>} />
            <Route path="/demo/walk" element={<L><Walk /></L>} />
            <Route path="/health" element={<L><Health /></L>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </BackendProvider>
      </BrowserRouter>
    </PrefsProvider>
  );
}
