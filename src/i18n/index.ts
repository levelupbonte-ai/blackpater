import * as common from './common';
import * as home from './home';
import * as articles from './articles';
import * as offer from './offer';
import * as payment from './payment';
import * as portal from './portal';

const fr = { ...common.fr, ...home.fr, ...articles.fr, ...offer.fr, ...payment.fr, ...portal.fr };
const en: Record<keyof typeof fr, string> = { ...common.en, ...home.en, ...articles.en, ...offer.en, ...payment.en, ...portal.en };

export const translations = { fr, en };
export type TranslationKey = keyof typeof fr;
