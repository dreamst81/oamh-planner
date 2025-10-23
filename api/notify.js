// api/notify.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    if (req.method !== 'POST')
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });

    let body; try { body = await req.json(); } catch { body = null; }
    const booking_id = Number(body?.booking_id || 0);
    const note = (body?.note || '').toString();

    if (!booking_id)
      return new Response(JSON.stringify({ error: 'booking_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

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
      return new Response(JSON.stringify({ error: 'email_not_configured', detail: 'RESEND_API_KEY missing in project env.' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    // IMPORTANT: ensure "from" is a verified sender/domain in Resend
    const from = process.env.RESEND_FROM || 'OAMH Planner <noreply@oakesameshall.org>';

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text: textBody })
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: 'email_failed', detail: t }), {
        status: 502, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true, planner_url: plannerUrl }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    const detail = e?.message || String(e);
    return new Response(JSON.stringify({ error: 'server_error', detail }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}