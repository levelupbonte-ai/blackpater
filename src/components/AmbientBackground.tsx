import React, { useEffect, useRef } from 'react';

interface Orb {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  colorDark: string;
  colorLight: string;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
}

/**
 * Interactive particle & ambient gradient background.
 */
export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const orbs: Orb[] = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 260 + 180,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      colorDark: i % 2 === 0 ? 'rgba(0, 168, 255, 0.07)' : 'rgba(255, 107, 0, 0.06)',
      colorLight: i % 2 === 0 ? 'rgba(0, 119, 230, 0.05)' : 'rgba(255, 69, 0, 0.05)'
    }));

    const particleCount = Math.min(60, Math.floor((width * height) / 22000));
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.8,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.4 + 0.2
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x - orb.radius < -120 || orb.x + orb.radius > width + 120) orb.vx *= -1;
        if (orb.y - orb.radius < -120 || orb.y + orb.radius > height + 120) orb.vy *= -1;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        grad.addColorStop(0, isLight ? orb.colorLight : orb.colorDark);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      const dotRgb = isLight ? '71, 85, 105' : '148, 163, 184';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotRgb}, ${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${dotRgb}, ${0.13 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className='ambient-canvas' aria-hidden='true' />;
};
