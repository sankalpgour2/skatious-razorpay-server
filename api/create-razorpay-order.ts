import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

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

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID ?? '',
    key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
  });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: true,
    });

    return res.status(200).json(order);
  } catch (err: any) {
    console.error('Razorpay Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
