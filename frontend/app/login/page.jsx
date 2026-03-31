'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import { loginAction } from './actions';

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get('next') || '/dashboard';

  const [error,   setError]   = useState(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push(next);
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>

          {/* Header */}
          <div className="px-8 py-8 text-center"
            style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/craftpolicy-logo.svg" alt="CraftPolicy" className="h-7 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-2"
              style={{ color: '#0155b9' }}>
              <Lock className="h-4 w-4" />
              <span className="text-sm font-semibold">Достъп до системата</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--cp-neutral-80)' }}>
                Парола
              </label>
              <input
                type="password"
                name="password"
                autoFocus
                required
                placeholder="Въведете паролата"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition"
                style={{
                  borderColor:     error ? '#fca5a5' : 'var(--cp-neutral-40)',
                  backgroundColor: error ? '#fef2f2' : 'white',
                  color:           'var(--cp-neutral-100)',
                }}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0155b9' }}>
              {pending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Влизане...</>
                : 'Вход'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
