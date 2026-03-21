'use client';
// ⚠️ TEST ONLY — delete together with lib/test-audit-fixture.js when done.
// Route: /toc-report/test  |  Trigger: client_name=CP_TEST + site=https://craftpolicy.com/

import { useSearchParams } from 'next/navigation';
import {
  Globe, Calendar, User, Building2,
  Microscope, CheckCircle2, FlaskConical, AlertCircle,
  FileText, XCircle, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { TEST_AUDIT_META, TEST_PRIVACY_RESULT } from '@/lib/test-audit-fixture';
import { reportI18n } from '@/lib/i18n';

// ── Data ──────────────────────────────────────────────────────────────────────
const TIER_LABELS = {
  1: 'Организационна прозрачност',
  2: 'Правно основание & съхранение',
  3: 'Потребителски права & проследяване',
  4: 'Допълнителни изисквания',
};

const { criteria, tier_scores, total_score, total_max_score } = TEST_PRIVACY_RESULT;

const SCOPE_DATA = {
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
      method_bg: 'Автоматичен текстов анализ',
      method_en: 'Automated Text Analysis',
      desc_bg: 'Claude AI прочита и анализира съдържанието на документа спрямо 8 критерия, разпределени в 4 нива с различна тежест.',
      desc_en: 'Claude AI reads and evaluates the document content against 8 criteria distributed across 4 weighted tiers.',
    },
    {
      method_bg: 'Претеглена оценка (×множител)',
      method_en: 'Weighted Scoring (×multiplier)',
      desc_bg: 'Всяко ниво носи различна тежест: Ниво 1 ×3, Ниво 2 ×2, Ниво 3 ×1.5, Ниво 4 ×1.',
      desc_en: 'Each level carries a different weight: Level 1 ×3, Level 2 ×2, Level 3 ×1.5, Level 4 ×1.',
    },
    {
      method_bg: 'Verbal scale класификация',
      method_en: 'Verbal Scale Classification',
      desc_bg: 'Крайният процент се преобразува в 6-степенна скала от „Критичен риск" до „Пълно съответствие".',
      desc_en: 'The final percentage maps to a 6-level scale from "Critical Risk" to "Full Compliance".',
    },
  ],
  limitations_bg: [
    'Анализът е базиран единствено на текстовото съдържание на предоставения документ.',
    'Техническото изпълнение (cookie banner, consent management) не се проверява в тази версия.',
    'Резултатите са индикативни и не заместват юридическа консултация.',
  ],
  limitations_en: [
    'Analysis is based solely on the textual content of the submitted document.',
    'Technical implementation (cookie banner, consent management) is not verified in this version.',
    'Results are indicative and do not substitute legal advice.',
  ],
};

const PRIVACY_ANALYSIS_DATA = {
  tiers: [1, 2, 3, 4].map(t => {
    const ts    = tier_scores[`tier${t}`];
    const items = criteria.filter(c => c.tier === t);
    const pct   = Math.round(ts.pct);
    return {
      id:           `tier${t}`,
      name_bg:      `Ниво ${t} — ${TIER_LABELS[t]}`,
      name_en:      `Level ${t} — ${TIER_LABELS[t]}`,
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

// ── Verbal scale helpers ──────────────────────────────────────────────────────
const VERBAL_SEGS = [
  { range_bg: '0–30%',   range_en: '0–30%',   label: 'Критичен риск',         min: 0,  max: 30  },
  { range_bg: '31–50%',  range_en: '31–50%',  label: 'Несъответствие',         min: 31, max: 50  },
  { range_bg: '51–60%',  range_en: '51–60%',  label: 'Частично съответствие',  min: 51, max: 60  },
  { range_bg: '61–75%',  range_en: '61–75%',  label: 'Адекватно',              min: 61, max: 75  },
  { range_bg: '76–89%',  range_en: '76–89%',  label: 'Високо съответствие',    min: 76, max: 89  },
  { range_bg: '90–100%', range_en: '90–100%', label: 'Пълно съответствие',     min: 90, max: 100 },
];
const INACTIVE_BG = ['#0155B9','#1e6ed4','#449AFF','#6badff','#ACCEF7','#C6E0FF'];

function getVerbalLabel(pct) {
  const seg = VERBAL_SEGS.find(s => pct >= s.min && pct <= s.max);
  return seg?.label ?? 'Адекватно';
}

function getRiskWord(pct, t) {
  if (pct < 30)  return t.verbalRisk.critical;
  if (pct < 60)  return t.verbalRisk.high;
  if (pct < 80)  return t.verbalRisk.medium;
  return t.verbalRisk.good;
}

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

function CoverSection({ t }) {
  const meta = {
    targetUrl:   TEST_AUDIT_META.site_url,
    scanDate:    new Date(TEST_AUDIT_META.created_at).toLocaleDateString('en-GB'),
    preparedFor: TEST_AUDIT_META.client_name,
    preparedBy:  'CraftPolicy Audit Engine v1',
  };
  return (
    <section id="cover" className="scroll-mt-24">
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
        <div className="px-8 py-10" style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg font-black text-white text-sm"
              style={{ backgroundColor: 'var(--cp-blue-100)' }}>CP</div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--cp-blue-100)' }}>CraftPolicy</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight lg:text-4xl"
            style={{ color: 'var(--cp-blue-100)', whiteSpace: 'pre-line' }}>
            {t.auditTitle}
          </h1>
          <p className="mt-3 text-base" style={{ color: '#4a5568' }}>{t.tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: 'var(--cp-neutral-40)' }}>
          <DetailCell icon={<Globe     className="h-4 w-4" />} label={t.website}     value={meta.targetUrl} />
          <DetailCell icon={<Calendar  className="h-4 w-4" />} label={t.scanDate}    value={meta.scanDate} />
          <DetailCell icon={<User      className="h-4 w-4" />} label={t.preparedFor} value={meta.preparedFor} />
          <DetailCell icon={<Building2 className="h-4 w-4" />} label={t.preparedBy}  value={meta.preparedBy} />
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

// ── 2. Scope & Methodology ────────────────────────────────────────────────────
function ScopeSection({ t, lang }) {
  return (
    <ReportSection id="scope" title={t.scopeTitle} subtitle={t.scopeSubtitle}
      icon={<Microscope className="h-5 w-5" />}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-5"
          style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-neutral-20)' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--cp-success)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>{t.whatTested}</h3>
          </div>
          <ul className="space-y-2">
            {SCOPE_DATA.whatWeTested.map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--cp-blue-100)' }} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--cp-neutral-90)' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          {SCOPE_DATA.howWeTested.map((m, i) => (
            <div key={i} className="rounded-xl border p-4"
              style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <FlaskConical className="h-3.5 w-3.5" style={{ color: 'var(--cp-blue-100)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>
                  {lang === 'en' ? m.method_en : m.method_bg}
                </h4>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
                {lang === 'en' ? m.desc_en : m.desc_bg}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-xl border p-4"
        style={{ borderColor: 'var(--cp-blue-40)', backgroundColor: 'var(--cp-blue-5)' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4" style={{ color: 'var(--cp-blue-150)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>{t.limitations}</h3>
        </div>
        <ul className="space-y-1.5">
          {(lang === 'en' ? SCOPE_DATA.limitations_en : SCOPE_DATA.limitations_bg).map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: 'var(--cp-blue-150)' }} />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-90)' }}>{item}</span>
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
          display: 'inline-block', width: '0.9375rem', height: '0.9375rem',
          borderRadius: '50%', flexShrink: 0,
          backgroundColor: i < score ? 'var(--cp-blue-100)' : 'var(--cp-neutral-40)',
        }} />
      ))}
      <span className="ml-1.5 text-xs font-bold tabular-nums" style={{ color: 'var(--cp-neutral-80)' }}>
        {score}/5
      </span>
    </div>
  );
}

function AuditTableSection({ t }) {
  const tiers = [1, 2, 3, 4].map(n => ({
    num: n, label: TIER_LABELS[n], ts: tier_scores[`tier${n}`],
    items: criteria.filter(c => c.tier === n),
  }));

  return (
    <ReportSection id="audit-table" title={t.tableTitle}
      subtitle={`Privacy Policy · ${criteria.length} ${t.colCriterion.toLowerCase()} · 4 ${t.tierWord.toLowerCase()}`}
      icon={<FileText className="h-5 w-5" />}>
      <div className="space-y-5">
        {tiers.map(({ num, label, ts, items }) => {
          const pct = Math.round(ts?.pct ?? 0);
          return (
            <div key={num} className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--cp-neutral-40)' }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: 'var(--cp-blue-150)', color: 'white' }}>
                <span className="text-sm font-bold">{t.tierWord} {num} — {label}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  {pct}% {t.complianceWord}
                </span>
              </div>
              <div className="grid text-[11px] font-bold uppercase tracking-wide px-4 py-2"
                style={{ gridTemplateColumns: '44px 1fr 150px 1fr', gap: '16px',
                  backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
                <div>{t.colNum}</div><div>{t.colCriterion}</div>
                <div>{t.colScore}</div><div>{t.colFindings}</div>
              </div>
              {items.map((c, idx) => (
                <div key={c.id} className="grid px-4 py-4 items-start"
                  style={{ gridTemplateColumns: '44px 1fr 150px 1fr', gap: '16px',
                    borderTop: '1px solid var(--cp-neutral-40)',
                    backgroundColor: idx % 2 === 0 ? 'white' : 'var(--cp-neutral-20)' }}>
                  <div className="flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold"
                    style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
                    {c.id - 100}
                  </div>
                  <p className="text-sm font-semibold leading-snug pt-0.5"
                    style={{ color: 'var(--cp-neutral-100)' }}>{c.name}</p>
                  <div className="pt-0.5"><ScoreDots score={c.score} /></div>
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
  const s = {
    critical: { bg: 'var(--cp-error-light)',   text: 'var(--cp-error)'   },
    high:     { bg: '#fff7ed',                 text: '#c2410c'            },
    medium:   { bg: 'var(--cp-blue-15)',       text: 'var(--cp-blue-150)' },
    low:      { bg: 'var(--cp-success-light)', text: 'var(--cp-success)'  },
  }[severity] ?? { bg: 'var(--cp-blue-15)', text: 'var(--cp-blue-150)' };
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}>{label}</span>
  );
}

// ── Issue 1 fix: single-row tier block (no criteria, no subtotal) ─────────────
function TierBlock({ tier, t }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 rounded-xl"
      style={{ border: '1px solid var(--cp-neutral-40)', backgroundColor: 'var(--cp-neutral-20)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--cp-neutral-100)' }}>
          {t.lang === 'en' ? tier.name_en : tier.name_bg}
        </h3>
        <SeverityBadge severity={tier.severity} label={`${t.verbal[tier.name_bg.replace(/^Ниво \d — /, '')] ?? tier.percentage + '%'}`} />
      </div>
      {/* Issue 1: percentage replaces earnedPoints/maxPoints, slightly bigger */}
      <span className="text-xl font-extrabold tabular-nums shrink-0 ml-4"
        style={{ color: 'var(--cp-blue-150)' }}>
        {tier.percentage}%
      </span>
    </div>
  );
}

// ── Issue 3 fix: compact horizontal final score row ───────────────────────────
function FinalScoreBar({ finalScore, finalTotal, t }) {
  const pct        = finalTotal > 0 ? Math.round((finalScore / finalTotal) * 100) : 0;
  const verbalKey  = getVerbalLabel(pct);
  const verbalDisp = t.verbal[verbalKey] ?? verbalKey;
  const riskDisp   = getRiskWord(pct, t);
  const activeIdx  = VERBAL_SEGS.findIndex(s => pct >= s.min && pct <= s.max);

  return (
    <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '1px solid var(--cp-neutral-40)' }}>
      {/* Issue 3: percentage moved right with verbal label next to it */}
      <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#d2e2f5' }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#0155b9' }}>
            {t.finalScoreLabel}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#0155b9', opacity: 0.7 }}>
            {finalScore}/{finalTotal} {t.pointsWord}
          </p>
        </div>
        {/* Percentage + verbal label on the right */}
        <div className="flex items-center gap-3">
          <p className="text-4xl font-extrabold tabular-nums" style={{ color: '#0155b9' }}>{pct}%</p>
          <div className="text-right">
            <p className="text-sm font-bold leading-tight" style={{ color: '#0155b9' }}>{verbalDisp}</p>
            <p className="text-xs mt-0.5" style={{ color: '#0155b9', opacity: 0.7 }}>{riskDisp}</p>
          </div>
        </div>
      </div>
      {/* Verbal scale cells */}
      <div className="flex" style={{ borderTop: '1px solid var(--cp-neutral-40)' }}>
        {VERBAL_SEGS.map((s, i) => (
          <div key={i} className="flex-1 py-2 text-center"
            style={{
              backgroundColor: i === activeIdx ? 'var(--cp-blue-100)' : INACTIVE_BG[i],
              color:           i === activeIdx || i <= 2 ? 'white' : 'var(--cp-neutral-100)',
              outline:         i === activeIdx ? '2px solid var(--cp-blue-150)' : 'none',
              outlineOffset:   '-2px',
              borderRight:     i < VERBAL_SEGS.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
            }}>
            <p className="text-[10px] font-bold">{t.lang === 'en' ? s.range_en : s.range_bg}</p>
            <p className="text-[9px] mt-0.5 opacity-90">{t.verbal[s.label] ?? s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyAnalysisSection({ t }) {
  const { tiers, finalScore, finalTotal } = PRIVACY_ANALYSIS_DATA;
  const total   = tiers.reduce((a, t) => a + t.criteria.length, 0);
  const passed  = tiers.reduce((a, t) => a + t.criteria.filter(c => c.status === 'pass').length, 0);
  const failed  = tiers.reduce((a, t) => a + t.criteria.filter(c => c.status === 'fail').length, 0);

  return (
    <ReportSection id="privacy-analysis" title={t.analysisTitle} subtitle={t.analysisSubtitle}
      icon={<FileText className="h-5 w-5" />}>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: 'var(--cp-neutral-20)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--cp-neutral-100)' }}>{total}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--cp-neutral-80)' }}>{t.totalCriteria}</p>
        </div>
        <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: 'var(--cp-error-light)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--cp-error)' }}>{failed}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--cp-error)' }}>{t.nonCompliant}</p>
        </div>
        <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: 'var(--cp-success-light)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--cp-success)' }}>{passed}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--cp-success)' }}>{t.compliant}</p>
        </div>
      </div>
      {/* Single-row tier blocks */}
      <div className="space-y-3">
        {tiers.map(tier => <TierBlock key={tier.id} tier={tier} t={t} />)}
      </div>
      {/* Compact final score */}
      <FinalScoreBar finalScore={finalScore} finalTotal={finalTotal} t={t} />
    </ReportSection>
  );
}

// ── 5. Recommendations ────────────────────────────────────────────────────────
function PriorityCard({ criterion, t }) {
  const critical = criterion.tier === 1;
  return (
    <div className="rounded-xl p-5" style={{
      border: `1px solid ${critical ? 'var(--cp-blue-150)' : 'var(--cp-blue-40)'}`,
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
                {critical ? t.recCritical : t.recSuggested} · {t.recLevel} {criterion.tier}
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
              {t.recAction}
            </p>
            <p className="text-sm" style={{ color: 'var(--cp-neutral-80)' }}>
              <strong>{t.recUrgent}</strong>{' '}
              <em>{criterion.name.toLowerCase()}</em> {t.recGdpr}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationsSection({ t }) {
  const issues = criteria
    .filter(c => !c.skipped && c.score !== null && c.score <= 3)
    .sort((a, b) => a.tier - b.tier || a.score - b.score);
  if (!issues.length) return null;
  return (
    <ReportSection id="recommendations" title={t.recTitle} subtitle={t.recSubtitle}
      icon={<AlertTriangle className="h-5 w-5" />}>
      <div className="space-y-4">
        {issues.map(c => <PriorityCard key={c.id} criterion={c} t={t} />)}
      </div>
    </ReportSection>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TestReportPage() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'bg';
  const t    = { ...reportI18n[lang], lang };

  return (
    <div className="space-y-10 pb-16" style={{ color: 'var(--cp-neutral-100)' }}>
      {/* TEST MODE banner */}
      <div className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm"
        style={{ backgroundColor: 'var(--cp-blue-15)', border: '1px solid var(--cp-blue-40)', color: 'var(--cp-blue-150)' }}>
        <span><strong>TEST MODE</strong> — {lang === 'en' ? 'simulated audit · no API calls · no tokens consumed' : 'симулиран одит · няма реални API извиквания'}</span>
        <a href={TEST_AUDIT_META.site_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs hover:underline shrink-0"
          style={{ color: 'var(--cp-blue-100)' }}>
          {TEST_AUDIT_META.site_url} <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <CoverSection t={t} />
      <ScopeSection t={t} lang={lang} />
      <AuditTableSection t={t} />
      <PrivacyAnalysisSection t={t} />
      <RecommendationsSection t={t} />
    </div>
  );
}
