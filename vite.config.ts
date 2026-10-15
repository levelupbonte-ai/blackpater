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
                      'Paiement en ligne Stripe : la clé secrète STRIPE_SECRET_KEY n’est pas encore configurée sur le serveur.',
                  })
                );
                return;
              }

              const session = await stripe.checkout.sessions.create({
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
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'error',
                  message: err.message || 'Erreur lors de la création de la session Stripe.',
                  stripeError: err.message,
                  stripeCode: err.code || err.type || 'UNKNOWN',
                })
              );
            }
          });
          return;
        }

        if (req.url === '/api/mobile-money/create-session' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            const data = body ? JSON.parse(body) : {};
            const flwSecretKey = (process.env.FLUTTERWAVE_SECRET_KEY || '').trim();
            const customLink = process.env.MOBILE_MONEY_PAYMENT_LINK;

            res.setHeader('Content-Type', 'application/json');
            if (customLink && customLink.startsWith('http')) {
              res.end(JSON.stringify({ status: 'success', configured: true, url: customLink }));
              return;
            }

            if (!flwSecretKey) {
              res.end(
                JSON.stringify({
                  status: 'pending_keys',
                  configured: false,
                  message:
                    'Le module Mobile Money (Orange Money, MTN, Airtel, M-Pesa, Wave) est prêt dans le code. Ajoutez votre clé FLUTTERWAVE_SECRET_KEY dans vos variables d’environnement pour lancer le paiement direct.',
                  supportedOperators: ['Orange Money', 'MTN Mobile Money', 'Airtel Money', 'Vodacom M-Pesa', 'Wave'],
                })
              );
              return;
            }

            try {
              const host = req.headers.host || 'localhost:3000';
              const protocol = req.headers['x-forwarded-proto'] || 'http';
              const origin = `${protocol}://${host}`;
              const txRef = `BP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

              const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${flwSecretKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tx_ref: txRef,
                  amount: '1',
                  currency: 'USD',
                  redirect_url: `${origin}/abonnements?payment=success&provider=mobile_money`,
                  payment_options:
                    'mobilemoneysn,mobilemoneyfranco,mobilemoneyuganda,mobilemoneyrwanda,mobilemoneyzambia,mobilemoneyghana,card,ussd,banktransfer',
                  customer: {
                    email: data.email && data.email.includes('@') ? data.email : 'contact@blackpater.com',
                    name: data.name || 'Abonné Black Pater',
                    phonenumber: data.phone || '',
                  },
                  customizations: {
                    title: 'Black Pater — Accompagnement & Démarches ($1)',
                    description: 'Paiement direct sécurisé Orange Money, MTN MoMo, Airtel Money, Wave, M-Pesa',
                    logo: `${origin}/logo.png`,
                  },
                }),
              });

              const flwData = await flwResponse.json();
              if (flwData.status === 'success' && flwData.data && flwData.data.link) {
                res.end(JSON.stringify({ status: 'success', configured: true, url: flwData.data.link }));
              } else {
                res.end(JSON.stringify({ status: 'error', message: flwData.message || 'Erreur Flutterwave.' }));
              }
            } catch (err: any) {
              res.end(JSON.stringify({ status: 'error', message: err.message || 'Erreur de connexion Mobile Money.' }));
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
