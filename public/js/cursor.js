/**
 * Black Pater Official - Bespoke Custom Cursor Engine
 * Ultra-smooth dual-layer cursor with inertial damping, contextual hover states,
 * text morphing, and tactile click physics.
 */
(function initBlackPaterCursor() {
  'use strict';

  // Only initialize on desktop devices with a fine pointer (mouse / trackpad)
  if (typeof window === 'undefined') return;
  const isFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isFinePointer) return;

  // Prevent multiple initializations
  if (document.getElementById('bpCursor')) return;

  // Build Cursor DOM elements
  const cursorRoot = document.createElement('div');
  cursorRoot.id = 'bpCursor';
  cursorRoot.className = 'bp-cursor is-hidden';
  cursorRoot.setAttribute('aria-hidden', 'true');
  cursorRoot.innerHTML = `
    <div class="bp-cursor__ring" id="bpCursorRing">
      <div class="bp-cursor__ring-ticks">
        <span class="tick tick--t"></span>
        <span class="tick tick--r"></span>
        <span class="tick tick--b"></span>
        <span class="tick tick--l"></span>
      </div>
    </div>
    <div class="bp-cursor__dot" id="bpCursorDot"></div>
    <div class="bp-cursor__label" id="bpCursorLabel"></div>
  `;

  // Attach to DOM once body is ready
  function attachCursor() {
    if (document.body && !document.getElementById('bpCursor')) {
      document.body.appendChild(cursorRoot);
    }
  }
  if (document.body) {
    attachCursor();
  } else {
    document.addEventListener('DOMContentLoaded', attachCursor);
  }

  const ringEl = cursorRoot.querySelector('#bpCursorRing');
  const dotEl = cursorRoot.querySelector('#bpCursorDot');
  const labelEl = cursorRoot.querySelector('#bpCursorLabel');

  // Coordinates and physics state
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
  let rafId = null;

  // LERP interpolation constant (smooth trailing inertia)
  const LERP_FACTOR = 0.17;

  function updateLoop() {
    if (isVisible) {
      // Lerp ring towards mouse position
      ringX += (mouseX - ringX) * LERP_FACTOR;
      ringY += (mouseY - ringY) * LERP_FACTOR;

      // Apply transforms
      ringEl.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%)`;
      if (labelEl) {
        labelEl.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%)`;
      }
    }
    rafId = requestAnimationFrame(updateLoop);
  }

  // Pointer move handler (Zero-latency dot positioning)
  function onPointerMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (isFirstMove) {
      ringX = mouseX;
      ringY = mouseY;
      isFirstMove = false;
      cursorRoot.classList.remove('is-hidden');
      isVisible = true;
      if (!rafId) rafId = requestAnimationFrame(updateLoop);
    }

    if (!isVisible) {
      cursorRoot.classList.remove('is-hidden');
      isVisible = true;
    }

    // Direct instantaneous 0-latency update for central dot
    dotEl.style.transform = `translate3d(${mouseX.toFixed(1)}px, ${mouseY.toFixed(1)}px, 0) translate(-50%, -50%)`;

    // Contextual hover target check
    inspectHoverTarget(e.target);
  }

  // Contextual hover target detection
  function inspectHoverTarget(target) {
    if (!target || !(target instanceof Element)) return;

    // Check for interactive and clickable elements
    const interactive = target.closest(
      'a, button, [role="button"], input[type="submit"], input[type="button"], .sbtn, .btn-primary, .burger, .snd, .scard, .press__pub-card, .press__faq-summary, .mix li, summary, .wa-send, .wa-box, [data-wa], [data-cursor]'
    );

    const inputField = target.closest('input[type="text"], input[type="email"], textarea, [contenteditable="true"]');

    // Input state
    if (inputField) {
      if (!isInput) {
        isInput = true;
        cursorRoot.classList.add('is-input');
        cursorRoot.classList.remove('is-hover', 'has-label');
      }
      return;
    } else if (isInput) {
      isInput = false;
      cursorRoot.classList.remove('is-input');
    }

    // Interactive clickable state
    if (interactive) {
      if (!isHovering) {
        isHovering = true;
        cursorRoot.classList.add('is-hover');
      }

      // Check if element has a custom cursor label
      let label = interactive.getAttribute('data-cursor') || '';
      if (!label) {
        if (interactive.classList.contains('snd')) {
          label = 'AUDIO';
        } else if (interactive.hasAttribute('data-wa') || interactive.closest('.s-wa')) {
          label = 'WHATSAPP';
        } else if (interactive.closest('.scard')) {
          label = 'EXPLORE';
        } else if (interactive.closest('.press__pub-card')) {
          label = 'LIRE';
        } else if (interactive.classList.contains('btn-primary') || interactive.id === 'stripeCheckoutBtn') {
          label = 'CHOISIR';
        }
      }

      if (label && label !== currentLabel) {
        currentLabel = label;
        labelEl.textContent = label;
        cursorRoot.classList.add('has-label');
      } else if (!label && currentLabel) {
        currentLabel = '';
        labelEl.textContent = '';
        cursorRoot.classList.remove('has-label');
      }
    } else {
      if (isHovering) {
        isHovering = false;
        cursorRoot.classList.remove('is-hover');
      }
      if (currentLabel) {
        currentLabel = '';
        labelEl.textContent = '';
        cursorRoot.classList.remove('has-label');
      }
    }
  }

  // Pointer down (Click compression)
  function onPointerDown() {
    isDown = true;
    cursorRoot.classList.add('is-down');
  }

  // Pointer up (Release expansion)
  function onPointerUp() {
    isDown = false;
    cursorRoot.classList.remove('is-down');
  }

  // Window leave and enter
  function onMouseLeave() {
    isVisible = false;
    cursorRoot.classList.add('is-hidden');
  }

  function onMouseEnter() {
    isVisible = true;
    cursorRoot.classList.remove('is-hidden');
  }

  // Bind global event listeners
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('mouseenter', onMouseEnter);

  // Fallback for document visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      onMouseLeave();
    }
  });

  // Start animation loop
  rafId = requestAnimationFrame(updateLoop);
})();
