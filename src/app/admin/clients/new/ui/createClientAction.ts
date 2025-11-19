'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabaseServer } from '@/lib/supabase-server';
import { Resend } from 'resend';
import crypto from 'crypto';

export default async function createClientAction(formData: FormData) {
  try {
    const full_name = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    const title = formData.get('title') as string;
    const location = formData.get('location') as string;
    const starts_at = formData.get('starts_at') as string;
    const ends_at = formData.get('ends_at') as string;

    // Generate a secure password
    const password = crypto.randomBytes(8).toString('hex');

    // Create user in auth
    const { data: authUser, error: authErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authErr) return { error: authErr.message };

    const userId = authUser.user?.id!;
    const supabase = await supabaseServer();

    // Insert profile
    await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        phone,
        role: 'client',
      });

    // Insert event
    const { error: eventErr } = await supabaseAdmin
      .from('events')
      .insert({
        client_id: userId,
        title,
        location,
        starts_at,
        ends_at,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

    if (eventErr) return { error: eventErr.message };

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY!);

    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: 'Your OAMH Planner Account',
      text: `
        Hi ${full_name},

        Your account for the Oakes Ames Hall Floor Planner has been created.

        Login email: ${email}
        Temporary password: ${password}

        Login here:
        ${process.env.APP_BASE_URL}/login

        You can change your password once logged in.
      `,
    });

    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}