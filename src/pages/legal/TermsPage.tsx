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
  title: 'Conditions de vente & d’utilisation',
  lead: 'Les conditions applicables à l’accompagnement « Accompagnement & Orientation Internationale » sur blackpater.com.',
  updated: 'Dernière mise à jour : 19 octobre 2026',
  sections: [
    {
      id: 'vendeur',
      title: '1. Qui sommes-nous (Agence d’accompagnement, et non agence de voyage)',
      body: (
        <>
          <p>
            Le service est proposé par <strong>Jean-Pierre Lofumbwa</strong>, connu sous le nom « BlackPater », basé à Salt Lake City (Utah, États-Unis). Contact : <Contact />.
          </p>
          <p>
            <strong>BlackPater n’est pas une agence de voyage</strong>, ni un cabinet d’avocats, ni une autorité consulaire. Nous sommes une{' '}
            <strong>structure d’accompagnement, d’orientation et de conseil</strong> : notre mission est d’aider chaque personne à{' '}
            <strong>comprendre concrètement le pays où elle souhaite se rendre</strong>, son fonctionnement réel, ses codes culturels, académiques et administratifs, et de lui donner des conseils pratiques étape par étape — en particulier lorsqu’il s’agit d’une <strong>première fois à l’étranger</strong>.
          </p>
        </>
      )
    },
    {
      id: 'service',
      title: '2. Nature de l’accompagnement',
      body: (
        <>
          <p>L’accompagnement personnalisé comprend :</p>
          <ul>
            <li>une évaluation préalable interactive (PaterGuide) adaptée au pays visé et à votre profil ;</li>
            <li>des explications claires pour comprendre comment fonctionnent les démarches officielles (études, séjour, travail, installation) ;</li>
            <li>des conseils pratiques pour préparer un premier départ (coût réel de la vie, logement, adaptation culturelle, 30 premiers jours) ;</li>
            <li>le guide des erreurs éliminatoires et des arnaques à éviter ;</li>
            <li>une orientation sur les études, les bourses et le système académique du pays d’accueil ;</li>
            <li>un suivi et un échange direct sur WhatsApp et par e-mail avec l’équipe de Jean-Pierre Lofumbwa.</li>
          </ul>
          <p>
            Nous ne vendons ni billets d’avion, ni forfaits touristiques, ni visas. Les informations et conseils sont fournis de bonne foi ;{' '}
            <strong>aucun résultat n’est garanti</strong> : les décisions de visa, d’admission ou de bourse appartiennent exclusivement aux ambassades, autorités et établissements officiels.
          </p>
        </>
      )
    },
    {
      id: 'informations',
      title: '3. Informations obligatoires demandées avant le paiement',
      body: (
        <p>
          Durant le parcours préalable au paiement (PaterGuide), l’acheteur doit obligatoirement renseigner ses coordonnées complètes (<strong>nom complet, adresse e-mail valide et numéro de téléphone / WhatsApp avec indicatif</strong>) ainsi que les informations relatives à son projet. Même si le prestataire de paiement Stripe demande également une adresse e-mail pour l’envoi du reçu bancaire, ces informations nous sont indispensables pour constituer votre dossier d’accompagnement et vous contacter directement.
        </p>
      )
    },
    {
      id: 'prix',
      title: '4. Prix',
      body: (
        <p>
          Le prix est de <strong>49 $ US (quarante-neuf dollars américains)</strong>, payé une seule fois. Il ne s’agit pas d’un abonnement : aucun prélèvement récurrent ni renouvellement automatique. Si votre moyen de paiement n’est pas libellé en dollars américains, votre banque peut appliquer des frais de conversion indépendants de BlackPater. Le prix affiché au moment de l’achat est celui qui s’applique.
        </p>
      )
    },
    {
      id: 'paiement',
      title: '5. Paiement sécurisé',
      body: (
        <p>
          Le paiement s’effectue en ligne à la fin du parcours d’évaluation via <strong>Stripe</strong> (carte bancaire, Apple Pay ou Google Pay). Les données bancaires sont traitées exclusivement par Stripe et ne sont jamais conservées par BlackPater. La commande est confirmée dès que le paiement est validé ; un reçu est envoyé par e-mail.
        </p>
      )
    },
    {
      id: 'demarrage',
      title: '6. Démarrage de l’accompagnement',
      body: (
        <p>
          Après confirmation du paiement, vous démarrez immédiatement votre accompagnement en écrivant sur WhatsApp au {WHATSAPP_DISPLAY} avec votre référence de commande et le récapitulatif de votre dossier (le message est pré-rempli sur la page de confirmation), ou par e-mail à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      )
    },
    {
      id: 'remboursement',
      title: '7. Annulation et remboursement',
      body: (
        <p>
          Les conditions d’annulation et de remboursement sont détaillées dans la <Link to='/legal/remboursement'>politique de remboursement</Link>.
        </p>
      )
    },
    {
      id: 'donnees',
      title: '8. Données personnelles',
      body: (
        <p>
          Les coordonnées et informations de projet transmises lors de votre commande sont traitées comme décrit dans la <Link to='/legal/confidentialite'>politique de confidentialité</Link>.
        </p>
      )
    },
    {
      id: 'contact',
      title: '9. Questions et réclamations',
      body: (
        <p>
          Pour toute question ou réclamation, écrivez à <Contact /> en indiquant votre référence de commande. Ces conditions peuvent évoluer ; la version applicable est celle en vigueur au moment de votre achat.
        </p>
      )
    }
  ]
};

const en: LegalDoc = {
  title: 'Terms of sale & use',
  lead: 'The terms that apply to the “International Guidance & Country Orientation” service on blackpater.com.',
  updated: 'Last updated: October 19, 2026',
  sections: [
    {
      id: 'vendeur',
      title: '1. Who we are (Guidance agency, not a travel agency)',
      body: (
        <>
          <p>
            The service is provided by <strong>Jean-Pierre Lofumbwa</strong>, known as “BlackPater”, based in Salt Lake City (Utah, USA). Contact: <Contact />.
          </p>
          <p>
            <strong>BlackPater is not a travel agency</strong>, a law firm, or a consular authority. We are a{' '}
            <strong>guidance, orientation and advisory agency</strong>: our mission is to help people{' '}
            <strong>truly understand the country they want to go to</strong>, how it works in practice, its cultural, academic and administrative rules, and to provide step-by-step advice — especially when it is their <strong>first time going abroad</strong>.
          </p>
        </>
      )
    },
    {
      id: 'service',
      title: '2. Nature of the guidance service',
      body: (
        <>
          <p>The personalised guidance includes:</p>
          <ul>
            <li>an interactive pre-payment assessment (PaterGuide) tailored to your target country and profile;</li>
            <li>clear explanations to understand how official procedures work (study, stay, work, relocation);</li>
            <li>practical advice for a first move abroad (real cost of living, housing, cultural adaptation, first 30 days);</li>
            <li>the guide to disqualifying mistakes and scams to avoid;</li>
            <li>orientation on studies, scholarships and the host country’s academic system;</li>
            <li>direct follow-up and exchange on WhatsApp and email with Jean-Pierre Lofumbwa’s team.</li>
          </ul>
          <p>
            We do not sell flight tickets, tour packages or visas. Information and advice are given in good faith;{' '}
            <strong>no outcome is guaranteed</strong>: visa, admission and scholarship decisions rest solely with the embassies, authorities and institutions concerned.
          </p>
        </>
      )
    },
    {
      id: 'informations',
      title: '3. Required information before payment',
      body: (
        <p>
          During the pre-payment assessment (PaterGuide), the buyer must provide complete contact details (<strong>full name, valid email address, and phone / WhatsApp number with country code</strong>) along with project details. Even though our payment processor Stripe also asks for an email address to issue the payment receipt, this information is required by our team to prepare your guidance file and contact you directly.
        </p>
      )
    },
    {
      id: 'prix',
      title: '4. Price',
      body: (
        <p>
          The price is <strong>US$49 (forty-nine US dollars)</strong>, paid once. This is not a subscription: there is no recurring charge and no automatic renewal. If your payment method is not in US dollars, your bank may apply a conversion fee outside BlackPater’s control. The price displayed at the time of purchase applies.
        </p>
      )
    },
    {
      id: 'paiement',
      title: '5. Secure payment',
      body: (
        <p>
          Payment is made online at the end of the assessment through <strong>Stripe</strong> (card, Apple Pay or Google Pay). Card details are processed exclusively by Stripe and are never stored by BlackPater. The order is confirmed as soon as payment is approved; a receipt is emailed to you.
        </p>
      )
    },
    {
      id: 'demarrage',
      title: '6. Starting the guidance',
      body: (
        <p>
          After payment confirmation, you start your guidance right away by messaging {WHATSAPP_DISPLAY} on WhatsApp with your order reference and assessment summary (pre-filled on the confirmation page), or by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      )
    },
    {
      id: 'remboursement',
      title: '7. Cancellation and refunds',
      body: (
        <p>
          Cancellation and refund conditions are set out in the <Link to='/legal/remboursement'>refund policy</Link>.
        </p>
      )
    },
    {
      id: 'donnees',
      title: '8. Personal data',
      body: (
        <p>
          Contact and project details provided during your order are processed as described in the <Link to='/legal/confidentialite'>privacy policy</Link>.
        </p>
      )
    },
    {
      id: 'contact',
      title: '9. Questions and complaints',
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
