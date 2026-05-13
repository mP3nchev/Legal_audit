'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { proxyUrl } from '@/lib/utils';

export function DeleteAuditButton({ uid, clientName }) {
  const router   = useRouter();
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState(null);

  async function handleDelete() {
    if (!confirm(`Изтриване на одит за „${clientName}"?\n\nТова действие е необратимо.`)) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(proxyUrl(`/api/toc/${uid}`), { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        title="Изтрий одита"
        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors"
      >
        {busy
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Trash2  className="h-4 w-4" />}
      </button>
      {error && <span className="text-[10px] text-red-600 text-center max-w-[60px] leading-tight">{error}</span>}
    </div>
  );
}
