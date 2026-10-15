import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe securely if STRIPE_SECRET_KEY is provided
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1d' }));
}
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// Explicit Favicon routes for Google Search Central & Search Preview crawlers
app.get('/favicon.ico', (req, res) => {
  res.type('image/x-icon');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get(['/favicon-192x192.png', '/android-chrome-192x192.png', '/favicon.png'], (req, res) => {
  res.type('image/png');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(__dirname, 'public', 'favicon-192x192.png'));
});

app.get('/favicon-48x48.png', (req, res) => {
  res.type('image/png');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(__dirname, 'public', 'favicon-48x48.png'));
});

app.get('/favicon-96x96.png', (req, res) => {
  res.type('image/png');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(__dirname, 'public', 'favicon-96x96.png'));
});

app.get('/apple-touch-icon.png', (req, res) => {
  res.type('image/png');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));
});

app.get('/logo.png', (req, res) => {
  res.type('image/png');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(__dirname, 'public', 'logo.png'));
});

// Stripe API: Check configuration status
app.get('/api/stripe/config', (req, res) => {
  res.json({
    configured: Boolean(stripe),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    offer: {
      id: 'offre-lancement-1usd',
      title: 'Accompagnement & Démarches Voyage',
      amount: 1.00,
      currency: 'USD',
      symbol: '$'
    }
  });
});

// Stripe API: Create Checkout Session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  const { email, name, note } = req.body || {};
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  const origin = `${protocol}://${host}`.replace(/\/+$/, '');

  if (!stripe) {
    return res.json({
      status: 'pending_keys',
      configured: false,
      message: 'Paiement en ligne Stripe : la clé secrète STRIPE_SECRET_KEY n’est pas encore configurée sur le serveur.',
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email && email.includes('@') ? email : undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Black Pater — Accompagnement & Démarches Voyage (Offre 1$)',
              description: 'Accès complet : démarches de voyage, bourses, visas, opportunités réelles.',
            },
            unit_amount: 100, // 100 cents = $1.00 USD
          },
          quantity: 1,
        },
      ],
      metadata: {
        customer_name: name || 'Abonné Black Pater',
        customer_note: note || '',
        platform: 'blackpater.com'
      },
      success_url: `${origin}/abonnements?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/abonnements?payment=cancelled`,
    });

    return res.json({
      status: 'success',
      configured: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    let userMessage = error.message || 'Erreur lors de la création de la session Stripe.';
    if (error.type === 'StripeAuthenticationError') {
      userMessage = 'Clé secrète Stripe invalide. Vérifiez STRIPE_SECRET_KEY.';
    }
    return res.status(200).json({
      status: 'error',
      message: userMessage,
      stripeError: error.message,
      stripeCode: error.code || error.type || 'UNKNOWN',
    });
  }
});

// Mobile Money API: Orange Money, MTN, Airtel, Wave, M-Pesa
app.post('/api/mobile-money/create-session', async (req, res) => {
  const { email, name, phone, operator } = req.body || {};
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  const origin = `${protocol}://${host}`.replace(/\/+$/, '');

  const customLink = process.env.MOBILE_MONEY_PAYMENT_LINK;
  if (customLink && customLink.startsWith('http')) {
    return res.json({ status: 'success', configured: true, url: customLink });
  }

  const flwSecretKey = (process.env.FLUTTERWAVE_SECRET_KEY || '').trim();
  if (!flwSecretKey) {
    return res.json({
      status: 'pending_keys',
      configured: false,
      message: 'Le module Mobile Money (Orange Money, MTN, Airtel, M-Pesa, Wave) est prêt dans le code. Ajoutez votre clé FLUTTERWAVE_SECRET_KEY dans les variables d’environnement pour activer le paiement.',
      supportedOperators: ['Orange Money', 'MTN Mobile Money', 'Airtel Money', 'Vodacom M-Pesa', 'Wave']
    });
  }

  try {
    const txRef = `BP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: '1',
        currency: 'USD',
        redirect_url: `${origin}/abonnements?payment=success&provider=mobile_money`,
        payment_options: 'mobilemoneysn,mobilemoneyfranco,mobilemoneyuganda,mobilemoneyrwanda,mobilemoneyzambia,mobilemoneyghana,card,ussd,banktransfer',
        customer: {
          email: email && email.includes('@') ? email : 'contact@blackpater.com',
          name: name || 'Abonné Black Pater',
          phonenumber: phone || ''
        },
        customizations: {
          title: 'Black Pater — Accompagnement & Démarches ($1)',
          description: 'Paiement direct sécurisé Orange Money, MTN MoMo, Airtel Money, Wave, M-Pesa',
          logo: `${origin}/logo.png`
        },
        meta: { operator: operator || 'all', platform: 'blackpater.com' }
      })
    });
    const flwData = await flwResponse.json();
    if (flwData.status === 'success' && flwData.data && flwData.data.link) {
      return res.json({ status: 'success', configured: true, url: flwData.data.link });
    }
    return res.json({ status: 'error', message: flwData.message || 'Erreur lors de l’initialisation Mobile Money.' });
  } catch (err) {
    console.error('Mobile money error:', err);
    return res.json({ status: 'error', message: err.message || 'Erreur de connexion Mobile Money.' });
  }
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

const indexHtmlPath = fs.existsSync(path.join(distPath, 'index.html'))
  ? path.join(distPath, 'index.html')
  : path.join(__dirname, 'index.html');

app.get(['/', '/abonnements', '/articles', '/biographie', '/medias', '/contact'], (req, res) => {
  res.sendFile(indexHtmlPath);
});

app.get('*', (req, res) => {
  res.sendFile(indexHtmlPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
