export default async function handler(req, res) {
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

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { email, name, phone, operator } = body || {};

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

  // 1. Direct payment link if provided by user (e.g. Flutterwave / CinetPay link)
  const customLink = process.env.MOBILE_MONEY_PAYMENT_LINK;
  if (customLink && customLink.startsWith('http')) {
    return res.status(200).json({
      status: 'success',
      configured: true,
      url: customLink,
    });
  }

  // 2. Flutterwave API integration (Orange Money, MTN, Airtel, M-Pesa, Wave)
  const flwSecretKey = (process.env.FLUTTERWAVE_SECRET_KEY || '').trim();

  if (!flwSecretKey) {
    return res.status(200).json({
      status: 'pending_keys',
      configured: false,
      message:
        'Le module Mobile Money (Orange Money, MTN, Airtel, M-Pesa, Wave) est prêt dans le code. Pour activer le paiement en direct, ajoutez votre clé FLUTTERWAVE_SECRET_KEY sur Vercel.',
      supportedOperators: ['Orange Money', 'MTN Mobile Money', 'Airtel Money', 'Vodacom M-Pesa', 'Wave'],
    });
  }

  try {
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
          email: email && email.includes('@') ? email : 'contact@blackpater.com',
          name: name || 'Abonné Black Pater',
          phonenumber: phone || '',
        },
        customizations: {
          title: 'Black Pater — Accompagnement & Démarches ($1)',
          description: 'Paiement direct sécurisé Orange Money, MTN MoMo, Airtel Money, Wave, M-Pesa',
          logo: `${origin}/logo.png`,
        },
        meta: {
          operator: operator || 'all',
          platform: 'blackpater.com',
        },
      }),
    });

    const flwData = await flwResponse.json();

    if (flwData.status === 'success' && flwData.data && flwData.data.link) {
      return res.status(200).json({
        status: 'success',
        configured: true,
        url: flwData.data.link,
      });
    }

    return res.status(200).json({
      status: 'error',
      message: flwData.message || 'Erreur lors de l’initialisation Mobile Money Flutterwave.',
    });
  } catch (error) {
    console.error('Mobile Money Payment Error:', error);
    return res.status(200).json({
      status: 'error',
      message: error.message || 'Erreur lors de la connexion à la passerelle Mobile Money.',
    });
  }
}
