// Publications about Jean-Pierre Lofumbwa (links to the original sources).
export type ArticleCategory = 'usa' | 'academic' | 'editorial' | 'dossier';

export interface Article {
  id: string;
  category: ArticleCategory;
  source: string;
  sourceEn: string;
  date: string;
  dateEn: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  url: string;
  cta: string;
  ctaEn: string;
}

export const ARTICLES: Article[] = [
  {
    id: 'voyageutah',
    category: 'usa',
    source: 'VoyageUtah · Salt Lake City',
    sourceEn: 'VoyageUtah · Salt Lake City',
    date: 'Août 2024',
    dateEn: 'August 2024',
    title: 'Rising Stars: Meet Black_Pater Lofumbwa of Salt Lake City',
    titleEn: 'Rising Stars: Meet Black_Pater Lofumbwa of Salt Lake City',
    excerpt:
      'Portrait dans la série « Rising Stars » de VoyageUtah : de la première place nationale en RDC (85 % en latin-philosophie, 2015) à l’arrivée comme étudiant international à Salt Lake City, le choc culturel surmonté et l’engagement comme éducateur et ambassadeur culturel.',
    excerptEn:
      'Feature in VoyageUtah’s “Rising Stars” series: from first place nationally in the DRC (85% in Latin-Philosophy, 2015) to arriving in Salt Lake City as an international student, overcoming culture shock and becoming an educator and cultural ambassador.',
    url: 'https://voyageutah.com/interview/rising-stars-meet-black_pater-lofumbwa-of-salt-lake-city/',
    cta: 'Lire sur VoyageUtah',
    ctaEn: 'Read on VoyageUtah'
  },
  {
    id: 'columbia-college',
    category: 'academic',
    source: 'Columbia College · ccis.edu',
    sourceEn: 'Columbia College · ccis.edu',
    date: 'Janvier 2024',
    dateEn: 'January 2024',
    title: 'Columbia College Fall Semester 2023 Dean’s List Announced — Jean-Pierre Lofumbwa',
    titleEn: 'Columbia College Fall Semester 2023 Dean’s List Announced — Jean-Pierre Lofumbwa',
    excerpt:
      'Annonce officielle du tableau d’honneur (Dean’s List) de Columbia College pour le semestre d’automne 2023, sur lequel figure Jean-Pierre Lofumbwa (moyenne supérieure à 3.5).',
    excerptEn:
      'Official announcement of Columbia College’s Fall 2023 Dean’s List, which includes Jean-Pierre Lofumbwa (GPA above 3.5).',
    url: 'https://connected.ccis.edu/2024/01/columbia-college-fall-semester-2023-deans-list-announced/',
    cta: 'Voir l’annonce',
    ctaEn: 'View the announcement'
  },
  {
    id: 'substack-beni-muwawa',
    category: 'editorial',
    source: 'Substack · Béni Muwawa',
    sourceEn: 'Substack · Béni Muwawa',
    date: 'Tribune',
    dateEn: 'Essay',
    title: 'Black Pater : le soldat digital du Congo',
    titleEn: 'Black Pater: the digital soldier of Congo',
    excerpt:
      'Tribune consacrée à Jean-Pierre Lofumbwa, présenté comme un « soldat digital » au service de l’image, de l’histoire et de la résilience du Congo, alliant pédagogie, fierté culturelle et modernité.',
    excerptEn:
      'Essay on Jean-Pierre Lofumbwa as a “digital soldier” for Congo’s image, history and resilience, combining teaching, cultural pride and modern media.',
    url: 'https://benimuwawa.substack.com/p/black-pater-le-soldat-digital-du',
    cta: 'Lire la tribune',
    ctaEn: 'Read the essay'
  },
  {
    id: 'komelate-bio',
    category: 'dossier',
    source: 'Komelate · Portrait',
    sourceEn: 'Komelate · Profile',
    date: 'Biographie',
    dateEn: 'Biography',
    title: 'Black Pater : biographie, parcours et impact',
    titleEn: 'Black Pater: biography, path and impact',
    excerpt:
      'Portrait biographique de Jean-Pierre Lofumbwa (« Le Prof ») : ses racines en République démocratique du Congo, sa philosophie, son goût de l’apprentissage continu et l’écho de ses messages auprès de la jeunesse.',
    excerptEn:
      'Biographical profile of Jean-Pierre Lofumbwa (“Le Prof”): his roots in the DRC, his philosophy, his commitment to lifelong learning and the reach of his messages among young people.',
    url: 'https://komelate-blog.netlify.app/black-pater-biographie/',
    cta: 'Lire le portrait',
    ctaEn: 'Read the profile'
  },
  {
    id: 'komelate-rdc-utah',
    category: 'dossier',
    source: 'Komelate · Parcours',
    sourceEn: 'Komelate · Journey',
    date: 'Diaspora',
    dateEn: 'Diaspora',
    title: 'De la RDC aux États-Unis (Utah) : le parcours de Black Pater',
    titleEn: 'From the DRC to the United States (Utah): Black Pater’s journey',
    excerpt:
      'Le parcours d’installation aux États-Unis : comment Jean-Pierre Lofumbwa a surmonté le choc culturel à Salt Lake City pour devenir une voix respectée et un repère pour les candidats aux visas et aux bourses.',
    excerptEn:
      'Settling in the United States: how Jean-Pierre Lofumbwa overcame culture shock in Salt Lake City to become a respected voice and a reference for visa and scholarship applicants.',
    url: 'https://komelate-blog.netlify.app/black-pater-rdc-utah-parcours/',
    cta: 'Lire le récit',
    ctaEn: 'Read the story'
  },
  {
    id: 'komelate-danse',
    category: 'dossier',
    source: 'Komelate · Culture',
    sourceEn: 'Komelate · Culture',
    date: 'Danse & musique',
    dateEn: 'Dance & music',
    title: 'Black Pater, ambassadeur de la culture congolaise et de la danse Banafro',
    titleEn: 'Black Pater, ambassador of Congolese culture and Banafro dance',
    excerpt:
      'La dimension artistique de Black Pater : la promotion des danses urbaines congolaises, de la culture Banafro, de la rumba et du soukous à travers le monde.',
    excerptEn:
      'Black Pater’s artistic side: promoting Congolese urban dance, Banafro culture, rumba and soukous around the world.',
    url: 'https://komelate-blog.netlify.app/black-pater-culture-danse-banafro/',
    cta: 'Lire l’article',
    ctaEn: 'Read the article'
  },
  {
    id: 'komelate-langues',
    category: 'academic',
    source: 'Komelate · Éducation',
    sourceEn: 'Komelate · Education',
    date: 'Pédagogie',
    dateEn: 'Teaching',
    title: '« Le Prof » Black Pater : éducation, langues et excellence',
    titleEn: '“Le Prof” Black Pater: education, languages and excellence',
    excerpt:
      'La méthode Molakisi : comment Jean-Pierre Lofumbwa pratique et enseigne cinq langues (français, anglais, lingala, swahili, tshiluba) et rend accessibles les démarches académiques et administratives.',
    excerptEn:
      'The Molakisi method: how Jean-Pierre Lofumbwa practises and teaches five languages (French, English, Lingala, Swahili, Tshiluba) and makes academic and administrative procedures accessible.',
    url: 'https://komelate-blog.netlify.app/le-prof-black-pater-etudes-langues/',
    cta: 'Lire l’analyse',
    ctaEn: 'Read the analysis'
  },
  {
    id: 'komelate-diaspora',
    category: 'editorial',
    source: 'Komelate · Médias',
    sourceEn: 'Komelate · Media',
    date: 'Diaspora',
    dateEn: 'Diaspora',
    title: 'Black Pater : créateur de contenu multilingue et figure de la diaspora',
    titleEn: 'Black Pater: multilingual content creator and diaspora figure',
    excerpt:
      'L’impact numérique de Black Pater : une communauté construite sans céder aux facilités algorithmiques, des passerelles entre l’Afrique et les États-Unis, et une voix crédible pour la jeunesse de la diaspora.',
    excerptEn:
      'Black Pater’s digital impact: a community built without algorithmic shortcuts, bridges between Africa and the United States, and a credible voice for diaspora youth.',
    url: 'https://komelate-blog.netlify.app/createur-contenu-multilingue-diaspora/',
    cta: 'Lire l’article',
    ctaEn: 'Read the article'
  },
  {
    id: 'collegesidekick',
    category: 'academic',
    source: 'CollegeSidekick · Archives',
    sourceEn: 'CollegeSidekick · Archive',
    date: 'Travaux',
    dateEn: 'Coursework',
    title: 'Jean-Pierre Lofumbwa : documents d’études et travaux universitaires',
    titleEn: 'Jean-Pierre Lofumbwa: study documents and coursework',
    excerpt:
      'Dépôt de travaux de cours, synthèses et devoirs rédigés par Jean-Pierre Lofumbwa durant son cursus universitaire aux États-Unis.',
    excerptEn: 'Repository of coursework, summaries and assignments written by Jean-Pierre Lofumbwa during his university studies in the United States.',
    url: 'https://www.collegesidekick.com/study-docs/7290959',
    cta: 'Consulter',
    ctaEn: 'View'
  }
];
