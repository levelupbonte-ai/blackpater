import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLanguage, type Language } from '../context/LanguageContext';
import { Icon } from '../components/Icon';

const OPTIONS: Array<{ code: Language; name: string }> = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' }
];

/**
 * Discreet language picker: a small "globe + code" button that opens a
 * listbox with the two languages written in their own language.
 * Keyboard: Enter / Space / ↓ open; ↑ ↓ Home End move; Enter / Space choose;
 * Escape or Tab close. The choice is remembered by LanguageContext.
 */
export const LanguageMenu: React.FC<{ placement?: 'down' | 'up'; className?: string }> = ({ placement = 'down', className }) => {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, OPTIONS.findIndex((o) => o.code === lang)));
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const listId = `${id}-list`;
  const current = OPTIONS.find((o) => o.code === lang) || OPTIONS[0];

  const close = useCallback((focusButton = false) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }, []);

  const openMenu = () => {
    setActive(Math.max(0, OPTIONS.findIndex((o) => o.code === lang)));
    setOpen(true);
  };

  const choose = (code: Language) => {
    setLang(code);
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, close]);

  const onButtonKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu();
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => (i + 1) % OPTIONS.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => (i - 1 + OPTIONS.length) % OPTIONS.length);
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(OPTIONS.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(OPTIONS[active].code);
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        close();
        break;
    }
  };

  return (
    <div ref={rootRef} className={`langmenu langmenu--${placement}${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}>
      <button
        ref={buttonRef}
        type='button'
        className='langmenu__button'
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t('lang_switch')} — ${current.name}`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onButtonKey}
      >
        <Icon name='globe' className='langmenu__globe' />
        <span className='langmenu__code' aria-hidden='true'>
          {current.code.toUpperCase()}
        </span>
        <Icon name='chevronDown' className='langmenu__chev' />
      </button>
      <ul
        ref={listRef}
        id={listId}
        role='listbox'
        tabIndex={-1}
        className='langmenu__list'
        aria-label={t('lang_switch')}
        aria-activedescendant={open ? `${id}-opt-${OPTIONS[active].code}` : undefined}
        hidden={!open}
        onKeyDown={onListKey}
      >
        {OPTIONS.map((o, i) => (
          <li
            key={o.code}
            id={`${id}-opt-${o.code}`}
            role='option'
            lang={o.code}
            aria-selected={o.code === lang}
            className={`langmenu__option${i === active ? ' is-active' : ''}`}
            onClick={() => choose(o.code)}
            onPointerMove={() => setActive(i)}
          >
            <span className='langmenu__name'>{o.name}</span>
            <span className='langmenu__abbr' aria-hidden='true'>
              {o.code.toUpperCase()}
            </span>
            <Icon name='check' className='langmenu__check' />
          </li>
        ))}
      </ul>
    </div>
  );
};
