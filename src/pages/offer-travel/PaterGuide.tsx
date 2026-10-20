import React, { useEffect, useMemo, useRef, useState } from 'react';
import './paterguide.css';
import { Link } from '../../app/router';
import { useLanguage, type Language } from '../../context/LanguageContext';
import { Icon } from '../../components/Icon';
import { PaymentMarks } from '../../components/PaymentMarks';
import { OFFERS, formatOfferPrice } from '../../../shared/offers.js';
import type { TranslationKey } from '../../i18n';
import { useCheckout } from './useCheckout';

const offer = OFFERS['accompagnement-voyage'];

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

const YN: Record<string, string> = {
  yes: 'Oui|Yes',
  no: 'Non|No',
  unsure: 'Je ne sais pas|Not sure'
};

const O: Record<string, Record<string, string>> = {
  purpose: {
    tourism: 'Premier voyage ou court séjour|First trip or short stay',
    study: 'Études|Study',
    work: 'Emploi|Employment',
    fvisit: 'Visite à ma famille|Visiting family',
    freunion: 'Regroupement familial|Family reunification',
    immigration: 'Installation durable|Permanent relocation',
    business: 'Voyage d’affaires|Business trip',
    medical: 'Soins médicaux|Medical care',
    dv: 'Diversity Visa (loterie)|Diversity Visa (lottery)',
    other: 'Autre|Other'
  },
  tdur: {
    d7: 'Moins d’une semaine|Under a week',
    d14: '1 à 2 semaines|1–2 weeks',
    d30: '2 à 4 semaines|2–4 weeks',
    m3: '1 à 3 mois|1–3 months',
    m3p: 'Plus de 3 mois|Over 3 months'
  },
  tstyle: {
    culture: 'Comprendre la culture et le mode de vie|Understand culture and lifestyle',
    nature: 'Découverte et déplacements|Discovery and getting around',
    city: 'Villes et repères pratiques|Cities and practical orientation',
    beach: 'Séjour détente|Relaxation stay',
    events: 'Événements ou conférences|Events or conferences'
  },
  sLevel: {
    lang: 'Cours de langue|Language course',
    voc: 'Formation professionnelle|Vocational training',
    bach: 'Licence / Bachelor|Bachelor’s',
    mast: 'Master|Master’s',
    phd: 'Doctorat|PhD'
  },
  sAdm: {
    none: 'Pas encore de candidature|Not applied yet',
    applying: 'Candidatures en cours|Applications in progress',
    accepted: 'J’ai une admission|I have an admission'
  },
  ltest: {
    yes: 'Oui|Yes',
    plan: 'Je prévois de le passer|Planning to take it',
    no: 'Non|No',
    unsure: 'Je ne sais pas si c’est requis|Not sure if required'
  },
  sFund: {
    self: 'Économies personnelles|Personal savings',
    family: 'Soutien familial|Family support',
    schol: 'Bourse|Scholarship',
    loan: 'Prêt|Loan',
    work: 'Travail sur place|Work on site'
  },
  wOffer: {
    yes: 'Oui, j’ai une offre|Yes, I have an offer',
    inter: 'Je suis en entretiens|I am interviewing',
    search: 'Je cherche activement|Actively searching',
    none: 'Pas encore|Not yet'
  },
  degree: {
    sec: 'Secondaire / Bac|High school',
    voc: 'Diplôme professionnel|Vocational',
    bach: 'Licence / Bachelor|Bachelor’s',
    mast: 'Master|Master’s',
    phd: 'Doctorat|PhD'
  },
  exp: {
    e2: 'Moins de 2 ans|Under 2 years',
    e5: '2 à 5 ans|2–5 years',
    e10: '5 à 10 ans|5–10 years',
    e10p: 'Plus de 10 ans|Over 10 years'
  },
  fRel: {
    spouse: 'Conjoint(e)|Spouse',
    child: 'Enfant|Child',
    parent: 'Parent|Parent',
    sib: 'Frère ou sœur|Sibling',
    fiance: 'Fiancé(e)|Fiancé(e)',
    other: 'Autre proche|Other relative'
  },
  fStat: {
    cit: 'Citoyen(ne)|Citizen',
    pr: 'Résident(e) permanent(e)|Permanent resident',
    temp: 'Résident(e) temporaire (études, travail)|Temporary resident',
    unsure: 'Je ne sais pas|Not sure'
  },
  iRoute: {
    skill: 'Travail qualifié|Skilled work',
    family: 'Famille|Family',
    study: 'Études puis installation|Study then settle',
    prov: 'Programme provincial|Provincial program',
    invest: 'Investissement ou entrepreneuriat|Investment or entrepreneurship',
    unsure: 'Je ne sais pas encore|Not sure yet'
  },
  iAge: { a1: '18–24', a2: '25–34', a3: '35–44', a4: '45+' },
  bType: {
    meet: 'Réunions ou négociations|Meetings or negotiations',
    conf: 'Conférence ou salon|Conference or trade fair',
    prosp: 'Prospection de marché|Market research',
    train: 'Formation|Training'
  },
  inv: {
    yes: 'Oui, confirmé|Yes, confirmed',
    prog: 'En cours|In progress',
    no: 'Non|No'
  },
  mCare: {
    cons: 'Consultation|Consultation',
    surg: 'Intervention chirurgicale|Surgery',
    long: 'Traitement de longue durée|Long-term treatment',
    unsure: 'Je ne sais pas encore|Not sure yet'
  },
  dvStatus: {
    considering: 'Je me renseigne|I’m exploring',
    entered: 'J’ai déjà participé|I have entered',
    selected: 'J’ai été sélectionné(e)|I was selected'
  },
  dvStage: {
    letter: 'J’attends mon avis officiel|Waiting for official notice',
    docs: 'Je prépare mes documents|Preparing documents',
    int: 'Entretien programmé|Interview scheduled'
  },
  dvElig: YN,
  status: {
    researching: 'C’est ma première fois, je veux comprendre comment ça marche|It’s my first time, I want to understand how it works',
    started: 'J’ai commencé un dossier|I started an application',
    hasVisa: 'J’ai déjà un visa ou un permis|I already have a visa or permit',
    hasAppt: 'J’ai un rendez-vous (ambassade, consulat, centre de visas)|I have an appointment',
    refused: 'J’ai déjà eu un refus|I was refused before'
  },
  stage: {
    form: 'Formulaire rempli|Form completed',
    fee: 'Frais payés|Fees paid',
    docs: 'Documents envoyés|Documents submitted',
    bio: 'Biométrie ou entretien faits|Biometrics or interview done',
    wait: 'En attente de décision|Awaiting decision'
  },
  vExp: {
    ok: 'Valide plus de 6 mois|Valid for over 6 months',
    soon: 'Expire dans moins de 6 mois|Expires within 6 months',
    gone: 'Expiré|Expired'
  },
  appt: {
    w2: 'Dans moins de 2 semaines|Within 2 weeks',
    m2: 'Dans 1 à 2 mois|In 1–2 months',
    later: 'Plus tard|Later'
  },
  refR: {
    docs: 'Documents insuffisants|Insufficient documents',
    funds: 'Ressources financières|Financial resources',
    ties: 'Attaches dans mon pays|Ties to my home country',
    unk: 'Je ne sais pas|I don’t know'
  },
  travelDate: {
    lt3: 'Dans moins de 3 mois|Within 3 months',
    '3to6': 'Dans 3 à 6 mois|In 3–6 months',
    '6to12': 'Dans 6 à 12 mois|In 6–12 months',
    gt12: 'Dans plus d’un an|In over a year',
    undecided: 'Je ne sais pas encore|Not sure yet'
  },
  flexible: {
    yes: 'Oui, assez flexible|Yes, fairly flexible',
    no: 'Non, elle est fixe|No, it is fixed'
  },
  comp: {
    alone: 'Seul(e)|Alone',
    partner: 'Avec mon conjoint ou ma conjointe|With my partner',
    family: 'Avec ma famille|With my family'
  },
  kids: {
    k1: '1 personne de plus|1 more person',
    k2: '2 personnes|2 people',
    k3: '3 à 4 personnes|3–4 people',
    k5: '5 ou plus|5 or more'
  },
  proof: {
    yes: 'Oui, complètement|Yes, fully',
    part: 'En partie|Partly',
    no: 'Pas encore|Not yet',
    unsure: 'Je ne sais pas|Not sure'
  },
  budget: {
    b1: 'Moins de 500 $|Under $500',
    b2: '500 à 1 000 $|$500–1,000',
    b3: '1 000 à 2 000 $|$1,000–2,000',
    b4: '2 000 à 3 500 $|$2,000–3,500',
    b5: 'Plus de 3 500 $|Over $3,500',
    unsure: 'Je ne sais pas|Not sure'
  },
  housing: {
    arranged: 'Oui, c’est organisé|Yes, arranged',
    searching: 'Je suis en recherche|Searching',
    none: 'Pas encore|Not yet'
  },
  lang: {
    good: 'À l’aise|Comfortable',
    basic: 'Notions de base|Basic',
    none: 'Pas du tout|Not at all'
  },
  topics: {
    docs: 'Comprendre le pays et ses démarches officielles|Understand the country and its official procedures',
    visa: 'Catégories de visa et conditions expliquées simplement|Visa categories and conditions explained simply',
    interview: 'Conseils pour préparer un entretien|Advice to prepare for an interview',
    housing: 'Logement et quartiers à l’arrivée|Housing and neighbourhoods on arrival',
    budget: 'Coût réel de la vie et budget mensuel|Real cost of living and monthly budget',
    edujob: 'Système d’études et d’emploi sur place|Education and employment system on site',
    health: 'Santé, assurance et vie pratique|Healthcare, insurance and practical life',
    transport: 'Transports et repères du quotidien|Transport and everyday orientation',
    first30: 'Réussir ses 30 premiers jours (première fois)|Succeeding in your first 30 days (first-timer guide)',
    official: 'Comprendre les sources officielles|Understanding official sources',
    scam: 'Éviter les erreurs et les arnaques|Avoiding mistakes and scams',
    lang: 'Langue, codes culturels et intégration|Language, cultural codes and integration'
  }
};

const LANGS: Record<string, string> = {
  US: 'l’anglais|English',
  GB: 'l’anglais|English',
  CA: 'l’anglais ou le français|English or French',
  FR: 'le français|French',
  BE: 'le français ou le néerlandais|French or Dutch',
  DE: 'l’allemand|German',
  IT: 'l’italien|Italian',
  NL: 'le néerlandais|Dutch'
};

type Answers = Record<string, string | string[]>;
interface Ctx {
  c: string;
  a: Answers;
}

interface QuestionDef {
  id: string;
  st: string;
  ty: 'text' | 'single' | 'multi' | 'contact';
  dl?: number;
  opt?: number;
  if?: (x: Ctx) => boolean;
  o?: (x: Ctx) => string[];
  q: (x: Ctx, l: Language) => string;
  h?: (x: Ctx, l: Language) => string;
}

function tr(s: string, l: Language): string {
  const p = s.split('|');
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

const S1 = 'Profil|Profile';
const S2 = 'Objectif|Goal';
const S3 = 'Votre projet|Your plan';
const S4 = 'Démarches|Procedures';
const S5 = 'Voyage|Travel';
const S6 = 'Moyens|Resources';
const S7 = 'Besoins|Needs';
const S8 = 'Coordonnées|Contact details';

const P = (x: Ctx) => String(x.a.purpose || '');
const is = (x: Ctx, k: string, ...v: string[]) => v.includes(String(x.a[k] || ''));
const inP = (x: Ctx, ...v: string[]) => v.includes(P(x));
const isLong = (x: Ctx) => inP(x, 'study', 'work', 'immigration', 'freunion') || x.a.tdur === 'm3p';
const noDV = (x: Ctx) => !(P(x) === 'dv' && x.a.dvStatus !== 'selected');
const ln = (x: Ctx, l: Language) => tr(LANGS[x.c] || 'la langue locale|the local language', l);

const SKIP =
  'tstyle activity sFund degree exp iAge ltest inv dvElig stage appt refR caseRef flexible comp kids proof budget housing lang concern'.split(
    ' '
  );

const RAW_Q: QuestionDef[] = [
  {
    id: 'residence',
    st: S1,
    ty: 'text',
    dl: 1,
    q: () => 'Dans quel pays vivez-vous actuellement ?|Which country do you live in now?',
    h: () => 'Choisissez dans la liste ou tapez-le.|Pick from the list or type it.'
  },
  {
    id: 'nationality',
    st: S1,
    ty: 'text',
    dl: 1,
    q: () => 'Quelle est votre nationalité ?|What is your nationality?',
    h: (x, l) =>
      `Pour vous expliquer clairement comment fonctionne l’accès vers ${regionName(x.c, l)} selon votre situation.|To clearly explain how access to ${regionName(x.c, l)} works for your situation.`
  },
  {
    id: 'purpose',
    st: S2,
    ty: 'single',
    o: (x) => Object.keys(O.purpose).filter((k) => k !== 'dv' || x.c === 'US'),
    q: (x, l) => `Quel est votre objectif en ${regionName(x.c, l)} ?|What is your goal in ${regionName(x.c, l)}?`,
    h: () => 'Votre choix adapte nos conseils à votre projet.|Your choice tailors our guidance to your plan.'
  },
  {
    id: 'tdur',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'tourism'),
    q: () => 'Combien de temps prévoyez-vous de rester ?|How long do you plan to stay?'
  },
  {
    id: 'tstyle',
    st: S3,
    ty: 'multi',
    opt: 1,
    if: (x) => inP(x, 'tourism'),
    q: () => 'Quels aspects souhaitez-vous mieux comprendre ?|Which aspects do you want to understand better?'
  },
  {
    id: 'sLevel',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'study'),
    q: () => 'Quel type de formation visez-vous ?|What kind of programme are you aiming for?'
  },
  {
    id: 'activity',
    st: S3,
    ty: 'text',
    if: (x) => inP(x, 'study', 'work'),
    q: (x) =>
      P(x) === 'study'
        ? 'Quel domaine d’études ?|Which field of study?'
        : 'Dans quel métier ou secteur ?|Which profession or sector?'
  },
  {
    id: 'sAdm',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'study'),
    q: () => 'Où en êtes-vous côté admission ?|Where do you stand on admission?',
    h: () =>
      'Nous vous expliquons comment fonctionne le système universitaire du pays choisi.|We explain how the university system works in your chosen country.'
  },
  {
    id: 'sFund',
    st: S3,
    ty: 'multi',
    if: (x) => inP(x, 'study'),
    q: () => 'Comment financerez-vous vos études ?|How will you fund your studies?'
  },
  {
    id: 'wOffer',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'work'),
    q: () => 'Avez-vous une offre d’emploi ?|Do you have a job offer?'
  },
  {
    id: 'degree',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'work', 'immigration'),
    q: () => 'Quel est votre plus haut diplôme ?|What is your highest qualification?'
  },
  {
    id: 'exp',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'work', 'immigration'),
    q: () => 'Combien d’années d’expérience professionnelle ?|How many years of work experience?'
  },
  {
    id: 'iRoute',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'immigration'),
    o: (x) => Object.keys(O.iRoute).filter((k) => k !== 'prov' || x.c === 'CA'),
    q: (x, l) =>
      `Quelle piste vous semble la plus proche pour ${regionName(x.c, l)} ?|Which route feels closest for ${regionName(x.c, l)}?`,
    h: () =>
      'Peu importe si c’est votre première fois : nous vous expliquerons comment chaque voie fonctionne.|No worries if it is your first time: we will explain how each route works.'
  },
  {
    id: 'iAge',
    st: S3,
    ty: 'single',
    opt: 1,
    if: (x) => inP(x, 'immigration'),
    q: () => 'Dans quelle tranche d’âge êtes-vous ?|Which age range are you in?',
    h: () => 'Certains systèmes de sélection en tiennent compte.|Some selection systems take age into account.'
  },
  {
    id: 'ltest',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'study', 'immigration'),
    q: (x, l) =>
      `Avez-vous un test de langue reconnu (${ln(x, l)}) ?|Do you have a recognised language test (${ln(x, l)})?`
  },
  {
    id: 'fRel',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'fvisit', 'freunion'),
    q: (x) =>
      P(x) === 'fvisit'
        ? 'Quel est votre lien avec la personne qui vous accueille ?|How are you related to the person hosting you?'
        : 'Quel est votre lien avec la personne qui vous parraine ?|How are you related to your sponsor?'
  },
  {
    id: 'fStat',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'fvisit', 'freunion'),
    q: (x, l) => `Quel est son statut en ${regionName(x.c, l)} ?|What is their status in ${regionName(x.c, l)}?`,
    h: () => 'Les règles dépendent fortement de ce statut.|The rules depend heavily on this status.'
  },
  {
    id: 'bType',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'business'),
    q: () => 'Quel est l’objet de votre déplacement ?|What is the purpose of your trip?'
  },
  {
    id: 'inv',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'business', 'medical'),
    q: (x) =>
      P(x) === 'medical'
        ? 'Avez-vous un rendez-vous confirmé avec un établissement de santé ?|Do you have a confirmed appointment with a healthcare provider?'
        : 'Avez-vous une lettre d’invitation de l’entreprise hôte ?|Do you have an invitation letter from the host company?'
  },
  {
    id: 'mCare',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'medical'),
    q: () => 'De quel type de soins s’agit-il ?|What kind of care is it?'
  },
  {
    id: 'dvStatus',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'dv'),
    q: () => 'Où en êtes-vous avec le Diversity Visa ?|Where are you with the Diversity Visa?',
    h: () =>
      'C’est un programme officiel du gouvernement américain. Nous vous aidons à comprendre chaque étape sans erreur.|It is an official US government programme. We help you understand each step without mistakes.'
  },
  {
    id: 'dvElig',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'dv') && is(x, 'dvStatus', 'considering', 'entered'),
    q: () =>
      'Remplissez-vous les conditions de base (niveau d’études ou expérience) ?|Do you meet the basic requirements (education or work experience)?'
  },
  {
    id: 'dvStage',
    st: S3,
    ty: 'single',
    if: (x) => inP(x, 'dv') && is(x, 'dvStatus', 'selected'),
    q: () => 'À quelle étape êtes-vous ?|Which stage are you at?'
  },
  {
    id: 'oDesc',
    st: S3,
    ty: 'text',
    if: (x) => inP(x, 'other'),
    q: () => 'Décrivez votre projet en quelques mots.|Describe your plan in a few words.'
  },
  {
    id: 'status',
    st: S4,
    ty: 'single',
    if: (x) => !inP(x, 'dv'),
    q: () => 'Où en êtes-vous dans votre préparation ?|Where are you in your preparation?'
  },
  {
    id: 'stage',
    st: S4,
    ty: 'single',
    if: (x) => is(x, 'status', 'started'),
    q: () => 'Quelle étape avez-vous franchie ?|Which step have you completed?'
  },
  {
    id: 'vExp',
    st: S4,
    ty: 'single',
    if: (x) => is(x, 'status', 'hasVisa'),
    q: () => 'Quelle est la validité de votre visa ou permis ?|How long is your visa or permit valid?'
  },
  {
    id: 'appt',
    st: S4,
    ty: 'single',
    if: (x) => is(x, 'status', 'hasAppt'),
    q: () => 'Quand a lieu votre rendez-vous ?|When is your appointment?'
  },
  {
    id: 'refR',
    st: S4,
    ty: 'single',
    if: (x) => is(x, 'status', 'refused'),
    q: () => 'Connaissez-vous le motif du refus ?|Do you know the reason for the refusal?',
    h: () =>
      'Comprendre le motif est essentiel avant toute nouvelle démarche.|Understanding the reason is essential before any new step.'
  },
  {
    id: 'caseRef',
    st: S4,
    ty: 'text',
    opt: 1,
    if: (x) => is(x, 'status', 'started', 'hasVisa', 'hasAppt'),
    q: () => 'Avez-vous une référence de dossier officielle ?|Do you have an official case reference?',
    h: () =>
      'Facultatif. N’indiquez jamais de numéro de passeport ni de document d’identité.|Optional. Never enter a passport or ID number.'
  },
  {
    id: 'travelDate',
    st: S5,
    ty: 'single',
    q: () => 'Quand espérez-vous partir ?|When do you hope to go?'
  },
  {
    id: 'flexible',
    st: S5,
    ty: 'single',
    if: (x) => Boolean(x.a.travelDate && x.a.travelDate !== 'undecided'),
    q: () => 'Votre date est-elle flexible ?|Is your date flexible?'
  },
  {
    id: 'comp',
    st: S5,
    ty: 'single',
    q: () => 'Partez-vous seul(e) ou accompagné(e) ?|Are you going alone or with others?'
  },
  {
    id: 'kids',
    st: S5,
    ty: 'single',
    if: (x) => is(x, 'comp', 'family'),
    q: () => 'Combien de personnes vous accompagnent ?|How many people are with you?'
  },
  {
    id: 'proof',
    st: S6,
    ty: 'single',
    if: noDV,
    q: () => 'Pouvez-vous justifier vos moyens financiers ?|Can you document your finances?',
    h: () => 'Nous vous conseillons sur la manière de présenter un dossier cohérent.|We advise you on how to present a coherent file.'
  },
  {
    id: 'budget',
    st: S6,
    ty: 'single',
    if: (x) => isLong(x) || inP(x, 'medical'),
    q: () => 'Quel budget mensuel pouvez-vous consacrer sur place ?|What monthly budget can you spend there?'
  },
  {
    id: 'housing',
    st: S6,
    ty: 'single',
    if: isLong,
    q: () => 'Avez-vous déjà un logement prévu ?|Do you have housing lined up?'
  },
  {
    id: 'lang',
    st: S6,
    ty: 'single',
    q: (x, l) => `Parlez-vous ${ln(x, l)} ?|Do you speak ${ln(x, l)}?`
  },
  {
    id: 'concern',
    st: S7,
    ty: 'text',
    opt: 1,
    q: (x, l) =>
      `Quelle est votre principale question ou inquiétude concernant ${regionName(x.c, l)} ?|What is your main question or concern about ${regionName(x.c, l)}?`,
    h: () => 'Quelques mots suffisent.|A few words are enough.'
  },
  {
    id: 'topics',
    st: S7,
    ty: 'multi',
    q: () => 'Sur quels sujets voulez-vous être accompagné(e) et conseillé(e) ?|Which topics do you want guidance and advice on?',
    h: () =>
      'Nous avons présélectionné les sujets recommandés pour votre profil.|We have pre-marked the topics recommended for your profile.'
  },
  {
    id: 'contactInfo',
    st: S8,
    ty: 'contact',
    q: () => 'Vos coordonnées pour votre accompagnement|Your contact details for your guidance'
  }
];

const Q: QuestionDef[] = RAW_Q.map((q) => (SKIP.includes(q.id) ? { ...q, opt: 1 } : q));

function vis(x: Ctx): QuestionDef[] {
  return Q.filter((q) => !q.if || q.if(x));
}

function rec(x: Ctx): string[] {
  const r = ['docs', 'official', 'first30'];
  if (is(x, 'status', 'researching', 'refused') || inP(x, 'dv')) r.push('visa', 'scam');
  if (is(x, 'status', 'started', 'hasAppt') || inP(x, 'study', 'business', 'work')) r.push('interview');
  if (isLong(x)) r.push('housing', 'health');
  if (isLong(x) || is(x, 'proof', 'part', 'no')) r.push('budget');
  if (inP(x, 'study', 'work', 'immigration')) r.push('edujob');
  if (inP(x, 'tourism')) r.push('transport');
  if (is(x, 'lang', 'basic', 'none')) r.push('lang');
  return Array.from(new Set(r));
}

function insights(x: Ctx): string[] {
  const a = x.a;
  const r: string[] = [];
  r.push(
    'Notre rôle est celui d’une agence d’accompagnement et de conseil (et non d’une agence de voyage) : nous vous aidons à comprendre le pays visé, son fonctionnement réel et ses démarches, surtout lorsqu’il s’agit d’une première fois.|Our role is that of a guidance and advisory agency (not a travel agency): we help you understand your destination country, how it really works and its procedures, especially if it is your first time.'
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
  if (is(x, 'comp', 'family'))
    r.push(
      'Partir en famille demande une préparation spécifique du budget, du logement et des démarches.|Going with family requires specific preparation for budget, housing and procedures.'
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{5,24}$/;

export const PaterGuide: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { lang, t } = useLanguage();
  const { state: checkoutState, pay } = useCheckout(offer.id);

  const [country, setCountry] = useState<string | null>(null);
  const [hoverFlag, setHoverFlag] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [curId, setCurId] = useState<string>('residence');
  const [hist, setHist] = useState<string[]>([]);
  const [err, setErr] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [portal, setPortal] = useState<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0
  });

  const headingRef = useRef<HTMLHeadingElement>(null);

  const ctx: Ctx = useMemo(() => ({ c: country || 'US', a: answers }), [country, answers]);
  const visibleQuestions = useMemo(() => vis(ctx), [ctx]);

  // Persist draft in localStorage whenever country/answers/curId/hist change
  useEffect(() => {
    if (!country) return;
    writeStorage(
      `pg:draft:${country}`,
      JSON.stringify({ a: answers, cur: curId, hist })
    );
  }, [country, answers, curId, hist]);

  // Save a human-readable summary including mandatory buyer contact details for ConfirmationPage
  useEffect(() => {
    if (!country || curId !== 'review') return;
    const destName = regionName(country, lang);
    const purposeVal = answers.purpose ? tr(O.purpose[String(answers.purpose)] || '', lang) : '';
    const dateVal = answers.travelDate ? tr(O.travelDate[String(answers.travelDate)] || '', lang) : '';
    const cName = String(answers.contactName || '').trim();
    const cEmail = String(answers.contactEmail || '').trim();
    const cPhone = String(answers.contactPhone || '').trim();
    const contactPart = [cName, cEmail, cPhone].filter(Boolean).join(' · ');
    const summary = `${destName}${purposeVal ? ` · ${purposeVal}` : ''}${dateVal ? ` (${dateVal})` : ''}${contactPart ? ` — Client : ${contactPart}` : ''}`;
    writeStorage('pg:last_summary', summary);
  }, [country, curId, answers, lang]);

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
    let loadedCur = 'residence';
    let loadedHist: string[] = [];
    try {
      const raw = readStorage(`pg:draft:${code}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          loadedAnswers = parsed.a || {};
          loadedCur = parsed.cur || 'residence';
          loadedHist = Array.isArray(parsed.hist) ? parsed.hist : [];
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
    setCurId('residence');
    setHist([]);
    setErr('');
  };

  const currentQuestion = visibleQuestions.find((q) => q.id === curId) || visibleQuestions[0];
  const isReview = curId === 'review';
  const stepIndex = isReview
    ? visibleQuestions.length
    : Math.max(0, visibleQuestions.findIndex((q) => q.id === curId));
  const pct = visibleQuestions.length > 0 ? Math.round((stepIndex / visibleQuestions.length) * 100) : 0;

  const formatAnswerLabel = (q: QuestionDef, val: string | string[] | undefined): string => {
    if (q.ty === 'contact') {
      const n = String(answers.contactName || '').trim();
      const em = String(answers.contactEmail || '').trim();
      const ph = String(answers.contactPhone || '').trim();
      return [n, em, ph].filter(Boolean).join(' · ');
    }
    if (!val) return '';
    if (q.ty === 'text') return String(val);
    if (Array.isArray(val)) {
      return val
        .map((k) => (O[q.id]?.[k] ? tr(O[q.id][k], lang) : k))
        .filter(Boolean)
        .join(', ');
    }
    return O[q.id]?.[val] ? tr(O[q.id][val], lang) : String(val);
  };

  const validateContactFields = (): string | null => {
    const name = String(answers.contactName || '').trim();
    const email = String(answers.contactEmail || '').trim();
    const phone = String(answers.contactPhone || '').trim();

    if (name.length < 2) {
      return tr(
        'Veuillez indiquer votre nom complet (obligatoire).|Please enter your full name (required).',
        lang
      );
    }
    if (!EMAIL_RE.test(email)) {
      return tr(
        'Veuillez indiquer une adresse e-mail valide (obligatoire).|Please enter a valid email address (required).',
        lang
      );
    }
    if (!PHONE_RE.test(phone)) {
      return tr(
        'Veuillez indiquer votre numéro de téléphone avec indicatif (ex. +243... ou +1...).|Please enter your phone number with country code (e.g. +243... or +1...).',
        lang
      );
    }
    return null;
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    if (currentQuestion.ty === 'contact') {
      const contactErr = validateContactFields();
      if (contactErr) {
        setErr(contactErr);
        return;
      }
    } else {
      const v = answers[currentQuestion.id];
      const hasValue =
        currentQuestion.ty === 'multi'
          ? Array.isArray(v) && v.length > 0
          : Boolean(v && String(v).trim());

      if (!currentQuestion.opt && !hasValue) {
        setErr(
          currentQuestion.ty === 'multi'
            ? tr('Choisissez au moins une option.|Choose at least one option.', lang)
            : tr('Merci de répondre pour continuer.|Please answer to continue.', lang)
        );
        return;
      }
    }

    const list = vis(ctx);
    const idx = list.findIndex((z) => z.id === currentQuestion.id);
    const nextId = list[idx + 1] ? list[idx + 1].id : 'review';
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

  const activeFlagCode = country || hoverFlag;
  const price = formatOfferPrice(offer, lang);
  const redirecting = checkoutState.kind === 'redirecting';
  const unavailable = checkoutState.kind === 'unavailable';

  let payLabel =
    lang === 'fr'
      ? `Valider mon dossier & Payer ${price}`
      : `Confirm my file & Pay ${price}`;
  if (redirecting) payLabel = t('offer_cta_redirecting');
  else if (unavailable) payLabel = t('offer_cta_unavailable');
  else if (checkoutState.kind === 'error') payLabel = t('offer_cta_retry');

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
              <span>{isReview ? tr('Récapitulatif & Paiement|Summary & Payment', lang) : tr(currentQuestion?.st || S1, lang)}</span>
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

                {/* Animated Stripe Payment Reveal Box at the end of the process */}
                <div className='pg-checkout-box pg-checkout-reveal' id='achat'>
                  <div className='pg-checkout-badge'>
                    <Icon name='shield' />
                    <span>
                      {tr(
                        'Dossier prêt · Étape finale de validation|File ready · Final confirmation step',
                        lang
                      )}
                    </span>
                  </div>

                  <div className='pg-checkout-head'>
                    <div>
                      <h2 className='pg-checkout-title'>{t('offer_name')}</h2>
                      <p className='pg-checkout-sub'>
                        {tr(
                          'Accompagnement personnalisé pour comprendre votre pays de destination, préparer vos démarches et réussir votre première installation.',
                          lang
                        ) ||
                          'Personalised guidance to understand your destination country, prepare your procedures and succeed in your first move abroad.'}
                      </p>
                    </div>
                    <div className='pg-checkout-price'>
                      <span className='pg-checkout-amount'>{price}</span>
                      <span className='pg-checkout-note'>{t('offer_price_note')}</span>
                    </div>
                  </div>

                  <div className='pg-buyer-recap'>
                    <div className='pg-buyer-recap__row'>
                      <span>{tr('Client|Client', lang)}</span>
                      <strong>{String(answers.contactName || '—')}</strong>
                    </div>
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
                    {redirecting ? <span className='btn__spinner' aria-hidden='true' /> : <Icon name='lock' />}
                    <span>{payLabel}</span>
                    {!redirecting && !unavailable && <Icon name='arrowRight' />}
                  </button>

                  <div className='buy__status' role='status' aria-live='polite'>
                    {checkoutState.kind === 'error' && (
                      <p className='notice notice--error'>
                        <Icon name='alert' />
                        <span>{t(ERROR_KEYS[checkoutState.code] || 'err_checkout_failed')}</span>
                      </p>
                    )}
                    {redirecting && <span className='sr-only'>{t('offer_cta_redirecting')}</span>}
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
                          <dt>{tr(z.q(ctx, lang), lang)}</dt>
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
                  {tr(currentQuestion.q(ctx, lang), lang)}
                </h1>
                {currentQuestion.h && (
                  <p className='pg-q-hint'>{tr(currentQuestion.h(ctx, lang), lang)}</p>
                )}
                {currentQuestion.opt && (
                  <p className='pg-q-opt-tag'>
                    {tr('Facultatif : vous pouvez passer cette question|Optional: you can skip this question', lang)}
                  </p>
                )}

                <div className='pg-fields'>
                  {currentQuestion.ty === 'contact' ? (
                    <div className='pg-contact-grid'>
                      <div className='pg-contact-field'>
                        <label htmlFor='pg-contact-name' className='pg-contact-label'>
                          {tr('Nom complet *|Full name *', lang)}
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
                  ) : currentQuestion.ty === 'text' ? (
                    <>
                      <input
                        className='pg-input'
                        type='text'
                        list={currentQuestion.dl ? 'pg-country-datalist' : undefined}
                        maxLength={200}
                        autoComplete='off'
                        aria-label={tr(currentQuestion.q(ctx, lang), lang)}
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
                      {currentQuestion.dl && (
                        <datalist id='pg-country-datalist'>
                          {sortedAllCountries.map((c) => (
                            <option key={c.code} value={c.name} />
                          ))}
                        </datalist>
                      )}
                    </>
                  ) : (
                    <>
                      <div role={currentQuestion.ty === 'single' ? 'radiogroup' : 'group'}>
                        {(currentQuestion.o
                          ? currentQuestion.o(ctx)
                          : O[currentQuestion.id]
                            ? Object.keys(O[currentQuestion.id])
                            : []
                        ).map((optKey) => {
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
                              role={currentQuestion.ty === 'single' ? 'radio' : 'checkbox'}
                              aria-checked={isChecked}
                              onClick={() => {
                                setAnswers((prev) => {
                                  if (currentQuestion.ty === 'single') {
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
                              <span>{tr(O[currentQuestion.id][optKey], lang)}</span>
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
                  <p className='pg-err' role='alert'>
                    {err}
                  </p>
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
                    {currentQuestion.opt &&
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
