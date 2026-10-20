import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from '../app/router';
import { AmbientBackground } from '../components/AmbientBackground';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const REVEAL_SELECTOR = [
  '.section-header-center',
  '.section-head',
  '.hero__stat-card',
  '.about__profile-card',
  '.about__card',
  '.about__role-item',
  '.jny__tabs-wrap',
  '.jrow',
  '.jny__card',
  '.showcase-card',
  '.scard',
  '.dig__tabs',
  '.dig__device',
  '.article-card',
  '.pull-quote',
  '.faq__item',
  '.contact__info-card',
  '.contact__form-card',
  '.step'
].join(', ');

export const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, lang } = useLanguage();
  const { path } = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    // Group siblings to assign staggered delays so sections build progressively on scroll
    const parentCounts = new Map<Element | null, number>();
    elements.forEach((el) => {
      if (el.classList.contains('is-revealed')) return;
      el.classList.add('reveal-on-scroll');
      const parent = el.parentElement;
      const idx = parentCounts.get(parent) ?? 0;
      parentCounts.set(parent, idx + 1);
      el.style.setProperty('--reveal-idx', String(idx % 6));
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => {
      if (!el.classList.contains('is-revealed')) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [path, lang]);

  return (
    <>
      <a className='skip-link' href='#main'>
        {t('skip_to_content')}
      </a>
      <AmbientBackground />
      <Navbar />
      <main id='main' tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
};
