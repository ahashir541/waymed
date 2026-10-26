import { Component, type ReactNode } from 'react';
import { translate } from '../lib/i18n/core.ts';
import { reportError } from '../lib/errors.ts';

/** Last line of defence: never leave a visitor on a blank screen. Message in all three languages. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    reportError(`render: ${error.message}`);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-3xl border border-line bg-solid p-8 text-center text-xl">
        <p>{translate('en', 'common.error')}</p>
        <p lang="ur" dir="rtl">
          {translate('ur', 'common.error')}
        </p>
        <p lang="sd" dir="rtl">
          {translate('sd', 'common.error')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="btn btn-primary" onClick={() => location.reload()}>
            {translate('en', 'common.retry')} · <span lang="ur">{translate('ur', 'common.retry')}</span>
          </button>
          <a className="btn btn-danger" href="/emergency">
            {translate('en', 'emergency.button')} · <span lang="ur">{translate('ur', 'emergency.button')}</span>
          </a>
        </div>
      </div>
    );
  }
}
