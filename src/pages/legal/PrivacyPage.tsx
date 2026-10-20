import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LegalLayout, type LegalDoc } from './LegalLayout';
import { CONTACT_EMAIL } from '../../lib/contact';

const fr: LegalDoc = {
  title: 'Politique de confidentialité',
  lead: 'Quelles données sont traitées quand vous visitez blackpater.com ou utilisez notre service d’accompagnement, par qui, et comment exercer vos droits.',
  updated: 'Dernière mise à jour : 19 octobre 2026',
  sections: [
    {
      id: 'responsable',
      title: 'Responsable',
      body: (
        <p>
          Jean-Pierre Lofumbwa (« BlackPater »), structure d’accompagnement et d’orientation internationale basée à Salt Lake City, Utah, États-Unis. Contact : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      )
    },
    {
      id: 'donnees',
      title: 'Données traitées',
      body: (
        <ul>
          <li>
            <strong>Dossier d’accompagnement (PaterGuide)</strong> : lors du processus préalable au paiement, nous collectons obligatoirement votre <strong>nom complet, votre adresse e-mail et votre numéro de téléphone / WhatsApp</strong>, ainsi que vos réponses sur le pays visé et votre projet, afin de préparer votre accompagnement personnalisé et de vous contacter directement.
          </li>
          <li>
            <strong>Paiement</strong> : il est réalisé chez Stripe. Stripe collecte également votre e-mail, votre nom, votre pays et vos données de paiement pour le traitement bancaire et l’envoi du reçu. BlackPater reçoit de Stripe la confirmation de la commande mais <strong>jamais votre numéro de carte</strong>.
          </li>
          <li>
            <strong>Échanges</strong> : les messages que vous envoyez sur WhatsApp ou par e-mail, pour vous répondre, vous conseiller et vous accompagner.
          </li>
          <li>
            <strong>Navigation</strong> : le site enregistre dans votre navigateur votre choix de langue, le brouillon de votre questionnaire PaterGuide (stockage local) et, pendant un achat, un identifiant de tentative de paiement qui évite les doubles paiements (stockage de session, effacé à la fermeture de l’onglet). Aucun cookie publicitaire ni outil de suivi publicitaire n’est utilisé.
          </li>
          <li>
            <strong>Journaux techniques</strong> : l’hébergeur enregistre des données techniques (adresse IP, navigateur, pages demandées) pour la sécurité et le bon fonctionnement du site.
          </li>
        </ul>
      )
    },
    {
      id: 'finalites',
      title: 'Pourquoi',
      body: <p>Pour préparer votre dossier d’accompagnement, vous aider à comprendre le pays où vous souhaitez aller, vous répondre sur WhatsApp et par e-mail, tenir la comptabilité des paiements, et assurer la sécurité du site. Vos données ne sont jamais vendues.</p>
    },
    {
      id: 'prestataires',
      title: 'Prestataires',
      body: (
        <ul>
          <li>
            Stripe (paiement) — <a href='https://stripe.com/privacy' target='_blank' rel='noopener noreferrer'>stripe.com/privacy</a>
          </li>
          <li>Vercel (hébergement du site)</li>
          <li>WhatsApp / Meta (messagerie, pour l’accompagnement direct)</li>
          <li>Google Fonts (polices de caractères chargées depuis les serveurs de Google)</li>
          <li>LevelUp Ecosystem (gestion du contenu du site)</li>
        </ul>
      )
    },
    {
      id: 'conservation',
      title: 'Durée de conservation',
      body: (
        <p>
          Les informations de paiement sont conservées le temps nécessaire aux obligations comptables ; les coordonnées et échanges, le temps de l’accompagnement puis de répondre à d’éventuelles questions. Vous pouvez demander leur suppression à tout moment lorsque la loi le permet.
        </p>
      )
    },
    {
      id: 'droits',
      title: 'Vos droits',
      body: (
        <p>
          Vous pouvez demander l’accès, la correction ou la suppression de vos données en écrivant à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Vous pouvez effacer à tout moment les données stockées par votre navigateur depuis ses réglages.
        </p>
      )
    }
  ]
};

const en: LegalDoc = {
  title: 'Privacy policy',
  lead: 'What data is processed when you visit blackpater.com or use our guidance service, by whom, and how to exercise your rights.',
  updated: 'Last updated: October 19, 2026',
  sections: [
    {
      id: 'responsable',
      title: 'Controller',
      body: (
        <p>
          Jean-Pierre Lofumbwa (“BlackPater”), international guidance and orientation service based in Salt Lake City, Utah, USA. Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      )
    },
    {
      id: 'donnees',
      title: 'Data processed',
      body: (
        <ul>
          <li>
            <strong>Guidance file (PaterGuide)</strong>: during the pre-payment assessment process, we collect your mandatory <strong>full name, email address and phone / WhatsApp number</strong>, along with your answers regarding your destination country and plan, in order to prepare your personalised guidance and contact you directly.
          </li>
          <li>
            <strong>Payment</strong>: handled by Stripe. Stripe also collects your email, name, country and payment details for banking processing and receipt delivery. BlackPater receives the order confirmation from Stripe but <strong>never your card number</strong>.
          </li>
          <li>
            <strong>Conversations</strong>: the messages you send on WhatsApp or by email, to answer, advise and guide you.
          </li>
          <li>
            <strong>Browsing</strong>: the site stores your language choice, your PaterGuide assessment draft in your browser (local storage) and, during a purchase, a payment attempt identifier that prevents double payments (session storage, cleared when the tab closes). No advertising cookies or ad tracking tools are used.
          </li>
          <li>
            <strong>Technical logs</strong>: the hosting provider records technical data (IP address, browser, pages requested) for security and reliability.
          </li>
        </ul>
      )
    },
    {
      id: 'finalites',
      title: 'Why',
      body: <p>To prepare your guidance file, help you understand your destination country, contact you on WhatsApp and by email, keep payment records, and keep the site secure. Your data is never sold.</p>
    },
    {
      id: 'prestataires',
      title: 'Service providers',
      body: (
        <ul>
          <li>
            Stripe (payments) — <a href='https://stripe.com/privacy' target='_blank' rel='noopener noreferrer'>stripe.com/privacy</a>
          </li>
          <li>Vercel (website hosting)</li>
          <li>WhatsApp / Meta (messaging, for direct guidance)</li>
          <li>Google Fonts (typefaces loaded from Google’s servers)</li>
          <li>LevelUp Ecosystem (website content management)</li>
        </ul>
      )
    },
    {
      id: 'conservation',
      title: 'Retention',
      body: (
        <p>
          Payment information is kept as long as accounting obligations require; contact details and conversations for the duration of the guidance and any follow-up questions. You can ask for deletion at any time where the law allows.
        </p>
      )
    },
    {
      id: 'droits',
      title: 'Your rights',
      body: (
        <p>
          You can request access to, correction or deletion of your data by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You can clear the data stored by your browser at any time in its settings.
        </p>
      )
    }
  ]
};

export const PrivacyPage: React.FC = () => {
  const { lang } = useLanguage();
  return <LegalLayout doc={lang === 'en' ? en : fr} />;
};

export default PrivacyPage;
