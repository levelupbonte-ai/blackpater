import React, { useEffect, useRef, useState } from 'react';

export const Cursor: React.FC = () => {
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
    let currentLabel = '';

    const inspectHoverTarget = (target: EventTarget | null) => {
      if (!target || !(target instanceof Element) || !rootRef.current) return;

      // Only trigger for specific elements with explicit data-cursor or WhatsApp actions
      const specificTarget = target.closest('[data-cursor], [data-wa], a[href*="wa.me"], button[data-action="whatsapp"]');

      if (specificTarget) {
        let label = specificTarget.getAttribute('data-cursor') || '';
        if (!label) {
          if (specificTarget.hasAttribute('data-wa') || specificTarget.getAttribute('href')?.includes('wa.me') || specificTarget.getAttribute('data-action') === 'whatsapp') {
            label = '💬 Discuter sur WhatsApp';
          }
        }

        if (label && label !== currentLabel) {
          currentLabel = label;
          if (labelRef.current) labelRef.current.textContent = label;
          rootRef.current.classList.add('has-label');
        }
      } else {
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

      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${mouseX + 14}px, ${mouseY + 14}px, 0)`;
      }

      inspectHoverTarget(e.target);
    };

    const onMouseLeave = () => {
      if (rootRef.current) rootRef.current.classList.remove('has-label');
      currentLabel = '';
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div ref={rootRef} id="bpCursor" className="bp-cursor" aria-hidden="true">
      <div ref={labelRef} className="bp-cursor__label" id="bpCursorLabel" />
    </div>
  );
};
