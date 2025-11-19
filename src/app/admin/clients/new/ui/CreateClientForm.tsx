'use client';

import { useState } from 'react';
import createClientAction from './createClientAction';

export default function CreateClientForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const formData = new FormData(e.currentTarget);
    const res = await createClientAction(formData);

    if (res.error) {
      setMsg(res.error);
    } else {
      setMsg('Client created and invited successfully!');
      e.target.reset();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <h2 className="text-xl font-bold">Client Info</h2>

      <input
        name="full_name"
        required
        placeholder="Client Full Name"
        className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
      />

      <input
        name="email"
        type="email"
        required
        placeholder="Client Email"
        className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
      />

      <input
        name="phone"
        placeholder="Phone Number"
        className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
      />

      <h2 className="text-xl font-bold pt-4">Event Info</h2>

      <input
        name="title"
        required
        placeholder="Event Title"
        className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
      />

      <select
        name="location"
        className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
      >
        <option>Hall A</option>
        <option>Hall B</option>
        <option>Hall C</option>
        <option>Loggia</option>
      </select>

      <input
        name="starts_at"
        type="datetime-local"
        required
        className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
      />

      <input
        name="ends_at"
        type="datetime-local"
        required
        className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
      />

      <button
        disabled={loading}
        className="p-2 bg-blue-600 rounded hover:bg-blue-500 w-full"
        type="submit"
      >
        {loading ? 'Creating…' : 'Create Client + Event'}
      </button>

      {msg && <p className="mt-3 text-green-400">{msg}</p>}
    </form>
  );
}