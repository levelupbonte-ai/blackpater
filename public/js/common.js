/**
 * Black Pater Official - Shared Runtime Logic
 * Handles Header, Navigation, Mobile Drawer, Footer Accordion, and Multilingual Switch
 */

(function () {
  'use strict';

  const $ = (s, r = document) => (r && typeof r.querySelector === 'function') ? r.querySelector(s) : null;
  const $$ = (s, r = document) => (r && typeof r.querySelectorAll === 'function') ? [...r.querySelectorAll(s)] : [];

  const WA_NUMBER = '17205490926';
  const MSG = {
    en: 'Hello Jean-Pierre, I discovered your platform and would like to connect with you.',
    fr: "Bonjour Jean-Pierre, j'ai découvert votre plateforme et j'aimerais échanger avec vous."
  };

  // Language management
  let currentLang = localStorage.getItem('bp_lang') || 'fr'; // default to French as requested by user

  const DICT = {
    fr: {
      nav_home: 'Accueil',
      nav_subs: 'Nos Abonnements',
      nav_articles: 'Mes Articles',
      nav_bio: 'Biographie',
      nav_medias: 'Vidéos & Médias',
      nav_contact: 'Contact & Booking',
      foot_nav: 'Navigation',
      foot_media: 'Revue de Presse & Médias',
      foot_socials: 'Réseaux Officiels',
      snd_on: 'Activer le son',
      snd_off: 'Couper le son'
    },
    en: {
      nav_home: 'Home',
      nav_subs: 'Subscriptions',
      nav_articles: 'My Articles',
      nav_bio: 'Biography',
      nav_medias: 'Videos & Media',
      nav_contact: 'Contact & Booking',
      foot_nav: 'Navigation',
      foot_media: 'Press & Media Features',
      foot_socials: 'Official Socials',
      snd_on: 'Sound On',
      snd_off: 'Sound Off'
    }
  };

  function updateTranslations(l) {
    currentLang = l;
    document.documentElement.lang = l;
    localStorage.setItem('bp_lang', l);

    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (DICT[l] && DICT[l][key]) {
        el.textContent = DICT[l][key];
      }
    });

    $$('[data-lang]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === l));
      b.classList.toggle('active', b.dataset.lang === l);
    });
  }

  // Language buttons click
  $$('[data-lang]').forEach(b => {
    b.addEventListener('click', () => {
      const targetLang = b.dataset.lang;
      if (targetLang) updateTranslations(targetLang);
    });
  });

  // Mobile menu
  const burger = $('#burger');
  const mmenu = $('#mmenu');

  function openMenu() {
    document.body.classList.add('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    if (mmenu) {
      mmenu.setAttribute('aria-hidden', 'false');
      mmenu.classList.add('is-open');
    }
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (mmenu) {
      mmenu.setAttribute('aria-hidden', 'true');
      mmenu.classList.remove('is-open');
    }
  }

  if (burger) {
    burger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = document.body.classList.contains('menu-open');
      isOpen ? closeMenu() : openMenu();
    });
  }

  if (mmenu) {
    $$('a', mmenu).forEach(a => a.addEventListener('click', closeMenu));
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Footer Accordion (Samsung style mobile)
  $$('.foot__accordion-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.foot__accordion');
      if (!parent) return;
      const isOpen = parent.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // Highlight current active route
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  $$('.nav__links a, .mmenu__links a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const cleanHref = href.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    if (cleanHref === path) {
      a.classList.add('is-active');
    }
  });

  // WhatsApp link helper
  window.waUrl = function (customText) {
    const msg = customText || MSG[currentLang] || MSG.fr;
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  };

  // Bind any [data-wa] links
  $$('[data-wa]').forEach(el => {
    el.addEventListener('click', function(e) {
      const custom = el.getAttribute('data-wa-text');
      el.href = window.waUrl(custom);
    });
  });

  // Reveal observer
  const revIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  $$('.fade, .rule, [data-split]').forEach(el => revIO.observe(el));

  // Initialize language on DOM ready
  updateTranslations(currentLang);
})();
