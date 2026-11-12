/**
 * The member's dossier in words: the PaterGuide answers (codes) turned back
 * into the questions and answers the member saw. Used by the "Mon dossier"
 * screen, its PDF, and the AI assistant (without e-mail and phone).
 * Browser and server (no DOM).
 */
import { COUNTRY_LANGS, DEFAULT_OPTIONS, DEFAULT_QUESTIONS, STEPS, evaluateWhen } from './questionnaire.js';

/** "Texte FR|Text EN" -> the text of one language. */
export function tr(s, lang) {
  const p = String(s || '').split('|');
  return lang === 'en' && p.length > 1 ? p[1] : p[0];
}

export function regionName(code, lang) {
  if (typeof code !== 'string' || !/^[A-Z]{2}$/.test(code)) return String(code || '');
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

const L = {
  destination: 'Destination|Destination',
  tier: 'Formule|Plan',
  name: 'Nom|Name',
  sex: 'Sexe|Gender',
  age: 'Âge|Age',
  email: 'E-mail|Email',
  phone: 'Téléphone|Phone',
  partner: 'Deuxième personne|Second person',
  family: 'Membres de la famille|Family members',
  years: 'ans|years old'
};

function textOf(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(textOf).filter(Boolean).join(', ');
  if (typeof v === 'object') return '';
  return String(v).trim().slice(0, 2000);
}

function answerText(q, value, lang) {
  const opts = q.options || DEFAULT_OPTIONS[q.id] || null;
  const one = (v) => {
    if (opts && typeof v === 'string' && opts[v]) return tr(opts[v], lang);
    if (q.countryList) return regionName(String(v), lang);
    return textOf(v);
  };
  if (Array.isArray(value)) return value.map(one).filter(Boolean).join(', ');
  return one(value);
}

/**
 * @param {Record<string, any> | null} dossier the saved dossier (pg:last_dossier shape)
 * @param {'fr'|'en'} lang
 * @param {{ contact?: boolean }} [opts] contact: include e-mail and phone
 * @returns {{ header: {label: string, value: string}[], sections: {title: string, rows: {q: string, a: string}[]}[] } | null}
 */
export function readableDossier(dossier, lang, opts = {}) {
  if (!dossier || typeof dossier !== 'object' || Array.isArray(dossier)) return null;
  const answers = dossier.answers && typeof dossier.answers === 'object' && !Array.isArray(dossier.answers) ? dossier.answers : {};
  const country = typeof dossier.destinationCountry === 'string' ? dossier.destinationCountry : '';
  const chosenTier = typeof dossier.tier === 'string' ? dossier.tier : typeof answers.groupTier === 'string' ? answers.groupTier : '';
  const tier = chosenTier || 'solo';
  const purpose = String(answers.purpose || '');
  const fill = (s) =>
    tr(s, lang)
      .replace(/\{country\}/g, regionName(country, lang) || tr('le pays visé|the destination', lang))
      .replace(/\{lang\}/g, tr(COUNTRY_LANGS[country] || 'la langue locale|the local language', lang));

  const header = [];
  const push = (label, value) => {
    const v = textOf(value);
    if (v) header.push({ label: tr(label, lang), value: v });
  };
  push(L.destination, regionName(country, lang));
  push(L.tier, tr(DEFAULT_OPTIONS.groupTier[chosenTier] || '', lang));
  push(L.name, dossier.fullName);
  push(L.sex, tr(DEFAULT_OPTIONS.sex[dossier.sex] || '', lang));
  push(L.age, dossier.age ? `${dossier.age} ${tr(L.years, lang)}` : '');
  if (opts.contact) {
    push(L.email, dossier.email);
    push(L.phone, dossier.phone);
  }
  if (dossier.partner && typeof dossier.partner === 'object') {
    const p = dossier.partner;
    push(
      L.partner,
      [textOf(p.fullName), tr(DEFAULT_OPTIONS.sex[p.sex] || '', lang), p.age ? `${p.age} ${tr(L.years, lang)}` : '']
        .filter(Boolean)
        .join(' · ')
    );
  }
  push(L.family, dossier.familyMembersDetails);

  const ctx = { c: country || 'US', a: answers };
  const skip = new Set(['groupTier', 'sex', 'age']);
  const bySection = new Map();
  const questions = [...DEFAULT_QUESTIONS].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  for (const q of questions) {
    if (!q.enabled || q.type === 'contact' || skip.has(q.id)) continue;
    if (!(q.id in answers)) continue;
    if (q.when && !evaluateWhen(q.when, ctx)) continue;
    const a = answerText(q, answers[q.id], lang);
    if (!a) continue;
    const question = fill((purpose && q.questionByPurpose?.[purpose]) || q.questionByTier?.[tier] || q.question);
    const title = tr(q.step || STEPS.S1, lang);
    if (!bySection.has(title)) bySection.set(title, []);
    bySection.get(title).push({ q: question, a });
  }
  const sections = [...bySection].map(([title, rows]) => ({ title, rows }));
  if (!header.length && !sections.length) return null;
  return { header, sections };
}

/** The dossier as plain text (for the AI: no e-mail, no phone). */
export function dossierText(dossier, lang, opts = {}) {
  const r = readableDossier(dossier, lang, opts);
  if (!r) return '';
  const lines = r.header.map((h) => `${h.label}: ${h.value}`);
  for (const s of r.sections) {
    lines.push('', `## ${s.title}`);
    for (const row of s.rows) lines.push(`- ${row.q} → ${row.a}`);
  }
  return lines.join('\n').slice(0, 8000);
}
