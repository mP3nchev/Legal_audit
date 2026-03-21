'use client';
// ⚠️ TEST ONLY — delete together with lib/test-audit-fixture.js when done.
// Route: /toc-report/test  |  Trigger: client_name=CP_TEST + site=https://craftpolicy.com/

import { useState } from 'react';
import {
  Globe, Calendar, User, Building2, ScanLine, Shield,
  Microscope, CheckCircle2, FlaskConical, AlertCircle,
  FileText, ChevronDown, ChevronUp, XCircle, ExternalLink,
} from 'lucide-react';
import { TEST_AUDIT_META, TEST_PRIVACY_RESULT } from '@/lib/test-audit-fixture';

// ── Tier label map ────────────────────────────────────────────────────────────
const TIER_LABELS = {
  1: 'Организационна прозрачност',
  2: 'Правно основание & съхранение',
  3: 'Потребителски права & проследяване',
  4: 'Допълнителни изисквания',
};

// ── Static mock data ──────────────────────────────────────────────────────────
const META = {
  targetUrl:   TEST_AUDIT_META.site_url,
  scanDate:    new Date(TEST_AUDIT_META.created_at).toLocaleDateString('en-GB'),
  auditType:   'Privacy Policy — GDPR Compliance',
  preparedFor: TEST_AUDIT_META.client_name,
  preparedBy:  'CraftPolicy Audit Engine v1',
  scanId:      TEST_AUDIT_META.uid,
};

const SCOPE = {
  whatWeTested: [
    'Наличие и достъпност на Privacy Policy документа',
    'Идентификация на администратора на лични данни',
    'Правно основание за обработка съгласно чл. 6 GDPR',
    'Права на субектите на данни (достъп, коригиране, изтриване)',
    'Срокове за съхранение на лични данни',
    'Политика за бисквитки и технологии за проследяване',
    'Трансфер на данни извън ЕС/ЕИП',
    'Информация за надзорни органи и DPO контакти',
  ],
  howWeTested: [
    {
      method:      'Автоматичен текстов анализ',
      description: 'Claude AI прочита и анализира съдържанието на документа спрямо 8-те критерия, разпределени в 4 нива с различна тежест.',
    },
    {
      method:      'Претеглена оценка (×множител)',
      description: 'Всяко ниво носи различна тежест: Ниво 1 ×3, Ниво 2 ×2, Ниво 3 ×1.5, Ниво 4 ×1. Крайният резултат е претегленото средно.',
    },
    {
      method:      'Verbal scale класификация',
      description: 'Крайният процент се преобразува в 6-степенна скала от „Критичен риск" до „Пълно съответствие" за лесна интерпретация.',
    },
  ],
  limitations: [
    'Анализът е базиран единствено на текстовото съдържание на предоставения документ.',
    'Техническото изпълнение (cookie banner, consent management) не се проверява в тази версия.',
    'Резултатите са индикативни и не заместват юридическа консултация.',
  ],
};

// Derive privacy analysis data from the fixture
const { criteria, tier_scores, total_score, total_max_score } = TEST_PRIVACY_RESULT;
const PRIVACY_ANALYSIS = {
  tiers: [1, 2, 3, 4].map(t => {
    const ts    = tier_scores[`tier${t}`];
    const items = criteria.filter(c => c.tier === t);
    const pct   = Math.round(ts.pct);
    return {
      id:          `tier${t}`,
      name:        `Ниво ${t} — ${TIER_LABELS[t]}`,
      severity:    pct >= 76 ? 'low' : pct >= 61 ? 'medium' : pct >= 31 ? 'high' : 'critical',
      percentage:  pct,
      earnedPoints: ts.score,
      maxPoints:   ts.max,
      criteria: items.map(c => ({
        name:        c.name,
        status:      c.score >= 4 ? 'pass' : c.score === 3 ? 'warning' : 'fail',
        score:       c.score,
        maxScore:    5,
        explanation: c.explanation,
      })),
    };
  }),
  finalScore: total_score,
  finalTotal: total_max_score,
};

// ── Shared layout wrapper ─────────────────────────────────────────────────────
function ReportSection({ id, title, subtitle, icon, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--cp-neutral-100)' }}>{title}</h2>
          {subtitle && <p className="text-xs" style={{ color: 'var(--cp-neutral-80)' }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// ── Cover page ────────────────────────────────────────────────────────────────
function CoverSection({ meta }) {
  return (
    <section id="cover" className="scroll-mt-24">
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
        {/* Top gradient band */}
        <div className="px-8 py-10" style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg font-black text-white text-sm"
              style={{ backgroundColor: 'var(--cp-blue-100)' }}>CP</div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--cp-blue-100)' }}>CraftPolicy</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight lg:text-4xl"
            style={{ color: 'var(--cp-blue-100)' }}>
            GDPR & Privacy Policy<br />Compliance Audit
          </h1>
          <p className="mt-3 text-base" style={{ color: '#4a5568' }}>
            Executive-level compliance assessment with actionable recommendations
          </p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
          style={{ backgroundColor: 'var(--cp-neutral-40)' }}>
          <DetailCell icon={<Globe className="h-4 w-4" />}     label="Website"      value={meta.targetUrl} />
          <DetailCell icon={<Calendar className="h-4 w-4" />}  label="Scan Date"    value={meta.scanDate} />
          <DetailCell icon={<ScanLine className="h-4 w-4" />}  label="Audit Type"   value={meta.auditType} />
          <DetailCell icon={<User className="h-4 w-4" />}      label="Prepared For" value={meta.preparedFor} />
          <DetailCell icon={<Building2 className="h-4 w-4" />} label="Prepared By"  value={meta.preparedBy} />
          <DetailCell icon={<Shield className="h-4 w-4" />}    label="Scan ID"      value={meta.scanId} mono />
        </div>

        {/* Confidence note */}
        <div className="border-t px-8 py-4" style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-blue-5)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
            <span className="font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>Confidence Level:</span>{' '}
            This audit combines automated document analysis with AI-assisted evaluation to ensure
            high-confidence findings. Evidence is derived from the submitted document and validated
            against GDPR compliance criteria.
          </p>
        </div>
      </div>
    </section>
  );
}

function DetailCell({ icon, label, value, mono = false }) {
  return (
    <div className="px-6 py-4" style={{ backgroundColor: 'var(--cp-white)' }}>
      <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--cp-neutral-80)' }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-sm font-medium break-all ${mono ? 'font-mono text-xs' : ''}`}
        style={{ color: 'var(--cp-neutral-100)' }}>
        {value}
      </p>
    </div>
  );
}

// ── Scope & Methodology ───────────────────────────────────────────────────────
function ScopeSection({ scope }) {
  return (
    <ReportSection
      id="scope"
      title="Scope & Methodology"
      subtitle="What we tested and how we tested it"
      icon={<Microscope className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* What we tested */}
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-neutral-20)' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--cp-success)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>What We Tested</h3>
          </div>
          <ul className="space-y-2">
            {scope.whatWeTested.map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--cp-blue-100)' }} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--cp-neutral-90)' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* How we tested */}
        <div className="space-y-3">
          {scope.howWeTested.map(method => (
            <div key={method.method} className="rounded-xl border p-4" style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <FlaskConical className="h-3.5 w-3.5" style={{ color: 'var(--cp-blue-100)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>{method.method}</h4>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>{method.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div className="mt-6 rounded-xl border p-4" style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-warning-light)' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4" style={{ color: 'var(--cp-warning)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>Limitations</h3>
        </div>
        <ul className="space-y-1.5">
          {scope.limitations.map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--cp-warning)' }} />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-90)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </ReportSection>
  );
}

// ── Score dots (responsive size) ──────────────────────────────────────────────
function ScoreDots({ score, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          display:         'inline-block',
          width:           '0.9375rem',   // 15px → rem
          height:          '0.9375rem',
          borderRadius:    '50%',
          backgroundColor: i < score ? 'var(--cp-blue-100)' : 'var(--cp-neutral-40)',
          flexShrink:      0,
        }} />
      ))}
      <span className="ml-1.5 text-xs font-bold tabular-nums" style={{ color: 'var(--cp-neutral-80)' }}>
        {score}/5
      </span>
    </div>
  );
}

// ── Audit table (modified) ────────────────────────────────────────────────────
function AuditTableSection({ criteria, tierScores }) {
  const tiers = [1, 2, 3, 4].map(t => ({
    num:   t,
    label: TIER_LABELS[t],
    ts:    tierScores[`tier${t}`],
    items: criteria.filter(c => c.tier === t),
  }));

  return (
    <ReportSection
      id="audit-table"
      title="Детайлна одитна таблица"
      subtitle={`Privacy Policy · ${criteria.length} критерия · 4 нива`}
      icon={<FileText className="h-5 w-5" />}
    >
      <div className="space-y-[1.25rem]">
        {tiers.map(({ num, label, ts, items }) => {
          const pct = Math.round(ts?.pct ?? 0);
          return (
            <div key={num} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--cp-neutral-40)' }}>
              {/* Tier header with % */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: 'var(--cp-blue-150)', color: 'white' }}>
                <span className="text-sm font-bold">Ниво {num} — {label}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {pct}% съответствие
                </span>
              </div>

              {/* Column headers */}
              <div className="grid text-[11px] font-bold uppercase tracking-wide px-4 py-2"
                style={{
                  gridTemplateColumns: '44px 1fr 140px 1fr',
                  gap:                 '16px',
                  backgroundColor:     'var(--cp-blue-15)',
                  color:               'var(--cp-blue-150)',
                }}>
                <div>#</div>
                <div>Критерий</div>
                <div>Оценка</div>
                <div>Констатации & обяснение</div>
              </div>

              {/* Rows */}
              {items.map((c, idx) => (
                <div key={c.id}
                  className="grid px-4 py-4 items-start"
                  style={{
                    gridTemplateColumns: '44px 1fr 140px 1fr',
                    gap:                 '16px',
                    borderTop:           '1px solid var(--cp-neutral-40)',
                    backgroundColor:     idx % 2 === 0 ? 'white' : 'var(--cp-neutral-20)',
                  }}>
                  {/* Index bubble */}
                  <div className="flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold tabular-nums"
                    style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
                    {c.id - 100}
                  </div>

                  {/* Name */}
                  <p className="text-sm font-semibold leading-snug pt-0.5"
                    style={{ color: 'var(--cp-neutral-100)' }}>
                    {c.name}
                  </p>

                  {/* Score dots only (no label below) */}
                  <div className="pt-0.5">
                    <ScoreDots score={c.score} />
                  </div>

                  {/* Explanation */}
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
                    {c.explanation}
                  </p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </ReportSection>
  );
}

// ── Privacy Policy Analysis (adapted from privacy-policy-analysis.tsx) ────────
function StatusIcon({ status }) {
  switch (status) {
    case 'pass':    return <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--cp-success)' }} />;
    case 'fail':    return <XCircle      className="h-4 w-4 shrink-0" style={{ color: 'var(--cp-error)'   }} />;
    case 'warning': return <AlertCircle  className="h-4 w-4 shrink-0" style={{ color: 'var(--cp-warning)' }} />;
  }
}

function SeverityBadge({ severity, label }) {
  const map = {
    critical: { bg: 'var(--cp-error-light)',   text: 'var(--cp-error)'   },
    high:     { bg: '#fff7ed',                 text: '#c2410c'            },
    medium:   { bg: 'var(--cp-blue-15)',       text: 'var(--cp-blue-150)' },
    low:      { bg: 'var(--cp-success-light)', text: 'var(--cp-success)'  },
  };
  const s = map[severity] ?? map.medium;
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}>
      {label}
    </span>
  );
}

function TierAccordion({ tier }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--cp-neutral-40)' }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors"
        style={{ backgroundColor: expanded ? 'var(--cp-blue-5)' : 'var(--cp-neutral-20)' }}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>{tier.name}</h3>
          <SeverityBadge severity={tier.severity} label={`${tier.percentage}%`} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--cp-neutral-80)' }}>
            {tier.earnedPoints}/{tier.maxPoints} pts
          </span>
          {expanded
            ? <ChevronUp   className="h-4 w-4" style={{ color: 'var(--cp-neutral-80)' }} />
            : <ChevronDown className="h-4 w-4" style={{ color: 'var(--cp-neutral-80)' }} />}
        </div>
      </button>

      {expanded && (
        <div style={{ backgroundColor: 'var(--cp-blue-5)' }}>
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {tier.criteria.map(c => (
              <div key={c.name} className="px-5 py-3.5" style={{ backgroundColor: 'var(--cp-white)', borderTopColor: 'var(--cp-neutral-40)', borderTopWidth: '1px' }}>
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-start gap-2.5 flex-1">
                    <StatusIcon status={c.status} />
                    <span className="text-sm font-medium" style={{ color: 'var(--cp-neutral-100)' }}>{c.name}</span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: 'var(--cp-neutral-80)' }}>
                    {c.score}/{c.maxScore}
                  </span>
                </div>
                <p className="text-xs leading-relaxed pl-[26px]" style={{ color: 'var(--cp-neutral-80)' }}>
                  {c.explanation}
                </p>
              </div>
            ))}
          </div>
          {/* Tier subtotal */}
          <div className="flex items-center justify-between px-5 py-3 border-t"
            style={{ backgroundColor: 'var(--cp-neutral-20)', borderColor: 'var(--cp-neutral-40)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
              {tier.name.split(' — ')[0]} Subtotal:
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--cp-neutral-100)' }}>
              {tier.percentage}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function PrivacyAnalysisSection({ data }) {
  const { tiers, finalScore, finalTotal } = data;
  const totalCriteria  = tiers.reduce((a, t) => a + t.criteria.length, 0);
  const passedCriteria = tiers.reduce((a, t) => a + t.criteria.filter(c => c.status === 'pass').length, 0);
  const failedCriteria = tiers.reduce((a, t) => a + t.criteria.filter(c => c.status === 'fail').length, 0);
  const finalPct       = finalTotal > 0 ? Math.round((finalScore / finalTotal) * 100) : 0;

  return (
    <ReportSection
      id="privacy-analysis"
      title="Privacy Policy Analysis"
      subtitle="Compliance criteria evaluation with detailed explanations"
      icon={<FileText className="h-5 w-5" />}
    >
      {/* Quick stats — 3 columns (not 4) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl px-4 py-3 text-center"
          style={{ backgroundColor: 'var(--cp-neutral-20)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--cp-neutral-100)' }}>{totalCriteria}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cp-neutral-80)' }}>
            Общо критерии
          </p>
        </div>
        <div className="rounded-xl px-4 py-3 text-center"
          style={{ backgroundColor: 'var(--cp-error-light)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--cp-error)' }}>{failedCriteria}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cp-error)' }}>
            Несъответствие
          </p>
        </div>
        <div className="rounded-xl px-4 py-3 text-center"
          style={{ backgroundColor: 'var(--cp-success-light)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--cp-success)' }}>{passedCriteria}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cp-success)' }}>
            Съответствие
          </p>
        </div>
      </div>

      {/* Tier accordions */}
      <div className="space-y-4">
        {tiers.map(tier => <TierAccordion key={tier.id} tier={tier} />)}
      </div>

      {/* Final score block — #d2e2f5 bg, #0155b9 text */}
      <div className="mt-6 rounded-xl overflow-hidden">
        <div className="relative px-6 py-6 text-center" style={{ backgroundColor: '#d2e2f5' }}>
          {/* Progress bar */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="h-full transition-all duration-500"
              style={{ width: `${finalPct}%`, backgroundColor: '#ACCEF7' }} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: '#0155b9' }}>
              Final Privacy Policy Score
            </p>
            <p className="text-5xl font-bold tabular-nums" style={{ color: '#0155b9' }}>{finalPct}%</p>
            <p className="text-sm mt-1" style={{ color: '#0155b9' }}>
              ({finalScore}/{finalTotal} точки)
            </p>
          </div>
        </div>
        {/* Risk classification */}
        <div className="border px-6 py-3 text-center"
          style={{ backgroundColor: 'var(--cp-error-light)', borderColor: 'var(--cp-error)', borderTopWidth: 0 }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--cp-error)' }}>
            {finalPct < 30  ? 'Критично: Сериозни пропуски, изискващи незабавни мерки'
            : finalPct < 60 ? 'Висок риск: Значителни пропуски в съответствието'
            : finalPct < 80 ? 'Среден риск: Някои области изискват подобрение'
            :                 'Добро: Политиката отговаря на повечето изисквания'}
          </p>
        </div>
      </div>
    </ReportSection>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TestReportPage() {
  return (
    <div className="space-y-10 pb-16" style={{ color: 'var(--cp-neutral-100)' }}>

      {/* TEST MODE banner */}
      <div className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm"
        style={{ backgroundColor: 'var(--cp-blue-15)', border: '1px solid var(--cp-blue-40)', color: 'var(--cp-blue-150)' }}>
        <span>
          <strong>TEST MODE</strong> — симулиран одит · няма реални API извиквания · не се харчат токени
        </span>
        <a href={META.targetUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs hover:underline shrink-0"
          style={{ color: 'var(--cp-blue-100)' }}>
          {META.targetUrl} <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* 1 — Cover */}
      <CoverSection meta={META} />

      {/* 2 — Scope & Methodology */}
      <ScopeSection scope={SCOPE} />

      {/* 3 — Audit table (modified) */}
      <AuditTableSection criteria={criteria} tierScores={tier_scores} />

      {/* 4 — Privacy Policy Analysis */}
      <PrivacyAnalysisSection data={PRIVACY_ANALYSIS} />

    </div>
  );
}
