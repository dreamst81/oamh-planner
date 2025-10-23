// api/layout.js
import { list, put } from '@vercel/blob';

export const config = { runtime: 'nodejs' };

// Deterministic blob key per booking
const keyFor = (bookingId) => `layouts/${bookingId}.json`;

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const booking_id = Number(req.query.booking_id || 0);
      if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

      const key = keyFor(booking_id);
      const { blobs } = await list({ prefix: key, limit: 1 });
      if (!blobs || blobs.length === 0) {
        return res.status(200).json({ booking_id, layout: null, updated_at: null });
      }

      const url = blobs[0].url;
      const r = await fetch(url);
      if (!r.ok) return res.status(500).json({ error: 'blob fetch failed' });
      const layout = await r.json();

      return res.status(200).json({ booking_id, layout, updated_at: blobs[0].uploadedAt || null });
    }

    if (req.method === 'POST') {
      const { booking_id, layout } = req.body || {};
      if (!booking_id || !layout) return res.status(400).json({ error: 'booking_id and layout required' });

      const key = keyFor(Number(booking_id));
      // Overwrite same key each time (no random suffix)
      const { url } = await put(key, JSON.stringify(layout), {
        contentType: 'application/json',
        access: 'public',
        addRandomSuffix: false,
      });

      return res.status(200).json({ ok: true, url });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error', detail: String(e) });
  }
}