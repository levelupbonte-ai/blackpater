import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { normalizePath } from '../../shared/routes.js';
import { safeInternalPath } from '../../shared/validation.js';

interface Location {
  path: string;
  search: string;
  hash: string;
}

interface RouterValue extends Location {
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

function readLocation(): Location {
  return {
    path: normalizePath(window.location.pathname),
    search: window.location.search,
    hash: window.location.hash
  };
}

const RouterContext = createContext<RouterValue>({ path: '/', search: '', hash: '', navigate: () => {} });

function scrollToHash(hash: string) {
  if (!hash || hash.length > 200) return false;
  let id: string;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return false; // malformed %-escape in a hand-typed URL
  }
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ block: 'start' });
  return true;
}

/**
 * Minimal client router: real URLs (one HTML file per route is served by the
 * host), history API, hash anchors, focus moved to the main region on
 * navigation for screen-reader users.
 */
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loc, setLoc] = useState<Location>(readLocation);
  const navigated = useRef(false);

  const navigate = useCallback((to: string, opts: { replace?: boolean } = {}) => {
    // In-site navigation only: "/path", never "//host", "javascript:" or another
    // origin (external links are plain <a href> elements).
    const path = safeInternalPath(to, '');
    if (!path) return;
    const url = new URL(path, window.location.origin);
    const next = { path: normalizePath(url.pathname), search: url.search, hash: url.hash };
    const method = opts.replace ? 'replaceState' : 'pushState';
    window.history[method](null, '', `${url.pathname}${url.search}${url.hash}`);
    navigated.current = true;
    setLoc(next);
    // Same anchor clicked again: state does not change, scroll directly.
    if (next.hash && next.path === normalizePath(window.location.pathname)) scrollToHash(next.hash);
  }, []);

  useEffect(() => {
    const onPop = () => {
      navigated.current = true;
      setLoc(readLocation());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Scroll + focus after the new route has rendered.
  useLayoutEffect(() => {
    // Pages load on demand: retry until the anchor exists (max ~1.5 s).
    const tryHash = (attempt = 0) => {
      if (scrollToHash(loc.hash) || attempt > 30) return;
      window.setTimeout(() => tryHash(attempt + 1), 50);
    };
    if (!navigated.current) {
      if (loc.hash) tryHash();
      return;
    }
    if (loc.hash) {
      tryHash();
    } else {
      window.scrollTo(0, 0);
      const main = document.getElementById('main');
      main?.focus({ preventScroll: true });
    }
  }, [loc.path, loc.hash, loc.search]);

  return <RouterContext.Provider value={{ ...loc, navigate }}>{children}</RouterContext.Provider>;
};

export const useRouter = () => useContext(RouterContext);

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; replace?: boolean };

/** Internal link: client-side navigation, normal behaviour for modified clicks. */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, replace, onClick, ...rest }, ref) {
  const { navigate } = useRouter();
  return (
    <a
      ref={ref}
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (rest.target && rest.target !== '_self') return;
        e.preventDefault();
        navigate(to, { replace });
      }}
      {...rest}
    />
  );
});
