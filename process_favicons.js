import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalLogo = path.join(__dirname, 'public', 'bp-logo-original.png');
const publicDir = path.join(__dirname, 'public');

// Generate favicons in all standard browser dimensions
await sharp(originalLogo).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
await sharp(originalLogo).resize(48, 48).png().toFile(path.join(publicDir, 'favicon-48x48.png'));
await sharp(originalLogo).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
await sharp(originalLogo).resize(64, 64).png().toFile(path.join(__dirname, 'favicon.png'));
await sharp(originalLogo).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
await sharp(originalLogo).resize(192, 192).png().toFile(path.join(publicDir, 'android-chrome-192x192.png'));
await sharp(originalLogo).resize(512, 512).png().toFile(path.join(publicDir, 'android-chrome-512x512.png'));

// Copy to favicon.ico as PNG (modern browsers and Googlebot support PNG favicon.ico)
fs.copyFileSync(path.join(publicDir, 'favicon-48x48.png'), path.join(__dirname, 'favicon.ico'));
fs.copyFileSync(path.join(publicDir, 'favicon-48x48.png'), path.join(publicDir, 'favicon.ico'));

console.log('Successfully generated all favicon sizes from original user logo!');

// Now update og-preview.png by compositing the authentic logo image onto the luxury preview background
const logoResized = await sharp(originalLogo).resize(260, 260).png().toBuffer();

const ogBaseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="bgGlow" cx="25%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#1e1814"/>
      <stop offset="50%" stop-color="#120e0c"/>
      <stop offset="100%" stop-color="#080605"/>
    </radialGradient>
    <radialGradient id="copperAura" cx="80%" cy="40%" r="60%">
      <stop offset="0%" stop-color="rgba(201, 138, 82, 0.28)"/>
      <stop offset="100%" stop-color="rgba(0, 0, 0, 0)"/>
    </radialGradient>
    <radialGradient id="congoAura" cx="30%" cy="80%" r="50%">
      <stop offset="0%" stop-color="rgba(110, 20, 35, 0.38)"/>
      <stop offset="100%" stop-color="rgba(0, 0, 0, 0)"/>
    </radialGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fdfbf7"/>
      <stop offset="70%" stop-color="#eedfc8"/>
      <stop offset="100%" stop-color="#c98a52"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bgGlow)"/>
  <rect width="1200" height="630" fill="url(#copperAura)"/>
  <rect width="1200" height="630" fill="url(#congoAura)"/>
  <rect x="24" y="24" width="1152" height="582" rx="16" fill="none" stroke="rgba(239, 232, 220, 0.14)" stroke-width="1.5"/>

  <g transform="translate(1030, 48)">
    <rect x="0" y="0" width="30" height="4" fill="#1b6fd6" rx="2"/>
    <rect x="34" y="0" width="30" height="4" fill="#f7d618" rx="2"/>
    <rect x="68" y="0" width="30" height="4" fill="#ce1126" rx="2"/>
  </g>

  <g transform="translate(72, 80)">
    <g>
      <rect x="0" y="0" width="360" height="34" rx="17" fill="rgba(201, 138, 82, 0.12)" stroke="rgba(201, 138, 82, 0.4)" stroke-width="1"/>
      <circle cx="18" cy="17" r="4.5" fill="#c98a52"/>
      <text x="32" y="22" font-family="'Helvetica Neue', Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="#c98a52" text-transform="uppercase">OFFICIAL DIGITAL PLATFORM</text>
    </g>

    <text x="0" y="140" font-family="'League Gothic', 'Impact', 'Arial Black', sans-serif" font-size="98" font-weight="900" letter-spacing="3" fill="url(#textGrad)">BLACK PATER</text>
    <text x="2" y="196" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#efe8dc">Jean-Pierre Lofumbwa · « Le Prof »</text>
    <text x="2" y="240" font-family="'Helvetica Neue', Arial, sans-serif" font-size="19" font-weight="500" fill="rgba(239, 232, 220, 0.75)" letter-spacing="0.5">Congolese Cultural Ambassador · Educator · Content Creator · Translator</text>

    <g transform="translate(0, 280)">
      <g>
        <rect x="0" y="0" width="330" height="66" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(239, 232, 220, 0.12)" stroke-width="1"/>
        <text x="16" y="26" font-family="'Helvetica Neue', Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5" fill="#c98a52" text-transform="uppercase">VOYAGEUTAH MAGAZINE</text>
        <text x="16" y="48" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" font-weight="600" fill="#f4eee3">Rising Stars · Salt Lake City</text>
      </g>
      <g transform="translate(346, 0)">
        <rect x="0" y="0" width="330" height="66" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(239, 232, 220, 0.12)" stroke-width="1"/>
        <text x="16" y="26" font-family="'Helvetica Neue', Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5" fill="#c98a52" text-transform="uppercase">CHRONIQUE ÉDITORIALE</text>
        <text x="16" y="48" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" font-weight="600" fill="#f4eee3">Le Soldat Digital du Congo</text>
      </g>
    </g>

    <g transform="translate(0, 395)">
      <text x="0" y="20" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" font-weight="700" fill="#c98a52" letter-spacing="1.5">DOMAIN: blackpater.com</text>
      <text x="240" y="20" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" font-weight="500" fill="rgba(239, 232, 220, 0.5)">#1 Student DRC 2015 · 5 Languages · Salt Lake City, Utah</text>
    </g>
  </g>
</svg>`;

const ogBasePng = await sharp(Buffer.from(ogBaseSvg)).png().toBuffer();

// Composite the user's authentic logo on the right side of the card
await sharp(ogBasePng)
  .composite([
    {
      input: logoResized,
      top: 175,
      left: 850
    }
  ])
  .png()
  .toFile(path.join(__dirname, 'og-preview.png'));

fs.copyFileSync(path.join(__dirname, 'og-preview.png'), path.join(publicDir, 'og-preview.png'));
console.log('Successfully generated og-preview.png with authentic BP logo composite!');
