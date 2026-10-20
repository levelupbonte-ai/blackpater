import React, { useEffect, useMemo, useRef, useState } from 'react';
import './paterguide.css';
import { Link } from '../../app/router';
import { useLanguage, type Language } from '../../context/LanguageContext';
import { Icon } from '../../components/Icon';
import { PaymentMarks } from '../../components/PaymentMarks';
import { OFFERS, formatOfferPrice, getOfferByTier } from '../../../shared/offers.js';
import {
  COUNTRY_LANGS,
  DEFAULT_OPTIONS,
  DEFAULT_QUESTIONS,
  STEPS,
  evaluateWhen,
  mergeQuestionnaire
} from '../../../shared/questionnaire.js';
import type { TranslationKey } from '../../i18n';
import { useCheckout } from './useCheckout';

type TierKey = 'express' | 'solo' | 'duo' | 'family' | 'test';

const ERROR_KEYS: Record<string, TranslationKey> = {
  rate_limited: 'err_rate_limited',
  timeout: 'err_timeout',
  network: 'err_network',
  checkout_failed: 'err_checkout_failed'
};

const CODES =
  'AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW HK MO TW PS XK PR'.split(
    ' '
  );

const FEAT = ['US', 'FR', 'CA', 'GB', 'BE', 'DE', 'IT', 'NL'] as const;

const TAG: Record<string, string> = {
  US: 'Comprendre le pays, études, premier départ, visas & adaptation|Understand the country, study, first trip, visas & settling in',
  FR: 'Études, démarches, vie quotidienne & repères sur place|Study, procedures, daily life & local guidance',
  CA: 'Études, travail, installation & conseils pratiques|Study, work, relocation & practical advice',
  GB: 'Études, travail, premier séjour & repères|Study, work, first stay & orientation',
  BE: 'Études, travail & vie quotidienne en Europe|Study, work & daily life in Europe',
  DE: 'Études, emploi qualifié & adaptation|Study, skilled work & adaptation',
  IT: 'Études, séjour & installation|Study, stay & relocation',
  NL: 'Études, travail & vie sur place|Study, work & life on arrival'
};

type Answers = Record<string, string | string[]>;
interface Ctx {
  c: string;
  a: Answers;
}

export interface QuestionItem {
  id: string;
  enabled: boolean;
  sortOrder: number;
  step: string;
  type: 'text' | 'number' | 'single' | 'multi' | 'contact';
  optional: boolean;
  countryList?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  question: string;
  questionByPurpose?: Record<string, string> | null;
  questionByTier?: Record<string, string> | null;
  hint?: string;
  options?: Record<string, string>;
  optionRules?: Record<string, Record<string, unknown>> | null;
  when?: Record<string, unknown> | null;
}

function tr(s: string, l: Language): string {
  const p = String(s || '').split('|');
  return l === 'en' && p.length > 1 ? p[1] : p[0];
}

function regionName(code: string, l: Language): string {
  try {
    return new Intl.DisplayNames([l], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function normalizeStr(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const P = (x: Ctx) => String(x.a.purpose || '');
const is = (x: Ctx, k: string, ...v: string[]) => v.includes(String(x.a[k] || ''));
const inP = (x: Ctx, ...v: string[]) => v.includes(P(x));
const isLong = (x: Ctx) => inP(x, 'study', 'work', 'immigration', 'freunion') || x.a.tdur === 'm3p';
const ln = (x: Ctx, l: Language) =>
  tr((COUNTRY_LANGS as Record<string, string>)[x.c] || 'la langue locale|the local language', l);

function formatQuestionText(raw: string, x: Ctx, l: Language): string {
  const localized = tr(raw, l);
  return localized
    .replace(/\{country\}/g, regionName(x.c, l))
    .replace(/\{lang\}/g, ln(x, l));
}

function getQuestionTitle(q: QuestionItem, x: Ctx, l: Language): string {
  const purpose = P(x);
  const tier = String(x.a.groupTier || '');
  const raw =
    (q.questionByTier && tier && q.questionByTier[tier]) ||
    (q.questionByPurpose && purpose && q.questionByPurpose[purpose]) ||
    q.question;
  return formatQuestionText(raw, x, l);
}

function getQuestionHint(q: QuestionItem, x: Ctx, l: Language): string {
  if (!q.hint) return '';
  return formatQuestionText(q.hint, x, l);
}

function getQuestionOptionKeys(q: QuestionItem, x: Ctx): string[] {
  const opts = q.options || (DEFAULT_OPTIONS as Record<string, Record<string, string>>)[q.id] || {};
  return Object.keys(opts).filter((k) => {
    const rule = q.optionRules?.[k];
    return rule ? evaluateWhen(rule, x) : true;
  });
}

function getOptionLabel(q: QuestionItem, optKey: string, l: Language): string {
  const opts = q.options || (DEFAULT_OPTIONS as Record<string, Record<string, string>>)[q.id] || {};
  return opts[optKey] ? tr(opts[optKey], l) : optKey;
}

function rec(x: Ctx): string[] {
  const r = ['docs', 'official', 'first30'];
  if (is(x, 'status', 'researching', 'refused') || inP(x, 'dv')) r.push('visa', 'scam');
  if (is(x, 'status', 'started', 'hasAppt') || inP(x, 'study', 'business', 'work')) r.push('interview');
  if (isLong(x) || is(x, 'groupTier', 'duo', 'family')) r.push('housing', 'health');
  if (isLong(x) || is(x, 'proof', 'part', 'no') || is(x, 'groupTier', 'duo', 'family')) r.push('budget');
  if (inP(x, 'study', 'work', 'immigration')) r.push('edujob');
  if (inP(x, 'tourism')) r.push('transport');
  if (is(x, 'lang', 'basic', 'none')) r.push('lang');
  return Array.from(new Set(r));
}

function insights(x: Ctx): string[] {
  const a = x.a;
  const r: string[] = [];
  r.push(
    'Cette inscription enregistre officiellement votre dossier dans l’écosystème BlackPater : une fois intégré, vous accédez à nos forfaits mensuels d’accompagnement (Pro & Premium) adaptés au rythme de vos démarches.|This registration officially records your file in the BlackPater ecosystem: once integrated, you unlock access to our monthly guidance plans (Pro & Premium) tailored to the pace of your procedures.'
  );
  if (is(x, 'groupTier', 'duo'))
    r.push(
      'Votre dossier Duo (2 personnes) permet de coordonner simultanément la stratégie d’orientation et les démarches des deux participants.|Your Duo file (2 people) coordinates the orientation strategy and procedures for both participants simultaneously.'
    );
  if (is(x, 'groupTier', 'family'))
    r.push(
      'Votre dossier Famille (jusqu’à 5 personnes) intègre l’ensemble des membres pour préparer de manière cohérente le budget, le logement, la scolarisation et les démarches.|Your Family file (up to 5 people) covers all members to coherently prepare budget, housing, schooling and procedures.'
    );
  if (inP(x, 'dv'))
    r.push(
      'Le Diversity Visa passe uniquement par le site officiel du gouvernement américain, sans frais d’inscription. Nous vous guidons pour éviter les pièges et les erreurs.|The Diversity Visa runs only through the official US government website, with no entry fee. We guide you to avoid pitfalls and mistakes.'
    );
  if (is(x, 'status', 'refused'))
    r.push(
      'Après un refus, nous analysons ensemble le motif communiqué afin de comprendre ce qui a manqué avant toute nouvelle démarche.|After a refusal, we review the stated reason together to understand what was missing before taking any new step.'
    );
  if (a.travelDate === 'lt3' && is(x, 'status', 'researching', 'refused'))
    r.push(
      'Votre départ souhaité est proche : nous ferons le point en priorité sur les délais officiels et le calendrier réaliste.|Your target departure is close: we will prioritise official processing times and a realistic timeline.'
    );
  if (is(x, 'sAdm', 'none') && inP(x, 'study'))
    r.push(
      'Pour des études, le choix de l’établissement et l’admission sont la première étape : nous vous expliquerons comment procéder pas à pas.|For studies, choosing the institution and securing admission is the first step: we will explain how to proceed step by step.'
    );
  if (is(x, 'proof', 'part', 'no'))
    r.push(
      'La préparation financière et ses justificatifs sont essentiels : nous vous conseillerons sur ce qui est attendu.|Financial preparation and documentation are essential: we will advise you on what is expected.'
    );
  return r;
}

/* Pure React SVG Flag Component */
const FlagSvg: React.FC<{ code: string | null }> = ({ code }) => {
  if (!code) return null;
  switch (code) {
    case 'US': {
      const stars: Array<{ key: string; points: string }> = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < (r % 2 ? 5 : 6); c++) {
          const cx = (r % 2 ? 5 : 2.5) + c * 5;
          const cy = 2.4 + r * 2.3;
          const pts: string[] = [];
          for (let i = 0; i < 10; i++) {
            const a = (Math.PI / 5) * i - Math.PI / 2;
            const k = i % 2 ? 0.4 : 1;
            pts.push(`${(cx + k * Math.cos(a)).toFixed(2)},${(cy + k * Math.sin(a)).toFixed(2)}`);
          }
          stars.push({ key: `${r}-${c}`, points: pts.join(' ') });
        }
      }
      return (
        <svg viewBox='0 0 76 40'>
          <rect width='76' height='40' fill='#B22234' />
          {[1, 3, 5, 7, 9, 11].map((i) => (
            <rect key={i} y={(i * 40) / 13} width='76' height={40 / 13} fill='#fff' />
          ))}
          <rect width='30.4' height='21.5' fill='#3C3B6E' />
          {stars.map((s) => (
            <polygon key={s.key} points={s.points} fill='#fff' />
          ))}
        </svg>
      );
    }
    case 'FR':
      return (
        <svg viewBox='0 0 30 20' preserveAspectRatio='none'>
          <rect x='0' width='10.02' height='20' fill='#0055A4' />
          <rect x='10' width='10.02' height='20' fill='#fff' />
          <rect x='20' width='10.02' height='20' fill='#EF4135' />
        </svg>
      );
    case 'BE':
      return (
        <svg viewBox='0 0 30 20' preserveAspectRatio='none'>
          <rect x='0' width='10.02' height='20' fill='#000' />
          <rect x='10' width='10.02' height='20' fill='#FAE042' />
          <rect x='20' width='10.02' height='20' fill='#ED2939' />
        </svg>
      );
    case 'IT':
      return (
        <svg viewBox='0 0 30 20' preserveAspectRatio='none'>
          <rect x='0' width='10.02' height='20' fill='#009246' />
          <rect x='10' width='10.02' height='20' fill='#fff' />
          <rect x='20' width='10.02' height='20' fill='#CE2B37' />
        </svg>
      );
    case 'DE':
      return (
        <svg viewBox='0 0 30 20' preserveAspectRatio='none'>
          <rect y='0' width='30' height='6.69' fill='#000' />
          <rect y='6.66' width='30' height='6.69' fill='#DD0000' />
          <rect y='13.33' width='30' height='6.69' fill='#FFCE00' />
        </svg>
      );
    case 'NL':
      return (
        <svg viewBox='0 0 30 20' preserveAspectRatio='none'>
          <rect y='0' width='30' height='6.69' fill='#AE1C28' />
          <rect y='6.66' width='30' height='6.69' fill='#fff' />
          <rect y='13.33' width='30' height='6.69' fill='#21468B' />
        </svg>
      );
    case 'CA':
      return (
        <svg viewBox='0 0 40 20'>
          <rect width='40' height='20' fill='#fff' />
          <rect width='10' height='20' fill='#D52B1E' />
          <rect x='30' width='10' height='20' fill='#D52B1E' />
          <path
            transform='translate(20 10.6) scale(.78)'
            fill='#D52B1E'
            d='M0-10 1.6-6 4-7 3.2-3 6.5-4.5 5.5-1 8 0 4.5 3.2 5 5.5 1 4.7.8 9H-.8L-1 4.7-5 5.5-4.5 3.2-8 0-5.5-1-6.5-4.5-3.2-3-4-7-1.6-6z'
          />
        </svg>
      );
    case 'GB':
      return (
        <svg viewBox='0 0 60 30' preserveAspectRatio='none'>
          <rect width='60' height='30' fill='#012169' />
          <path stroke='#fff' strokeWidth='6' d='m0 0 60 30m0-30L0 30' />
          <path stroke='#C8102E' strokeWidth='2.5' d='m0 0 60 30m0-30L0 30' />
          <path stroke='#fff' strokeWidth='10' d='M30 0v30M0 15h60' />
          <path stroke='#C8102E' strokeWidth='6' d='M30 0v30M0 15h60' />
        </svg>
      );
    default:
      return null;
  }
};

function hasFlag(code: string | null): boolean {
  return Boolean(code && ['US', 'FR', 'CA', 'GB', 'BE', 'DE', 'IT', 'NL'].includes(code));
}

function readStorage(k: string): string | null {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}

function writeStorage(k: string, v: string) {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
}

function removeStorage(k: string) {
  try {
    window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

function loadDatabaseQuestionOverrides(): unknown[] {
  try {
    const winAny = window as unknown as { __BP_QUESTIONNAIRE__?: unknown[] };
    if (Array.isArray(winAny.__BP_QUESTIONNAIRE__)) {
      return winAny.__BP_QUESTIONNAIRE__;
    }
    const stored = readStorage('pg:custom_questions');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{5,24}$/;

export const PaterGuide: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { lang, t } = useLanguage();

  // Merge default questions from shared/questionnaire.js with any database overrides
  const allQuestions = useMemo<QuestionItem[]>(() => {
    const dbOverrides = loadDatabaseQuestionOverrides();
    return mergeQuestionnaire(DEFAULT_QUESTIONS, dbOverrides) as QuestionItem[];
  }, []);

  const firstQuestionId = allQuestions[0]?.id || 'groupTier';

  const [country, setCountry] = useState<string | null>(null);
  const [hoverFlag, setHoverFlag] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [curId, setCurId] = useState<string>(firstQuestionId);
  const [hist, setHist] = useState<string[]>([]);
  const [err, setErr] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [portal, setPortal] = useState<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0
  });

  const activeTier: TierKey =
    answers.groupTier === 'express' || answers.groupTier === 'test'
      ? 'express'
      : answers.groupTier === 'duo' || answers.groupTier === 'family'
      ? answers.groupTier
      : 'solo';
  const activeOffer = getOfferByTier(activeTier);
  const { state: checkoutState, pay } = useCheckout(activeOffer.id);

  const headingRef = useRef<HTMLHeadingElement>(null);

  const ctx: Ctx = useMemo(() => ({ c: country || 'US', a: answers }), [country, answers]);
  const visibleQuestions = useMemo(
    () => allQuestions.filter((q) => !q.when || evaluateWhen(q.when, ctx)),
    [allQuestions, ctx]
  );

  // Persist draft in localStorage whenever country/answers/curId/hist change
  useEffect(() => {
    if (!country) return;
    writeStorage(
      `pg:draft:${country}`,
      JSON.stringify({ a: answers, cur: curId, hist })
    );
  }, [country, answers, curId, hist]);

  // Save a human-readable summary AND structured dossier (including tier, sex, age, companions) for ConfirmationPage / Supabase
  useEffect(() => {
    if (!country || curId !== 'review') return;
    const destName = regionName(country, lang);
    const purposeMap = DEFAULT_OPTIONS.purpose as Record<string, string>;
    const travelDateMap = DEFAULT_OPTIONS.travelDate as Record<string, string>;
    const sexMap = DEFAULT_OPTIONS.sex as Record<string, string>;
    const tierMap = DEFAULT_OPTIONS.groupTier as Record<string, string>;
    const tierVal = tr(tierMap[activeTier] || '', lang);
    const purposeVal = answers.purpose ? tr(purposeMap[String(answers.purpose)] || '', lang) : '';
    const dateVal = answers.travelDate ? tr(travelDateMap[String(answers.travelDate)] || '', lang) : '';
    const cName = String(answers.contactName || '').trim();
    const cSex = answers.sex ? tr(sexMap[String(answers.sex)] || String(answers.sex), lang) : '';
    const cAge = String(answers.age || '').trim();
    const cEmail = String(answers.contactEmail || '').trim();
    const cPhone = String(answers.contactPhone || '').trim();
    const ageLabel = cAge ? `${cAge} ${tr('ans|yrs', lang)}` : '';
    const contactPart = [cName, cSex, ageLabel, cEmail, cPhone].filter(Boolean).join(' · ');
    const partnerPart =
      activeTier === 'duo' && answers.partnerName
        ? ` · 2e pers. : ${String(answers.partnerName).trim()}`
        : activeTier === 'family' && answers.familyMembersDetails
        ? ` · Famille : ${String(answers.familyMembersDetails).trim()}`
        : '';
    const summary = `${destName} [${tierVal}]${purposeVal ? ` · ${purposeVal}` : ''}${dateVal ? ` (${dateVal})` : ''}${contactPart ? ` — Client : ${contactPart}${partnerPart}` : ''}`;
    writeStorage('pg:last_summary', summary);

    const dossier = {
      destinationCountry: country,
      tier: activeTier,
      offerId: activeOffer.id,
      amountCents: activeOffer.amount,
      fullName: cName,
      sex: String(answers.sex || ''),
      age: Number(cAge) || null,
      email: cEmail,
      phone: cPhone,
      partner:
        activeTier === 'duo'
          ? {
              fullName: String(answers.partnerName || '').trim(),
              sex: String(answers.partnerSex || ''),
              age: Number(answers.partnerAge) || null
            }
          : null,
      familyMembersDetails:
        activeTier === 'family' ? String(answers.familyMembersDetails || '').trim() : null,
      answers,
      updatedAt: new Date().toISOString()
    };
    writeStorage('pg:last_dossier', JSON.stringify(dossier));
    try {
      window.dispatchEvent(new CustomEvent('bp:dossier-ready', { detail: dossier }));
    } catch {
      /* ignore */
    }
  }, [country, curId, answers, lang, activeTier, activeOffer]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [curId, country]);

  const sortedAllCountries = useMemo(() => {
    return CODES.map((c) => ({ code: c, name: regionName(c, lang) })).sort((a, b) =>
      a.name.localeCompare(b.name, lang)
    );
  }, [lang]);

  const searchResults = useMemo(() => {
    const q = normalizeStr(searchQuery.trim());
    if (!q) return [];
    return sortedAllCountries.filter((item) => normalizeStr(item.name).includes(q)).slice(0, 6);
  }, [searchQuery, sortedAllCountries]);

  const startCountry = (code: string) => {
    let loadedAnswers: Answers = {};
    let loadedCur = firstQuestionId;
    let loadedHist: string[] = [];
    try {
      const raw = readStorage(`pg:draft:${code}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          loadedAnswers = parsed.a || {};
          const candidateCur = parsed.cur || firstQuestionId;
          const exists =
            candidateCur === 'review' || allQuestions.some((q) => q.id === candidateCur);
          loadedCur = exists ? candidateCur : firstQuestionId;
          loadedHist = Array.isArray(parsed.hist) ? parsed.hist : [];
        }
      }
      if (!loadedAnswers.groupTier) {
        const preselected = readStorage('pg:preselected_tier');
        if (preselected === 'express' || preselected === 'solo' || preselected === 'duo' || preselected === 'family' || preselected === 'test') {
          loadedAnswers = { ...loadedAnswers, groupTier: preselected };
        }
      }
    } catch {
      /* ignore */
    }
    setCountry(code);
    setHoverFlag(code);
    setAnswers(loadedAnswers);
    setCurId(loadedCur);
    setHist(loadedHist);
    setErr('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pickCountry = (code: string, e: React.MouseEvent<HTMLButtonElement>) => {
    setHoverFlag(code);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      startCountry(code);
      return;
    }
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    setPortal({ active: true, x, y });
    window.setTimeout(() => {
      startCountry(code);
      setPortal((prev) => ({ ...prev, active: false }));
    }, 620);
  };

  const resetToHome = () => {
    setCountry(null);
    setHoverFlag(null);
    setErr('');
  };

  const restartCurrentCountry = () => {
    if (!country) return;
    removeStorage(`pg:draft:${country}`);
    setAnswers({});
    setCurId(firstQuestionId);
    setHist([]);
    setErr('');
  };

  const currentQuestion = visibleQuestions.find((q) => q.id === curId) || visibleQuestions[0];
  const isReview = curId === 'review';
  const stepIndex = isReview
    ? visibleQuestions.length
    : Math.max(0, visibleQuestions.findIndex((q) => q.id === curId));
  const pct = visibleQuestions.length > 0 ? Math.round((stepIndex / visibleQuestions.length) * 100) : 0;

  const formatAnswerLabel = (q: QuestionItem, val: string | string[] | undefined): string => {
    const sexMap = DEFAULT_OPTIONS.sex as Record<string, string>;
    if (q.type === 'contact') {
      const n = String(answers.contactName || '').trim();
      const sx = answers.sex ? tr(sexMap[String(answers.sex)] || String(answers.sex), lang) : '';
      const ag = String(answers.age || '').trim();
      const ageStr = ag ? `${ag} ${tr('ans|yrs', lang)}` : '';
      const em = String(answers.contactEmail || '').trim();
      const ph = String(answers.contactPhone || '').trim();
      return [n, sx, ageStr, em, ph].filter(Boolean).join(' · ');
    }
    if (!val) return '';
    if (q.type === 'number') {
      return q.id === 'age' ? `${val} ${tr('ans|yrs', lang)}` : String(val);
    }
    if (q.type === 'text') return String(val);
    if (Array.isArray(val)) {
      return val
        .map((k) => getOptionLabel(q, k, lang))
        .filter(Boolean)
        .join(', ');
    }
    return getOptionLabel(q, String(val), lang);
  };

  const validateAgeValue = (rawAge: string, min = 14, max = 100): string | null => {
    const trimmed = rawAge.trim();
    const num = Number(trimmed);
    if (!trimmed || !Number.isInteger(num) || num < min || num > max) {
      return tr(
        `Veuillez indiquer un âge valide compris entre ${min} et ${max} ans.|Please enter a valid age between ${min} and ${max}.`,
        lang
      );
    }
    return null;
  };

  const validateContactFields = (): string | null => {
    const name = String(answers.contactName || '').trim();
    const sex = String(answers.sex || '').trim();
    const age = String(answers.age || '').trim();
    const email = String(answers.contactEmail || '').trim();
    const phone = String(answers.contactPhone || '').trim();

    if (name.length < 2) {
      return tr(
        'Veuillez renseigner votre nom complet afin de constituer votre dossier d’accompagnement.|Please enter your full name to prepare your guidance file.',
        lang
      );
    }
    if (!sex) {
      return tr(
        'Veuillez sélectionner votre sexe afin de compléter votre profil.|Please select your gender to complete your profile.',
        lang
      );
    }
    const ageErr = validateAgeValue(age, 14, 100);
    if (ageErr) {
      return ageErr;
    }
    if (!EMAIL_RE.test(email)) {
      return tr(
        'Veuillez saisir une adresse e-mail valide pour la réception de votre confirmation.|Please enter a valid email address to receive your confirmation.',
        lang
      );
    }
    if (!PHONE_RE.test(phone)) {
      return tr(
        'Veuillez renseigner un numéro de téléphone valide incluant l’indicatif international (ex. : +1 ou +243).|Please enter a valid phone number including the country code (e.g. +1 or +243).',
        lang
      );
    }
    if (activeTier === 'duo') {
      const pName = String(answers.partnerName || '').trim();
      const pSex = String(answers.partnerSex || '').trim();
      const pAge = String(answers.partnerAge || '').trim();
      if (pName.length < 2) {
        return tr(
          'Veuillez renseigner le nom complet de la 2e personne pour le dossier Duo.|Please enter the full name of the 2nd person for the Duo file.',
          lang
        );
      }
      if (!pSex) {
        return tr(
          'Veuillez sélectionner le sexe de la 2e personne du dossier Duo.|Please select the gender of the 2nd person in the Duo file.',
          lang
        );
      }
      const pAgeErr = validateAgeValue(pAge, 1, 100);
      if (pAgeErr) {
        return pAgeErr;
      }
    }
    if (activeTier === 'family') {
      const famDetails = String(answers.familyMembersDetails || '').trim();
      if (famDetails.length < 3) {
        return tr(
          'Veuillez indiquer les prénoms et âges des membres accompagnants de votre famille.|Please enter the names and ages of your accompanying family members.',
          lang
        );
      }
    }
    return null;
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    if (currentQuestion.type === 'contact') {
      const contactErr = validateContactFields();
      if (contactErr) {
        setErr(contactErr);
        return;
      }
    } else if (currentQuestion.type === 'number') {
      const rawVal = String(answers[currentQuestion.id] || '').trim();
      if (!currentQuestion.optional || rawVal.length > 0) {
        const ageErr = validateAgeValue(
          rawVal,
          currentQuestion.min ?? 14,
          currentQuestion.max ?? 100
        );
        if (ageErr) {
          setErr(ageErr);
          return;
        }
      }
    } else {
      const v = answers[currentQuestion.id];
      const hasValue =
        currentQuestion.type === 'multi'
          ? Array.isArray(v) && v.length > 0
          : Boolean(v && String(v).trim());

      if (!currentQuestion.optional && !hasValue) {
        setErr(
          currentQuestion.type === 'multi'
            ? tr(
                'Veuillez sélectionner au moins une option pour poursuivre votre évaluation.|Please select at least one option to continue your assessment.',
                lang
              )
            : tr(
                'Veuillez compléter cette étape pour poursuivre votre évaluation personnalisée.|Please complete this step to continue your personalised assessment.',
                lang
              )
        );
        return;
      }
    }

    const idx = visibleQuestions.findIndex((z) => z.id === currentQuestion.id);
    const nextId = visibleQuestions[idx + 1] ? visibleQuestions[idx + 1].id : 'review';
    setHist((prev) => [...prev, curId]);
    setCurId(nextId);
    setErr('');
  };

  const handleBack = () => {
    if (hist.length === 0) return;
    const nextHist = [...hist];
    const prevId = nextHist.pop()!;
    setHist(nextHist);
    setCurId(prevId);
    setErr('');
  };

  const jumpToQuestion = (qId: string) => {
    setHist((prev) => [...prev, curId]);
    setCurId(qId);
    setErr('');
  };

  const handleCheckoutPay = () => {
    const contactErr = validateContactFields();
    if (contactErr) {
      jumpToQuestion('contactInfo');
      setErr(contactErr);
      return;
    }
    pay();
  };

  const handleSelectTier = (tier: TierKey) => {
    setAnswers((prev) => ({ ...prev, groupTier: tier }));
    writeStorage('pg:preselected_tier', tier);
    setErr('');
  };

  const tierCards: Array<{ key: TierKey; name: string; desc: string; price: string }> = [
    {
      key: 'express',
      name: tr('Express · 1 pers.|Express · 1 person', lang),
      desc: tr('Orientation initiale|Initial guidance', lang),
      price: formatOfferPrice(OFFERS['accompagnement-voyage-express'], lang)
    },
    {
      key: 'solo',
      name: tr('Solo · 1 pers.|Solo · 1 person', lang),
      desc: tr('Dossier individuel|Individual file', lang),
      price: formatOfferPrice(OFFERS['accompagnement-voyage'], lang)
    },
    {
      key: 'duo',
      name: tr('Duo · 2 pers.|Duo · 2 people', lang),
      desc: tr('Couple ou binôme|Couple or pair', lang),
      price: formatOfferPrice(OFFERS['accompagnement-voyage-duo'], lang)
    },
    {
      key: 'family',
      name: tr('Famille · 5 pers.|Family · 5 people', lang),
      desc: tr('Jusqu’à 5 membres|Up to 5 members', lang),
      price: formatOfferPrice(OFFERS['accompagnement-voyage-famille'], lang)
    }
  ];

  const activeFlagCode = country || hoverFlag;
  const price = formatOfferPrice(activeOffer, lang);
  const redirecting = checkoutState.kind === 'redirecting';
  const unavailable = checkoutState.kind === 'unavailable';

  let payLabel = t('offer_cta');
  if (unavailable) payLabel = t('offer_cta_unavailable');
  else if (checkoutState.kind === 'error') payLabel = t('offer_cta_retry');

  const sexMap = DEFAULT_OPTIONS.sex as Record<string, string>;
  const recapSex = answers.sex ? tr(sexMap[String(answers.sex)] || String(answers.sex), lang) : '—';
  const recapAge = answers.age ? `${answers.age} ${tr('ans|yrs', lang)}` : '—';
  const recapPartnerSex = answers.partnerSex
    ? tr(sexMap[String(answers.partnerSex)] || String(answers.partnerSex), lang)
    : '';
  const recapPartnerAge = answers.partnerAge ? `${answers.partnerAge} ${tr('ans|yrs', lang)}` : '';

  return (
    <div className='pg-shell page'>
      <div className='pg-aurora' aria-hidden='true' />

      <div
        className={`pg-portal${portal.active ? ' is-on' : ''}`}
        style={
          {
            '--pg-x': `${portal.x}px`,
            '--pg-y': `${portal.y}px`
          } as React.CSSProperties
        }
        aria-hidden='true'
      />

      <div
        className={`pg-flag${hasFlag(activeFlagCode) ? ' is-on' : ''}${country ? ' is-inq' : ''}`}
        aria-hidden='true'
      >
        <FlagSvg code={activeFlagCode} />
      </div>

      {!country ? (
        /* STEP 0: COUNTRY SELECTION */
        <div className='pg-wrap pg-wrap--home'>
          <div className='pg-top pg-fade'>
            <span className='pg-tag'>PaterGuide · {t('nav_offers')}</span>
            {onClose ? (
              <button type='button' className='pg-close-btn' onClick={onClose}>
                <span>{tr('Fermer|Close', lang)}</span>
                <span aria-hidden='true'>×</span>
              </button>
            ) : (
              <Link className='pg-link-btn' to='/abonnements'>
                ← {t('nav_offers')}
              </Link>
            )}
          </div>

          <h1 className='pg-h1 pg-fade'>
            {tr(
              'Votre prochaine destination commence par la compréhension.|Your next destination begins with understanding.',
              lang
            )}
          </h1>
          <p className='pg-sub pg-fade'>
            {tr(
              'Choisissez le pays que vous souhaitez comprendre. Nous vous guidons étape par étape (même si c’est votre première fois) avant l’ouverture du paiement sécurisé à la fin.|Choose the country you want to understand. We guide you step by step (even if it is your first time) before unlocking secure payment at the end.',
              lang
            )}
          </p>

          <ul
            className='pg-countries'
            onMouseLeave={() => setHoverFlag(null)}
          >
            {FEAT.map((c) => (
              <li key={c} className='pg-fade'>
                <button
                  type='button'
                  className='pg-country-btn'
                  onMouseEnter={() => setHoverFlag(c)}
                  onFocus={() => setHoverFlag(c)}
                  onClick={(e) => pickCountry(c, e)}
                >
                  <span className='pg-country-name'>{regionName(c, lang)}</span>
                  <span className='pg-country-tag'>{tr(TAG[c], lang)}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className='pg-more pg-fade'>
            <input
              className='pg-search'
              type='search'
              autoComplete='off'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr('Un autre pays ?|Another country?', lang)}
              aria-label={tr('Rechercher un pays|Search a country', lang)}
            />
            {searchQuery.trim() !== '' && (
              <div className='pg-search-results'>
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={item.code}
                      type='button'
                      className='pg-search-item'
                      onMouseEnter={() => setHoverFlag(item.code)}
                      onClick={(e) => pickCountry(item.code, e)}
                    >
                      {item.name}
                    </button>
                  ))
                ) : (
                  <span className='pg-sub' style={{ marginTop: 6, fontSize: '0.86rem' }}>
                    {tr('Aucun pays trouvé.|No country found.', lang)}
                  </span>
                )}
              </div>
            )}
          </div>

          <p className='pg-disclaimer'>
            {tr(
              'Agence d’accompagnement, d’orientation et de conseil (non affiliée à un gouvernement et distincte d’une agence de voyage).|Guidance, orientation and advisory service (not affiliated with any government and not a travel agency).',
              lang
            )}
          </p>
        </div>
      ) : (
        /* STEP 1..N: ADAPTIVE QUESTIONNAIRE, MANDATORY BUYER DETAILS & FINAL PAYMENT REVEAL */
        <div className='pg-wrap pg-wrap--q'>
          <div className='pg-top'>
            <button type='button' className='pg-link-btn' onClick={resetToHome}>
              ← {tr('Changer de pays|Change country', lang)}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className='pg-country-pill'>
                {hasFlag(country) && (
                  <span className='pg-mini-flag' aria-hidden='true'>
                    <FlagSvg code={country} />
                  </span>
                )}
                <span>{regionName(country, lang)}</span>
              </span>
              {onClose && (
                <button type='button' className='pg-close-btn' onClick={onClose}>
                  <span>{tr('Fermer|Close', lang)}</span>
                  <span aria-hidden='true'>×</span>
                </button>
              )}
            </div>
          </div>

          <div
            className='pg-progress'
            role='progressbar'
            aria-label={tr('Progression|Progress', lang)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div className='pg-bar'>
              <i style={{ width: `${pct}%` }} />
            </div>
            <div className='pg-step-label'>
              <span>
                {isReview
                  ? tr('Récapitulatif & Paiement|Summary & Payment', lang)
                  : tr(currentQuestion?.step || STEPS.S1, lang)}
              </span>
              <span>{pct}%</span>
            </div>
          </div>

          <main className='pg-main pg-fade' key={curId}>
            {isReview ? (
              <div>
                <h1 ref={headingRef} tabIndex={-1} className='pg-q-title'>
                  {tr('Votre bilan & accès à l’accompagnement|Your assessment & guidance access', lang)}
                </h1>

                <div className='pg-insights'>
                  {insights(ctx).map((text, idx) => (
                    <p key={idx}>{tr(text, lang)}</p>
                  ))}
                </div>

                {/* Stripe Payment Box at the end of the process */}
                <div className='pg-checkout-box pg-checkout-reveal' id='achat'>
                  <div className='pg-checkout-head'>
                    <div>
                      <h2 className='pg-checkout-title'>{t('offer_name')}</h2>
                      <p className='pg-checkout-sub'>
                        {tr(
                          'Règlement unique de votre accompagnement. Vos réponses sont prêtes à être analysées dès validation de votre paiement.|One-time guidance fee. Your answers are ready to be reviewed as soon as your payment is confirmed.',
                          lang
                        )}
                      </p>
                    </div>
                    <div className='pg-checkout-price'>
                      <span className='pg-checkout-amount'>{price}</span>
                      <span className='pg-checkout-note'>
                        {activeTier === 'express'
                          ? tr('USD · Express (0,50 $)|USD · Express ($0.50)', lang)
                          : activeTier === 'duo'
                          ? tr('USD · Duo (2 pers.)|USD · Duo (2 people)', lang)
                          : activeTier === 'family'
                          ? tr('USD · Famille (5 pers.)|USD · Family (5 people)', lang)
                          : tr('USD · Solo (1 pers.)|USD · Solo (1 person)', lang)}
                      </span>
                    </div>
                  </div>

                  <div className='pg-buyer-recap'>
                    <div className='pg-buyer-recap__row'>
                      <span>{tr('Formule choisie|Selected plan', lang)}</span>
                      <strong>
                        {activeTier === 'express'
                          ? tr('Express · 1 personne (0,50 $)|Express · 1 person ($0.50)', lang)
                          : activeTier === 'duo'
                          ? tr('Duo · 2 personnes (5 $)|Duo · 2 people ($5)', lang)
                          : activeTier === 'family'
                          ? tr('Famille · Jusqu’à 5 pers. (11 $)|Family · Up to 5 people ($11)', lang)
                          : tr('Solo · 1 personne (2,60 $)|Solo · 1 person ($2.60)', lang)}
                      </strong>
                    </div>
                    <div className='pg-buyer-recap__row'>
                      <span>{tr('Titulaire du dossier|Primary applicant', lang)}</span>
                      <strong>{String(answers.contactName || '—')}</strong>
                    </div>
                    <div className='pg-buyer-recap__row'>
                      <span>{tr('Sexe & Âge|Gender & Age', lang)}</span>
                      <strong>{`${recapSex} · ${recapAge}`}</strong>
                    </div>
                    {activeTier === 'duo' && (
                      <div className='pg-buyer-recap__row'>
                        <span>{tr('2e personne (Duo)|2nd person (Duo)', lang)}</span>
                        <strong>
                          {[String(answers.partnerName || '—'), recapPartnerSex, recapPartnerAge]
                            .filter(Boolean)
                            .join(' · ')}
                        </strong>
                      </div>
                    )}
                    {activeTier === 'family' && (
                      <div className='pg-buyer-recap__row'>
                        <span>{tr('Membres famille|Family members', lang)}</span>
                        <strong>{String(answers.familyMembersDetails || '—')}</strong>
                      </div>
                    )}
                    <div className='pg-buyer-recap__row'>
                      <span>{tr('E-mail|Email', lang)}</span>
                      <strong>{String(answers.contactEmail || '—')}</strong>
                    </div>
                    <div className='pg-buyer-recap__row'>
                      <span>{tr('Téléphone|Phone', lang)}</span>
                      <strong>{String(answers.contactPhone || '—')}</strong>
                    </div>
                    <button
                      type='button'
                      className='pg-link-btn pg-link-btn--underline'
                      onClick={() => jumpToQuestion('contactInfo')}
                    >
                      {tr('Modifier mes coordonnées|Edit my contact details', lang)}
                    </button>
                  </div>

                  <button
                    type='button'
                    className='btn btn--primary btn--lg btn--block buy__cta'
                    onClick={handleCheckoutPay}
                    disabled={redirecting || unavailable}
                    aria-busy={redirecting || undefined}
                  >
                    {redirecting ? (
                      <>
                        <span className='btn__dots' aria-hidden='true'>
                          <span className='btn__dot' />
                          <span className='btn__dot' />
                          <span className='btn__dot' />
                        </span>
                        <span className='sr-only'>{t('offer_cta_redirecting')}</span>
                      </>
                    ) : (
                      <>
                        <Icon name='lock' />
                        <span>{`${payLabel} · ${price}`}</span>
                        {!unavailable && <Icon name='arrowRight' />}
                      </>
                    )}
                  </button>

                  <div className='buy__status' role='status' aria-live='polite'>
                    {checkoutState.kind === 'error' && (
                      <p className='notice notice--error'>
                        <Icon name='alert' />
                        <span>{t(ERROR_KEYS[checkoutState.code] || 'err_checkout_failed')}</span>
                      </p>
                    )}
                    {checkoutState.kind === 'unavailable' && (
                      <p className='notice notice--error' style={{ marginTop: 8 }}>
                        <Icon name='alert' />
                        <span>{t('err_payments_unavailable')}</span>
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <PaymentMarks label={t('offer_methods_label')} />
                  </div>

                  <p className='buy__terms'>
                    {t('offer_terms_before')}
                    <Link className='text-link' to='/legal/conditions-de-vente'>
                      {t('offer_terms_link')}
                    </Link>
                    {t('offer_terms_middle')}
                    <Link className='text-link' to='/legal/remboursement'>
                      {t('offer_refund_link')}
                    </Link>
                    {t('offer_terms_after')}
                  </p>
                </div>

                <dl className='pg-summary-list'>
                  {visibleQuestions.map((z) => {
                    const labelVal = formatAnswerLabel(z, answers[z.id]);
                    return (
                      <div key={z.id} className='pg-summary-item'>
                        <div>
                          <dt>{getQuestionTitle(z, ctx, lang)}</dt>
                          <dd>{labelVal || '—'}</dd>
                        </div>
                        <button
                          type='button'
                          className='pg-link-btn pg-link-btn--underline'
                          onClick={() => jumpToQuestion(z.id)}
                        >
                          {tr('Modifier|Edit', lang)}
                        </button>
                      </div>
                    );
                  })}
                </dl>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type='button'
                    className='pg-link-btn pg-link-btn--underline'
                    onClick={restartCurrentCountry}
                  >
                    {tr('Recommencer l’évaluation|Start over', lang)}
                  </button>
                </div>
              </div>
            ) : currentQuestion ? (
              <div>
                <h1 ref={headingRef} tabIndex={-1} className='pg-q-title'>
                  {getQuestionTitle(currentQuestion, ctx, lang)}
                </h1>
                {currentQuestion.hint && (
                  <p className='pg-q-hint'>{getQuestionHint(currentQuestion, ctx, lang)}</p>
                )}
                {currentQuestion.optional && (
                  <p className='pg-q-opt-tag'>
                    {tr('Facultatif : vous pouvez passer cette question|Optional: you can skip this question', lang)}
                  </p>
                )}

                <div className='pg-fields'>
                  {currentQuestion.type === 'contact' ? (
                    <div className='pg-contact-grid'>
                      <div className='pg-contact-field'>
                        <span className='pg-contact-label'>
                          {tr(
                            'Formule d’intégration à l’écosystème *|Ecosystem integration plan *',
                            lang
                          )}
                        </span>
                        <div
                          className='pg-tier-switcher'
                          role='radiogroup'
                          aria-label={tr('Formule d’intégration|Integration plan', lang)}
                        >
                          {tierCards.map((tc) => (
                            <button
                              key={tc.key}
                              type='button'
                              role='radio'
                              aria-checked={activeTier === tc.key}
                              className='pg-tier-card'
                              onClick={() => handleSelectTier(tc.key)}
                            >
                              <span className='pg-tier-card__top'>
                                <span className='pg-tier-card__name'>{tc.name}</span>
                                <span className='pg-tier-card__price'>{tc.price}</span>
                              </span>
                              <span className='pg-tier-card__desc'>{tc.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className='pg-contact-field'>
                        <label htmlFor='pg-contact-name' className='pg-contact-label'>
                          {activeTier === 'solo'
                            ? tr('Nom complet *|Full name *', lang)
                            : tr('Nom complet du responsable principal *|Full name of primary applicant *', lang)}
                        </label>
                        <input
                          id='pg-contact-name'
                          className='pg-input pg-input--box'
                          type='text'
                          required
                          maxLength={120}
                          autoComplete='name'
                          placeholder={tr('Ex. : Jean-Pierre Lofumbwa|E.g. Jean-Pierre Lofumbwa', lang)}
                          value={String(answers.contactName || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAnswers((prev) => ({ ...prev, contactName: val }));
                            setErr('');
                          }}
                        />
                      </div>

                      <div className='pg-contact-row'>
                        <div className='pg-contact-field'>
                          <span className='pg-contact-label'>
                            {tr('Sexe *|Gender *', lang)}
                          </span>
                          <div className='pg-sex-pills' role='radiogroup' aria-label={tr('Sexe|Gender', lang)}>
                            {Object.entries(sexMap).map(([k, label]) => {
                              const checked = answers.sex === k;
                              return (
                                <button
                                  key={k}
                                  type='button'
                                  role='radio'
                                  aria-checked={checked}
                                  className='pg-sex-pill'
                                  onClick={() => {
                                    setAnswers((prev) => ({ ...prev, sex: k }));
                                    setErr('');
                                  }}
                                >
                                  {tr(label, lang)}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className='pg-contact-field'>
                          <label htmlFor='pg-contact-age' className='pg-contact-label'>
                            {tr('Âge (en années) *|Age (in years) *', lang)}
                          </label>
                          <input
                            id='pg-contact-age'
                            className='pg-input pg-input--box'
                            type='number'
                            inputMode='numeric'
                            required
                            min={14}
                            max={100}
                            placeholder={tr('Ex. : 25|E.g. 25', lang)}
                            value={String(answers.age || '')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
                              setAnswers((prev) => ({ ...prev, age: val }));
                              setErr('');
                            }}
                          />
                        </div>
                      </div>

                      {activeTier === 'duo' && (
                        <div className='pg-companion-card'>
                          <h3 className='pg-companion-title'>
                            {tr(
                              '2e participant du dossier Duo (inclus dans le tarif 5 $)|2nd participant in Duo file (included in $5 plan)',
                              lang
                            )}
                          </h3>
                          <div className='pg-contact-field'>
                            <label htmlFor='pg-partner-name' className='pg-contact-label'>
                              {tr('Nom complet de la 2e personne *|Full name of 2nd person *', lang)}
                            </label>
                            <input
                              id='pg-partner-name'
                              className='pg-input pg-input--box'
                              type='text'
                              required
                              maxLength={120}
                              placeholder={tr('Ex. : Grâce Lofumbwa|E.g. Grace Lofumbwa', lang)}
                              value={String(answers.partnerName || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAnswers((prev) => ({ ...prev, partnerName: val }));
                                setErr('');
                              }}
                            />
                          </div>
                          <div className='pg-contact-row'>
                            <div className='pg-contact-field'>
                              <span className='pg-contact-label'>
                                {tr('Sexe (2e personne) *|Gender (2nd person) *', lang)}
                              </span>
                              <div
                                className='pg-sex-pills'
                                role='radiogroup'
                                aria-label={tr('Sexe 2e personne|2nd person gender', lang)}
                              >
                                {Object.entries(sexMap).map(([k, label]) => {
                                  const checked = answers.partnerSex === k;
                                  return (
                                    <button
                                      key={k}
                                      type='button'
                                      role='radio'
                                      aria-checked={checked}
                                      className='pg-sex-pill'
                                      onClick={() => {
                                        setAnswers((prev) => ({ ...prev, partnerSex: k }));
                                        setErr('');
                                      }}
                                    >
                                      {tr(label, lang)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className='pg-contact-field'>
                              <label htmlFor='pg-partner-age' className='pg-contact-label'>
                                {tr('Âge (2e personne) *|Age (2nd person) *', lang)}
                              </label>
                              <input
                                id='pg-partner-age'
                                className='pg-input pg-input--box'
                                type='number'
                                inputMode='numeric'
                                required
                                min={1}
                                max={100}
                                placeholder={tr('Ex. : 24|E.g. 24', lang)}
                                value={String(answers.partnerAge || '')}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
                                  setAnswers((prev) => ({ ...prev, partnerAge: val }));
                                  setErr('');
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTier === 'family' && (
                        <div className='pg-companion-card'>
                          <h3 className='pg-companion-title'>
                            {tr(
                              'Membres de la famille inclus (jusqu’à 5 personnes au total · 11 $)|Included family members (up to 5 people total · $11)',
                              lang
                            )}
                          </h3>
                          <div className='pg-contact-field'>
                            <label htmlFor='pg-family-members' className='pg-contact-label'>
                              {tr(
                                'Prénoms, noms et âges des membres accompagnants *|Names and ages of accompanying family members *',
                                lang
                              )}
                            </label>
                            <input
                              id='pg-family-members'
                              className='pg-input pg-input--box'
                              type='text'
                              required
                              maxLength={280}
                              placeholder={tr(
                                'Ex. : Marie (31 ans, Femme), Junior (8 ans), Sarah (5 ans)|E.g. Marie (31, Female), Junior (8), Sarah (5)',
                                lang
                              )}
                              value={String(answers.familyMembersDetails || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAnswers((prev) => ({ ...prev, familyMembersDetails: val }));
                                setErr('');
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className='pg-contact-field'>
                        <label htmlFor='pg-contact-email' className='pg-contact-label'>
                          {tr('Adresse e-mail obligatoire *|Required email address *', lang)}
                        </label>
                        <input
                          id='pg-contact-email'
                          className='pg-input pg-input--box'
                          type='email'
                          required
                          maxLength={160}
                          autoComplete='email'
                          placeholder={tr('votre.email@exemple.com|your.email@example.com', lang)}
                          value={String(answers.contactEmail || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAnswers((prev) => ({ ...prev, contactEmail: val }));
                            setErr('');
                          }}
                        />
                      </div>

                      <div className='pg-contact-field'>
                        <label htmlFor='pg-contact-phone' className='pg-contact-label'>
                          {tr(
                            'Numéro de téléphone obligatoire (avec indicatif) *|Required phone number (with country code) *',
                            lang
                          )}
                        </label>
                        <input
                          id='pg-contact-phone'
                          className='pg-input pg-input--box'
                          type='tel'
                          required
                          maxLength={40}
                          autoComplete='tel'
                          placeholder={tr('Ex. : +243 81 000 0000 ou +1 385 000 0000|E.g. +1 385 000 0000 or +243...', lang)}
                          value={String(answers.contactPhone || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAnswers((prev) => ({ ...prev, contactPhone: val }));
                            setErr('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleNext();
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : currentQuestion.type === 'number' ? (
                    <input
                      className='pg-input'
                      type='number'
                      inputMode='numeric'
                      min={currentQuestion.min ?? 14}
                      max={currentQuestion.max ?? 100}
                      placeholder={
                        currentQuestion.placeholder
                          ? tr(currentQuestion.placeholder, lang)
                          : tr('Ex. : 25|E.g. 25', lang)
                      }
                      aria-label={getQuestionTitle(currentQuestion, ctx, lang)}
                      value={String(answers[currentQuestion.id] || '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
                        setErr('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNext();
                        }
                      }}
                    />
                  ) : currentQuestion.type === 'text' ? (
                    <>
                      <input
                        className='pg-input'
                        type='text'
                        list={currentQuestion.countryList ? 'pg-country-datalist' : undefined}
                        maxLength={200}
                        autoComplete='off'
                        placeholder={
                          currentQuestion.placeholder ? tr(currentQuestion.placeholder, lang) : undefined
                        }
                        aria-label={getQuestionTitle(currentQuestion, ctx, lang)}
                        value={String(answers[currentQuestion.id] || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
                          setErr('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                      />
                      {currentQuestion.countryList && (
                        <datalist id='pg-country-datalist'>
                          {sortedAllCountries.map((c) => (
                            <option key={c.code} value={c.name} />
                          ))}
                        </datalist>
                      )}
                    </>
                  ) : (
                    <>
                      <div role={currentQuestion.type === 'single' ? 'radiogroup' : 'group'}>
                        {getQuestionOptionKeys(currentQuestion, ctx).map((optKey) => {
                          const curVal = answers[currentQuestion.id];
                          const isChecked = Array.isArray(curVal)
                            ? curVal.includes(optKey)
                            : curVal === optKey;
                          const recommended =
                            currentQuestion.id === 'topics' ? rec(ctx).includes(optKey) : false;

                          return (
                            <button
                              key={optKey}
                              type='button'
                              className='pg-opt'
                              role={currentQuestion.type === 'single' ? 'radio' : 'checkbox'}
                              aria-checked={isChecked}
                              onClick={() => {
                                setAnswers((prev) => {
                                  if (currentQuestion.type === 'single') {
                                    return { ...prev, [currentQuestion.id]: optKey };
                                  }
                                  const existing = Array.isArray(prev[currentQuestion.id])
                                    ? (prev[currentQuestion.id] as string[])
                                    : [];
                                  const updated = existing.includes(optKey)
                                    ? existing.filter((z) => z !== optKey)
                                    : [...existing, optKey];
                                  return { ...prev, [currentQuestion.id]: updated };
                                });
                                setErr('');
                              }}
                            >
                              <span>{getOptionLabel(currentQuestion, optKey, lang)}</span>
                              {recommended && (
                                <span className='pg-rec'>{tr('Suggéré|Suggested', lang)}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {currentQuestion.id === 'topics' && (
                        <button
                          type='button'
                          className='pg-link-btn pg-link-btn--underline'
                          style={{ marginTop: 8 }}
                          onClick={() => {
                            setAnswers((prev) => ({ ...prev, topics: rec(ctx) }));
                            setErr('');
                          }}
                        >
                          {tr('Sélectionner les suggestions|Select suggested topics', lang)}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {err && (
                  <div className='pg-err' role='alert'>
                    <Icon name='alert' />
                    <span>{err}</span>
                  </div>
                )}

                <div className='pg-nav-row'>
                  <button
                    type='button'
                    className='pg-link-btn'
                    style={{ visibility: hist.length > 0 ? 'visible' : 'hidden' }}
                    onClick={handleBack}
                  >
                    ← {tr('Retour|Back', lang)}
                  </button>

                  <button type='button' className='pg-next-btn' onClick={handleNext}>
                    {currentQuestion.optional &&
                    !(answers[currentQuestion.id] && String(answers[currentQuestion.id]).length > 0)
                      ? tr('Passer|Skip', lang)
                      : visibleQuestions[visibleQuestions.length - 1]?.id === currentQuestion.id
                        ? tr('Accéder au paiement|Proceed to payment', lang)
                        : tr('Continuer|Continue', lang)}
                  </button>
                </div>
              </div>
            ) : null}
          </main>

          <p className='pg-disclaimer'>
            {tr(
              'Agence d’accompagnement et d’orientation uniquement : nous vous aidons à comprendre le pays visé et ses démarches, sans être une agence de voyage ni une autorité consulaire.|Guidance and orientation service only: we help you understand your destination country and its procedures, and are neither a travel agency nor a consular authority.',
              lang
            )}
          </p>
        </div>
      )}
    </div>
  );
};
