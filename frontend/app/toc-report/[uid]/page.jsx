/**
 * /toc-report/[uid] — Production audit report page (server component)
 *
 * Design: 1:1 with /toc-report/test (Cover + Scope + Methodology),
 * followed by EditModeClient for interactive Privacy + T&C sections.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Microscope, CheckCircle2, FlaskConical, AlertCircle,
  ExternalLink, ArrowLeft,
} from 'lucide-react';
import { EditModeClient }              from './EditModeClient';
import { CoverSection, ScopeSection }  from '@/app/toc-report/_sections';
import { reportI18n }                  from '@/lib/i18n';

const BACKEND_URL  = process.env.BACKEND_API_URL  || 'http://localhost:3001';
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || '';

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
  if (!data) return { title: 'Одит не е намерен - CraftPolicy' };
  return { title: `${data.audit?.client_name ?? 'Одит'} - CraftPolicy` };
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    completed: { bg: '#f0fdf4', text: '#15803d', label: 'Завършен'   },
    partial:   { bg: '#fefce8', text: '#a16207', label: 'Частичен'   },
    pending:   { bg: 'var(--cp-neutral-20)', text: 'var(--cp-neutral-60)', label: 'Изчакване' },
    running:   { bg: 'var(--cp-blue-15)',    text: 'var(--cp-blue-100)', label: 'Анализ...' },
    failed:    { bg: '#fef2f2', text: '#b91c1c', label: 'Грешка'     },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function TocReportPage({ params, searchParams }) {
  const lang = searchParams?.lang === 'en' ? 'en' : 'bg';
  const t    = { ...reportI18n[lang], lang };

  const data = await fetchAudit(params.uid);
  if (!data) notFound();

  const { audit, privacy_result, toc_result } = data;
  const isPublished = !!audit.published_at;
  const shareUid    = audit.share_uid ?? null;

  return (
    <div className="space-y-10 pb-16" style={{ color: 'var(--cp-neutral-100)' }}>

      {/* Navigation header */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard"
          className="flex items-center gap-1 text-sm hover:underline transition"
          style={{ color: 'var(--cp-neutral-60)' }}>
          <ArrowLeft className="h-4 w-4" /> Табло
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={audit.status} />
          <span className="rounded px-2 py-0.5 text-xs font-mono"
            style={{ backgroundColor: 'var(--cp-neutral-20)', color: 'var(--cp-neutral-60)' }}>
            {audit.uid}
          </span>
          {isPublished && shareUid && (
            <Link
              href={`/toc-report/share/${shareUid}`}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:opacity-90 transition"
              style={{ borderColor: 'var(--cp-blue-40)', backgroundColor: 'var(--cp-blue-5)', color: 'var(--cp-blue-100)' }}>
              Публична версия <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Cover section */}
      <CoverSection audit={audit} t={t} />

      {/* Scope & Methodology */}
      <ScopeSection t={t} />

      {/* Interactive audit sections (Privacy + T&C) */}
      <EditModeClient
        audit={audit}
        privacy_result={privacy_result}
        toc_result={toc_result}
        isPublished={isPublished}
        shareUid={shareUid}
      />

    </div>
  );
}
