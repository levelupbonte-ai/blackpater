export default function handler(req, res) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  
  res.status(200).json({
    configured: Boolean(stripeSecretKey),
    publishableKey: stripePublishableKey,
    offer: {
      id: 'offre-lancement-1usd',
      title: 'Accompagnement & Démarches Voyage',
      amount: 1.0,
      currency: 'USD',
      symbol: '$',
    },
  });
}
