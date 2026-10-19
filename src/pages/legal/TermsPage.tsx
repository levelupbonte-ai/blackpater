import React from 'react';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { LegalLayout, type LegalDoc } from './LegalLayout';
import { CONTACT_EMAIL, WHATSAPP_DISPLAY } from '../../lib/contact';

const Contact: React.FC = () => (
  <>
    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> · WhatsApp {WHATSAPP_DISPLAY}
  </>
);

const fr: LegalDoc = {
  title: 'Conditions de vente',
  lead: 'Les conditions applicables à l’achat de l’accompagnement « Accompagnement & Démarches Voyage » sur blackpater.com.',
  updated: 'Dernière mise à jour : 18 octobre 2026',
  sections: [
    {
      id: 'vendeur',
      title: '1. Qui vend',
      body: (
        <p>
          Le service est proposé par <strong>Jean-Pierre Lofumbwa</strong>, connu sous le nom « Black Pater », basé à Salt Lake City (Utah, États-Unis). Contact : <Contact />.
        </p>
      )
    },
    {
      id: 'service',
      title: '2. Le service',
      body: (
        <>
          <p>« Accompagnement & Démarches Voyage » est un service d’information et d’orientation. Il comprend :</p>
          <ul>
            <li>des informations vérifiées sur les procédures de voyage et de visa (par exemple F-1, B1/B2) ;</li>
            <li>une veille sur les opportunités de bourses et les programmes internationaux ;</li>
            <li>le guide des erreurs éliminatoires à éviter dans les dossiers ;</li>
            <li>des conseils pratiques sur la destination (coût de la vie, logement, adaptation) ;</li>
            <li>une orientation sur les admissions universitaires et les équivalences de diplômes ;</li>
            <li>un échange direct sur WhatsApp avec l’équipe de Jean-Pierre Lofumbwa.</li>
          </ul>
          <p>
            Black Pater n’est ni une agence de voyage, ni un cabinet d’avocats, ni un représentant d’une ambassade, d’une université ou d’un organisme de bourses.
            Les informations sont données de bonne foi ; <strong>aucun résultat n’est garanti</strong> : les décisions de visa, d’admission ou de bourse appartiennent
            exclusivement aux autorités et aux établissements concernés.
          </p>
        </>
      )
    },
    {
      id: 'prix',
      title: '3. Prix',
      body: (
        <p>
          Le prix est de <strong>1 $ US (un dollar américain)</strong>, payé une seule fois. Il ne s’agit pas d’un abonnement : aucun prélèvement récurrent ni
          renouvellement automatique. Si votre moyen de paiement n’est pas libellé en dollars, votre banque peut appliquer des frais de conversion qui ne dépendent pas
          de Black Pater. Le prix affiché au moment de l’achat est celui qui s’applique.
        </p>
      )
    },
    {
      id: 'paiement',
      title: '4. Paiement',
      body: (
        <p>
          Le paiement s’effectue en ligne via <strong>Stripe</strong>, prestataire de paiement (carte bancaire, Apple Pay ou Google Pay). Les données bancaires sont
          traitées par Stripe et ne sont pas conservées par Black Pater. La commande est confirmée dès que le paiement est validé ; un reçu est envoyé par e-mail.
        </p>
      )
    },
    {
      id: 'demarrage',
      title: '5. Démarrage de l’accompagnement',
      body: (
        <p>
          Après confirmation, vous démarrez l’accompagnement en écrivant sur WhatsApp au {WHATSAPP_DISPLAY} avec votre référence de commande (le message est pré-rempli
          sur la page de confirmation). Vous pouvez aussi écrire à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      )
    },
    {
      id: 'remboursement',
      title: '6. Annulation et remboursement',
      body: (
        <p>
          Les conditions d’annulation et de remboursement sont détaillées dans la <Link to='/legal/remboursement'>politique de remboursement</Link>.
        </p>
      )
    },
    {
      id: 'donnees',
      title: '7. Données personnelles',
      body: (
        <p>
          Les données nécessaires à la commande sont traitées comme décrit dans la <Link to='/legal/confidentialite'>politique de confidentialité</Link>.
        </p>
      )
    },
    {
      id: 'contact',
      title: '8. Questions et réclamations',
      body: (
        <p>
          Pour toute question ou réclamation, écrivez à <Contact /> en indiquant votre référence de commande. Ces conditions peuvent évoluer ; la version applicable est
          celle en vigueur au moment de votre achat.
        </p>
      )
    }
  ]
};

const en: LegalDoc = {
  title: 'Terms of sale',
  lead: 'The terms that apply when you buy the “Travel & Visa Guidance” offer on blackpater.com.',
  updated: 'Last updated: October 18, 2026',
  sections: [
    {
      id: 'vendeur',
      title: '1. Who sells',
      body: (
        <p>
          The service is provided by <strong>Jean-Pierre Lofumbwa</strong>, known as “Black Pater”, based in Salt Lake City (Utah, USA). Contact: <Contact />.
        </p>
      )
    },
    {
      id: 'service',
      title: '2. The service',
      body: (
        <>
          <p>“Travel & Visa Guidance” is an information and orientation service. It includes:</p>
          <ul>
            <li>verified information on travel and visa procedures (for example F-1, B1/B2);</li>
            <li>a watch on scholarship opportunities and international programs;</li>
            <li>the guide to disqualifying mistakes to avoid in applications;</li>
            <li>practical advice about the destination (cost of living, housing, adaptation);</li>
            <li>orientation on university admissions and diploma equivalences;</li>
            <li>direct contact on WhatsApp with Jean-Pierre Lofumbwa’s team.</li>
          </ul>
          <p>
            Black Pater is not a travel agency, a law firm, or a representative of any embassy, university or scholarship body. Information is given in good faith;{' '}
            <strong>no outcome is guaranteed</strong>: visa, admission and scholarship decisions rest solely with the authorities and institutions concerned.
          </p>
        </>
      )
    },
    {
      id: 'prix',
      title: '3. Price',
      body: (
        <p>
          The price is <strong>US$1 (one US dollar)</strong>, paid once. This is not a subscription: there is no recurring charge and no automatic renewal. If your payment
          method is not in US dollars, your bank may charge a conversion fee that Black Pater does not control. The price shown at the time of purchase applies.
        </p>
      )
    },
    {
      id: 'paiement',
      title: '4. Payment',
      body: (
        <p>
          Payment is made online through <strong>Stripe</strong>, our payment processor (card, Apple Pay or Google Pay). Card data is processed by Stripe and is not
          stored by Black Pater. The order is confirmed as soon as the payment is approved; a receipt is emailed to you.
        </p>
      )
    },
    {
      id: 'demarrage',
      title: '5. Starting the guidance',
      body: (
        <p>
          After confirmation, you start the guidance by messaging {WHATSAPP_DISPLAY} on WhatsApp with your order reference (the message is pre-filled on the confirmation
          page). You can also email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      )
    },
    {
      id: 'remboursement',
      title: '6. Cancellation and refunds',
      body: (
        <p>
          Cancellation and refund conditions are set out in the <Link to='/legal/remboursement'>refund policy</Link>.
        </p>
      )
    },
    {
      id: 'donnees',
      title: '7. Personal data',
      body: (
        <p>
          Data needed for the order is processed as described in the <Link to='/legal/confidentialite'>privacy policy</Link>.
        </p>
      )
    },
    {
      id: 'contact',
      title: '8. Questions and complaints',
      body: (
        <p>
          For any question or complaint, write to <Contact /> with your order reference. These terms may change; the version in force at the time of your purchase applies.
        </p>
      )
    }
  ]
};

export const TermsPage: React.FC = () => {
  const { lang } = useLanguage();
  return <LegalLayout doc={lang === 'en' ? en : fr} />;
};

export default TermsPage;
