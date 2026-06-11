export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.CONFIG_SECRET;
  if (!secret) return res.status(500).json({ error: 'Not configured' });

  const r = await fetch('https://kavox-zeta.vercel.app/api/config', {
    headers: { 'x-config-token': secret }
  });

  if (!r.ok) return res.status(401).json({ error: 'Unauthorized' });

  const data = await r.json();
  return res.status(200).json(data);
}
