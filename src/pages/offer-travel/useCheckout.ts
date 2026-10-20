import { useCallback, useEffect, useRef, useState } from 'react';
import { createCheckoutController } from '../../lib/checkout-client.js';
import { useRouter } from '../../app/router';

export type CheckoutState =
  | { kind: 'idle' }
  | { kind: 'redirecting' }
  | { kind: 'unavailable' }
  | { kind: 'error'; code: 'rate_limited' | 'timeout' | 'network' | 'checkout_failed' };

function sessionStorageOrNull(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Pay button state machine. One controller per page: every tap and retry
 * reuses the same purchase attempt (see src/lib/checkout-client.js).
 */
export function useCheckout(offerId: string) {
  const { navigate } = useRouter();
  const [state, setState] = useState<CheckoutState>({ kind: 'idle' });
  const controller = useRef<ReturnType<typeof createCheckoutController> | null>(null);
  const currentOfferId = useRef<string>('');
  if (!controller.current || currentOfferId.current !== offerId) {
    currentOfferId.current = offerId;
    controller.current = createCheckoutController({ offerId, storage: sessionStorageOrNull() });
  }

  // Show the neutral "unavailable" state up front when Stripe is not configured.
  useEffect(() => {
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 6000);
    fetch('/api/stripe/config', { signal: abort.signal, credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.available === false) setState({ kind: 'unavailable' });
      })
      .catch(() => {
        /* unknown: keep the button usable, the checkout call will tell */
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      abort.abort();
      window.clearTimeout(timer);
    };
  }, []);

  // Back/forward cache: the page comes back exactly as it was left
  // ("redirecting…"); unlock it so the visitor can pay — same attempt id.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      controller.current?.reset();
      setState((s) => (s.kind === 'unavailable' ? s : { kind: 'idle' }));
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const busy = useRef(false);
  const pay = useCallback(async () => {
    if (busy.current || state.kind === 'redirecting' || state.kind === 'unavailable') return;
    busy.current = true;
    setState({ kind: 'redirecting' });
    const result = await controller.current!.start();
    if (result.type === 'redirect') {
      window.location.assign(result.url);
      return; // stays locked while the browser leaves the page
    }
    busy.current = false;
    if (result.type === 'paid') {
      navigate(result.redirect);
      return;
    }
    if (result.code === 'payments_unavailable') setState({ kind: 'unavailable' });
    else setState({ kind: 'error', code: result.code as Exclude<CheckoutState, { kind: 'idle' | 'redirecting' | 'unavailable' }>['code'] });
  }, [state.kind, navigate]);

  // Reset the lock flag when the page is restored from the bfcache.
  useEffect(() => {
    if (state.kind === 'idle') busy.current = false;
  }, [state.kind]);

  return { state, pay };
}
