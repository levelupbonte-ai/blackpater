import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from '../app/router';
import { AmbientBackground } from '../components/AmbientBackground';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const { path } = useRouter();

  // Progressive scroll-reveal observer so text, buttons, and cards build smoothly as the user lands and scrolls
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const selectors = [
      '.section-header-center',
      '.section-head',
      '.page-head__inner > *',
      '.hero__stat-card',
      '.about__portrait-col',
      '.about__bio-card',
      '.about__role-card',
      '.about__pill',
      '.about__cta-card',
      '.about__quote-bar',
      '.timeline__item',
      '.cf__head',
      '.cf__stage',
      '.soc__card',
      '.phone-showcase',
      '.press__featured',
      '.press__card',
      '.press__quote',
      '.faq__item',
      '.contact__info-card',
      '.contact__wa-card',
      '.offer-card',
      '.offers__question',
      '.art-card',
      '.nf__card',
      '.foot__brand',
      '.foot__col'
    ].join(', ');

    const timer = window.setTimeout(() => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors));
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -6% 0px', threshold: 0.08 }
      );

      elements.forEach((el, idx) => {
        el.classList.add('reveal-on-scroll');
        el.style.setProperty('--reveal-idx', String(idx % 4));
        io.observe(el);
      });

      return () => io.disconnect();
    }, 30);

    return () => window.clearTimeout(timer);
  }, [path]);

  return (
    <>
      <AmbientBackground />
      <a className='skip-link' href='#main'>
        {t('skip_to_content')}
      </a>
      <Navbar />
      <main id='main' tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
};
