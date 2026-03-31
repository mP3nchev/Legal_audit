/**
 * /toc-report/share/[share_uid] — Public read-only report
 *
 * Uses the same Cover + Scope + EditModeClient layout as the edit view.
 * No navigation header (NavHeader hides itself on this path).
 * No auth required — public link.
 */

import { notFound }                    from 'next/navigation';
import { CoverSection, ScopeSection }  from '@/app/toc-report/_sections';
import { EditModeClient }              from '@/app/toc-report/[uid]/EditModeClient';
import { reportI18n }                  from '@/lib/i18n';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

async function fetchShare(shareUid) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/toc/share/${shareUid}`, {
      next: { revalidate: 3600 },
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

  const lang = audit?.language === 'en' ? 'en' : 'bg';
  const t    = { ...reportI18n[lang], lang };

  return (
    <div className="space-y-10 pb-16" style={{ color: 'var(--cp-neutral-100)' }}>

      {/* Cover section */}
      <CoverSection audit={audit ?? {}} t={t} />

      {/* Scope & Methodology */}
      <ScopeSection t={t} />

      {/* Audit content — identical layout to edit view, fully read-only */}
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
