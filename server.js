import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

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

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

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
  try {
    const { email, name, note } = req.body || {};
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const origin = `${protocol}://${host}`;

    if (!stripe) {
      // Return clear status when Stripe is ready in the codebase but awaiting user's live secret key
      return res.json({
        status: 'pending_keys',
        configured: false,
        message: 'Stripe est prêt et sécurisé. Ajoutez votre STRIPE_SECRET_KEY dans les variables d’environnement pour lancer le paiement en direct.',
        fallbackUrl: `https://wa.me/17205490926?text=${encodeURIComponent("Bonjour Jean-Pierre, je souhaite souscrire à l'offre à 1$ (Accompagnement & Démarches Voyage).")}`
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email && email.includes('@') ? email : undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Black Pater — Accompagnement & Démarches Voyage (Offre 1$)',
              description: 'Accès complet : démarches de voyage, bourses, visas, opportunités réelles et contact direct WhatsApp.',
              images: [`${origin}/og-preview.png`],
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
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la création de la session Stripe.'
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/abonnements', '/abonnements.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'abonnements.html'));
});

app.get(['/articles', '/articles.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'articles.html'));
});

app.get(['/biographie', '/biographie.html'], (req, res) => {
  res.redirect('/#about');
});

app.get(['/medias', '/medias.html'], (req, res) => {
  res.redirect('/#socials');
});

app.get(['/contact', '/contact.html'], (req, res) => {
  res.redirect('/#contact');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
