import { useEffect } from 'react';

/**
 * Scroll reveal, once per element, for the whole site.
 *
 * Elements matching REVEAL_SELECTOR (or carrying [data-reveal]) fade up the
 * first time they enter the viewport. Children of STAGGER_GROUPS get a small
 * increasing delay so cards in a row arrive one after the other.
 *
 * Content is never hidden unless motion is actually going to run: the hiding
 * CSS only applies under html.motion-ok, which is set here when the browser
 * supports IntersectionObserver and the visitor has not asked for reduced
 * motion. A MutationObserver picks up content rendered later (filters,
 * PaterGuide steps, language changes).
 */
const REVEAL_SELECTOR = [
  '[data-reveal]',
  '.section-header-center',
  '.section-head',
  '.page-header .container > *',
  '.hero__stat-card',
  '.about__profile-card',
  '.about__card',
  '.timeline__item',
  '.cf__head',
  '.cf__stage',
  '.soc__card',
  '.phone-showcase',
  '.press__featured',
  '.article-card',
  '.pull-quote',
  '.faq__item',
  '.contact__info-card',
  '.contact__wa-card',
  '.offer-card',
  '.tier',
  '.step',
  '.offers__question',
  '.articles__toolbar',
  '.legal__aside',
  '.legal__section',
  '.pay-card',
  '.nf__card',
  '.foot__grid > *'
].join(', ');

const STAGGER_GROUPS = [
  '.hero__stats',
  '.article-grid',
  '.tiers__grid',
  '.steps',
  '.about__grid',
  '.about__expertise-col',
  '.soc__grid',
  '.faq',
  '.foot__grid',
  '.page-header .container'
];

const STAGGER_MS = 80;
const STAGGER_MAX = 6;

function delayFor(el: Element): number {
  const parent = el.parentElement;
  if (!parent || !STAGGER_GROUPS.some((g) => parent.matches(g))) return 0;
  const idx = Array.prototype.indexOf.call(parent.children, el);
  return Math.min(Math.max(idx, 0), STAGGER_MAX) * STAGGER_MS;
}

export function useRevealOnScroll(routeKey: string) {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches || typeof IntersectionObserver === 'undefined') {
      root.classList.remove('motion-ok');
      return;
    }
    root.classList.add('motion-ok');

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add('is-revealed');
          io.unobserve(el);
          // Drop the stagger delay once the entrance is over, so hover
          // transitions respond immediately.
          const delay = parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0;
          window.setTimeout(() => el.classList.add('is-settled'), delay + 800);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );

    const prepare = (el: HTMLElement) => {
      if (el.classList.contains('is-revealed')) return;
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        const d = delayFor(el);
        if (d) el.style.setProperty('--reveal-delay', `${d}ms`);
      }
      // Observing twice is a no-op; this also re-arms elements that survive a
      // route change (footer) before they were seen.
      io.observe(el);
    };

    const scan = (scope: ParentNode) => {
      if (scope instanceof HTMLElement && scope.matches(REVEAL_SELECTOR)) prepare(scope);
      scope.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach(prepare);
    };

    scan(document.body);

    let pending = false;
    const queue: Node[] = [];
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n.nodeType === 1 && queue.push(n));
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        queue.splice(0).forEach((n) => scan(n as HTMLElement));
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const onChange = () => {
      if (reduce.matches) {
        root.classList.remove('motion-ok');
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-revealed'));
      }
    };
    reduce.addEventListener?.('change', onChange);

    return () => {
      io.disconnect();
      mo.disconnect();
      reduce.removeEventListener?.('change', onChange);
    };
  }, [routeKey]);
}
