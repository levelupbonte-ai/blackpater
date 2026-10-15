import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Cursor } from './components/Cursor';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ExecutiveButtons } from './components/ExecutiveButtons';
import { AboutSection } from './components/AboutSection';
import { JourneySection } from './components/JourneySection';
import { CoverFlow } from './components/CoverFlow';
import { PhoneSimulator } from './components/PhoneSimulator';
import { SocialsGrid } from './components/SocialsGrid';
import { PhotoStrip } from './components/PhotoStrip';
import { PressSection } from './components/PressSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AbonnementsPage } from './pages/AbonnementsPage';
import { ArticlesPage } from './pages/ArticlesPage';

export const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
      const hash = window.location.hash;
      return hash ? `${path}${hash}` : path;
    }
    return '/';
  });

  const navigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      if (path.startsWith('/#')) {
        const hash = path.substring(1);
        window.history.pushState(null, '', `/${hash}`);
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        window.history.pushState(null, '', path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
      const hash = window.location.hash;
      setCurrentPath(hash ? `${path}${hash}` : path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Determine active view
  const isAbonnements = currentPath === '/abonnements' || currentPath.startsWith('/abonnements');
  const isArticles = currentPath === '/articles' || currentPath.startsWith('/articles');

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Bespoke Kinetic Dual-Layer Cursor */}
      <Cursor />

      {/* Persistent Navigation */}
      <Navbar currentRoute={currentPath} onNavigate={navigate} />

      {/* Main Content Area */}
      <main id="main" style={{ flex: 1 }}>
        {isAbonnements ? (
          <AbonnementsPage />
        ) : isArticles ? (
          <ArticlesPage onNavigate={navigate} />
        ) : (
          <>
            <Hero />
            <ExecutiveButtons onNavigate={navigate} />
            <AboutSection />
            <JourneySection />
            <CoverFlow />
            <SocialsGrid />
            <PhoneSimulator />
            <PhotoStrip />
            <PressSection onNavigate={navigate} />
            <FaqSection />
            <ContactSection />
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={navigate} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
