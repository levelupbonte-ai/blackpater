import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Stripe from 'stripe';

function stripeApiPlugin() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_51SPybEAQ5K91JyQSKuUAxboFNIJOpXKiyYn8dJfoK21bH5c9wsGfpoJ7oe5gVW7X41nccCFuNd26JgGsMFYJceGndqV8ZaoMi';
  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

  return {
    name: 'stripe-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/stripe/config' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              configured: Boolean(stripe),
              publishableKey: stripePublishableKey,
              offer: {
                id: 'offre-lancement-1usd',
                title: 'Accompagnement & Démarches Voyage',
                amount: 1.0,
                currency: 'USD',
                symbol: '$',
              },
            })
          );
          return;
        }

        if (url === '/api/stripe/create-checkout-session' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = body ? JSON.parse(body) : {};
              const { email, name, note } = data;
              const host = req.headers.host || 'localhost:3000';
              const protocol = req.headers['x-forwarded-proto'] || 'http';
              const origin = `${protocol}://${host}`;

              if (!stripe) {
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    status: 'pending_keys',
                    configured: false,
                    publishableKey: stripePublishableKey,
                    message:
                      'Stripe est prêt et sécurisé. Ajoutez votre STRIPE_SECRET_KEY dans les variables d’environnement pour lancer le paiement en direct.',
                    fallbackUrl: `https://wa.me/17205490926?text=${encodeURIComponent(
                      "Bonjour Jean-Pierre, je souhaite souscrire à l'offre à 1$ (Accompagnement & Démarches Voyage)."
                    )}`,
                  })
                );
                return;
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
                        description:
                          'Accès complet : démarches de voyage, bourses, visas, opportunités réelles et contact direct WhatsApp.',
                        images: [`${origin}/og-preview.png`],
                      },
                      unit_amount: 100,
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

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'success',
                  configured: true,
                  url: session.url,
                  sessionId: session.id,
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'error',
                  message: err.message || 'Erreur lors de la création de la session Stripe.',
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), stripeApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
});
