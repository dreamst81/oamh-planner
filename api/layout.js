// api/layout.js
import { list, put } from '@vercel/blob';

export const config = { runtime: 'nodejs' };

// deterministic key per booking
const keyFor = (bookingId) => `layouts/${bookingId}.json`;

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
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res
        .status(500)
        .json({ error: 'blob_token_missing', detail: 'Enable Blobs in Vercel → Project → Storage and redeploy.' });
    }

    if (req.method === 'GET') {
      const booking_id = Number(req.query.booking_id || 0);
      if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

      const key = keyFor(booking_id);
      const { blobs } = await list({ prefix: key, limit: 1, token });

      if (!blobs || blobs.length === 0) {
        return res.status(200).json({
          booking_id,
          layout: null,
          customer_name: '',
          event_at: '',
          updated_at: null,
        });
      }

      const url = blobs[0].url;
      const r = await fetch(url);
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        return res.status(500).json({ error: 'blob_fetch_failed', detail: t });
      }
      const doc = await r.json(); // {layout, customer_name, event_at, updated_at}
      return res.status(200).json({
        booking_id,
        layout: doc.layout || null,
        customer_name: doc.customer_name || '',
        event_at: doc.event_at || '',
        updated_at: doc.updated_at || blobs[0].uploadedAt || blobs[0].createdAt || null,
      });
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      if (!body) return res.status(400).json({ error: 'invalid_json_body' });

      const booking_id = Number(body.booking_id || 0);
      const layout = body.layout;
      const customer_name = (body.customer_name || '').toString().slice(0, 200);
      const event_at = (body.event_at || '').toString().slice(0, 200);
      if (!booking_id || !layout) {
        return res.status(400).json({ error: 'booking_id and layout required' });
      }

      const key = keyFor(booking_id);
      const payload = {
        layout,
        customer_name,
        event_at,
        updated_at: new Date().toISOString(),
      };

      const { url } = await put(key, JSON.stringify(payload), {
        contentType: 'application/json',
        access: 'public',
        addRandomSuffix: false,
        token,
      });

      return res.status(200).json({ ok: true, url });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    const detail = e?.message || String(e);
    console.error('[api/layout] error:', detail);
    return res.status(500).json({ error: 'server_error', detail });
  }
}