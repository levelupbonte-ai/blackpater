import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LegalLayout, type LegalDoc } from './LegalLayout';
import { CONTACT_EMAIL, PHONE_DISPLAY } from '../../lib/contact';

const fr: LegalDoc = {
  title: 'Politique de remboursement',
  lead: 'Quand et comment obtenir le remboursement de l’accompagnement « Accompagnement & Démarches Voyage ».',
  updated: 'Dernière mise à jour : 18 octobre 2026',
  sections: [
    {
      id: 'avant',
      title: 'Avant le début de l’accompagnement',
      body: (
        <p>
          Si l’accompagnement n’a pas commencé (aucun échange n’a eu lieu après votre paiement), vous pouvez demander un <strong>remboursement intégral dans les 14 jours</strong>{' '}
          suivant le paiement, sans avoir à vous justifier.
        </p>
      )
    },
    {
      id: 'apres',
      title: 'Après le début de l’accompagnement',
      body: (
        <p>
          Une fois l’accompagnement commencé, le service est considéré comme fourni. Si vous rencontrez un problème, écrivez-nous : chaque demande est examinée avec
          attention.
        </p>
      )
    },
    {
      id: 'double',
      title: 'Paiement en double ou erreur',
      body: (
        <p>
          En cas de double débit ou d’erreur de montant, le paiement en trop est <strong>remboursé intégralement</strong>.
        </p>
      )
    },
    {
      id: 'comment',
      title: 'Comment demander un remboursement',
      body: (
        <>
          <p>
            Écrivez à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ou contactez le {PHONE_DISPLAY} en indiquant :
          </p>
          <ul>
            <li>votre référence de commande (affichée sur la page de confirmation) ou l’e-mail utilisé lors du paiement ;</li>
            <li>la date du paiement.</li>
          </ul>
          <p>
            Le remboursement est effectué via Stripe, sur le moyen de paiement utilisé. Selon votre banque, il apparaît généralement sur votre relevé sous 5 à 10 jours
            ouvrés.
          </p>
        </>
      )
    }
  ]
};

const en: LegalDoc = {
  title: 'Refund policy',
  lead: 'When and how to get a refund for the “Travel & Visa Guidance” offer.',
  updated: 'Last updated: October 18, 2026',
  sections: [
    {
      id: 'avant',
      title: 'Before the guidance starts',
      body: (
        <p>
          If the guidance has not started (no exchange has taken place since your payment), you can request a <strong>full refund within 14 days</strong> of payment, with no
          reason needed.
        </p>
      )
    },
    {
      id: 'apres',
      title: 'After the guidance has started',
      body: <p>Once the guidance has started, the service is considered delivered. If something went wrong, write to us: every request is reviewed carefully.</p>
    },
    {
      id: 'double',
      title: 'Duplicate payment or error',
      body: (
        <p>
          If you see a duplicate charge or a wrong amount, the extra payment is <strong>refunded in full</strong>.
        </p>
      )
    },
    {
      id: 'comment',
      title: 'How to request a refund',
      body: (
        <>
          <p>
            Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or call {PHONE_DISPLAY} with:
          </p>
          <ul>
            <li>your order reference (shown on the confirmation page) or the email used at checkout;</li>
            <li>the payment date.</li>
          </ul>
          <p>Refunds are issued through Stripe to the original payment method. Depending on your bank, they usually appear on your statement within 5 to 10 business days.</p>
        </>
      )
    }
  ]
};

export const RefundPage: React.FC = () => {
  const { lang } = useLanguage();
  return <LegalLayout doc={lang === 'en' ? en : fr} />;
};

export default RefundPage;
