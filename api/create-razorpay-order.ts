import type { VercelRequest, VercelResponse } from '@vercel/node';

interface CreateOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
}

const allowedOrigins = ['http://localhost:5173', 'https://skatious.com'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 🛑 CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('--- Incoming request to create-razorpay-order ---');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body: CreateOrderRequest;

  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    console.error('Invalid JSON:', err);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { amount, currency, receipt } = body;

  if (!amount || !currency || !receipt) {
    return res.status(400).json({ error: 'Missing required fields: amount, currency, or receipt' });
  }

  const key_id = 'rzp_live_okTAPcTHi0rRN2';
  const key_secret = 'LO9rLlHcI13UKisWZudWUVvl';

  const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

  try {
    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        payment_capture: 1,
      }),
    });

    const responseData = await razorpayRes.json();

    if (!razorpayRes.ok) {
      console.error('Razorpay Error Response:', responseData);
      return res.status(razorpayRes.status).json({ error: responseData?.error?.description || 'Failed to create order' });
    }

    return res.status(200).json(responseData);
  } catch (err: any) {
    console.error('Network or Razorpay Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
