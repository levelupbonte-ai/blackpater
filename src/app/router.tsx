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

const HASH_ROUTE_MAP: Record<string, string> = {
  '#parcours': '/parcours',
  '#journey': '/parcours',
  '#culture': '/parcours',
  '#showcase': '/parcours',
  '#medias': '/medias',
  '#socials': '/medias',
  '#phone': '/medias',
  '#contact': '/contact',
  '#faq': '/contact',
  '#abonnements': '/abonnements',
  '#offres': '/abonnements',
  '#offers': '/abonnements',
  '#articles': '/articles',
  '#press': '/articles'
};

function readLocation(): Location {
  const rawHash = window.location.hash.toLowerCase();
  const mappedPath = rawHash && HASH_ROUTE_MAP[rawHash] ? HASH_ROUTE_MAP[rawHash] : normalizePath(window.location.pathname);
  return {
    path: mappedPath,
    search: window.location.search,
    hash: ''
  };
}

const RouterContext = createContext<RouterValue>({ path: '/', search: '', hash: '', navigate: () => {} });

/**
 * Minimal client router: clean folder-based URLs (one HTML file per route is
 * served by the host), history API without URL hashes, focus moved to the main
 * region on navigation for screen-reader users.
 */
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loc, setLoc] = useState<Location>(readLocation);
  const navigated = useRef(false);

  const navigate = useCallback((to: string, opts: { replace?: boolean } = {}) => {
    const path = safeInternalPath(to, '');
    if (!path) return;
    const url = new URL(path, window.location.origin);
    const rawHash = url.hash.toLowerCase();
    const resolvedPath = rawHash && HASH_ROUTE_MAP[rawHash] ? HASH_ROUTE_MAP[rawHash] : normalizePath(url.pathname);
    const next = { path: resolvedPath, search: url.search, hash: '' };
    const method = opts.replace ? 'replaceState' : 'pushState';
    window.history[method](null, '', `${resolvedPath}${url.search}`);
    navigated.current = true;
    setLoc(next);
  }, []);

  useEffect(() => {
    // Strip any initial #hash from the browser URL bar immediately on load.
    if (window.location.hash) {
      const rawHash = window.location.hash.toLowerCase();
      const targetPath = HASH_ROUTE_MAP[rawHash] || normalizePath(window.location.pathname);
      window.history.replaceState(null, '', `${targetPath}${window.location.search}`);
    }
    const onPop = () => {
      if (window.location.hash) {
        const rawHash = window.location.hash.toLowerCase();
        const targetPath = HASH_ROUTE_MAP[rawHash] || normalizePath(window.location.pathname);
        window.history.replaceState(null, '', `${targetPath}${window.location.search}`);
      }
      navigated.current = true;
      setLoc(readLocation());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Scroll + focus after the new route has rendered.
  useLayoutEffect(() => {
    if (!navigated.current) return;
    window.scrollTo(0, 0);
    const main = document.getElementById('main');
    main?.focus({ preventScroll: true });
  }, [loc.path, loc.search]);

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
