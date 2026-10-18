import React from 'react';
import './home.css';
import { Hero } from './sections/Hero';
import { EntryLinks } from './sections/EntryLinks';
import { About } from './sections/About';
import { Journey } from './sections/Journey';
import { CoverFlow } from './sections/CoverFlow';
import { Socials } from './sections/Socials';
import { DigitalPresence } from './sections/DigitalPresence';
import { PhotoStrip } from './sections/PhotoStrip';
import { Press } from './sections/Press';
import { HomeFaq } from './sections/HomeFaq';
import { Contact } from './sections/Contact';

export const HomePage: React.FC = () => (
  <>
    <Hero />
    <EntryLinks />
    <About />
    <Journey />
    <CoverFlow />
    <Socials />
    <DigitalPresence />
    <PhotoStrip />
    <Press />
    <HomeFaq />
    <Contact />
  </>
);

export default HomePage;
