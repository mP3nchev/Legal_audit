'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const CP_PASSWORD     = process.env.CP_PASSWORD      ?? 'CP2@26$';
const SESSION_TOKEN   = process.env.CP_SESSION_TOKEN ?? 'cp_session_2026_default';

export async function loginAction(formData) {
  const password = formData.get('password');

  if (!password || password !== CP_PASSWORD) {
    return { error: 'Грешна парола. Опитайте отново.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('cp_auth', SESSION_TOKEN, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30, // 30 days
    path:     '/',
  });

  return { ok: true };
}
