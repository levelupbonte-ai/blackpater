import React from 'react';
import './home.css';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Press } from './sections/Press';

export const HomePage: React.FC = () => (
  <>
    <Hero />
    <About />
    <Press />
  </>
);

export default HomePage;
