/**
 * /toc-report/share/[share_uid] — Public read-only report
 *
 * Server component: no auth required.
 * Uses immutable published_json snapshot from backend.
 */

import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { ScoreCards }       from '@/components/toc/ScoreCards';
import { VerbalScale }      from '@/components/toc/VerbalScale';
import { PriorityTimeline } from '@/components/toc/PriorityTimeline';
import { CriteriaTable }    from '@/components/toc/CriteriaTable';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

async function fetchShare(shareUid) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/toc/share/${shareUid}`, {
      cache: 'force-cache', // immutable snapshot — safe to cache
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await fetchShare(params.share_uid);
  if (!data) return { title: 'Споделен одит — CraftPolicy' };
  return {
    title: `${data.client_name ?? 'Одит'} — CraftPolicy`,
    description: `Правен одит на ${data.site_url ?? ''}`,
  };
}

function ResultBlock({ title, result, docType }) {
  if (!result) return null;
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">{title}</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ScoreCards scoringResult={result} docType={docType} />
          <CriteriaTable criteria={result.criteria ?? []} readOnly />
        </div>
        <div className="space-y-4">
          <VerbalScale pct={result.total_pct} />
          <PriorityTimeline criteria={result.criteria ?? []} docType={docType} />
        </div>
      </div>
    </section>
  );
}

export default async function SharePage({ params }) {
  const data = await fetchShare(params.share_uid);
  if (!data) notFound();

  const { client_name, site_url, business_type, published_at, privacy_result, toc_result } = data;

  const publishedDate = published_at
    ? new Date(published_at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-10">
      {/* Public header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700 mb-2">
              Публичен правен одит
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{client_name}</h1>
            {site_url && (
              <a href={site_url} target="_blank" rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-sm text-blue-500 hover:underline">
                {site_url} <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <p className="mt-2 text-xs text-gray-400">
              Публикувано: {publishedDate}
              {business_type && <> · Тип бизнес: <span className="capitalize">{business_type}</span></>}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-400">Изготвен от</p>
            <p className="text-sm font-semibold text-gray-700">CraftPolicy</p>
            <p className="text-xs text-gray-400">с Claude AI</p>
          </div>
        </div>
      </div>

      <ResultBlock title="Privacy Policy" result={privacy_result} docType="privacy" />
      <ResultBlock title="Terms & Conditions" result={toc_result} docType="toc" />

      {/* Footer */}
      <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
        Генерирано автоматично с изкуствен интелект. Не е правен съвет.
      </div>
    </div>
  );
}
