/**
 * /toc-report/[uid] — Production audit report page (server component)
 *
 * Design: 1:1 with /toc-report/test (Cover + Scope + Methodology),
 * followed by EditModeClient for interactive Privacy + T&C sections.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Globe, Calendar, User, Building2,
  Microscope, CheckCircle2, FlaskConical, AlertCircle,
  ExternalLink, ArrowLeft,
} from 'lucide-react';
import { EditModeClient } from './EditModeClient';
import { reportI18n }    from '@/lib/i18n';

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
  if (!data) return { title: 'Одит не е намерен — CraftPolicy' };
  return { title: `${data.audit?.client_name ?? 'Одит'} — CraftPolicy` };
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

// ── Cover section (exact test design) ────────────────────────────────────────
function DetailCell({ icon, label, value }) {
  return (
    <div className="px-6 py-4" style={{ backgroundColor: 'var(--cp-white)' }}>
      <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--cp-neutral-80)' }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-medium break-all" style={{ color: 'var(--cp-neutral-100)' }}>{value}</p>
    </div>
  );
}

function CoverSection({ audit, t }) {
  const scanDate = audit.created_at
    ? new Date(audit.created_at).toLocaleDateString('en-GB')
    : '—';

  return (
    <section id="cover" className="scroll-mt-24">
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
        <div className="px-8 py-10" style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
          <div className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/craftpolicy-logo.svg" alt="CraftPolicy" className="h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight lg:text-4xl"
            style={{ color: 'var(--cp-blue-100)', whiteSpace: 'pre-line' }}>
            {t.auditTitle}
          </h1>
          <p className="mt-3 text-base" style={{ color: '#4a5568' }}>{t.tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: 'var(--cp-neutral-40)' }}>
          <DetailCell icon={<Globe     className="h-4 w-4" />} label={t.website}     value={audit.site_url || '—'} />
          <DetailCell icon={<Calendar  className="h-4 w-4" />} label={t.scanDate}    value={scanDate} />
          <DetailCell icon={<User      className="h-4 w-4" />} label={t.preparedFor} value={audit.client_name} />
          <DetailCell icon={<Building2 className="h-4 w-4" />} label={t.preparedBy}  value="CraftPolicy Audit team" />
        </div>
        <div className="border-t px-8 py-4"
          style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-blue-5)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
            <span className="font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
              {t.confidenceLabel}:
            </span>{' '}{t.confidenceText}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Scope & Methodology (static — content lives in reportI18n) ───────────────
function ScopeSection({ t }) {
  return (
    <section id="scope" className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
          <Microscope className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--cp-neutral-100)' }}>{t.scopeTitle}</h2>
          <p className="text-xs" style={{ color: 'var(--cp-neutral-80)' }}>{t.scopeSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: audit bullets */}
        <div className="rounded-xl border p-5"
          style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-neutral-20)' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--cp-success)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
              {t.whatTestedLabel}
            </h3>
          </div>
          <ul className="space-y-2">
            {t.whatTested.map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--cp-blue-100)' }} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--cp-neutral-90)' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: method cards */}
        <div className="space-y-3">
          {t.methodCards.map((m, i) => (
            <div key={i} className="rounded-xl border p-4"
              style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <FlaskConical className="h-3.5 w-3.5" style={{ color: 'var(--cp-blue-100)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
                  {m.heading}
                </h4>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
                {m.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: transparency notice */}
      <div className="mt-6 rounded-xl border p-4"
        style={{ borderColor: 'var(--cp-blue-40)', backgroundColor: 'var(--cp-blue-5)' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4" style={{ color: 'var(--cp-blue-150)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
            {t.limitationsLabel}
          </h3>
        </div>
        <ul className="space-y-1.5">
          {t.limitations.map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: 'var(--cp-blue-150)' }} />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-90)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
