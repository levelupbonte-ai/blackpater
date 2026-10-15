import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

  if (!stripeSecretKey) {
    return res.status(200).json({
      status: 'pending_keys',
      configured: false,
      publishableKey: stripePublishableKey,
      message: 'STRIPE_SECRET_KEY non configurée sur le serveur Vercel.',
      fallbackUrl: `https://wa.me/17205490926?text=${encodeURIComponent(
        "Bonjour Jean-Pierre, je souhaite souscrire à l'offre à 1$ (Accompagnement & Démarches Voyage)."
      )}`,
    });
  }

  const stripe = new Stripe(stripeSecretKey);
  const { email, name, note } = req.body || {};
  const origin = req.headers.origin || `https://${req.headers.host || 'blackpater.com'}`;

  try {
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
            unit_amount: 100, // $1.00 USD
          },
          quantity: 1,
        },
      ],
      metadata: {
        customer_name: name || 'Abonné Black Pater',
        customer_note: note || '',
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
    console.error('Stripe error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la création de la session Stripe.',
    });
  }
}
