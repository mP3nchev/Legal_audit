'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Loader2, ExternalLink } from 'lucide-react';
import { proxyUrl } from '@/lib/utils';

/** Creates (or finds) the published demo audit "ТЕСТОВ" and links to its public page. */
export function CreateDemoButton() {
  const router = useRouter();
  const [busy, setBusy]     = useState(false);
  const [link, setLink]     = useState(null);
  const [exists, setExists] = useState(false);
  const [error, setError]   = useState(null);

  async function call(recreate) {
    if (recreate && !confirm('Тестовият одит ще бъде изтрит и създаден наново с нови текстове, а публичният му линк ще се смени. Продължи?')) return;
    setBusy(true);
    setError(null);
    try {
      const res  = await fetch(proxyUrl('/api/toc/admin/demo'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(recreate ? { recreate: true } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setLink(data.share_url);
      setExists(!!data.already_exists);
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-red-600">Грешка: {error}</span>}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          Публичен линк <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {exists && (
        <button type="button" onClick={() => call(true)} disabled={busy}
          className="text-xs text-gray-500 underline hover:text-gray-700 disabled:opacity-50">
          Пресъздай с нови текстове
        </button>
      )}
      <button type="button" onClick={() => call(false)} disabled={busy}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
        Тестов одит
      </button>
    </div>
  );
}
