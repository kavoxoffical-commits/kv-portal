exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { password } = JSON.parse(event.body || '{}');
  const correct = process.env.ADMIN_PASS;

  if (!correct) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Not configured' }) };
  }

  if (password === correct) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 401, body: JSON.stringify({ ok: false }) };
};
