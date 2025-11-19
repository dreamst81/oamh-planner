'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function signIn(e: any) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-900 text-white">
      <form className="space-y-4 w-80" onSubmit={signIn}>
        <h1 className="text-xl font-bold mb-4">Sign in</h1>

        <input
          className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button
          className="w-full p-2 bg-blue-600 rounded hover:bg-blue-500"
          type="submit"
        >
          Log In
        </button>
      </form>
    </div>
  );
}