/**
 * ============================================================================
 * FICHIER DE CONFIGURATION DU QUESTIONNAIRE (MODIFIABLE & COMPATIBLE SUPABASE)
 * ============================================================================
 *
 * Ce fichier centralise toutes les questions, étapes et options du formulaire
 * de remplissage (PaterGuide).
 *
 * COMMENT AJOUTER, MODIFIER OU ENLEVER UNE QUESTION :
 * 1. Dans ce fichier (`DEFAULT_QUESTIONS` ci-dessous) :
 *    - Pour AJOUTER une question : ajoutez un objet dans `DEFAULT_QUESTIONS`.
 *    - Pour ENLEVER une question : supprimez son bloc ou passez `enabled: false`.
 *    - Pour MODIFIER un texte ou des choix : modifiez `question`, `hint` ou `options`
 *      au format `"Texte en français|Text in English"`.
 *    - Variables dynamiques disponibles dans les textes :
 *      `{country}` -> nom du pays choisi (ex. États-Unis, Canada...)
 *      `{lang}`    -> langue principale du pays choisi (ex. l’anglais, le français...)
 *
 * 2. Depuis votre base de données Supabase (table `questionnaire_questions`) :
 *    Vous pouvez stocker/surcharger ces questions dans Supabase et passer les lignes
 *    à `mergeQuestionnaire(DEFAULT_QUESTIONS, rowsFromSupabase)`.
 *
 * Exemple de schéma SQL Supabase prêt à l'emploi :
 * ----------------------------------------------------------------------------
 * create table if not exists public.questionnaire_questions (
 *   id text primary key,
 *   sort_order integer not null default 100,
 *   enabled boolean not null default true,
 *   step text not null default 'Profil|Profile',
 *   type text not null default 'single', -- 'text' | 'number' | 'single' | 'multi' | 'contact'
 *   optional boolean not null default false,
 *   country_list boolean not null default false,
 *   question text not null,              -- 'Question FR|Question EN'
 *   hint text,                           -- 'Indice FR|Hint EN'
 *   options jsonb default '{}'::jsonb,   -- { "cle": "Libellé FR|Label EN" }
 *   when_rule jsonb default null,        -- règle d'affichage conditionnel
 *   updated_at timestamptz not null default now()
 * );
 *
 * create table if not exists public.accompagnement_dossiers (
 *   id uuid primary key default gen_random_uuid(),
 *   destination_country text not null,
 *   full_name text not null,
 *   sex text not null,
 *   age integer not null,
 *   email text not null,
 *   phone text not null,
 *   answers jsonb not null default '{}'::jsonb,
 *   stripe_session_id text,
 *   created_at timestamptz not null default now()
 * );
 * ----------------------------------------------------------------------------
 */

export const STEPS = Object.freeze({
  S1: 'Profil|Profile',
  S2: 'Objectif|Goal',
  S3: 'Votre projet|Your plan',
  S4: 'Démarches|Procedures',
  S5: 'Voyage|Travel',
  S6: 'Moyens|Resources',
  S7: 'Besoins|Needs',
  S8: 'Coordonnées|Contact details'
});

export const COUNTRY_LANGS = Object.freeze({
  US: 'l’anglais|English',
  GB: 'l’anglais|English',
  CA: 'l’anglais ou le français|English or French',
  FR: 'le français|French',
  BE: 'le français ou le néerlandais|French or Dutch',
  DE: 'l’allemand|German',
  IT: 'l’italien|Italian',
  NL: 'le néerlandais|Dutch'
});

export const YES_NO_OPTIONS = Object.freeze({
  yes: 'Oui|Yes',
  no: 'Non|No',
  unsure: 'Je ne sais pas|Not sure'
});

/**
 * Catalogue des choix par identifiant de question.
 * Vous pouvez aussi définir `options: { ... }` directement sur une question.
 */
export const DEFAULT_OPTIONS = {
  groupTier: {
    solo: 'Solo · 1 personne (2,60 $)|Solo · 1 person ($2.60)',
    duo: 'Duo · 2 personnes (5 $)|Duo · 2 people ($5)',
    family: 'Famille · Jusqu’à 5 personnes (11 $)|Family · Up to 5 people ($11)',
    test: 'Test Stripe · 1 centime (0,01 $)|Stripe Test · 1 cent ($0.01)'
  },
  duoRelation: {
    couple: 'En couple / Conjoints|Couple / Spouses',
    parent_child: 'Parent et enfant|Parent and child',
    friends_colleagues: 'Proches, étudiants ou associés|Relatives, students or partners'
  },
  familySize: {
    p3: '3 personnes|3 people',
    p4: '4 personnes|4 people',
    p5: '5 personnes (complet)|5 people (full group)'
  },
  sex: {
    male: 'Homme|Male',
    female: 'Femme|Female'
  },
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
  iAge: {
    a1: '18–24',
    a2: '25–34',
    a3: '35–44',
    a4: '45+'
  },
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
  dvElig: YES_NO_OPTIONS,
  status: {
    researching:
      'C’est ma première fois, je veux comprendre comment ça marche|It’s my first time, I want to understand how it works',
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
    first30:
      'Réussir ses 30 premiers jours (première fois)|Succeeding in your first 30 days (first-timer guide)',
    official: 'Comprendre les sources officielles|Understanding official sources',
    scam: 'Éviter les erreurs et les arnaques|Avoiding mistakes and scams',
    lang: 'Langue, codes culturels et intégration|Language, cultural codes and integration'
  }
};

const LONG_STAY_RULE = {
  any: [
    { field: 'purpose', in: ['study', 'work', 'immigration', 'freunion'] },
    { field: 'tdur', in: ['m3p'] }
  ]
};

/**
 * Liste ordonnée des questions du formulaire.
 * Modifiable directement ici ou via la base de données (`mergeQuestionnaire`).
 */
export const DEFAULT_QUESTIONS = [
  {
    id: 'groupTier',
    enabled: true,
    sortOrder: 5,
    step: STEPS.S1,
    type: 'single',
    optional: false,
    question:
      'Pour combien de personnes souhaitez-vous enregistrer ce dossier dans l’écosystème ?|For how many people are you registering this file in the ecosystem?',
    hint:
      'Ce règlement unique valide votre enregistrement et votre entrée dans l’écosystème BlackPater (accès aux forfaits mensuels Pro & Premium ensuite). Le questionnaire s’adapte automatiquement.|This one-time fee validates your registration and entry into the BlackPater ecosystem (unlocking monthly Pro & Premium plans afterwards). The form adapts automatically.',
    options: DEFAULT_OPTIONS.groupTier
  },
  {
    id: 'duoRelation',
    enabled: true,
    sortOrder: 7,
    step: STEPS.S1,
    type: 'single',
    optional: false,
    when: { field: 'groupTier', in: ['duo'] },
    question:
      'Quel est le lien entre les 2 personnes de ce dossier Duo ?|What is the relationship between the 2 people in this Duo file?',
    hint:
      'Permet d’adapter l’analyse des démarches aux deux profils.|Helps tailor the procedural analysis to both profiles.',
    options: DEFAULT_OPTIONS.duoRelation
  },
  {
    id: 'familySize',
    enabled: true,
    sortOrder: 8,
    step: STEPS.S1,
    type: 'single',
    optional: false,
    when: { field: 'groupTier', in: ['family'] },
    question:
      'Combien de personnes composent votre dossier Famille (jusqu’à 5 personnes) ?|How many people are in your Family file (up to 5 people)?',
    hint:
      'La formule Famille (11 $) couvre l’enregistrement dans l’écosystème jusqu’à 5 membres.|The Family plan ($11) covers ecosystem registration for up to 5 members.',
    options: DEFAULT_OPTIONS.familySize
  },
  {
    id: 'familyChildren',
    enabled: true,
    sortOrder: 9,
    step: STEPS.S1,
    type: 'single',
    optional: false,
    when: { field: 'groupTier', in: ['family'] },
    question:
      'Y a-t-il des enfants mineurs (moins de 18 ans) dans le groupe ?|Are there minor children (under 18) in the group?',
    hint:
      'Essentiel pour préparer les volets scolarisation et autorisations familiales.|Essential to prepare schooling and family authorisation steps.',
    options: YES_NO_OPTIONS
  },
  {
    id: 'sex',
    enabled: true,
    sortOrder: 10,
    step: STEPS.S1,
    type: 'single',
    optional: false,
    question: 'Quel est votre sexe ?|What is your gender?',
    questionByTier: {
      duo: 'Quel est votre sexe (responsable principal du dossier Duo) ?|What is your gender (primary Duo applicant)?',
      family: 'Quel est votre sexe (responsable principal du dossier Famille) ?|What is your gender (primary Family applicant)?'
    },
    hint: 'Cette information permet d’adapter votre dossier d’accompagnement.|This information helps tailor your guidance file.',
    options: DEFAULT_OPTIONS.sex
  },
  {
    id: 'age',
    enabled: true,
    sortOrder: 20,
    step: STEPS.S1,
    type: 'number',
    optional: false,
    min: 14,
    max: 100,
    placeholder: 'Ex. : 25|E.g. 25',
    question: 'Quel est votre âge ?|What is your age?',
    questionByTier: {
      duo: 'Quel est votre âge (responsable principal du dossier Duo) ?|What is your age (primary Duo applicant)?',
      family: 'Quel est votre âge (responsable principal du dossier Famille) ?|What is your age (primary Family applicant)?'
    },
    hint: 'Indiquez votre âge en années (ex. : 25). Certains programmes d’études, de bourses ou de mobilité en tiennent compte.|Enter your age in years (e.g. 25). Certain study, scholarship or mobility programmes take age into account.'
  },
  {
    id: 'residence',
    enabled: true,
    sortOrder: 30,
    step: STEPS.S1,
    type: 'text',
    countryList: true,
    optional: false,
    question: 'Dans quel pays vivez-vous actuellement ?|Which country do you live in now?',
    hint: 'Choisissez dans la liste ou tapez-le.|Pick from the list or type it.'
  },
  {
    id: 'nationality',
    enabled: true,
    sortOrder: 40,
    step: STEPS.S1,
    type: 'text',
    countryList: true,
    optional: false,
    question: 'Quelle est votre nationalité ?|What is your nationality?',
    hint: 'Pour vous expliquer clairement comment fonctionne l’accès vers {country} selon votre situation.|To clearly explain how access to {country} works for your situation.'
  },
  {
    id: 'purpose',
    enabled: true,
    sortOrder: 50,
    step: STEPS.S2,
    type: 'single',
    optional: false,
    question: 'Quel est votre objectif en {country} ?|What is your goal in {country}?',
    hint: 'Votre choix adapte nos conseils à votre projet.|Your choice tailors our guidance to your plan.',
    options: DEFAULT_OPTIONS.purpose,
    optionRules: {
      dv: { countryIn: ['US'] }
    }
  },
  {
    id: 'tdur',
    enabled: true,
    sortOrder: 60,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['tourism'] },
    question: 'Combien de temps prévoyez-vous de rester ?|How long do you plan to stay?',
    options: DEFAULT_OPTIONS.tdur
  },
  {
    id: 'tstyle',
    enabled: true,
    sortOrder: 70,
    step: STEPS.S3,
    type: 'multi',
    optional: true,
    when: { field: 'purpose', in: ['tourism'] },
    question: 'Quels aspects souhaitez-vous mieux comprendre ?|Which aspects do you want to understand better?',
    options: DEFAULT_OPTIONS.tstyle
  },
  {
    id: 'sLevel',
    enabled: true,
    sortOrder: 80,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['study'] },
    question: 'Quel type de formation visez-vous ?|What kind of programme are you aiming for?',
    options: DEFAULT_OPTIONS.sLevel
  },
  {
    id: 'activity',
    enabled: true,
    sortOrder: 90,
    step: STEPS.S3,
    type: 'text',
    optional: true,
    when: { field: 'purpose', in: ['study', 'work'] },
    question: 'Dans quel métier ou secteur ?|Which profession or sector?',
    questionByPurpose: {
      study: 'Quel domaine d’études ?|Which field of study?'
    }
  },
  {
    id: 'sAdm',
    enabled: true,
    sortOrder: 100,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['study'] },
    question: 'Où en êtes-vous côté admission ?|Where do you stand on admission?',
    hint: 'Nous vous expliquons comment fonctionne le système universitaire du pays choisi.|We explain how the university system works in your chosen country.',
    options: DEFAULT_OPTIONS.sAdm
  },
  {
    id: 'sFund',
    enabled: true,
    sortOrder: 110,
    step: STEPS.S3,
    type: 'multi',
    optional: true,
    when: { field: 'purpose', in: ['study'] },
    question: 'Comment financerez-vous vos études ?|How will you fund your studies?',
    options: DEFAULT_OPTIONS.sFund
  },
  {
    id: 'wOffer',
    enabled: true,
    sortOrder: 120,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['work'] },
    question: 'Avez-vous une offre d’emploi ?|Do you have a job offer?',
    options: DEFAULT_OPTIONS.wOffer
  },
  {
    id: 'degree',
    enabled: true,
    sortOrder: 130,
    step: STEPS.S3,
    type: 'single',
    optional: true,
    when: { field: 'purpose', in: ['work', 'immigration'] },
    question: 'Quel est votre plus haut diplôme ?|What is your highest qualification?',
    options: DEFAULT_OPTIONS.degree
  },
  {
    id: 'exp',
    enabled: true,
    sortOrder: 140,
    step: STEPS.S3,
    type: 'single',
    optional: true,
    when: { field: 'purpose', in: ['work', 'immigration'] },
    question: 'Combien d’années d’expérience professionnelle ?|How many years of work experience?',
    options: DEFAULT_OPTIONS.exp
  },
  {
    id: 'iRoute',
    enabled: true,
    sortOrder: 150,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['immigration'] },
    question: 'Quelle piste vous semble la plus proche pour {country} ?|Which route feels closest for {country}?',
    hint: 'Peu importe si c’est votre première fois : nous vous expliquerons comment chaque voie fonctionne.|No worries if it is your first time: we will explain how each route works.',
    options: DEFAULT_OPTIONS.iRoute,
    optionRules: {
      prov: { countryIn: ['CA'] }
    }
  },
  {
    id: 'ltest',
    enabled: true,
    sortOrder: 160,
    step: STEPS.S3,
    type: 'single',
    optional: true,
    when: { field: 'purpose', in: ['study', 'immigration'] },
    question: 'Avez-vous un test de langue reconnu ({lang}) ?|Do you have a recognised language test ({lang})?',
    options: DEFAULT_OPTIONS.ltest
  },
  {
    id: 'fRel',
    enabled: true,
    sortOrder: 170,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['fvisit', 'freunion'] },
    question: 'Quel est votre lien avec la personne qui vous parraine ?|How are you related to your sponsor?',
    questionByPurpose: {
      fvisit: 'Quel est votre lien avec la personne qui vous accueille ?|How are you related to the person hosting you?'
    },
    options: DEFAULT_OPTIONS.fRel
  },
  {
    id: 'fStat',
    enabled: true,
    sortOrder: 180,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['fvisit', 'freunion'] },
    question: 'Quel est son statut en {country} ?|What is their status in {country}?',
    hint: 'Les règles dépendent fortement de ce statut.|The rules depend heavily on this status.',
    options: DEFAULT_OPTIONS.fStat
  },
  {
    id: 'bType',
    enabled: true,
    sortOrder: 190,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['business'] },
    question: 'Quel est l’objet de votre déplacement ?|What is the purpose of your trip?',
    options: DEFAULT_OPTIONS.bType
  },
  {
    id: 'inv',
    enabled: true,
    sortOrder: 200,
    step: STEPS.S3,
    type: 'single',
    optional: true,
    when: { field: 'purpose', in: ['business', 'medical'] },
    question: 'Avez-vous une lettre d’invitation de l’entreprise hôte ?|Do you have an invitation letter from the host company?',
    questionByPurpose: {
      medical:
        'Avez-vous un rendez-vous confirmé avec un établissement de santé ?|Do you have a confirmed appointment with a healthcare provider?'
    },
    options: DEFAULT_OPTIONS.inv
  },
  {
    id: 'mCare',
    enabled: true,
    sortOrder: 210,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['medical'] },
    question: 'De quel type de soins s’agit-il ?|What kind of care is it?',
    options: DEFAULT_OPTIONS.mCare
  },
  {
    id: 'dvStatus',
    enabled: true,
    sortOrder: 220,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: { field: 'purpose', in: ['dv'] },
    question: 'Où en êtes-vous avec le Diversity Visa ?|Where are you with the Diversity Visa?',
    hint: 'C’est un programme officiel du gouvernement américain. Nous vous aidons à comprendre chaque étape sans erreur.|It is an official US government programme. We help you understand each step without mistakes.',
    options: DEFAULT_OPTIONS.dvStatus
  },
  {
    id: 'dvElig',
    enabled: true,
    sortOrder: 230,
    step: STEPS.S3,
    type: 'single',
    optional: true,
    when: {
      all: [
        { field: 'purpose', in: ['dv'] },
        { field: 'dvStatus', in: ['considering', 'entered'] }
      ]
    },
    question:
      'Remplissez-vous les conditions de base (niveau d’études ou expérience) ?|Do you meet the basic requirements (education or work experience)?',
    options: DEFAULT_OPTIONS.dvElig
  },
  {
    id: 'dvStage',
    enabled: true,
    sortOrder: 240,
    step: STEPS.S3,
    type: 'single',
    optional: false,
    when: {
      all: [
        { field: 'purpose', in: ['dv'] },
        { field: 'dvStatus', in: ['selected'] }
      ]
    },
    question: 'À quelle étape êtes-vous ?|Which stage are you at?',
    options: DEFAULT_OPTIONS.dvStage
  },
  {
    id: 'oDesc',
    enabled: true,
    sortOrder: 250,
    step: STEPS.S3,
    type: 'text',
    optional: false,
    when: { field: 'purpose', in: ['other'] },
    question: 'Décrivez votre projet en quelques mots.|Describe your plan in a few words.'
  },
  {
    id: 'status',
    enabled: true,
    sortOrder: 260,
    step: STEPS.S4,
    type: 'single',
    optional: false,
    when: { field: 'purpose', notIn: ['dv'] },
    question: 'Où en êtes-vous dans votre préparation ?|Where are you in your preparation?',
    options: DEFAULT_OPTIONS.status
  },
  {
    id: 'stage',
    enabled: true,
    sortOrder: 270,
    step: STEPS.S4,
    type: 'single',
    optional: true,
    when: { field: 'status', in: ['started'] },
    question: 'Quelle étape avez-vous franchie ?|Which step have you completed?',
    options: DEFAULT_OPTIONS.stage
  },
  {
    id: 'vExp',
    enabled: true,
    sortOrder: 280,
    step: STEPS.S4,
    type: 'single',
    optional: false,
    when: { field: 'status', in: ['hasVisa'] },
    question: 'Quelle est la validité de votre visa ou permis ?|How long is your visa or permit valid?',
    options: DEFAULT_OPTIONS.vExp
  },
  {
    id: 'appt',
    enabled: true,
    sortOrder: 290,
    step: STEPS.S4,
    type: 'single',
    optional: true,
    when: { field: 'status', in: ['hasAppt'] },
    question: 'Quand a lieu votre rendez-vous ?|When is your appointment?',
    options: DEFAULT_OPTIONS.appt
  },
  {
    id: 'refR',
    enabled: true,
    sortOrder: 300,
    step: STEPS.S4,
    type: 'single',
    optional: true,
    when: { field: 'status', in: ['refused'] },
    question: 'Connaissez-vous le motif du refus ?|Do you know the reason for the refusal?',
    hint: 'Comprendre le motif est essentiel avant toute nouvelle démarche.|Understanding the reason is essential before any new step.',
    options: DEFAULT_OPTIONS.refR
  },
  {
    id: 'caseRef',
    enabled: true,
    sortOrder: 310,
    step: STEPS.S4,
    type: 'text',
    optional: true,
    when: { field: 'status', in: ['started', 'hasVisa', 'hasAppt'] },
    question: 'Avez-vous une référence de dossier officielle ?|Do you have an official case reference?',
    hint: 'Facultatif. N’indiquez jamais de numéro de passeport ni de document d’identité.|Optional. Never enter a passport or ID number.'
  },
  {
    id: 'travelDate',
    enabled: true,
    sortOrder: 320,
    step: STEPS.S5,
    type: 'single',
    optional: false,
    question: 'Quand espérez-vous partir ?|When do you hope to go?',
    options: DEFAULT_OPTIONS.travelDate
  },
  {
    id: 'flexible',
    enabled: true,
    sortOrder: 330,
    step: STEPS.S5,
    type: 'single',
    optional: true,
    when: { field: 'travelDate', notEmpty: true, notIn: ['undecided'] },
    question: 'Votre date est-elle flexible ?|Is your date flexible?',
    options: DEFAULT_OPTIONS.flexible
  },
  {
    id: 'comp',
    enabled: true,
    sortOrder: 340,
    step: STEPS.S5,
    type: 'single',
    optional: true,
    when: { field: 'groupTier', notIn: ['solo', 'duo', 'family', 'test'] },
    question: 'Partez-vous seul(e) ou accompagné(e) ?|Are you going alone or with others?',
    options: DEFAULT_OPTIONS.comp
  },
  {
    id: 'kids',
    enabled: true,
    sortOrder: 350,
    step: STEPS.S5,
    type: 'single',
    optional: true,
    when: { field: 'comp', in: ['family'] },
    question: 'Combien de personnes vous accompagnent ?|How many people are with you?',
    options: DEFAULT_OPTIONS.kids
  },
  {
    id: 'proof',
    enabled: true,
    sortOrder: 360,
    step: STEPS.S6,
    type: 'single',
    optional: true,
    when: {
      not: {
        all: [
          { field: 'purpose', in: ['dv'] },
          { field: 'dvStatus', notIn: ['selected'] }
        ]
      }
    },
    question: 'Pouvez-vous justifier vos moyens financiers ?|Can you document your finances?',
    hint: 'Nous vous conseillons sur la manière de présenter un dossier cohérent.|We advise you on how to present a coherent file.',
    options: DEFAULT_OPTIONS.proof
  },
  {
    id: 'budget',
    enabled: true,
    sortOrder: 370,
    step: STEPS.S6,
    type: 'single',
    optional: true,
    when: {
      any: [LONG_STAY_RULE, { field: 'purpose', in: ['medical'] }]
    },
    question: 'Quel budget mensuel pouvez-vous consacrer sur place ?|What monthly budget can you spend there?',
    options: DEFAULT_OPTIONS.budget
  },
  {
    id: 'housing',
    enabled: true,
    sortOrder: 380,
    step: STEPS.S6,
    type: 'single',
    optional: true,
    when: LONG_STAY_RULE,
    question: 'Avez-vous déjà un logement prévu ?|Do you have housing lined up?',
    options: DEFAULT_OPTIONS.housing
  },
  {
    id: 'lang',
    enabled: true,
    sortOrder: 390,
    step: STEPS.S6,
    type: 'single',
    optional: true,
    question: 'Parlez-vous {lang} ?|Do you speak {lang}?',
    options: DEFAULT_OPTIONS.lang
  },
  {
    id: 'concern',
    enabled: true,
    sortOrder: 400,
    step: STEPS.S7,
    type: 'text',
    optional: true,
    question:
      'Quelle est votre principale question ou inquiétude concernant {country} ?|What is your main question or concern about {country}?',
    hint: 'Quelques mots suffisent.|A few words are enough.'
  },
  {
    id: 'topics',
    enabled: true,
    sortOrder: 410,
    step: STEPS.S7,
    type: 'multi',
    optional: false,
    question:
      'Sur quels sujets voulez-vous être accompagné(e) et conseillé(e) ?|Which topics do you want guidance and advice on?',
    hint: 'Nous avons présélectionné les sujets recommandés pour votre profil.|We have pre-marked the topics recommended for your profile.',
    options: DEFAULT_OPTIONS.topics
  },
  {
    id: 'contactInfo',
    enabled: true,
    sortOrder: 999,
    step: STEPS.S8,
    type: 'contact',
    optional: false,
    question: 'Validation du dossier & Intégration à l’écosystème|File validation & Ecosystem integration',
    hint: 'Vérifiez votre formule d’intégration (Solo, Duo ou Famille) et complétez les informations personnelles obligatoires du dossier.|Review your integration plan (Solo, Duo or Family) and complete the required personal details for your file.'
  }
];

/**
 * Évalue une règle déclarative `when` (JSON) sans aucun `eval`.
 */
export function evaluateWhen(rule, ctx) {
  if (!rule || typeof rule !== 'object') return true;
  if (Array.isArray(rule.all)) {
    return rule.all.every((sub) => evaluateWhen(sub, ctx));
  }
  if (Array.isArray(rule.any)) {
    return rule.any.some((sub) => evaluateWhen(sub, ctx));
  }
  if (rule.not) {
    return !evaluateWhen(rule.not, ctx);
  }
  if (Array.isArray(rule.countryIn)) {
    if (!rule.countryIn.includes(ctx.c)) return false;
  }
  if (Array.isArray(rule.countryNotIn)) {
    if (rule.countryNotIn.includes(ctx.c)) return false;
  }
  if (typeof rule.field === 'string') {
    const raw = ctx.a?.[rule.field];
    const strVal = Array.isArray(raw) ? raw.join(',') : String(raw || '');
    if (rule.notEmpty && !strVal.trim()) return false;
    if (Array.isArray(rule.in)) {
      if (Array.isArray(raw)) {
        if (!raw.some((v) => rule.in.includes(v))) return false;
      } else if (!rule.in.includes(strVal)) {
        return false;
      }
    }
    if (Array.isArray(rule.notIn)) {
      if (Array.isArray(raw)) {
        if (raw.some((v) => rule.notIn.includes(v))) return false;
      } else if (rule.notIn.includes(strVal)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Normalise une ligne provenant d'une base de données (ex. Supabase `questionnaire_questions`)
 * ou d'un objet JSON personnalisé.
 */
export function normalizeQuestionConfig(raw, index = 0) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim()) {
    return null;
  }
  const id = raw.id.trim();
  const type = ['text', 'number', 'single', 'multi', 'contact'].includes(raw.type || raw.ty)
    ? raw.type || raw.ty
    : 'text';
  return {
    id,
    enabled: raw.enabled !== false,
    sortOrder: Number.isFinite(raw.sortOrder ?? raw.sort_order) ? Number(raw.sortOrder ?? raw.sort_order) : (index + 1) * 10,
    step: raw.step || raw.st || STEPS.S3,
    type,
    optional: Boolean(raw.optional ?? raw.opt),
    countryList: Boolean(raw.countryList ?? raw.country_list ?? raw.dl),
    min: raw.min,
    max: raw.max,
    placeholder: raw.placeholder || '',
    question: raw.question || raw.q || id,
    questionByPurpose: raw.questionByPurpose || raw.question_by_purpose || null,
    questionByTier: raw.questionByTier || raw.question_by_tier || null,
    hint: raw.hint || raw.h || '',
    options: raw.options || DEFAULT_OPTIONS[id] || {},
    optionRules: raw.optionRules || raw.option_rules || null,
    when: raw.when ?? raw.when_rule ?? null
  };
}

/**
 * Fusionne la liste de questions par défaut avec des questions issues d'une base de données
 * (ex. Supabase) : permet d'ajouter de nouvelles questions, de modifier des questions existantes
 * ou d'en supprimer (`enabled: false`).
 */
export function mergeQuestionnaire(baseQuestions = DEFAULT_QUESTIONS, dbRows = []) {
  const byId = new Map();
  baseQuestions.forEach((q, idx) => {
    const norm = normalizeQuestionConfig(q, idx);
    if (norm) byId.set(norm.id, norm);
  });

  if (Array.isArray(dbRows)) {
    dbRows.forEach((row, idx) => {
      if (!row || typeof row !== 'object' || typeof row.id !== 'string') return;
      const existing = byId.get(row.id) || {};
      const merged = normalizeQuestionConfig({ ...existing, ...row }, baseQuestions.length + idx);
      if (merged) byId.set(merged.id, merged);
    });
  }

  return Array.from(byId.values())
    .filter((q) => q.enabled !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
