// api/notify.js
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { booking_id, note = '' } = req.body || {};
    if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

    const to = process.env.COORDINATOR_EMAIL || 'dreamstategraphics@yahoo.com';
    const appBase = process.env.APP_BASE_URL || 'http://localhost:3000';
    const plannerUrl = `${appBase}/index.html?booking_id=${encodeURIComponent(booking_id)}`;

    const subject = `Layout update – Booking #${booking_id}`;
    const body = [
      `A floorplan was saved/updated.`,
      ``,
      `Booking: #${booking_id}`,
      `Open layout: ${plannerUrl}`,
      ``,
      note ? `Note from customer:\n${note}` : ''
    ].join('\n');

    // If RESEND_API_KEY is not set, just succeed (dev mode)
    if (!process.env.RESEND_API_KEY) {
      console.log('[notify] DEV mode: would email to', to, '\n', body);
      return res.status(200).json({ ok: true, dev: true, planner_url: plannerUrl });
    }

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'OAMH Planner <noreply@oakesameshall.org>',
        to: [to],
        subject,
        text: body
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: 'email_failed', detail: t });
    }

    res.status(200).json({ ok: true, planner_url: plannerUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error', detail: String(e) });
  }
}