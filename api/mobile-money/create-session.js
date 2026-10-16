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
  const { email, name, phone, operator, planName, amount } = body || {};

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

  // 1. Direct payment link if provided by user (e.g. CinetPay payment page or direct link)
  const customLink = process.env.MOBILE_MONEY_PAYMENT_LINK;
  if (customLink && customLink.startsWith('http')) {
    return res.status(200).json({
      status: 'success',
      configured: true,
      url: customLink,
    });
  }

  // 2. CinetPay Integration (Le n°1 Afrique Francophone : Orange Money, MTN, Wave, Moov, Airtel)
  const cinetApiKey = (process.env.CINETPAY_APIKEY || '').trim();
  const cinetSiteId = (process.env.CINETPAY_SITE_ID || '').trim();

  if (cinetApiKey && cinetSiteId) {
    try {
      const txRef = `BP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const parsedAmount = Math.max(1, Math.round(Number(amount || 1)));
      const paymentTitle = planName ? `Black Pater — ${planName}` : 'Black Pater — Accompagnement VIP';

      // CinetPay supports USD directly or XOF
      const cinetCurrency = (process.env.CINETPAY_CURRENCY || 'USD').toUpperCase();
      // If currency is XOF, convert USD approx 1 USD ~ 600 XOF
      const finalAmount = cinetCurrency === 'XOF' ? parsedAmount * 600 : parsedAmount;

      const cinetRes = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: cinetApiKey,
          site_id: cinetSiteId,
          transaction_id: txRef,
          amount: finalAmount,
          currency: cinetCurrency,
          description: `${paymentTitle} ($${parsedAmount})`,
          notify_url: `${origin}/api/mobile-money/notify`,
          return_url: `${origin}/abonnements?payment=success&provider=cinetpay`,
          channels: 'ALL',
          customer_name: (name || 'Abonné').split(' ')[0] || 'Abonné',
          customer_surname: (name || 'Black Pater').split(' ').slice(1).join(' ') || 'Black Pater',
          customer_email: email && email.includes('@') ? email : 'contact@blackpater.com',
          customer_phone_number: phone || '',
          customer_address: 'Black Pater Club',
          customer_city: 'Kinshasa / Abidjan / Salt Lake City',
          customer_country: 'CI',
          customer_state: 'CI',
          customer_zip_code: '00225',
        }),
      });

      const cinetData = await cinetRes.json();
      if (cinetData && (cinetData.code === '201' || cinetData.data?.payment_url)) {
        return res.status(200).json({
          status: 'success',
          configured: true,
          provider: 'cinetpay',
          url: cinetData.data.payment_url,
        });
      }

      console.warn('CinetPay API warning:', cinetData);
      return res.status(200).json({
        status: 'error',
        message: cinetData.message || cinetData.description || 'Erreur lors de l’initialisation CinetPay.',
      });
    } catch (cinetErr) {
      console.error('CinetPay execution error:', cinetErr);
    }
  }

  // 3. Flutterwave API integration fallback
  const flwSecretKey = (process.env.FLUTTERWAVE_SECRET_KEY || '').trim();

  if (!flwSecretKey && !cinetApiKey) {
    return res.status(200).json({
      status: 'pending_keys',
      configured: false,
      message:
        'Pour activer le paiement par Orange Money, MTN MoMo, Moov ou Wave, configurez votre clé CINETPAY_APIKEY et CINETPAY_SITE_ID (recommandé pour l’Afrique Francophone) ou FLUTTERWAVE_SECRET_KEY dans les variables Vercel.',
      supportedOperators: ['Orange Money', 'MTN Mobile Money', 'Moov Money', 'Wave', 'Airtel Money'],
    });
  }

  try {
    const txRef = `BP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const parsedAmount = Math.max(1, Math.round(Number(amount || 1)));
    const paymentTitle = planName ? `Black Pater — ${planName}` : 'Black Pater — Accompagnement & Démarches';

    const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: String(parsedAmount),
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
          title: `${paymentTitle} ($${parsedAmount})`,
          description: 'Paiement direct sécurisé Orange Money, MTN MoMo, Airtel Money, Wave, M-Pesa',
          logo: `${origin}/logo.png`,
        },
        meta: {
          operator: operator || 'all',
          plan_name: planName || 'Standard',
          platform: 'blackpater.com',
        },
      }),
    });

    const flwData = await flwResponse.json();

    if (flwData.status === 'success' && flwData.data && flwData.data.link) {
      return res.status(200).json({
        status: 'success',
        configured: true,
        provider: 'flutterwave',
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
