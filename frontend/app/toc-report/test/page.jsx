'use client';
// ⚠️ TEST ONLY — delete together with lib/test-audit-fixture.js when done.
// Route: /toc-report/test  |  Trigger: client_name=CP_TEST + site=https://craftpolicy.com/

import {
  Globe, Calendar, User, Building2,
  Microscope, CheckCircle2, FlaskConical, AlertCircle,
  FileText, XCircle, ExternalLink, AlertTriangle,
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
  preparedFor: TEST_AUDIT_META.client_name,
  preparedBy:  'CraftPolicy Audit Engine v1',
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
      description: 'Всяко ниво носи различна тежест: Ниво 1 ×3, Ниво 2 ×2, Ниво 3 ×1.5, Ниво 4 ×1.',
    },
    {
      method:      'Verbal scale класификация',
      description: 'Крайният процент се преобразува в 6-степенна скала от „Критичен риск" до „Пълно съответствие".',
    },
  ],
  limitations: [
    'Анализът е базиран единствено на текстовото съдържание на предоставения документ.',
    'Техническото изпълнение (cookie banner, consent management) не се проверява в тази версия.',
    'Резултатите са индикативни и не заместват юридическа консултация.',
  ],
};

// Derive privacy analysis from fixture
const { criteria, tier_scores, total_score, total_max_score } = TEST_PRIVACY_RESULT;
const PRIVACY_ANALYSIS = {
  tiers: [1, 2, 3, 4].map(t => {
    const ts    = tier_scores[`tier${t}`];
    const items = criteria.filter(c => c.tier === t);
    const pct   = Math.round(ts.pct);
    return {
      id:           `tier${t}`,
      name:         `Ниво ${t} — ${TIER_LABELS[t]}`,
      severity:     pct >= 76 ? 'low' : pct >= 61 ? 'medium' : pct >= 31 ? 'high' : 'critical',
      percentage:   pct,
      earnedPoints: ts.score,
      maxPoints:    ts.max,
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

// ── Shared section wrapper ────────────────────────────────────────────────────
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

// ── 1. Cover Page ─────────────────────────────────────────────────────────────
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

function CoverSection({ meta }) {
  return (
    <section id="cover" className="scroll-mt-24">
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>

        {/* Gradient band */}
        <div className="px-8 py-10" style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg font-black text-white text-sm"
              style={{ backgroundColor: 'var(--cp-blue-100)' }}>CP</div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--cp-blue-100)' }}>
              CraftPolicy
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight lg:text-4xl"
            style={{ color: 'var(--cp-blue-100)' }}>
            GDPR & Privacy Policy<br />Compliance Audit
          </h1>
          <p className="mt-3 text-base" style={{ color: '#4a5568' }}>
            Executive-level compliance assessment with actionable recommendations
          </p>
        </div>

        {/* Details grid — 4 cells (2×2) */}
        <div className="grid grid-cols-2 gap-px"
          style={{ backgroundColor: 'var(--cp-neutral-40)' }}>
          <DetailCell icon={<Globe     className="h-4 w-4" />} label="Website"      value={meta.targetUrl} />
          <DetailCell icon={<Calendar  className="h-4 w-4" />} label="Scan Date"    value={meta.scanDate} />
          <DetailCell icon={<User      className="h-4 w-4" />} label="Prepared For" value={meta.preparedFor} />
          <DetailCell icon={<Building2 className="h-4 w-4" />} label="Prepared By"  value={meta.preparedBy} />
        </div>

        {/* Confidence note */}
        <div className="border-t px-8 py-4"
          style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-blue-5)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
            <span className="font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
              Confidence Level:
            </span>{' '}
            This audit combines automated document analysis with AI-assisted evaluation to ensure
            high-confidence findings derived from the submitted document and validated against GDPR criteria.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── 2. Scope & Methodology ────────────────────────────────────────────────────
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
        <div className="rounded-xl border p-5"
          style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-neutral-20)' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--cp-success)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
              What We Tested
            </h3>
          </div>
          <ul className="space-y-2">
            {scope.whatWeTested.map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--cp-blue-100)' }} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--cp-neutral-90)' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* How we tested */}
        <div className="space-y-3">
          {scope.howWeTested.map(method => (
            <div key={method.method} className="rounded-xl border p-4"
              style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <FlaskConical className="h-3.5 w-3.5" style={{ color: 'var(--cp-blue-100)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
                  {method.method}
                </h4>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
                {method.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations — light blue (not yellow) */}
      <div className="mt-6 rounded-xl border p-4"
        style={{ borderColor: 'var(--cp-blue-40)', backgroundColor: 'var(--cp-blue-5)' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4" style={{ color: 'var(--cp-blue-150)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
            Limitations
          </h3>
        </div>
        <ul className="space-y-1.5">
          {scope.limitations.map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: 'var(--cp-blue-150)' }} />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-90)' }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ReportSection>
  );
}

// ── 3. Audit Table ────────────────────────────────────────────────────────────
function ScoreDots({ score, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          display:         'inline-block',
          width:           '0.9375rem',
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
      <div className="space-y-5">
        {tiers.map(({ num, label, ts, items }) => {
          const pct = Math.round(ts?.pct ?? 0);
          return (
            <div key={num} className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--cp-neutral-40)' }}>

              {/* Tier header */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: 'var(--cp-blue-150)', color: 'white' }}>
                <span className="text-sm font-bold">Ниво {num} — {label}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  {pct}% съответствие
                </span>
              </div>

              {/* Column headers */}
              <div className="grid text-[11px] font-bold uppercase tracking-wide px-4 py-2"
                style={{
                  gridTemplateColumns: '44px 1fr 150px 1fr',
                  gap: '16px',
                  backgroundColor: 'var(--cp-blue-15)',
                  color: 'var(--cp-blue-150)',
                }}>
                <div>#</div><div>Критерий</div><div>Оценка</div><div>Констатации & обяснение</div>
              </div>

              {/* Rows — no multiplier label, no score verdict */}
              {items.map((c, idx) => (
                <div key={c.id} className="grid px-4 py-4 items-start"
                  style={{
                    gridTemplateColumns: '44px 1fr 150px 1fr',
                    gap: '16px',
                    borderTop: '1px solid var(--cp-neutral-40)',
                    backgroundColor: idx % 2 === 0 ? 'white' : 'var(--cp-neutral-20)',
                  }}>
                  <div className="flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold"
                    style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
                    {c.id - 100}
                  </div>
                  <p className="text-sm font-semibold leading-snug pt-0.5"
                    style={{ color: 'var(--cp-neutral-100)' }}>
                    {c.name}
                  </p>
                  <div className="pt-0.5">
                    <ScoreDots score={c.score} />
                  </div>
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

// ── 4. Privacy Policy Analysis ────────────────────────────────────────────────
function StatusIcon({ status }) {
  switch (status) {
    case 'pass':    return <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--cp-success)' }} />;
    case 'fail':    return <XCircle      className="h-4 w-4 shrink-0" style={{ color: 'var(--cp-error)'   }} />;
    case 'warning': return <AlertCircle  className="h-4 w-4 shrink-0" style={{ color: 'var(--cp-warning)' }} />;
  }
}

function SeverityBadge({ severity, label }) {
  const styles = {
    critical: { bg: 'var(--cp-error-light)',   text: 'var(--cp-error)'   },
    high:     { bg: '#fff7ed',                 text: '#c2410c'            },
    medium:   { bg: 'var(--cp-blue-15)',       text: 'var(--cp-blue-150)' },
    low:      { bg: 'var(--cp-success-light)', text: 'var(--cp-success)'  },
  };
  const s = styles[severity] ?? styles.medium;
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}>
      {label}
    </span>
  );
}

// Static (always-expanded) tier block — no accordion
function TierBlock({ tier }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--cp-neutral-40)' }}>
      {/* Header — static, no toggle */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ backgroundColor: 'var(--cp-neutral-20)' }}>
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
            {tier.name}
          </h3>
          <SeverityBadge severity={tier.severity} label={`${tier.percentage}%`} />
        </div>
        <span className="text-xs tabular-nums" style={{ color: 'var(--cp-neutral-80)' }}>
          {tier.earnedPoints}/{tier.maxPoints} pts
        </span>
      </div>

      {/* Criteria — always visible */}
      <div className="divide-y" style={{ divideColor: 'var(--cp-neutral-40)' }}>
        {tier.criteria.map(c => (
          <div key={c.name} className="px-5 py-3.5"
            style={{ backgroundColor: 'var(--cp-white)', borderTopColor: 'var(--cp-neutral-40)', borderTopWidth: '1px' }}>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-start gap-2.5 flex-1">
                <StatusIcon status={c.status} />
                <span className="text-sm font-medium" style={{ color: 'var(--cp-neutral-100)' }}>
                  {c.name}
                </span>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums"
                style={{ color: 'var(--cp-neutral-80)' }}>
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
  );
}

// Compact final score with verbal-scale cells
function FinalScoreBar({ finalScore, finalTotal }) {
  const pct  = finalTotal > 0 ? Math.round((finalScore / finalTotal) * 100) : 0;
  const segs = [
    { range: '0–30%',   label: 'Критичен риск',     min: 0,  max: 30  },
    { range: '31–50%',  label: 'Несъответствие',     min: 31, max: 50  },
    { range: '51–60%',  label: 'Частично',           min: 51, max: 60  },
    { range: '61–75%',  label: 'Адекватно',          min: 61, max: 75  },
    { range: '76–89%',  label: 'Високо',             min: 76, max: 89  },
    { range: '90–100%', label: 'Пълно съответствие', min: 90, max: 100 },
  ];
  const activeIdx = segs.findIndex(s => pct >= s.min && pct <= s.max);
  const inactiveBg = ['#0155B9','#1e6ed4','#449AFF','#6badff','#ACCEF7','#C6E0FF'];

  return (
    <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '1px solid var(--cp-neutral-40)' }}>
      {/* Score row */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#d2e2f5' }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: '#0155b9' }}>
            Final Privacy Policy Score
          </p>
          <p className="text-xs" style={{ color: '#0155b9' }}>
            {finalScore}/{finalTotal} точки
          </p>
        </div>
        <p className="text-4xl font-extrabold tabular-nums" style={{ color: '#0155b9' }}>{pct}%</p>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: '#0155b9' }}>
            {pct >= 90 ? 'Пълно съответствие'
              : pct >= 76 ? 'Високо съответствие'
              : pct >= 61 ? 'Адекватно'
              : pct >= 51 ? 'Частично съответствие'
              : pct >= 31 ? 'Несъответствие'
              : 'Критичен риск'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#0155b9', opacity: 0.7 }}>
            {pct < 60 ? 'Изисква корекция' : pct < 80 ? 'Среден риск' : 'Добро ниво'}
          </p>
        </div>
      </div>

      {/* Verbal scale cells */}
      <div className="flex" style={{ borderTop: '1px solid var(--cp-neutral-40)' }}>
        {segs.map((s, i) => (
          <div key={i} className="flex-1 py-2 text-center"
            style={{
              backgroundColor: i === activeIdx ? 'var(--cp-blue-100)' : inactiveBg[i],
              color:           i === activeIdx || i <= 2 ? 'white' : 'var(--cp-neutral-100)',
              outline:         i === activeIdx ? '2px solid var(--cp-blue-150)' : 'none',
              outlineOffset:   '-2px',
              borderRight:     i < segs.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
            }}>
            <p className="text-[10px] font-bold">{s.range}</p>
            <p className="text-[9px] mt-0.5 opacity-90">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyAnalysisSection({ data }) {
  const { tiers, finalScore, finalTotal } = data;
  const totalCriteria  = tiers.reduce((a, t) => a + t.criteria.length, 0);
  const passedCriteria = tiers.reduce((a, t) => a + t.criteria.filter(c => c.status === 'pass').length, 0);
  const failedCriteria = tiers.reduce((a, t) => a + t.criteria.filter(c => c.status === 'fail').length, 0);

  return (
    <ReportSection
      id="privacy-analysis"
      title="Privacy Policy Analysis"
      subtitle="Compliance criteria evaluation with detailed explanations"
      icon={<FileText className="h-5 w-5" />}
    >
      {/* Quick stats — 3 columns */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl px-4 py-3 text-center"
          style={{ backgroundColor: 'var(--cp-neutral-20)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--cp-neutral-100)' }}>{totalCriteria}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--cp-neutral-80)' }}>Общо критерии</p>
        </div>
        <div className="rounded-xl px-4 py-3 text-center"
          style={{ backgroundColor: 'var(--cp-error-light)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--cp-error)' }}>{failedCriteria}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--cp-error)' }}>Несъответствие</p>
        </div>
        <div className="rounded-xl px-4 py-3 text-center"
          style={{ backgroundColor: 'var(--cp-success-light)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--cp-success)' }}>{passedCriteria}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--cp-success)' }}>Съответствие</p>
        </div>
      </div>

      {/* Static tier blocks */}
      <div className="space-y-4">
        {tiers.map(tier => <TierBlock key={tier.id} tier={tier} />)}
      </div>

      {/* Compact final score with verbal scale */}
      <FinalScoreBar finalScore={finalScore} finalTotal={finalTotal} />
    </ReportSection>
  );
}

// ── 5. Recommendations ────────────────────────────────────────────────────────
function PriorityCard({ criterion }) {
  const critical = criterion.tier === 1;
  return (
    <div className="rounded-xl p-5" style={{
      border:          `1px solid ${critical ? 'var(--cp-blue-150)' : 'var(--cp-blue-40)'}`,
      borderLeftWidth: '5px',
      borderLeftColor: critical ? 'var(--cp-blue-150)' : 'var(--cp-blue-40)',
      backgroundColor: critical ? 'var(--cp-blue-15)' : 'var(--cp-neutral-20)',
    }}>
      <div className="flex gap-4">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0"
          style={{ color: critical ? 'var(--cp-blue-150)' : 'var(--cp-blue-40)' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                style={{ color: critical ? 'var(--cp-blue-150)' : 'var(--cp-neutral-80)' }}>
                {critical ? '⚠ Критичен риск' : 'Препоръчано подобрение'} · Ниво {criterion.tier}
              </p>
              <p className="text-base font-bold" style={{ color: 'var(--cp-neutral-100)' }}>
                {criterion.name}
              </p>
            </div>
            <ScoreDots score={criterion.score} />
          </div>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
            {criterion.explanation}
          </p>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--cp-blue-15)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--cp-neutral-100)' }}>
              Препоръчано действие:
            </p>
            <p className="text-sm" style={{ color: 'var(--cp-neutral-80)' }}>
              <strong>Спешно:</strong> Актуализирайте документа, за да включва конкретна информация
              относно <em>{criterion.name.toLowerCase()}</em> съгласно чл. 13 GDPR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationsSection({ criteria }) {
  const issues = criteria
    .filter(c => !c.skipped && c.score !== null && c.score <= 3)
    .sort((a, b) => a.tier - b.tier || a.score - b.score);

  if (issues.length === 0) return null;

  return (
    <ReportSection
      id="recommendations"
      title="Приоритетни препоръки"
      subtitle="Критични проблеми, изискващи незабавно внимание"
      icon={<AlertTriangle className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {issues.map(c => <PriorityCard key={c.id} criterion={c} />)}
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
          <strong>TEST MODE</strong> — симулиран одит · няма реални API извиквания
        </span>
        <a href={META.targetUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs hover:underline shrink-0"
          style={{ color: 'var(--cp-blue-100)' }}>
          {META.targetUrl} <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <CoverSection meta={META} />
      <ScopeSection scope={SCOPE} />
      <AuditTableSection criteria={criteria} tierScores={tier_scores} />
      <PrivacyAnalysisSection data={PRIVACY_ANALYSIS} />
      <RecommendationsSection criteria={criteria} />

    </div>
  );
}
