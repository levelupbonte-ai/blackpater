export type Language = 'fr' | 'en';

export interface ArticleItem {
  id: string;
  badge: string;
  badgeType: 'usa' | 'academic' | 'editorial' | 'dossier' | 'culture';
  source: string;
  date: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  url: string;
  buttonText: string;
  buttonTextEn?: string;
}

export interface FaqItem {
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
}

export interface TestimonialItem {
  text: string;
  author: string;
  location: string;
  avatar: string;
}

export interface SocialItem {
  id: string;
  name: string;
  handle: string;
  followers: string;
  color: string;
  url: string;
  badge: string;
  gridSpan?: string;
}
