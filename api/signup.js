// api/signup.js
// Secure serverless function — keeps the Airtable token hidden on the server.
// The browser calls THIS, and THIS calls Airtable. The token never reaches the visitor.

export default async function handler(req, res) {
  // Only allow POST requests (the signup form sends a POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read the email the visitor submitted
  const { email } = req.body || {};

  // Basic email validation on the server too (never trust the browser alone)
  const emailOk = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // The secret token comes from Vercel's environment variables — NOT from the code.
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = 'appHnd4J0kRjBiV2d';
  const TABLE = 'Signups';

  if (!AIRTABLE_TOKEN) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                'Email': email,
                'Source': 'mulatab.com',
              },
            },
          ],
        }),
      }
    );

    if (!airtableRes.ok) {
      return res.status(502).json({ error: 'Signup failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
