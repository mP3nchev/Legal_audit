/**
 * Shared report sections — used by both the edit view (/toc-report/[uid])
 * and the public share page (/toc-report/share/[share_uid]).
 *
 * Server component (no 'use client').
 */

import {
  Globe, Calendar, User, Building2,
  Microscope, CheckCircle2, FlaskConical, AlertCircle,
} from 'lucide-react';

// ── Detail cell ───────────────────────────────────────────────────────────────
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

// ── Cover section ─────────────────────────────────────────────────────────────
export function CoverSection({ audit, t }) {
  const locale   = t.lang === 'en' ? 'en-GB' : 'bg-BG';
  const scanDate = audit.created_at
    ? new Date(audit.created_at).toLocaleDateString(locale, {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Sofia',
      })
    : '-';

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
          <DetailCell icon={<Globe     className="h-4 w-4" />} label={t.website}     value={audit.site_url || '-'} />
          <DetailCell icon={<Calendar  className="h-4 w-4" />} label={t.scanDate}    value={scanDate} />
          <DetailCell icon={<User      className="h-4 w-4" />} label={t.preparedFor} value={audit.client_name || '-'} />
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

// ── Scope & Methodology section ───────────────────────────────────────────────
export function ScopeSection({ t }) {
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
