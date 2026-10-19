import type { TranslationKey } from '../i18n';

// Official channels. No follower counts: only what can be checked on the profiles.
export interface Social {
  id: string;
  name: string;
  handle: string;
  color: string;
  url: string;
  badge: TranslationKey;
  wide?: boolean;
}

export const SOCIALS: Social[] = [
  { id: 'tiktok', name: 'TikTok', handle: '@black_pater', color: '#fe2c55', url: 'https://www.tiktok.com/@black_pater', badge: 'soc_tiktok', wide: true },
  { id: 'instagram', name: 'Instagram', handle: '@black_pater', color: '#e1306c', url: 'https://www.instagram.com/black_pater/', badge: 'soc_instagram' },
  { id: 'youtube', name: 'YouTube', handle: '@black_pater', color: '#ff3d3d', url: 'https://www.youtube.com/@black_pater', badge: 'soc_youtube' },
  { id: 'facebook', name: 'Facebook', handle: 'BlackPaterOfficiel', color: '#4c8cf5', url: 'https://www.facebook.com/BlackPaterOfficiel', badge: 'soc_facebook' },
  { id: 'x', name: 'X', handle: '@black_pater', color: '#efe8dc', url: 'https://twitter.com/black_pater', badge: 'soc_x' },
  { id: 'linkedin', name: 'LinkedIn', handle: 'Jean-Pierre Lofumbwa', color: '#3b9ce0', url: 'https://www.linkedin.com/in/jean-pierre-lofumbwa-3a5585141/', badge: 'soc_linkedin' },
  { id: 'whatsapp', name: 'WhatsApp', handle: '+1 720 549 0926', color: '#25d366', url: 'https://wa.me/17205490926', badge: 'soc_whatsapp' }
];
