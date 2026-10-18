// Official contact details (as published on the site).
export const CONTACT_EMAIL = 'lofumbwapater@gmail.com';
export const WHATSAPP_NUMBER = '17205490926';
export const WHATSAPP_DISPLAY = '+1 720 549 0926';

/** WhatsApp link for contact / onboarding (never a payment channel). */
export function whatsappLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
