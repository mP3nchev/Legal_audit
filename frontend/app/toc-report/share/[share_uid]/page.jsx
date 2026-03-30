/**
 * /toc-report/share/[share_uid] — Public read-only report
 *
 * Uses the same layout as the edit view (EditModeClient with isPublished=true).
 * Server component: no auth required.
 * Data comes from the immutable published_json snapshot stored at publish time.
 */

import { notFound }        from 'next/navigation';
import { ExternalLink }    from 'lucide-react';
import { EditModeClient }  from '@/app/toc-report/[uid]/EditModeClient';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

async function fetchShare(shareUid) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/toc/share/${shareUid}`, {
      next: { revalidate: 3600 }, // revalidate hourly; immutable but allows cache busting on redeploy
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
  if (!data) return { title: 'Споделен одит - CraftPolicy' };
  return {
    title:       `${data.audit?.client_name ?? 'Одит'} - CraftPolicy`,
    description: `Правен одит на ${data.audit?.site_url ?? ''}`,
  };
}

export default async function SharePage({ params }) {
  const data = await fetchShare(params.share_uid);
  if (!data) notFound();

  const { audit, privacy_result, toc_result } = data;

  const publishedDate = audit?.published_at
    ? new Date(audit.published_at).toLocaleDateString('bg-BG', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '-';

  return (
    <div className="space-y-10 pb-16" style={{ color: 'var(--cp-neutral-100)' }}>

      {/* ── Public header ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
        <div className="px-8 py-10"
          style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
          <div className="mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/craftpolicy-logo.svg" alt="CraftPolicy" className="h-8" />
          </div>
          <span className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold mb-3"
            style={{ backgroundColor: 'rgba(1,85,185,0.15)', color: '#0155b9' }}>
            Публичен правен одит
          </span>
          <h1 className="text-3xl font-bold tracking-tight leading-tight lg:text-4xl"
            style={{ color: 'var(--cp-blue-100)' }}>
            {audit?.client_name ?? '-'}
          </h1>
          {audit?.site_url && (
            <a href={audit.site_url} target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm hover:underline transition"
              style={{ color: '#4a5568' }}>
              {audit.site_url} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="px-8 py-3 flex flex-wrap items-center gap-6 text-xs"
          style={{
            borderTop: '1px solid var(--cp-neutral-40)',
            backgroundColor: 'var(--cp-blue-5)',
            color: 'var(--cp-neutral-80)',
          }}>
          <span>Публикувано: <span className="font-medium">{publishedDate}</span></span>
          {audit?.business_type && (
            <span>
              Тип бизнес:{' '}
              <span className="capitalize font-medium">{audit.business_type}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Audit content — identical layout to edit view, fully read-only ── */}
      <EditModeClient
        audit={audit ?? {}}
        privacy_result={privacy_result}
        toc_result={toc_result}
        isPublished={true}
        shareUid={null}
        isSharePage={true}
      />

    </div>
  );
}
