import Stripe from 'stripe';

function cleanKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let key = raw.trim().replace(/^['"]|['"]$/g, '').replace(/[\r\n\s\t]/g, '');
  const map = {
    '\u0410': 'A', '\u0412': 'B', '\u0421': 'C', '\u0415': 'E', '\u041D': 'H', '\u041A': 'K', '\u041C': 'M',
    '\u041E': 'O', '\u0420': 'P', '\u0422': 'T', '\u0425': 'X', '\u0430': 'a', '\u0441': 'c', '\u0435': 'e',
    '\u043E': 'o', '\u0440': 'p', '\u0445': 'x', '\u0443': 'y', 'ç': 'c'
  };
  for (const [k, v] of Object.entries(map)) {
    key = key.split(k).join(v);
  }
  key = key.replace(/^sk_1ive_/, 'sk_live_').replace(/^pk_1ive_/, 'pk_live_');
  return key;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Parse body safely
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { email, name, note, planName, amount } = body || {};

  const rawSecretKey = process.env.STRIPE_SECRET_KEY || '';
  const stripeSecretKey = cleanKey(rawSecretKey);
  const rawPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  const stripePublishableKey = cleanKey(rawPublishableKey);

  if (!stripeSecretKey) {
    return res.status(200).json({
      status: 'pending_keys',
      configured: false,
      publishableKey: stripePublishableKey,
      message: 'Paiement en ligne Stripe : la clé secrète STRIPE_SECRET_KEY n’est pas encore configurée sur le serveur.',
    });
  }

  // Build clean, robust origin
  let origin = req.headers.origin;
  if (!origin) {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'blackpater.com';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    origin = `${proto}://${host}`;
  }
  if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
    origin = `https://${origin}`;
  }
  origin = origin.replace(/\/+$/, '');

  // Calculate amount in cents (default to $1.00)
  const parsedAmount = Math.max(1, Math.round(Number(amount || 1)));
  const unitAmountInCents = parsedAmount * 100;
  const itemTitle = planName ? `Black Pater — ${planName}` : 'Black Pater — Accompagnement & Démarches Voyage ($1)';

  try {
    const stripe = new Stripe(stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email && email.includes('@') ? email : undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: itemTitle,
              description: 'Accès complet : démarches de voyage, bourses, visas, opportunités réelles et contact direct.',
            },
            unit_amount: unitAmountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        customer_name: name || 'Abonné Black Pater',
        customer_note: note || '',
        plan_name: planName || 'Standard',
        platform: 'blackpater.com',
      },
      success_url: `${origin}/abonnements?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/abonnements?payment=cancelled`,
    });

    return res.status(200).json({
      status: 'success',
      configured: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);

    let userMessage = error.message || 'Erreur lors de la création de la session de paiement.';
    if (error.type === 'StripeAuthenticationError') {
      userMessage = 'Clé secrète Stripe invalide. Vérifiez que la variable STRIPE_SECRET_KEY sur Vercel commence bien par sk_live_... (ou sk_test_...) et ne comporte pas d’espaces.';
    } else if (error.type === 'StripePermissionError') {
      userMessage = 'Votre clé Stripe n’a pas la permission de créer des sessions Checkout.';
    }

    // Return status 200 with structured error info so browser does not throw uncaught 500 error
    return res.status(200).json({
      status: 'error',
      message: userMessage,
      stripeError: error.message,
      stripeCode: error.code || error.type || 'UNKNOWN',
    });
  }
}
