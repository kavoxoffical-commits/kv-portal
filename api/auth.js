// api/auth.js

const RATE_LIMIT = new Map(); // IP → { count, firstTime }
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة

// مقارنة آمنة ضد Timing Attacks
function safeCompare(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function getRateLimit(ip) {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);

  if (!entry || now - entry.firstTime > WINDOW_MS) {
    // نافذة جديدة
    RATE_LIMIT.set(ip, { count: 1, firstTime: now });
    return { blocked: false, remaining: MAX_ATTEMPTS - 1 };
  }

  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    return { blocked: true, remaining: 0 };
  }

  return { blocked: false, remaining: MAX_ATTEMPTS - entry.count };
}

export default async function handler(req, res) {
  // ── Method check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── CORS: قبل طلبات من نطاقك فقط
  const origin = req.headers.origin || '';
  const allowed = process.env.ADMIN_ORIGIN || 'https://kavox-zeta.vercel.app';
  if (origin && origin !== allowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ── Rate Limiting بالـ IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const { blocked, remaining } = getRateLimit(ip);

  if (blocked) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  // ── التحقق من كلمة السر
  const { password } = req.body || {};
  const correct = process.env.ADMIN_PASS;

  if (!correct) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid request' });
  }

  // مقارنة آمنة
  if (safeCompare(password, correct)) {
    // نظّف سجل هذا الـ IP بعد نجاح الدخول
    RATE_LIMIT.delete(ip);
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, remaining });
}
