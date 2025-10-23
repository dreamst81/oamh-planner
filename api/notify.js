// api/notify.js

export const config = { runtime: 'nodejs' };

// safe JSON body parser for Node serverless
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch {}
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const body = await readJson(req);
    const booking_id = Number(body?.booking_id || 0);
    const note = (body?.note || '').toString();
    if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

    const to = process.env.COORDINATOR_EMAIL || 'dreamstategraphics@yahoo.com';
    const appBase = process.env.APP_BASE_URL || 'http://localhost:3000';
    const plannerUrl = `${appBase}/index.html?booking_id=${encodeURIComponent(booking_id)}`;

    const subject = `Layout update – Booking #${booking_id}`;
    const textBody = [
      `A floorplan was saved/updated.`,
      ``,
      `Booking: #${booking_id}`,
      `Open layout: ${plannerUrl}`,
      ``,
      note ? `Note from customer:\n${note}` : ''
    ].join('\n');

    const key = process.env.RESEND_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'email_not_configured', detail: 'RESEND_API_KEY missing in env.' });
    }
    const from = process.env.RESEND_FROM || 'onboarding@resend.dev'; // safe default sender

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text: textBody }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: 'email_failed', detail: t });
    }

    return res.status(200).json({ ok: true, planner_url: plannerUrl });
  } catch (e) {
    const detail = e?.message || String(e);
    console.error('[api/notify] error:', detail);
    return res.status(500).json({ error: 'server_error', detail });
  }
}