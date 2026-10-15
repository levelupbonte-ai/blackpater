import { ArticleItem, FaqItem, SocialItem, TestimonialItem } from '../types';

export const ARTICLES_DATA: ArticleItem[] = [
  {
    id: 'voyageutah',
    badge: 'Presse Américaine · Utah',
    badgeType: 'usa',
    source: 'VoyageUtah Magazine · Salt Lake City',
    date: 'August 2024',
    title: 'Rising Stars: Meet Black_Pater Lofumbwa of Salt Lake City',
    titleEn: 'Rising Stars: Meet Black_Pater Lofumbwa of Salt Lake City',
    excerpt:
      'Grand reportage exclusif de la série phare de VoyageUtah mettant en avant les figures inspirantes de l’Utah. Récit du parcours de Jean-Pierre Lofumbwa : lauréat #1 de la RDC avec 85% en Latin-Philosophie (2015), arrivée comme étudiant international à Salt Lake City, résilience face au choc culturel et accomplissement comme éducateur et ambassadeur culturel.',
    excerptEn:
      'In-depth flagship feature from VoyageUtah spotlighting notable figures in Utah. Chronicles Jean-Pierre Lofumbwa’s path from achieving 85% in Latin-Philosophy as the #1 student in the Democratic Republic of Congo (2015) to arriving in Salt Lake City as an international student, overcoming culture shock, and thriving as an educator and cultural ambassador.',
    url: 'https://voyageutah.com/interview/rising-stars-meet-black_pater-lofumbwa-of-salt-lake-city/',
    buttonText: 'Lire l’Article sur VoyageUtah ↗',
    buttonTextEn: 'Read Feature on VoyageUtah ↗',
  },
  {
    id: 'columbia-college',
    badge: 'Distinction Universitaire · USA',
    badgeType: 'academic',
    source: 'Columbia College Connected (ccis.edu)',
    date: 'January 2024',
    title: 'Columbia College Fall Semester 2023 Dean’s List Announced — Jean-Pierre Lofumbwa',
    titleEn: 'Columbia College Fall Semester 2023 Dean’s List Announced — Jean-Pierre Lofumbwa',
    excerpt:
      'Reconnaissance institutionnelle d’excellence académique : Jean-Pierre Lofumbwa est officiellement nommé au tableau d’honneur (Dean’s List) du Columbia College pour le semestre d’automne 2023, sanctionnant une moyenne universitaire exemplaire (GPA supérieur à 3.5).',
    excerptEn:
      'Institutional recognition of academic excellence: Jean-Pierre Lofumbwa is officially named to the Columbia College Dean’s List for Fall Semester 2023, honoring an exemplary GPA (> 3.5).',
    url: 'https://connected.ccis.edu/2024/01/columbia-college-fall-semester-2023-deans-list-announced/',
    buttonText: 'Voir l’Annonce sur ccis.edu ↗',
    buttonTextEn: 'View Official Honor on ccis.edu ↗',
  },
  {
    id: 'substack-beni-muwawa',
    badge: 'Chronique Éditoriale · Diaspora',
    badgeType: 'editorial',
    source: 'Tribune d’Analyse · Par Béni Muwawa',
    date: 'Substack Culture',
    title: 'Black Pater : Le soldat digital du Congo',
    titleEn: 'Black Pater: The Digital Soldier of Congo',
    excerpt:
      'Tribune d’analyse consacrée à Jean-Pierre Lofumbwa, salué comme un « soldat digital » au service de l’image, de l’histoire et de la résilience du Congo. L’article met en lumière sa capacité unique à allier pédagogie rigoureuse, fierté culturelle et modernité pour unir la jeunesse congolaise et la diaspora mondiale.',
    excerptEn:
      'In-depth cultural essay honoring Jean-Pierre Lofumbwa as a “digital soldier” championing Congo’s legacy, cultural resilience, and truth. Highlights his ability to blend pedagogical rigor, cultural pride, and modern digital reach.',
    url: 'https://benimuwawa.substack.com/p/black-pater-le-soldat-digital-du',
    buttonText: 'Lire la Chronique sur Substack ↗',
    buttonTextEn: 'Read Essay on Substack ↗',
  },
  {
    id: 'komelate-bio',
    badge: 'Dossier Biographique · Komelate',
    badgeType: 'dossier',
    source: 'Komelate Blog · Portrait Spécial',
    date: 'Édition Spéciale',
    title: 'Black Pater : Biographie, Parcours et Impact Inspirant',
    titleEn: 'Black Pater: Biography, Trajectory and Inspiring Impact',
    excerpt:
      'Grand portrait biographique retraçant la trajectoire de Jean-Pierre Lofumbwa (« Le Prof ») : ses racines en République Démocratique du Congo, sa philosophie de vie, son dévouement envers l’apprentissage continu et l’impact de ses messages auprès de centaines de milliers de jeunes.',
    excerptEn:
      'Comprehensive biographical portrait tracing Jean-Pierre Lofumbwa’s life story: his roots in DRC, core philosophy, lifelong learning dedication, and inspiring impact on youth.',
    url: 'https://komelate-blog.netlify.app/black-pater-biographie/',
    buttonText: 'Lire le Portrait sur Komelate Blog ↗',
    buttonTextEn: 'Read Biography on Komelate Blog ↗',
  },
  {
    id: 'komelate-rdc-utah',
    badge: 'Récit de Parcours · Komelate',
    badgeType: 'dossier',
    source: 'Komelate Blog · Diaspora & Réussite',
    date: 'Série Trajectoires',
    title: 'De la RDC aux États-Unis (Utah) : Le Voyage Inspirant de Black Pater',
    titleEn: 'From DRC to the United States (Utah): The Inspiring Journey',
    excerpt:
      'Dossier d’investigation sur le parcours migratoire et l’adaptation aux États-Unis. Comment Jean-Pierre Lofumbwa a surmonté le choc culturel à Salt Lake City pour s’imposer comme un leader communautaire respecté et un guide de voyage pour des milliers de demandeurs de visas et bourses.',
    excerptEn:
      'Investigative piece on cultural adaptation in Utah. How Jean-Pierre Lofumbwa navigated cultural differences in Salt Lake City to emerge as a respected mentor for visa seekers and students.',
    url: 'https://komelate-blog.netlify.app/black-pater-rdc-utah-parcours/',
    buttonText: 'Lire le Récit sur Komelate Blog ↗',
    buttonTextEn: 'Read Journey on Komelate Blog ↗',
  },
  {
    id: 'komelate-danse',
    badge: 'Culture & Danse · Komelate',
    badgeType: 'culture',
    source: 'Komelate Blog · Patrimoine & Rythmes',
    date: 'Chronique Musique',
    title: 'Black Pater, Ambassadeur de la Culture Congolaise et Danse Banafro',
    titleEn: 'Black Pater, Ambassador of Congolese Culture & Banafro Dance',
    excerpt:
      'Analyse de la dimension artistique et scénique de Black Pater : la promotion des pas de danses urbaines congolaises, la culture Banafro et l’énergie communicative avec laquelle il fait rayonner la rumba, le soukous et les musiques africaines à travers le monde.',
    excerptEn:
      'Artistic study of Black Pater’s cultural work: promoting Congolese street dances, Banafro movement, and infectious rumba rhythms across the international scene.',
    url: 'https://komelate-blog.netlify.app/black-pater-culture-danse-banafro/',
    buttonText: 'Lire l’Article Danse & Culture ↗',
    buttonTextEn: 'Read Dance Feature ↗',
  },
  {
    id: 'komelate-langues',
    badge: 'Pédagogie & Linguistique · Komelate',
    badgeType: 'academic',
    source: 'Komelate Blog · Focus Éducation',
    date: 'Analyse Pédagogique',
    title: '« Le Prof » Black Pater : L’Éducation, l’Apprentissage des Langues et l’Excellence',
    titleEn: '“Le Prof” Black Pater: Education, Multilingualism and Academic Excellence',
    excerpt:
      'Décryptage de la méthode Molakisi : comment Jean-Pierre Lofumbwa pratique et enseigne 5 langues (Français, Anglais, Lingala, Swahili, Tshiluba), transmet des techniques de mémorisation efficaces et vulgarise les démarches académiques et administratives.',
    excerptEn:
      'Deconstructing the Molakisi method: how Jean-Pierre Lofumbwa uses 5 languages to make complex academic preparation and memory mastery accessible to thousands.',
    url: 'https://komelate-blog.netlify.app/le-prof-black-pater-etudes-langues/',
    buttonText: 'Lire l’Analyse Pédagogique ↗',
    buttonTextEn: 'Read Education Analysis ↗',
  },
  {
    id: 'komelate-diaspora',
    badge: 'Influence Digitale · Komelate',
    badgeType: 'editorial',
    source: 'Komelate Blog · Stratégie Digitale',
    date: 'Médias & Diaspora',
    title: 'Black Pater : Créateur de Contenu Multilingue et Figure de la Diaspora',
    titleEn: 'Black Pater: Multilingual Content Creator and Diaspora Figure',
    excerpt:
      'Étude de l’impact numérique de Black Pater : bâtir une communauté engagée sans céder aux facilités algorithmiques, créer des passerelles entre le continent africain et les États-Unis, et incarner une voix digne et crédible pour la jeunesse de la diaspora.',
    excerptEn:
      'Study of Black Pater’s digital leadership: cultivating organic engagement, building transatlantic bridges, and embodying an authentic role model for African youth.',
    url: 'https://komelate-blog.netlify.app/createur-contenu-multilingue-diaspora/',
    buttonText: 'Lire la Stratégie Digitale ↗',
    buttonTextEn: 'Read Digital Analysis ↗',
  },
  {
    id: 'collegesidekick',
    badge: 'Recherche & Études · CollegeSidekick',
    badgeType: 'academic',
    source: 'CollegeSidekick · Archives Académiques',
    date: 'Ressources d’Études',
    title: 'Jean-Pierre Lofumbwa : Documents d’Études & Travaux Académiques',
    titleEn: 'Jean-Pierre Lofumbwa: University Study Documents & Coursework',
    excerpt:
      'Dépôt universitaire des travaux de cours, synthèses et devoirs académiques rédigés par Jean-Pierre Lofumbwa dans le cadre de son cursus d’enseignement supérieur aux États-Unis, attestant de sa rigueur intellectuelle.',
    excerptEn:
      'Official higher education repository of coursework notes, academic papers, and study guides authored by Jean-Pierre Lofumbwa during his university studies in the United States.',
    url: 'https://www.collegesidekick.com/study-docs/7290959',
    buttonText: 'Consulter sur CollegeSidekick ↗',
    buttonTextEn: 'View on CollegeSidekick ↗',
  },
];

export const FAQ_DATA: FaqItem[] = [
  {
    question: 'Qui est Black Pater (blackpater / Jean-Pierre Lofumbwa) ?',
    questionEn: 'Who is Black Pater (blackpater / Jean-Pierre Lofumbwa)?',
    answer:
      'Black Pater (également orthographié blackpater, BlackPater ou black_pater) est le pseudonyme officiel de Jean-Pierre Lofumbwa (« Le Prof »). Il est éducateur, étudiant d’honneur inscrit sur la Dean’s List de Columbia College (Fall 2023), créateur de contenu multilingue et ambassadeur culturel congolais résidant à Salt Lake City (Utah, USA). Lauréat #1 de la RDC à l’Examen d’État 2015 avec 85% en Latin-Philosophie.',
    answerEn:
      'Black Pater (also spelled blackpater, BlackPater, or black_pater) is the official pseudonym of Jean-Pierre Lofumbwa (“Le Prof”). He is a Congolese educator, Columbia College Dean’s List honoree (Fall 2023), multilingual creator, and cultural ambassador based in Salt Lake City (Utah, USA). He was ranked #1 national student in the DRC at the 2015 State Exam (85% Latin-Philosophy).',
  },
  {
    question: 'Black Pater a-t-il un lien avec Blackwater ou Black Panther ?',
    questionEn: 'Is Black Pater affiliated with Blackwater or Black Panther?',
    answer:
      'Non. En raison d’une proximité phonétique avec des mots fréquents, des moteurs de recherche suggèrent parfois par erreur « blackwater » ou renvoient vers « Black Panther ». Black Pater (blackpater) est une personnalité publique et un éducateur réel (Jean-Pierre Lofumbwa), entièrement distinct de la société militaire Blackwater et du personnage de fiction Black Panther.',
    answerEn:
      'No. Due to algorithmic phonetic suggestions, some search queries confuse the name with “blackwater” or “Black Panther”. Black Pater (blackpater) is an authentic real-life educator and cultural ambassador (Jean-Pierre Lofumbwa), completely unaffiliated with the military company Blackwater or the fictional hero Black Panther.',
  },
  {
    question: 'Quelles sont les distinctions académiques de Black Pater ?',
    questionEn: 'What are Black Pater’s verified academic credentials?',
    answer:
      'Jean-Pierre Lofumbwa s’est classé 1er étudiant de toute la République Démocratique du Congo en 2015 avec 85% à l’Examen d’État (section Latin-Philosophie). Aux États-Unis, il a été distingué sur la prestigieuse Dean’s List du Columbia College pour le semestre d’automne 2023 (GPA supérieur à 3.5). Ses travaux sont archivés sur CollegeSidekick et documentés dans VoyageUtah Magazine.',
    answerEn:
      'Jean-Pierre Lofumbwa graduated as the #1 student in the Democratic Republic of Congo in 2015 with 85% on the national State Exam (Latin-Philosophy). In the US, he was named to the Columbia College Dean’s List for Fall 2023 (GPA > 3.5). His academic coursework is cataloged on CollegeSidekick and covered in VoyageUtah.',
  },
  {
    question: 'En quoi consiste l’offre d’accompagnement voyage à 1$ ?',
    questionEn: 'What is included in the $1 Travel & Visa Mentorship program?',
    answer:
      'C’est un accès d’orientation directe : informations vérifiées sur les visas (F-1, B1/B2, bourses, admissions universitaires américaines), guide des erreurs éliminatoires à éviter, conseils réalistes sur le coût de la vie et le logement en Utah/USA, ainsi qu’un canal de contact WhatsApp prioritaire avec l’équipe de Jean-Pierre Lofumbwa.',
    answerEn:
      'It provides comprehensive strategic orientation: verified visa and scholarship procedures (F-1, B1/B2, university admissions), checklist of disqualifying mistakes to avoid, realistic US cost-of-living advice, and priority direct WhatsApp communication with Jean-Pierre Lofumbwa’s mentorship team.',
  },
  {
    question: 'Comment réserver Black Pater pour une conférence ou une intervention ?',
    questionEn: 'How can I book Black Pater for keynotes, workshops, or media interviews?',
    answer:
      'Vous pouvez adresser directement votre demande par courriel à lofumbwapater@gmail.com ou via WhatsApp au +1 720 549 0926. Jean-Pierre Lofumbwa intervient sur les thématiques de l’éducation, de l’apprentissage des langues, du leadership de la diaspora et de la culture congolaise.',
    answerEn:
      'You can contact Jean-Pierre directly via email at lofumbwapater@gmail.com or via WhatsApp at +1 720 549 0926. He is available for keynote speeches, university lectures, cultural festivals, and media features.',
  },
];

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    text: '“Fier d’être congolais 🇨🇩. Merci à VoyageUtah pour la reconnaissance du travail de Jean-Pierre. C’est le Congo qui gagne !”',
    author: 'Herve Atwabi Ngoy',
    location: 'RDC & Diaspora Mondiale',
    avatar: 'HN',
  },
  {
    text: '“J’admire le Prof Jean-Pierre... aider des jeunes qu’il ne connaît même pas personnellement avec tant de générosité. Que Dieu bénisse son engagement.”',
    author: 'Lina Mbuyi',
    location: 'Salt Lake City, Utah',
    avatar: 'LM',
  },
  {
    text: '“Grâce à ses conseils précis sur les bourses et les démarches d’admission, mon dossier pour les États-Unis a été accepté sans intermédiaire douteux.”',
    author: 'Christian Kalala',
    location: 'Kinshasa / New York',
    avatar: 'CK',
  },
];

export const SOCIALS_DATA: SocialItem[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@black_pater',
    followers: '500K+ abonnés',
    color: '#fe2c55',
    url: 'https://www.tiktok.com/@black_pater',
    badge: 'Vérifié · Contenu Éducatif',
    gridSpan: 'scard--a',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@black_pater',
    followers: '150K+ communauté',
    color: '#d6249f',
    url: 'https://www.instagram.com/black_pater/',
    badge: 'Officiel · Storytelling',
    gridSpan: 'scard--b',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@black_pater',
    followers: '100K+ abonnés',
    color: '#ff0000',
    url: 'https://www.youtube.com/@black_pater',
    badge: 'Vidéos & Conférences',
    gridSpan: 'scard--c',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    handle: '@black_pater',
    followers: 'Diaspora & Diplomatie',
    color: '#ffffff',
    url: 'https://twitter.com/black_pater',
    badge: 'Analyses & Citations',
    gridSpan: 'scard--d',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp VIP',
    handle: '+1 720 549 0926',
    followers: 'Ligne Directe Officielle',
    color: '#25d366',
    url: 'https://wa.me/17205490926',
    badge: 'Accompagnement & Contact',
    gridSpan: 'scard--e',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'BlackPaterOfficiel',
    followers: 'Communauté Mondiale',
    color: '#1877f2',
    url: 'https://www.facebook.com/BlackPaterOfficiel',
    badge: 'Actualités & Directs',
    gridSpan: 'scard--f',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: 'Jean-Pierre Lofumbwa',
    followers: 'Réseau Académique & Pro',
    color: '#0077b5',
    url: 'https://www.linkedin.com/in/jean-pierre-lofumbwa-3a5585141/',
    badge: 'Parcours Universitaire',
    gridSpan: 'scard--g',
  },
];
