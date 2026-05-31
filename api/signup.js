export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email } = req.body || {};
  const emailOk = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = 'appHnd4J0kRjBiV2d';
  const TABLE = 'Signups';
  if (!AIRTABLE_TOKEN) {
    return res.status(500).json({ error: 'Server not configured' });
  }
  try {
    const airtableRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: [{ fields: { 'Email': email, 'Source': 'mulatab.com' } }] }),
    });
    if (!airtableRes.ok) {
      return res.status(502).json({ error: 'Signup failed' });
    }
    let position = null;
    let offset = null;
    let count = 0;
    do {
      const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
      url.searchParams.set('pageSize', '100');
      url.searchParams.set('fields[]', 'Email');
      if (offset) url.searchParams.set('offset', offset);
      const countRes = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` },
      });
      if (!countRes.ok) break;
      const countData = await countRes.json();
      count += (countData.records ? countData.records.length : 0);
      offset = countData.offset || null;
    } while (offset);
    position = count > 0 ? count : null;
    return res.status(200).json({ ok: true, position });
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
