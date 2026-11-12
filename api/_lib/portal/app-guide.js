/**
 * How the Black Pater member space works, for the AI assistant: it answers
 * "where do I find…", "how do I renew…" from this text. Keep it in step with
 * the member space (src/pages/portal).
 */

const FR = `Espace membre Black Pater (site blackpater.com/espace-client, aussi installable comme application).
Onglets :
- Accueil : l'état de l'adhésion (jours restants), des raccourcis vers Infos, Messages, l'assistant et Mon dossier.
- Infos : actualités, documents à télécharger, listes à cocher et programmes de voyage publiés par Black Pater. Certaines infos sont réservées à un forfait supérieur : leur titre est visible avec un cadenas.
- Messages : écrire à Black Pater (Jean-Pierre Lofumbwa). Sa réponse arrive dans l'espace, avec une notification ou un e-mail.
- Assistant : l'assistant IA (vous). Le bouton « Demander à Black Pater » sous une réponse lui transmet la question ; sa réponse revient marquée « Réponse validée par Black Pater ». On peut joindre des photos de documents (nombre limité par jour selon la formule) : elles restent sur le téléphone et ne sont pas enregistrées.
- Mon dossier : les réponses du questionnaire PaterGuide remplies avant le paiement, un champ « Mon projet en quelques mots » à compléter, et un bouton pour télécharger le dossier en PDF.
- Mon compte : la formule du mois, les paiements et reçus, les préférences (langue, apparence claire ou sombre, notifications, installer l'application), la sécurité (mot de passe, changer d'e-mail, déconnexion) et la suppression du compte.
Adhésion : elle se paie mois par mois, sans prélèvement automatique ; chaque paiement donne 30 jours. Rappels avant la fin (7 jours, 3 jours, 1 jour et le jour même). Pour continuer : Mon compte → « Renouveler ». « Annuler l'abonnement » arrête seulement les rappels ; l'accès reste jusqu'à la date payée. Quand l'adhésion est terminée, les infos sont masquées et l'écriture bloquée jusqu'au renouvellement ; l'historique reste.
Forfaits : un forfait remplace la formule de base pour son mois (un seul paiement) et donne accès à plus d'infos ; changer en cours de mois démarre le forfait le jour même et reporte les jours restants à la fin.
Application : sur Android, bouton « Installer l'application » dans Mon compte ou à l'accueil. Sur iPhone : dans Safari, bouton Partager puis « Sur l'écran d'accueil », puis ouvrir l'application et activer les notifications. Une fois installée, l'application s'ouvre directement sur l'espace membre.
Connexion : code à 6 chiffres reçu par e-mail, ou mot de passe si le membre en a créé un.`;

const EN = `Black Pater member space (blackpater.com/espace-client, also installable as an app).
Tabs:
- Home: membership status (days left), shortcuts to Info, Messages, the assistant and My dossier.
- Info: news, documents to download, checklists and travel programmes published by Black Pater. Some items need a higher plan: their title shows with a padlock.
- Messages: write to Black Pater (Jean-Pierre Lofumbwa). His answer arrives in the space, with a notification or an email.
- Assistant: the AI assistant (you). The "Ask Black Pater" button under an answer sends him the question; his answer comes back marked "Answer validated by Black Pater". Photos of documents can be attached (a daily number depending on the plan): they stay on the phone and are not stored.
- My dossier: the PaterGuide questionnaire answers given before paying, a "My project in a few words" field, and a button to download the dossier as a PDF.
- My account: this month's plan, payments and receipts, preferences (language, light or dark appearance, notifications, install the app), security (password, change email, sign out) and account deletion.
Membership: paid month by month, no automatic charge; each payment gives 30 days. Reminders before the end (7 days, 3 days, 1 day and on the day). To continue: My account → "Renew". "Cancel subscription" only stops the reminders; access stays until the paid date. When membership has ended, info is hidden and writing is locked until renewal; history stays.
Plans: a plan replaces the base membership for its month (one payment) and opens more info; switching mid-month starts the plan the same day and moves the remaining days to the end.
App: on Android, "Install the app" button in My account or on Home. On iPhone: in Safari, Share then "Add to Home Screen", then open the app and turn on notifications. Once installed, the app opens straight on the member space.
Sign-in: a 6-digit code sent by email, or a password if the member created one.`;

export function appGuide(lang) {
  return lang === 'en' ? EN : FR;
}
