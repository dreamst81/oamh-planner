import { supabaseServer } from '@/lib/supabase-server';

export default async function Dashboard() {
  const supabase = await supabaseServer();   // ← FIXED

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user?.id)
    .single();

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>
      <p>Welcome back, {profile?.full_name || 'User'}!</p>
      <p>Your role: <strong>{profile?.role}</strong></p>
    </div>
  );
}