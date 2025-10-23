// api/layout.js
// api/layout.js
import { list, put } from '@vercel/blob';

export const config = { runtime: 'edge' };

const keyFor = (bookingId) => `layouts/${bookingId}.json`;

export default async function handler(req) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'blob_token_missing', detail: 'Enable Blobs in Vercel → Storage and redeploy.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const booking_id = Number(searchParams.get('booking_id') || '0');
      if (!booking_id)
        return new Response(JSON.stringify({ error: 'booking_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      const key = keyFor(booking_id);
      const { blobs } = await list({ prefix: key, limit: 1, token });
      if (!blobs || blobs.length === 0) {
        return new Response(
          JSON.stringify({ booking_id, layout: null, customer_name: '', event_at: '', updated_at: null }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const url = blobs[0].url;
      const r = await fetch(url);
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        return new Response(JSON.stringify({ error: 'blob_fetch_failed', detail: t }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const doc = await r.json(); // {layout, customer_name, event_at, updated_at}
      return new Response(
        JSON.stringify({
          booking_id,
          layout: doc.layout || null,
          customer_name: doc.customer_name || '',
          event_at: doc.event_at || '',
          updated_at: doc.updated_at || blobs[0].uploadedAt || blobs[0].createdAt || null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      let body;
      try { body = await req.json(); } catch { body = null; }
      if (!body) return new Response(JSON.stringify({ error: 'invalid_json_body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      const booking_id = Number(body.booking_id || 0);
      const layout = body.layout;
      const customer_name = (body.customer_name || '').toString().slice(0, 200);
      const event_at = (body.event_at || '').toString().slice(0, 200);

      if (!booking_id || !layout) {
        return new Response(JSON.stringify({ error: 'booking_id and layout required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const key = keyFor(booking_id);
      const doc = {
        layout,
        customer_name,
        event_at,
        updated_at: new Date().toISOString()
      };

      const { url } = await put(key, JSON.stringify(doc), {
        contentType: 'application/json',
        access: 'public',
        addRandomSuffix: false,
        token
      });

      return new Response(JSON.stringify({ ok: true, url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    const detail = e?.message || String(e);
    return new Response(JSON.stringify({ error: 'server_error', detail }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}