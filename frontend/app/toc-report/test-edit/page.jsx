'use client';
// ⚠️ TEST ONLY — delete together with lib/test-audit-fixture.js when done.
// Route: /toc-report/test-edit  |  Preview of the edit/corrections page with mock data.

import { useState, useCallback } from 'react';
import { ArrowLeft, Save, Share2, Loader2, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { TEST_AUDIT_META, TEST_PRIVACY_RESULT } from '@/lib/test-audit-fixture';
import { ScoreCards }    from '@/components/toc/ScoreCards';
import { CriteriaTable } from '@/components/toc/CriteriaTable';

// ── Mock edit page (mirrors EditModeClient but with fixture data + no real API) ─
export default function TestEditPage() {
  const [criteria, setCriteria] = useState(TEST_PRIVACY_RESULT.criteria);
  const [liveScore, setLiveScore] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  const updateCriterion = useCallback((id, field, value) => {
    setCriteria(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
      // Recalculate inline (mirrors toc-score-calculator logic)
      const tiers = [1, 2, 3, 4];
      const tier_scores = {};
      let total_score = 0, total_max_score = 0;
      for (const t of tiers) {
        const active = updated.filter(c => c.tier === t && !c.skipped && c.score !== null);
        if (active.length === 0) continue;
        const mult  = active[0].multiplier ?? 1;
        const score = active.reduce((s, c) => s + (c.score ?? 0) * mult, 0);
        const max   = active.length * 5 * mult;
        tier_scores[`tier${t}`] = { score, max, pct: max > 0 ? (score / max) * 100 : 0 };
        total_score     += score;
        total_max_score += max;
      }
      const total_pct = total_max_score > 0 ? Math.round((total_score / total_max_score) * 100) : 0;
      const low_score_count = updated.filter(c => !c.skipped && c.score !== null && c.score <= 3).length;
      setLiveScore({ tier_scores, total_score, total_max_score, total_pct, verbal_scale: TEST_PRIVACY_RESULT.verbal_scale, low_score_count });
      return updated;
    });
  }, []);

  const displayScore = liveScore ?? TEST_PRIVACY_RESULT;

  function handleSave() {
    setSaveMsg({ type: 'ok', text: 'TEST MODE — реален запис няма.' });
    setTimeout(() => setSaveMsg(null), 3000);
  }

  return (
    <div className="space-y-8 pb-16">
      {/* TEST MODE banner */}
      <div className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm"
        style={{ backgroundColor: 'var(--cp-blue-15)', border: '1px solid var(--cp-blue-40)', color: 'var(--cp-blue-150)' }}>
        <span><strong>TEST MODE</strong> — симулиран одит · няма реални API извиквания</span>
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
            <ArrowLeft className="h-4 w-4" /> Към репорта
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
            <span className="rounded px-2 py-0.5 text-xs font-mono"
              style={{ backgroundColor: 'var(--cp-neutral-20)', color: 'var(--cp-neutral-60)' }}>
              {TEST_AUDIT_META.uid}
            </span>
          </div>
        </div>
      </div>

      {/* Edit section */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>Privacy Policy</h2>

        <div className="space-y-6">
          {/* Live score notice */}
          {liveScore && (
            <div className="rounded-lg border px-4 py-2 text-xs flex items-center gap-2"
              style={{ borderColor: 'var(--cp-blue-40)', backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
              <span className="font-semibold">Визуален преглед</span>
              — Backend ще изчисли окончателния резултат при запис.
            </div>
          )}

          {/* Score cards */}
          <ScoreCards scoringResult={displayScore} docType="privacy" />

          {/* Action bar */}
          <div className="flex items-center justify-between gap-4 rounded-xl border px-5 py-3 shadow-sm"
            style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: '#fff' }}>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
                style={{ backgroundColor: '#0175ff' }}>
                <Save className="h-4 w-4" /> Запази
              </button>
              <button
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition"
                style={{ borderColor: '#86efac', backgroundColor: '#f0fdf4', color: '#15803d' }}>
                <Share2 className="h-4 w-4" /> Публикувай
              </button>
            </div>

            {saveMsg && (
              <div className={`flex items-center gap-1.5 text-sm ${saveMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                <CheckCircle2 className="h-4 w-4" />
                {saveMsg.text}
              </div>
            )}
          </div>

          {/* Criteria table */}
          <CriteriaTable
            criteria={criteria}
            onCriterionChange={updateCriterion}
            readOnly={false}
          />
        </div>
      </section>
    </div>
  );
}
