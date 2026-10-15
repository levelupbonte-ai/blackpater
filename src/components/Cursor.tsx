import React, { useEffect, useRef, useState } from 'react';

export const Cursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer) return;

    setEnabled(true);

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isFirstMove = true;
    let isHovering = false;
    let isInput = false;
    let isDown = false;
    let isVisible = false;
    let currentLabel = '';
    let rafId: number | null = null;

    const LERP_FACTOR = 0.18;

    const updateLoop = () => {
      if (isVisible && ringRef.current) {
        ringX += (mouseX - ringX) * LERP_FACTOR;
        ringY += (mouseY - ringY) * LERP_FACTOR;

        const transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%)`;
        ringRef.current.style.transform = transform;
        if (labelRef.current) {
          labelRef.current.style.transform = transform;
        }
      }
      rafId = requestAnimationFrame(updateLoop);
    };

    const inspectHoverTarget = (target: EventTarget | null) => {
      if (!target || !(target instanceof Element) || !rootRef.current) return;

      const inputField = target.closest('input[type="text"], input[type="email"], textarea, [contenteditable="true"]');
      if (inputField) {
        if (!isInput) {
          isInput = true;
          rootRef.current.classList.add('is-input');
          rootRef.current.classList.remove('is-hover', 'has-label');
        }
        return;
      } else if (isInput) {
        isInput = false;
        rootRef.current.classList.remove('is-input');
      }

      const interactive = target.closest(
        'a, button, [role="button"], input[type="submit"], .btn-executive, .sub-card__btn, .press__pub-card, .scard, .snd, [data-wa], [data-cursor]'
      );

      if (interactive) {
        if (!isHovering) {
          isHovering = true;
          rootRef.current.classList.add('is-hover');
        }

        let label = interactive.getAttribute('data-cursor') || '';
        if (!label) {
          if (interactive.classList.contains('snd')) {
            label = 'AUDIO';
          } else if (interactive.hasAttribute('data-wa') || interactive.getAttribute('href')?.includes('wa.me')) {
            label = 'WHATSAPP';
          } else if (interactive.closest('.scard')) {
            label = 'EXPLORE';
          } else if (interactive.closest('.press__pub-card')) {
            label = 'LIRE';
          } else if (interactive.classList.contains('btn-executive--primary') || interactive.classList.contains('sub-card__btn--primary')) {
            label = 'CHOISIR';
          }
        }

        if (label && label !== currentLabel) {
          currentLabel = label;
          if (labelRef.current) labelRef.current.textContent = label;
          rootRef.current.classList.add('has-label');
        } else if (!label && currentLabel) {
          currentLabel = '';
          if (labelRef.current) labelRef.current.textContent = '';
          rootRef.current.classList.remove('has-label');
        }
      } else {
        if (isHovering) {
          isHovering = false;
          rootRef.current.classList.remove('is-hover');
        }
        if (currentLabel) {
          currentLabel = '';
          if (labelRef.current) labelRef.current.textContent = '';
          rootRef.current.classList.remove('has-label');
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (isFirstMove) {
        ringX = mouseX;
        ringY = mouseY;
        isFirstMove = false;
        if (rootRef.current) rootRef.current.classList.remove('is-hidden');
        isVisible = true;
        if (!rafId) rafId = requestAnimationFrame(updateLoop);
      }

      if (!isVisible && rootRef.current) {
        rootRef.current.classList.remove('is-hidden');
        isVisible = true;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX.toFixed(1)}px, ${mouseY.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }

      inspectHoverTarget(e.target);
    };

    const onPointerDown = () => {
      isDown = true;
      if (rootRef.current) rootRef.current.classList.add('is-down');
    };

    const onPointerUp = () => {
      isDown = false;
      if (rootRef.current) rootRef.current.classList.remove('is-down');
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (rootRef.current) rootRef.current.classList.add('is-hidden');
    };

    const onMouseEnter = () => {
      isVisible = true;
      if (rootRef.current) rootRef.current.classList.remove('is-hidden');
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    rafId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div ref={rootRef} id="bpCursor" className="bp-cursor is-hidden" aria-hidden="true">
      <div ref={ringRef} className="bp-cursor__ring" id="bpCursorRing">
        <div className="bp-cursor__ring-ticks">
          <span className="tick tick--t" />
          <span className="tick tick--r" />
          <span className="tick tick--b" />
          <span className="tick tick--l" />
        </div>
      </div>
      <div ref={dotRef} className="bp-cursor__dot" id="bpCursorDot" />
      <div ref={labelRef} className="bp-cursor__label" id="bpCursorLabel" />
    </div>
  );
};
