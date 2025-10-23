// api/layout.js
import { list, put } from '@vercel/blob';

export const config = { runtime: 'nodejs' };

const token = process.env.BLOB_READ_WRITE_TOKEN; // injected by Vercel after you enable Blob
const keyFor = (bookingId) => `layouts/${bookingId}.json`;

export default async function handler(req, res) {
  try {
    if (!token) {
      // Helpful error if Blob isn't enabled yet
      return res.status(500).json({ error: 'blob_token_missing', detail: 'Enable Blob storage on this Vercel project so BLOB_READ_WRITE_TOKEN is available.' });
    }

    if (req.method === 'GET') {
      const booking_id = Number(req.query.booking_id || 0);
      if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

      const key = keyFor(booking_id);
      const { blobs } = await list({ prefix: key, limit: 1, token });

      if (!blobs || blobs.length === 0) {
        return res.status(200).json({ booking_id, layout: null, updated_at: null });
      }

      const url = blobs[0].url;
      const r = await fetch(url);
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        return res.status(500).json({ error: 'blob_fetch_failed', detail: t });
      }
      const layout = await r.json();
      return res.status(200).json({ booking_id, layout, updated_at: blobs[0].uploadedAt || blobs[0].createdAt || null });
    }

    if (req.method === 'POST') {
      // In Vercel Node functions, req.body is parsed JSON for application/json
      const { booking_id, layout } = req.body || {};
      if (!booking_id || !layout) return res.status(400).json({ error: 'booking_id and layout required' });

      const key = keyFor(Number(booking_id));
      const { url } = await put(key, JSON.stringify(layout), {
        contentType: 'application/json',
        access: 'public',
        addRandomSuffix: false,
        token,
      });

      return res.status(200).json({ ok: true, url });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    console.error('[api/layout] error:', e);
    const detail = e && e.message ? e.message : String(e);
    return res.status(500).json({ error: 'server_error', detail });
  }
}