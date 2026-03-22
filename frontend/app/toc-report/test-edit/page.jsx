'use client';
// ⚠️ TEST ONLY — delete together with lib/test-audit-fixture.js when done.
// Route: /toc-report/test-edit  |  Edit view preview with mock data + new design.

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Save, Share2, Loader2, CheckCircle2, AlertCircle,
  ExternalLink, FileText, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { TEST_AUDIT_META, TEST_PRIVACY_RESULT } from '@/lib/test-audit-fixture';

// ── Verbal scale ──────────────────────────────────────────────────────────────
const VERBAL_SEGS = [
  { min: 0,  max: 30,  label: 'Критичен риск'        },
  { min: 31, max: 50,  label: 'Несъответствие'        },
  { min: 51, max: 60,  label: 'Частично съответствие' },
  { min: 61, max: 75,  label: 'Адекватно'             },
  { min: 76, max: 89,  label: 'Високо съответствие'   },
  { min: 90, max: 100, label: 'Пълно съответствие'    },
];
function getVerbalLabel(pct) {
  return VERBAL_SEGS.find(s => pct >= s.min && pct <= s.max)?.label ?? 'Адекватно';
}

// ── Score recalculation ───────────────────────────────────────────────────────
function recalc(criteria) {
  const tier_scores = {};
  let total_score = 0, total_max_score = 0;
  for (const t of [1, 2, 3, 4]) {
    const active = criteria.filter(c => c.tier === t && !c.skipped && c.score !== null);
    if (!active.length) continue;
    const mult  = active[0].multiplier ?? 1;
    const score = active.reduce((s, c) => s + (c.score ?? 0) * mult, 0);
    const max   = active.length * 5 * mult;
    tier_scores[`tier${t}`] = { score, max, pct: max > 0 ? (score / max) * 100 : 0 };
    total_score     += score;
    total_max_score += max;
  }
  const total_pct       = total_max_score > 0 ? Math.round((total_score / total_max_score) * 100) : 0;
  const low_score_count = criteria.filter(c => !c.skipped && c.score !== null && c.score <= 3).length;
  return { tier_scores, total_score, total_max_score, total_pct, verbal_scale: getVerbalLabel(total_pct), low_score_count };
}

// Pre-populate a `recommendation` field for low-score criteria
const INITIAL_CRITERIA = TEST_PRIVACY_RESULT.criteria.map(c => ({
  ...c,
  recommendation: c.score <= 3
    ? `Спешно: Актуализирайте документа, за да включва конкретна информация относно ${c.name.toLowerCase()} съгласно чл. 13 GDPR.`
    : null,
}));

const INITIAL_SCORE = recalc(INITIAL_CRITERIA);

const TIER_LABELS = {
  1: 'Организационна прозрачност',
  2: 'Правно основание & съхранение',
  3: 'Потребителски права & проследяване',
  4: 'Допълнителни изисквания',
};

const INACTIVE_BG = ['#0155B9','#1e6ed4','#449AFF','#6badff','#ACCEF7','#C6E0FF'];

// ── Auto-growing textarea ─────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, className, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={className}
      style={{ ...style, overflow: 'hidden', resize: 'none' }}
    />
  );
}

// ── Clickable score dots ──────────────────────────────────────────────────────
function EditableScoreDots({ score, onChange, max = 5 }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          title={`Оценка ${i + 1}`}
          className="rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            width: '1rem', height: '1rem', flexShrink: 0, cursor: 'pointer',
            backgroundColor: i < score ? 'var(--cp-blue-100)' : 'var(--cp-neutral-40)',
            border: 'none', padding: 0,
            focusRingColor: 'var(--cp-blue-100)',
          }}
        />
      ))}
      <span className="ml-1 text-xs font-bold tabular-nums" style={{ color: 'var(--cp-neutral-80)' }}>
        {score}/5
      </span>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
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

// ── Editable Audit Table ──────────────────────────────────────────────────────
function AuditTableEdit({ criteria, score, onScoreChange, onExplanationChange }) {
  const tiers = [1, 2, 3, 4].map(n => ({
    num: n, ts: score.tier_scores?.[`tier${n}`] ?? { pct: 0 },
    items: criteria.filter(c => c.tier === n),
  }));

  return (
    <ReportSection
      id="audit-table"
      title="Детайлна одитна таблица"
      subtitle={`Privacy Policy · ${criteria.length} критерия · 4 нива`}
      icon={<FileText className="h-5 w-5" />}
    >
      <div className="space-y-5">
        {tiers.map(({ num, ts, items }) => {
          const pct = Math.round(ts?.pct ?? 0);
          return (
            <div key={num} className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--cp-neutral-40)' }}>
              {/* Tier header */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: '#0175ff', color: 'white' }}>
                <span className="text-sm font-bold">Ниво {num} — {TIER_LABELS[num]}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  {pct}% съответствие
                </span>
              </div>
              {/* Column headers */}
              <div className="grid text-[11px] font-bold uppercase tracking-wide px-4 py-2"
                style={{
                  gridTemplateColumns: '44px 1fr 160px 1fr',
                  gap: '16px',
                  backgroundColor: 'var(--cp-blue-15)',
                  color: 'var(--cp-blue-150)',
                }}>
                <div>#</div><div>Критерий</div><div>Оценка</div><div>Констатации & обяснение</div>
              </div>
              {/* Rows */}
              {items.map((c, idx) => (
                <div key={c.id} className="grid px-4 py-4 items-start"
                  style={{
                    gridTemplateColumns: '44px 1fr 160px 1fr',
                    gap: '16px',
                    borderTop: '1px solid var(--cp-neutral-40)',
                    backgroundColor: idx % 2 === 0 ? 'white' : 'var(--cp-neutral-20)',
                  }}>
                  {/* № */}
                  <div className="flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold"
                    style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
                    {c.id - 100}
                  </div>
                  {/* Criterion name */}
                  <p className="text-sm font-semibold leading-snug pt-1"
                    style={{ color: 'var(--cp-neutral-100)' }}>{c.name}</p>
                  {/* Editable score dots */}
                  <div className="pt-1">
                    <EditableScoreDots
                      score={c.score}
                      onChange={val => onScoreChange(c.id, val)}
                    />
                  </div>
                  {/* Editable explanation */}
                  <AutoTextarea
                    value={c.explanation}
                    onChange={val => onExplanationChange(c.id, val)}
                    placeholder="Констатации & обяснение..."
                    className="w-full rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition"
                    style={{
                      color: 'var(--cp-neutral-80)',
                      borderColor: 'var(--cp-neutral-40)',
                      backgroundColor: idx % 2 === 0 ? 'white' : 'var(--cp-neutral-20)',
                      minHeight: '2.5rem',
                    }}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </ReportSection>
  );
}

// ── Editable Recommendations ──────────────────────────────────────────────────
function EditablePriorityCard({ c, onExplanationChange, onRecommendationChange }) {
  const critical = c.tier === 1;
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
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                style={{ color: critical ? 'var(--cp-blue-150)' : 'var(--cp-neutral-80)' }}>
                {critical ? '⚠ Критичен риск' : 'Препоръчано подобрение'} · Ниво {c.tier}
              </p>
              <p className="text-base font-bold" style={{ color: 'var(--cp-neutral-100)' }}>
                {c.name}
              </p>
            </div>
            <EditableScoreDots score={c.score} onChange={() => {}} />
          </div>

          {/* Editable explanation */}
          <AutoTextarea
            value={c.explanation}
            onChange={val => onExplanationChange(c.id, val)}
            placeholder="Описание на констатацията и проблема..."
            className="mt-3 w-full rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition"
            style={{
              color: 'var(--cp-neutral-80)',
              borderColor: critical ? 'var(--cp-blue-150)' : 'var(--cp-blue-40)',
              backgroundColor: critical ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)',
              minHeight: '3rem',
            }}
          />

          {/* Editable recommendation action */}
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--cp-blue-15)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--cp-neutral-100)' }}>
              Препоръчано действие:
            </p>
            <AutoTextarea
              value={c.recommendation ?? ''}
              onChange={val => onRecommendationChange(c.id, val)}
              placeholder="Препоръчано действие..."
              className="w-full rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition"
              style={{
                color: 'var(--cp-neutral-80)',
                borderColor: critical ? 'var(--cp-blue-150)' : 'var(--cp-blue-40)',
                backgroundColor: critical ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)',
                minHeight: '2.5rem',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationsEdit({ criteria, onExplanationChange, onRecommendationChange }) {
  const issues = criteria
    .filter(c => !c.skipped && c.score !== null && c.score <= 3)
    .sort((a, b) => a.tier - b.tier || a.score - b.score);

  if (!issues.length) return (
    <ReportSection id="recommendations" title="Приоритетни препоръки"
      subtitle="Критични проблеми, изискващи незабавно внимание"
      icon={<AlertTriangle className="h-5 w-5" />}>
      <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Няма критерии с оценка ≤ 3 — нняма препоръки.
      </div>
    </ReportSection>
  );

  return (
    <ReportSection id="recommendations" title="Приоритетни препоръки"
      subtitle={`${issues.length} критични проблема, изискващи незабавно внимание`}
      icon={<AlertTriangle className="h-5 w-5" />}>
      <div className="space-y-4">
        {issues.map(c => (
          <EditablePriorityCard
            key={c.id}
            c={c}
            onExplanationChange={onExplanationChange}
            onRecommendationChange={onRecommendationChange}
          />
        ))}
      </div>
    </ReportSection>
  );
}

// ── Score summary bar (compact) ───────────────────────────────────────────────
function ScoreSummaryBar({ score }) {
  const { total_pct, total_score, total_max_score, verbal_scale, low_score_count } = score;
  const pct       = Math.round(total_pct);
  const activeIdx = VERBAL_SEGS.findIndex(s => pct >= s.min && pct <= s.max);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--cp-neutral-40)' }}>
      <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#d2e2f5' }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#0155b9' }}>
            Краен резултат — Privacy Policy
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#0155b9', opacity: 0.7 }}>
            {total_score}/{total_max_score} точки
            {low_score_count > 0 && <span className="ml-3 font-semibold text-orange-700">⚠ {low_score_count} ниска оценка</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-4xl font-extrabold tabular-nums" style={{ color: '#0155b9' }}>{pct}%</p>
          <p className="text-sm font-bold" style={{ color: '#0155b9' }}>{verbal_scale}</p>
        </div>
      </div>
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
            <p className="text-[10px] font-bold">{s.min}–{s.max}%</p>
            <p className="text-[9px] mt-0.5 opacity-90">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TestEditPage() {
  const [criteria, setCriteria] = useState(INITIAL_CRITERIA);
  const [score,    setScore]    = useState(INITIAL_SCORE);
  const [saveMsg,  setSaveMsg]  = useState(null);

  const update = useCallback((id, field, value) => {
    setCriteria(prev => {
      const next = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
      setScore(recalc(next));
      return next;
    });
  }, []);

  const onScoreChange          = useCallback((id, v)   => update(id, 'score', v), [update]);
  const onExplanationChange    = useCallback((id, v)   => update(id, 'explanation', v), [update]);
  const onRecommendationChange = useCallback((id, v)   => update(id, 'recommendation', v), [update]);

  function handleSave() {
    setSaveMsg({ type: 'ok', text: 'TEST MODE — реален запис няма.' });
    setTimeout(() => setSaveMsg(null), 3000);
  }

  return (
    <div className="space-y-10 pb-16" style={{ color: 'var(--cp-neutral-100)' }}>
      {/* TEST MODE banner */}
      <div className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm"
        style={{ backgroundColor: 'var(--cp-blue-15)', border: '1px solid var(--cp-blue-40)', color: 'var(--cp-blue-150)' }}>
        <span><strong>TEST MODE</strong> — симулиран одит · редактиране · няма реални API извиквания</span>
        <a href={TEST_AUDIT_META.site_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs hover:underline shrink-0"
          style={{ color: 'var(--cp-blue-100)' }}>
          {TEST_AUDIT_META.site_url} <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/toc-report/test"
            className="flex items-center gap-1 text-sm mb-2 hover:underline"
            style={{ color: 'var(--cp-neutral-60)' }}>
            ← Към репорта
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--cp-neutral-100)' }}>
            {TEST_AUDIT_META.client_name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--cp-neutral-60)' }}>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">Завършен</span>
            <span>21 март 2026 г.</span>
            <a href={TEST_AUDIT_META.site_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline" style={{ color: '#0175ff' }}>
              {TEST_AUDIT_META.site_url} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="sticky top-4 z-10 flex items-center justify-between gap-4 rounded-xl border px-5 py-3 shadow-md"
        style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: '#0175ff' }}>
            <Save className="h-4 w-4" /> Запази
          </button>
          <button
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ borderColor: '#86efac', backgroundColor: '#f0fdf4', color: '#15803d' }}>
            <Share2 className="h-4 w-4" /> Публикувай
          </button>
          {saveMsg && (
            <div className={`flex items-center gap-1.5 text-sm ${saveMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
              <CheckCircle2 className="h-4 w-4" />
              {saveMsg.text}
            </div>
          )}
        </div>
        {/* Mini score badge */}
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: '#0155b9' }}>
          {Math.round(score.total_pct)}%
          <span className="text-xs font-normal" style={{ color: 'var(--cp-neutral-60)' }}>{score.verbal_scale}</span>
        </div>
      </div>

      {/* Score summary */}
      <ScoreSummaryBar score={score} />

      {/* Editable audit table */}
      <AuditTableEdit
        criteria={criteria}
        score={score}
        onScoreChange={onScoreChange}
        onExplanationChange={onExplanationChange}
      />

      {/* Editable recommendations */}
      <RecommendationsEdit
        criteria={criteria}
        onExplanationChange={onExplanationChange}
        onRecommendationChange={onRecommendationChange}
      />
    </div>
  );
}
