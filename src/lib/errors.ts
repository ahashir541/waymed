// Error tracking hook. Sends only the error message and route (ids masked) to the server log,
// at most 5 per page load. To use a hosted tracker (Sentry, GlitchTip...), set VITE_ERROR_DSN and
// forward from reportError() below; keep the same rule: no visitor data.
let sent = 0;

export function reportError(message: string) {
  if (sent >= 5 || typeof fetch === 'undefined') return;
  sent++;
  const path = location.pathname.replace(/[A-Za-z0-9_-]{16,}/g, '[id]');
  fetch('/api/public/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-waymed': '1' },
    body: JSON.stringify({ message: message.slice(0, 300), path }),
  }).catch(() => undefined);
}

export function installErrorHook() {
  addEventListener('error', (e) => reportError(String(e.message || 'error')));
  addEventListener('unhandledrejection', (e) => reportError(String((e.reason as Error)?.message ?? e.reason ?? 'rejection')));
}
