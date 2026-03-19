/**
 * /toc-report/[uid] — Full audit report page
 *
 * Server component: fetches audit data, renders static shell.
 * Passes result data to EditModeClient for interactive editing.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { EditModeClient }    from './EditModeClient';
import { ScoreCards }        from '@/components/toc/ScoreCards';
import { VerbalScale }       from '@/components/toc/VerbalScale';
import { PriorityTimeline }  from '@/components/toc/PriorityTimeline';

const BACKEND_URL    = process.env.BACKEND_API_URL    || 'http://localhost:3001';
const INTERNAL_KEY   = process.env.INTERNAL_API_KEY   || '';

async function fetchAudit(uid) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/toc/${uid}`, {
      headers: { 'x-api-key': INTERNAL_KEY },
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await fetchAudit(params.uid);
  if (!data) return { title: 'Одит не е намерен — CraftPolicy' };
  return { title: `${data.audit?.client_name ?? 'Одит'} — CraftPolicy` };
}

function StatusBadge({ status }) {
  const map = {
    completed: { cls: 'bg-green-100 text-green-800',  label: 'Завършен'  },
    partial:   { cls: 'bg-yellow-100 text-yellow-800', label: 'Частичен' },
    pending:   { cls: 'bg-gray-100 text-gray-600',     label: 'Изчакване'},
    running:   { cls: 'bg-blue-100 text-blue-700',     label: 'Анализ...' },
    failed:    { cls: 'bg-red-100 text-red-700',       label: 'Грешка'    },
  };
  const s = map[status] ?? map.pending;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function DocSection({ title, result, auditUid, docType, isPublished, shareUid }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
        {title} — не е качен / не е анализиран
      </div>
    );
  }
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {/* Read-only score summary + verbal scale in static view */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EditModeClient
            auditUid={auditUid}
            docType={docType}
            initialResult={result}
            isPublished={isPublished}
            shareUid={shareUid}
          />
        </div>
        <div className="space-y-4">
          <VerbalScale pct={result.total_pct} />
          <PriorityTimeline criteria={result.criteria ?? []} docType={docType} />
        </div>
      </div>
    </section>
  );
}

export default async function TocReportPage({ params }) {
  const data = await fetchAudit(params.uid);
  if (!data) notFound();

  const { audit, privacy_result, toc_result } = data;
  const isPublished = !!audit.published_at;
  const shareUid    = audit.share_uid ?? null;

  const createdAt = audit.created_at
    ? new Date(audit.created_at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition mb-2">
            <ArrowLeft className="h-4 w-4" /> Табло
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{audit.client_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <StatusBadge status={audit.status} />
            <span>{createdAt}</span>
            {audit.site_url && (
              <a href={audit.site_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-500 hover:underline">
                {audit.site_url} <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 font-mono">{audit.uid}</span>
          </div>
        </div>
        {isPublished && shareUid && (
          <Link
            href={`/toc-report/share/${shareUid}`}
            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition shrink-0"
          >
            Публична версия
          </Link>
        )}
      </div>

      {/* Privacy Policy section */}
      <DocSection
        title="Privacy Policy"
        result={privacy_result}
        auditUid={audit.uid}
        docType="privacy"
        isPublished={isPublished}
        shareUid={shareUid}
      />

      {/* T&C section */}
      <DocSection
        title="Terms & Conditions"
        result={toc_result}
        auditUid={audit.uid}
        docType="toc"
        isPublished={isPublished}
        shareUid={shareUid}
      />
    </div>
  );
}
