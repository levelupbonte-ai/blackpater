/**
 * Portal e-mails, sent with Black Pater's own Resend key (never LevelUp's).
 * Plain, branded HTML + a text version, in the customer's language (English by
 * default). The e-mails never carry published content: they point to the
 * private space, where the customer signs in.
 */
import { CONTACT_EMAIL, PORTAL_PATH, SITE_ORIGIN } from './config.js';

const RESEND_URL = 'https://api.resend.com/emails';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const TEXT = {
  en: {
    hello: (name) => (name ? `Hello ${name},` : 'Hello,'),
    footer: 'Black Pater · Jean-Pierre Lofumbwa · Salt Lake City, Utah',
    open: 'Open my space',
    ignore: 'If you did not ask for this, you can ignore this e-mail.',
    code: {
      subject: (c) => `${c} is your Black Pater code`,
      title: 'Your sign-in code',
      intro: 'Enter this code to open your private space. It works once and expires in 10 minutes.',
      never: 'Never share it: Black Pater will never ask you for this code.'
    },
    password: {
      subject: (c) => `${c} is your code to set a password`,
      title: 'Confirm it is you',
      intro: 'Enter this code in your space to create or change your password. It works once and expires in 10 minutes.'
    },
    emailOld: {
      subject: (c) => `${c} confirms your e-mail change`,
      title: 'E-mail change requested',
      intro: (to) => `Someone signed in to your space asked to change its e-mail address to ${to}. Enter this code to confirm. If it was not you, do nothing and sign out of all devices from your space.`
    },
    remove: {
      subject: (c) => `${c} confirms the deletion of your account`,
      title: 'Delete your account',
      intro: 'Enter this code in your space to delete your Black Pater account for good. Your monthly plan stops at once and your messages and personal details are erased. It works once and expires in 10 minutes.'
    },
    emailNew: {
      subject: (c) => `${c} confirms your new e-mail`,
      title: 'Confirm your new address',
      intro: 'Enter this code in your Black Pater space to use this address from now on.'
    },
    access: {
      subject: 'Welcome to Black Pater: your member space is ready',
      title: 'You are now a member',
      intro: 'Thank you for joining. Your member space is open: a free offer lets you see the first information right away, then you choose the monthly plan that suits you. Your messages with Black Pater are there too.',
      how: 'Sign in with this e-mail address: we send you a one-time code, no password needed.'
    },
    update: {
      subject: (title) => `New in your Black Pater space: ${title}`,
      title: 'Something new for you',
      intro: (title) => `Black Pater published “${title}” in your private space.`
    },
    message: {
      subject: 'New message from Black Pater',
      title: 'You have a new message',
      intro: 'Black Pater answered you in your private space.'
    },
    signin: {
      subject: 'New sign-in to your Black Pater space',
      title: 'New sign-in',
      intro: (device, at) => `Your space was opened${device ? ` on ${device}` : ''} on ${at} (UTC).`,
      safe: 'If it was you, there is nothing to do. If not, sign in and choose “Sign out of all devices”, then write to us.'
    }
  },
  fr: {
    hello: (name) => (name ? `Bonjour ${name},` : 'Bonjour,'),
    footer: 'Black Pater · Jean-Pierre Lofumbwa · Salt Lake City, Utah',
    open: 'Ouvrir mon espace',
    ignore: 'Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.',
    code: {
      subject: (c) => `${c} est votre code Black Pater`,
      title: 'Votre code de connexion',
      intro: 'Saisissez ce code pour ouvrir votre espace privé. Il ne sert qu’une fois et expire dans 10 minutes.',
      never: 'Ne le communiquez à personne : Black Pater ne vous le demandera jamais.'
    },
    password: {
      subject: (c) => `${c} est votre code pour le mot de passe`,
      title: 'Confirmez que c’est bien vous',
      intro: 'Saisissez ce code dans votre espace pour créer ou changer votre mot de passe. Il ne sert qu’une fois et expire dans 10 minutes.'
    },
    emailOld: {
      subject: (c) => `${c} confirme votre changement d’e-mail`,
      title: 'Changement d’e-mail demandé',
      intro: (to) => `Une personne connectée à votre espace demande à remplacer son adresse par ${to}. Saisissez ce code pour confirmer. Si ce n’est pas vous, ne faites rien et déconnectez tous les appareils depuis votre espace.`
    },
    remove: {
      subject: (c) => `${c} confirme la suppression de votre compte`,
      title: 'Supprimer votre compte',
      intro: 'Saisissez ce code dans votre espace pour supprimer définitivement votre compte Black Pater. Votre forfait mensuel s’arrête aussitôt, vos messages et données personnelles sont effacés. Il ne sert qu’une fois et expire dans 10 minutes.'
    },
    emailNew: {
      subject: (c) => `${c} confirme votre nouvelle adresse`,
      title: 'Confirmez votre nouvelle adresse',
      intro: 'Saisissez ce code dans votre espace Black Pater pour utiliser désormais cette adresse.'
    },
    access: {
      subject: 'Bienvenue chez Black Pater : votre espace membre est prêt',
      title: 'Vous êtes membre',
      intro: 'Merci de nous avoir rejoints. Votre espace membre est ouvert : une offre gratuite vous donne accès aux premières informations tout de suite, puis vous choisissez le forfait mensuel qui vous convient. Vos échanges avec Black Pater s’y trouvent aussi.',
      how: 'Connectez-vous avec cette adresse e-mail : nous vous envoyons un code à usage unique, sans mot de passe.'
    },
    update: {
      subject: (title) => `Nouveau dans votre espace Black Pater : ${title}`,
      title: 'Du nouveau pour vous',
      intro: (title) => `Black Pater a publié « ${title} » dans votre espace privé.`
    },
    message: {
      subject: 'Nouveau message de Black Pater',
      title: 'Vous avez un nouveau message',
      intro: 'Black Pater vous a répondu dans votre espace privé.'
    },
    signin: {
      subject: 'Nouvelle connexion à votre espace Black Pater',
      title: 'Nouvelle connexion',
      intro: (device, at) => `Votre espace a été ouvert${device ? ` sur ${device}` : ''} le ${at} (UTC).`,
      safe: 'Si c’était vous, il n’y a rien à faire. Sinon, connectez-vous et choisissez « Déconnecter tous les appareils », puis écrivez-nous.'
    }
  }
};

function layout({ lang, title, paragraphs, code, cta }) {
  const t = TEXT[lang];
  const p = paragraphs.map((x) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2b2f36">${escapeHtml(x)}</p>`).join('');
  const codeBlock = code
    ? `<p style="margin:8px 0 24px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:34px;letter-spacing:10px;font-weight:700;color:#0b1220;background:#f5f1ea;border-radius:12px;padding:18px 0;text-align:center">${escapeHtml(code)}</p>`
    : '';
  const button = cta
    ? `<p style="margin:8px 0 24px"><a href="${escapeHtml(cta.href)}" style="display:inline-block;background:#0b1220;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 26px;border-radius:999px">${escapeHtml(cta.label)}</a></p>`
    : '';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f5f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="background:#0b1220;padding:22px 28px"><span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.5px;color:#ffffff">Black <span style="color:#f08a4b">Pater</span></span></td></tr>
<tr><td style="padding:32px 28px 8px">
<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:26px;line-height:1.25;color:#0b1220">${escapeHtml(title)}</h1>
${p}${codeBlock}${button}
</td></tr>
<tr><td style="padding:0 28px 28px"><p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280">${escapeHtml(t.footer)}<br>${escapeHtml(CONTACT_EMAIL)}</p></td></tr>
</table></td></tr></table></body></html>`;
}

function textVersion({ title, paragraphs, code, cta }) {
  return [title, '', ...paragraphs, code ? `\n${code}\n` : '', cta ? `${cta.label}: ${cta.href}` : ''].filter((x) => x !== '').join('\n');
}

export const portalUrl = (origin = SITE_ORIGIN) => `${origin}${PORTAL_PATH}`;

/** { subject, html, text } for one portal e-mail. */
export function buildEmail(kind, { lang = 'en', name, code, title: itemTitle, device, at, newEmail, origin } = {}) {
  const l = lang === 'fr' ? 'fr' : 'en';
  const t = TEXT[l];
  const cta = { href: portalUrl(origin), label: t.open };
  let parts;
  switch (kind) {
    case 'code':
      parts = { subject: t.code.subject(code), title: t.code.title, paragraphs: [t.hello(name), t.code.intro, t.code.never, t.ignore], code };
      break;
    case 'password':
      parts = { subject: t.password.subject(code), title: t.password.title, paragraphs: [t.hello(name), t.password.intro, t.ignore], code };
      break;
    case 'email_old':
      parts = { subject: t.emailOld.subject(code), title: t.emailOld.title, paragraphs: [t.hello(name), t.emailOld.intro(newEmail)], code };
      break;
    case 'delete':
      parts = { subject: t.remove.subject(code), title: t.remove.title, paragraphs: [t.hello(name), t.remove.intro, t.ignore], code };
      break;
    case 'email_new':
      parts = { subject: t.emailNew.subject(code), title: t.emailNew.title, paragraphs: [t.hello(name), t.emailNew.intro, t.ignore], code };
      break;
    case 'access':
      parts = { subject: t.access.subject, title: t.access.title, paragraphs: [t.hello(name), t.access.intro, t.access.how], cta };
      break;
    case 'update':
      parts = { subject: t.update.subject(itemTitle), title: t.update.title, paragraphs: [t.hello(name), t.update.intro(itemTitle)], cta };
      break;
    case 'message':
      parts = { subject: t.message.subject, title: t.message.title, paragraphs: [t.hello(name), t.message.intro], cta };
      break;
    case 'signin':
      parts = { subject: t.signin.subject, title: t.signin.title, paragraphs: [t.hello(name), t.signin.intro(device, at), t.signin.safe], cta };
      break;
    default:
      throw new Error('unknown_email');
  }
  return { subject: parts.subject, html: layout({ lang: l, ...parts }), text: textVersion(parts) };
}

/** Sender over Resend's HTTP API (no SDK). Resolves to { ok, status } and never throws. */
export function createMailer(deps = {}) {
  const fetchImpl = deps.fetch || ((...a) => globalThis.fetch(...a));
  return async function send(cfg, { to, subject, html, text }) {
    if (!cfg.resendKey || !cfg.from) return { ok: false, status: 0, reason: 'not_configured' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? 8000);
    try {
      const res = await fetchImpl(RESEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: cfg.from, to: [to], reply_to: cfg.replyTo, subject, html, text }),
        signal: controller.signal
      });
      try {
        await res.text();
      } catch {
        /* ignore */
      }
      return { ok: res.ok, status: res.status, reason: res.ok ? null : 'http' };
    } catch {
      return { ok: false, status: 0, reason: 'network' };
    } finally {
      clearTimeout(timer);
    }
  };
}
