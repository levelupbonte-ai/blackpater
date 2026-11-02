import React from 'react';
import './home.css';
import './premium.css';
import { Hero } from './sections/Hero';
import { HomeOffers } from './sections/HomeOffers';
import { FinalCta, HowItWorks } from './sections/HowItWorks';
import { About } from './sections/About';
import { Press } from './sections/Press';
import { HomeFaq } from './sections/HomeFaq';

export const HomePage: React.FC = () => (
  <>
    <Hero />
    <HomeOffers />
    <HowItWorks />
    <About />
    <Press />
    <HomeFaq />
    <FinalCta />
  </>
);

export default HomePage;
