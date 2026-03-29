'use client';

/**
 * EditModeClient — interactive Privacy + T&C audit sections.
 *
 * Design: 1:1 with /toc-report/test-edit.
 * Handles both Privacy Policy and Terms & Conditions with real API save/publish.
 *
 * Props:
 *   audit          {object}         Full audit record
 *   privacy_result {object|null}    Privacy criteria + scores from API
 *   toc_result     {object|null}    T&C criteria + scores from API
 *   isPublished    {boolean}
 *   shareUid       {string|null}
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Save, Share2, Loader2, CheckCircle2, AlertCircle,
  ExternalLink, FileText, AlertTriangle, Lock,
} from 'lucide-react';
import { proxyUrl }              from '@/lib/utils';
import { recalculateFromEditor } from '@/lib/toc-score-calculator';

// ── Verbal scale ──────────────────────────────────────────────────────────────
const VERBAL_SEGS = [
  { min: 0,  max: 30,  label: 'Критичен риск'        },
  { min: 31, max: 50,  label: 'Несъответствие'        },
  { min: 51, max: 60,  label: 'Частично съответствие' },
  { min: 61, max: 75,  label: 'Адекватно'             },
  { min: 76, max: 89,  label: 'Високо съответствие'   },
  { min: 90, max: 100, label: 'Пълно съответствие'    },
];

const INACTIVE_BG = ['#0155B9','#1e6ed4','#449AFF','#6badff','#ACCEF7','#C6E0FF'];

function getVerbalLabel(pct) {
  return VERBAL_SEGS.find(s => pct >= s.min && pct <= s.max)?.label ?? 'Адекватно';
}

// ── Tier labels per document type ─────────────────────────────────────────────
const TIER_LABELS = {
  privacy: {
    1: 'Организационна прозрачност',
    2: 'Правно основание & съхранение',
    3: 'Потребителски права & проследяване',
    4: 'Допълнителни изисквания',
  },
  toc: {
    1: 'Основни договорни задължения',
    2: 'Плащания, прекратяване & спорове',
    3: 'Сигурност, акаунти & IP права',
    4: 'Допълнителни изисквания',
  },
};

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

// ── Score dots (read-only display or clickable) ───────────────────────────────
function ScoreDots({ score, onChange, readOnly = false, max = 5 }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => !readOnly && onChange && onChange(i + 1)}
          title={readOnly ? undefined : `Оценка ${i + 1}`}
          className={readOnly ? '' : 'transition-all hover:scale-110 focus:outline-none'}
          style={{
            width: '1rem', height: '1rem', flexShrink: 0,
            cursor: readOnly ? 'default' : 'pointer',
            backgroundColor: i < score ? 'var(--cp-blue-100)' : 'var(--cp-neutral-40)',
            border: 'none', padding: 0, borderRadius: '50%',
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

// ── Score summary bar ─────────────────────────────────────────────────────────
function ScoreSummaryBar({ score, docType }) {
  const pct       = Math.round(score?.total_pct ?? 0);
  const activeIdx = VERBAL_SEGS.findIndex(s => pct >= s.min && pct <= s.max);
  const docLabel  = docType === 'toc' ? 'Terms & Conditions' : 'Privacy Policy';
  const { total_score, total_max_score, verbal_scale, low_score_count } = score ?? {};

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--cp-neutral-40)' }}>
      <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#d2e2f5' }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#0155b9' }}>
            Краен резултат — {docLabel}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#0155b9', opacity: 0.7 }}>
            {total_score}/{total_max_score} точки
            {low_score_count > 0 && (
              <span className="ml-3 font-semibold" style={{ color: '#c2410c' }}>
                ⚠ {low_score_count} ниска оценка
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-4xl font-extrabold tabular-nums" style={{ color: '#0155b9' }}>{pct}%</p>
          <p className="text-sm font-bold" style={{ color: '#0155b9' }}>{verbal_scale ?? getVerbalLabel(pct)}</p>
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

// ── Audit table ───────────────────────────────────────────────────────────────
function AuditTableSection({ criteria, score, docType, readOnly, onScoreChange, onExplanationChange }) {
  const tierLabels   = TIER_LABELS[docType] ?? TIER_LABELS.privacy;
  const docLabel     = docType === 'toc' ? 'Terms & Conditions' : 'Privacy Policy';
  const activeCriteria = criteria.filter(c => !c.skipped);

  const tiers = [1, 2, 3, 4].map(n => ({
    num:   n,
    label: tierLabels[n],
    ts:    score?.tier_scores?.[`tier${n}`] ?? { pct: 0 },
    items: criteria.filter(c => c.tier === n && !c.skipped),
  })).filter(t => t.items.length > 0);

  return (
    <ReportSection
      id={`audit-table-${docType}`}
      title="Детайлна одитна таблица"
      subtitle={`${docLabel} · ${activeCriteria.length} критерия · ${tiers.length} нива`}
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
                style={{ backgroundColor: '#0175ff', color: 'white' }}>
                <span className="text-sm font-bold">Ниво {num} — {label}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  {pct}% съответствие
                </span>
              </div>
              {/* Column headers — desktop only */}
              <div className="hidden md:grid text-[11px] font-bold uppercase tracking-wide px-4 py-2"
                style={{
                  gridTemplateColumns: '44px 1fr 160px 1fr', gap: '16px',
                  backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)',
                }}>
                <div>#</div><div>Критерий</div><div>Оценка</div><div>Констатации & обяснение</div>
              </div>
              {/* Rows */}
              {items.map((c, idx) => (
                <div key={c.id} className="px-4 py-4"
                  style={{
                    borderTop: '1px solid var(--cp-neutral-40)',
                    backgroundColor: idx % 2 === 0 ? 'white' : 'var(--cp-neutral-20)',
                  }}>
                  {/* Mobile card */}
                  <div className="flex flex-col gap-2.5 md:hidden">
                    <div className="flex items-start gap-2.5">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold shrink-0"
                        style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
                        {idx + 1}
                      </div>
                      <p className="text-sm font-semibold leading-snug pt-0.5"
                        style={{ color: 'var(--cp-neutral-100)' }}>{c.name}</p>
                    </div>
                    <div className="pl-9">
                      <ScoreDots score={c.score ?? 0} readOnly={readOnly}
                        onChange={val => onScoreChange?.(c.id, val)} />
                    </div>
                    {readOnly ? (
                      <p className="pl-9 text-sm leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
                        {c.explanation}
                      </p>
                    ) : (
                      <AutoTextarea
                        value={c.explanation}
                        onChange={val => onExplanationChange?.(c.id, val)}
                        placeholder="Констатации & обяснение..."
                        className="w-full rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition"
                        style={{
                          color: 'var(--cp-neutral-80)', borderColor: 'var(--cp-neutral-40)',
                          backgroundColor: idx % 2 === 0 ? 'white' : 'var(--cp-neutral-20)',
                          minHeight: '2.5rem',
                        }}
                      />
                    )}
                  </div>
                  {/* Desktop grid */}
                  <div className="hidden md:grid items-start"
                    style={{ gridTemplateColumns: '44px 1fr 160px 1fr', gap: '16px' }}>
                    <div className="flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold"
                      style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
                      {idx + 1}
                    </div>
                    <p className="text-sm font-semibold leading-snug pt-1"
                      style={{ color: 'var(--cp-neutral-100)' }}>{c.name}</p>
                    <div className="pt-1">
                      <ScoreDots score={c.score ?? 0} readOnly={readOnly}
                        onChange={val => onScoreChange?.(c.id, val)} />
                    </div>
                    {readOnly ? (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
                        {c.explanation}
                      </p>
                    ) : (
                      <AutoTextarea
                        value={c.explanation}
                        onChange={val => onExplanationChange?.(c.id, val)}
                        placeholder="Констатации & обяснение..."
                        className="w-full rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition"
                        style={{
                          color: 'var(--cp-neutral-80)', borderColor: 'var(--cp-neutral-40)',
                          backgroundColor: idx % 2 === 0 ? 'white' : 'var(--cp-neutral-20)',
                          minHeight: '2.5rem',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </ReportSection>
  );
}

// ── Recommendations ───────────────────────────────────────────────────────────
function PriorityCard({ c, readOnly, onExplanationChange, onRecommendationChange }) {
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
            <ScoreDots score={c.score ?? 0} readOnly />
          </div>

          {/* Explanation */}
          {readOnly ? (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--cp-neutral-80)' }}>
              {c.explanation}
            </p>
          ) : (
            <AutoTextarea
              value={c.explanation}
              onChange={val => onExplanationChange?.(c.id, val)}
              placeholder="Описание на констатацията и проблема..."
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition"
              style={{
                color: 'var(--cp-neutral-80)',
                borderColor: critical ? 'var(--cp-blue-150)' : 'var(--cp-blue-40)',
                backgroundColor: critical ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)',
                minHeight: '3rem',
              }}
            />
          )}

          {/* Recommended action */}
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--cp-blue-15)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--cp-neutral-100)' }}>
              Препоръчано действие:
            </p>
            {readOnly ? (
              <p className="text-sm" style={{ color: 'var(--cp-neutral-80)' }}>
                {c.recommendation || `Спешно: Актуализирайте документа, за да включва конкретна информация относно ${c.name.toLowerCase()}.`}
              </p>
            ) : (
              <AutoTextarea
                value={c.recommendation ?? ''}
                onChange={val => onRecommendationChange?.(c.id, val)}
                placeholder="Препоръчано действие..."
                className="w-full rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition"
                style={{
                  color: 'var(--cp-neutral-80)',
                  borderColor: critical ? 'var(--cp-blue-150)' : 'var(--cp-blue-40)',
                  backgroundColor: critical ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)',
                  minHeight: '2.5rem',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationsSection({ id, criteria, readOnly, onExplanationChange, onRecommendationChange }) {
  const issues = criteria
    .filter(c => !c.skipped && c.score !== null && c.score <= 3)
    .sort((a, b) => a.tier - b.tier || a.score - b.score);

  const subtitle = issues.length === 0
    ? 'Няма критерии с оценка ≤ 3'
    : `${issues.length} ${issues.length === 1 ? 'критичен проблем' : 'критични проблема'}, изискващи незабавно внимание`;

  return (
    <ReportSection id={id} title="Приоритетни препоръки" subtitle={subtitle}
      icon={<AlertTriangle className="h-5 w-5" />}>
      {issues.length === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Всички критерии са с оценка ≥ 4 — няма препоръки.
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map(c => (
            <PriorityCard
              key={c.id}
              c={c}
              readOnly={readOnly}
              onExplanationChange={onExplanationChange}
              onRecommendationChange={onRecommendationChange}
            />
          ))}
        </div>
      )}
    </ReportSection>
  );
}

// ── Document section divider ──────────────────────────────────────────────────
function DocDivider({ docType }) {
  const label    = docType === 'toc' ? 'Terms & Conditions' : 'Privacy Policy';
  const subtitle = docType === 'toc'
    ? 'Анализ на договорните условия за ползване'
    : 'Анализ на политиката за поверителност';
  const abbr = docType === 'toc' ? 'T&C' : 'PP';

  return (
    <div className="flex items-center gap-3 pt-2 pb-2"
      style={{ borderTop: '2px solid var(--cp-blue-40)' }}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl font-black text-white text-xs"
        style={{ backgroundColor: 'var(--cp-blue-100)' }}>
        {abbr}
      </div>
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--cp-neutral-100)' }}>{label}</h2>
        <p className="text-xs" style={{ color: 'var(--cp-neutral-60)' }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ── Not uploaded placeholder ──────────────────────────────────────────────────
function NotUploadedPlaceholder({ label }) {
  return (
    <div className="rounded-xl px-8 py-6 text-center text-sm"
      style={{ border: '1px dashed var(--cp-neutral-40)', color: 'var(--cp-neutral-60)' }}>
      {label} — не е качен / не е анализиран
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function EditModeClient({ audit, privacy_result, toc_result, isPublished, shareUid }) {
  const [privCriteria, setPrivCriteria] = useState(
    () => (privacy_result?.criteria ?? []).map(c => ({ ...c, recommendation: c.recommendation ?? null }))
  );
  const [tocCriteria, setTocCriteria] = useState(
    () => (toc_result?.criteria ?? []).map(c => ({ ...c, recommendation: c.recommendation ?? null }))
  );

  const [privScore, setPrivScore] = useState(null); // null = use backend value
  const [tocScore,  setTocScore]  = useState(null);
  const [privDirty, setPrivDirty] = useState(false);
  const [tocDirty,  setTocDirty]  = useState(false);

  const [saving,     setSaving]     = useState(null); // 'privacy' | 'toc' | null
  const [publishing, setPublishing] = useState(false);
  const [saveMsg,    setSaveMsg]    = useState(null);  // { type: 'ok'|'err', text }

  const hasPrivacy = !!privacy_result;
  const hasToc     = !!toc_result;

  // ── Display scores (live during edit, fallback to backend) ───────────────────
  const displayPrivScore = privScore ?? {
    tier_scores:     privacy_result?.tier_scores,
    total_score:     privacy_result?.total_score,
    total_max_score: privacy_result?.total_max_score,
    total_pct:       privacy_result?.total_pct ?? 0,
    verbal_scale:    privacy_result?.verbal_scale,
    low_score_count: privacy_result?.low_score_count ?? 0,
  };

  const displayTocScore = tocScore ?? {
    tier_scores:     toc_result?.tier_scores,
    total_score:     toc_result?.total_score,
    total_max_score: toc_result?.total_max_score,
    total_pct:       toc_result?.total_pct ?? 0,
    verbal_scale:    toc_result?.verbal_scale,
    low_score_count: toc_result?.low_score_count ?? 0,
  };

  // ── Criterion update ─────────────────────────────────────────────────────────
  const updateCriterion = useCallback((docType, id, field, value) => {
    if (docType === 'privacy') {
      setPrivCriteria(prev => {
        const next = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
        setPrivScore(recalculateFromEditor(next));
        setPrivDirty(true);
        return next;
      });
    } else {
      setTocCriteria(prev => {
        const next = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
        setTocScore(recalculateFromEditor(next));
        setTocDirty(true);
        return next;
      });
    }
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave(docType) {
    const criteria = docType === 'privacy' ? privCriteria : tocCriteria;
    setSaving(docType);
    setSaveMsg(null);
    try {
      const res  = await fetch(proxyUrl(`/api/toc/${audit.uid}/save`), {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ doc_type: docType, criteria }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const label = docType === 'privacy' ? 'Privacy Policy' : 'T&C';
      setSaveMsg({ type: 'ok', text: `${label} — промените са запазени.` });
      if (docType === 'privacy') { setPrivScore(null); setPrivDirty(false); }
      else                       { setTocScore(null);  setTocDirty(false);  }
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (e) {
      setSaveMsg({ type: 'err', text: `Грешка: ${e.message}` });
    } finally {
      setSaving(null);
    }
  }

  // ── Publish ──────────────────────────────────────────────────────────────────
  async function handlePublish() {
    if (!confirm('Публикуването е необратимо. Продължи?')) return;
    setPublishing(true);
    setSaveMsg(null);
    try {
      const res  = await fetch(proxyUrl(`/api/toc/${audit.uid}/publish`), { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      window.location.reload();
    } catch (e) {
      setSaveMsg({ type: 'err', text: `Грешка при публикуване: ${e.message}` });
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-10">

      {/* ── Sticky action bar ── */}
      <div className="sticky top-4 z-10 flex items-center justify-between gap-4 rounded-xl border px-5 py-3 shadow-md"
        style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>

        <div className="flex flex-wrap items-center gap-3">
          {isPublished ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#15803d' }}>
              <Lock className="h-4 w-4" />
              <span>Публикувано — само четене</span>
            </div>
          ) : (
            <>
              {hasPrivacy && (
                <button
                  onClick={() => handleSave('privacy')}
                  disabled={!!saving || !privDirty}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#0175ff' }}>
                  {saving === 'privacy'
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Записване...</>
                    : <><Save className="h-4 w-4" /> Запази Privacy</>}
                </button>
              )}
              {hasToc && (
                <button
                  onClick={() => handleSave('toc')}
                  disabled={!!saving || !tocDirty}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#0175ff' }}>
                  {saving === 'toc'
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Записване...</>
                    : <><Save className="h-4 w-4" /> Запази T&C</>}
                </button>
              )}
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ borderColor: '#86efac', backgroundColor: '#f0fdf4', color: '#15803d' }}>
                {publishing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Публикуване...</>
                  : <><Share2 className="h-4 w-4" /> Публикувай</>}
              </button>
            </>
          )}

          {isPublished && shareUid && (
            <a href={`/toc-report/share/${shareUid}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:opacity-90"
              style={{ borderColor: 'var(--cp-blue-40)', backgroundColor: 'var(--cp-blue-5)', color: 'var(--cp-blue-100)' }}>
              <Share2 className="h-4 w-4" /> Публична връзка <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {saveMsg && (
            <div className={`flex items-center gap-1.5 text-sm ${saveMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
              {saveMsg.type === 'ok'
                ? <CheckCircle2 className="h-4 w-4" />
                : <AlertCircle  className="h-4 w-4" />}
              {saveMsg.text}
            </div>
          )}
        </div>

        {/* Mini score badges */}
        <div className="flex items-center gap-4 text-sm font-bold shrink-0" style={{ color: '#0155b9' }}>
          {hasPrivacy && (
            <span className="flex items-center gap-1.5">
              <span className="text-xs font-normal" style={{ color: 'var(--cp-neutral-60)' }}>PP</span>
              {Math.round(displayPrivScore.total_pct ?? 0)}%
            </span>
          )}
          {hasToc && (
            <span className="flex items-center gap-1.5">
              <span className="text-xs font-normal" style={{ color: 'var(--cp-neutral-60)' }}>T&C</span>
              {Math.round(displayTocScore.total_pct ?? 0)}%
            </span>
          )}
        </div>
      </div>

      {/* Visual preview notice */}
      {(privScore || tocScore) && (
        <div className="rounded-lg border px-4 py-2 text-xs flex items-center gap-2"
          style={{ borderColor: 'var(--cp-blue-40)', backgroundColor: 'var(--cp-blue-5)', color: 'var(--cp-blue-150)' }}>
          <span className="font-semibold">Визуален преглед</span>
          — Backend ще изчисли окончателния резултат при запис.
        </div>
      )}

      {/* ── Privacy Policy section ── */}
      {hasPrivacy ? (
        <div className="space-y-8">
          <DocDivider docType="privacy" />
          <ScoreSummaryBar score={displayPrivScore} docType="privacy" />
          <AuditTableSection
            criteria={privCriteria}
            score={displayPrivScore}
            docType="privacy"
            readOnly={isPublished}
            onScoreChange={(id, v)       => updateCriterion('privacy', id, 'score', v)}
            onExplanationChange={(id, v) => updateCriterion('privacy', id, 'explanation', v)}
          />
          <RecommendationsSection
            id="recommendations-privacy"
            criteria={privCriteria}
            readOnly={isPublished}
            onExplanationChange={(id, v)    => updateCriterion('privacy', id, 'explanation', v)}
            onRecommendationChange={(id, v) => updateCriterion('privacy', id, 'recommendation', v)}
          />
        </div>
      ) : (
        <NotUploadedPlaceholder label="Privacy Policy" />
      )}

      {/* ── Terms & Conditions section ── */}
      {hasToc ? (
        <div className="space-y-8">
          <DocDivider docType="toc" />
          <ScoreSummaryBar score={displayTocScore} docType="toc" />
          <AuditTableSection
            criteria={tocCriteria}
            score={displayTocScore}
            docType="toc"
            readOnly={isPublished}
            onScoreChange={(id, v)       => updateCriterion('toc', id, 'score', v)}
            onExplanationChange={(id, v) => updateCriterion('toc', id, 'explanation', v)}
          />
          <RecommendationsSection
            id="recommendations-toc"
            criteria={tocCriteria}
            readOnly={isPublished}
            onExplanationChange={(id, v)    => updateCriterion('toc', id, 'explanation', v)}
            onRecommendationChange={(id, v) => updateCriterion('toc', id, 'recommendation', v)}
          />
        </div>
      ) : (
        <NotUploadedPlaceholder label="Terms & Conditions" />
      )}

    </div>
  );
}
