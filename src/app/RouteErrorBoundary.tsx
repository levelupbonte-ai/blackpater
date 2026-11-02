import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Keeps one broken page from blanking the whole site.
 *
 * Without a boundary, any error thrown while React renders or cleans up a page
 * unmounts the entire app and the visitor sees an empty screen until they
 * refresh. This boundary sits around the routed page (the header and footer
 * stay), shows a short message with a reload button, and clears itself when
 * the visitor navigates to another page (resetKey changes).
 *
 * Many of these errors come from cleaning up the page being left (it is already
 * gone once the error is reported), so the new page is first rendered again
 * once; the notice only shows if it fails a second time.
 */
interface Props {
  resetKey: string;
  children: React.ReactNode;
}
interface State {
  failedKey: string | null;
}

export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { failedKey: null };
  private retriedKey: string | null = null;

  static getDerivedStateFromError(): Partial<State> {
    return { failedKey: '__pending__' };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    const retry = this.retriedKey !== this.props.resetKey;
    this.retriedKey = this.props.resetKey;
    this.setState({ failedKey: retry ? null : this.props.resetKey });
    // Kept in the browser console so the cause can be found from a visitor's report.
    console.error('[blackpater] page error', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.failedKey !== null) {
      this.setState({ failedKey: null });
    }
  }

  render() {
    return this.state.failedKey !== null ? <CrashNotice /> : this.props.children;
  }
}

const CrashNotice: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className='page nf'>
      <div className='container'>
        <div className='nf__card' role='alert'>
          <h1 className='nf__title'>{t('crash_title')}</h1>
          <p className='nf__lead'>{t('crash_lead')}</p>
          <div className='nf__actions'>
            <button type='button' className='btn btn--primary btn--lg' onClick={() => window.location.reload()}>
              {t('crash_reload')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
