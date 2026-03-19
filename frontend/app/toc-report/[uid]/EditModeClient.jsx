'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Share2, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { CriteriaTable } from '@/components/toc/CriteriaTable';
import { ScoreCards }    from '@/components/toc/ScoreCards';
import { proxyUrl }      from '@/lib/utils';
import { recalculateFromEditor } from '@/lib/toc-score-calculator';

/**
 * EditModeClient — handles interactive editing and saving of toc results.
 *
 * Props:
 *   auditUid      {string}
 *   docType       {string}    'privacy' | 'toc'
 *   initialResult {object}    API result object with criteria + scoring
 *   isPublished   {boolean}
 *   shareUid      {string|null}
 */
export function EditModeClient({ auditUid, docType, initialResult, isPublished, shareUid }) {
  const router = useRouter();

  const [criteria,   setCriteria]   = useState(initialResult?.criteria ?? []);
  const [liveScore,  setLiveScore]  = useState(null); // null = show backend score
  const [saving,     setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveMsg,    setSaveMsg]    = useState(null);  // { type: 'ok'|'err', text }

  // Recalculate live score when criteria changes
  const updateCriterion = useCallback((id, field, value) => {
    setCriteria(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
      setLiveScore(recalculateFromEditor(updated));
      return updated;
    });
  }, []);

  const displayScore = liveScore ?? {
    tier_scores:     initialResult?.tier_scores,
    total_score:     initialResult?.total_score,
    total_max_score: initialResult?.total_max_score,
    total_pct:       initialResult?.total_pct,
    verbal_scale:    initialResult?.verbal_scale,
    low_score_count: initialResult?.low_score_count ?? 0,
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res  = await fetch(proxyUrl(`/api/toc/${auditUid}/save`), {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ doc_type: docType, criteria }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSaveMsg({ type: 'ok', text: 'Промените са запазени.' });
      setLiveScore(null); // backend is now source of truth again
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (e) {
      setSaveMsg({ type: 'err', text: `Грешка: ${e.message}` });
    } finally {
      setSaving(false);
    }
  }

  // ── Publish ─────────────────────────────────────────────────────────────────
  async function handlePublish() {
    if (!confirm('Публикуването е необратимо. Продължи?')) return;
    setPublishing(true);
    setSaveMsg(null);
    try {
      const res  = await fetch(proxyUrl(`/api/toc/${auditUid}/publish`), { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      router.refresh();
    } catch (e) {
      setSaveMsg({ type: 'err', text: `Грешка при публикуване: ${e.message}` });
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Live score preview */}
      {liveScore && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700 flex items-center gap-2">
          <span className="font-semibold">Визуален преглед</span>
          — Backend ще изчисли окончателния резултат при запис.
        </div>
      )}

      <ScoreCards scoringResult={displayScore} docType={docType} />

      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {isPublished ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Lock className="h-4 w-4" />
              <span>Публикувано — само четене</span>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !liveScore}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Записване...</>
                : <><Save className="h-4 w-4" /> Запази</>}
            </button>
          )}

          {!isPublished && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50 transition"
            >
              {publishing
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Публикуване...</>
                : <><Share2 className="h-4 w-4" /> Публикувай</>}
            </button>
          )}

          {isPublished && shareUid && (
            <a
              href={`/toc-report/share/${shareUid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
            >
              <Share2 className="h-4 w-4" /> Публична връзка
            </a>
          )}
        </div>

        {saveMsg && (
          <div className={`flex items-center gap-1.5 text-sm ${saveMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
            {saveMsg.type === 'ok'
              ? <CheckCircle2 className="h-4 w-4" />
              : <AlertCircle className="h-4 w-4" />}
            {saveMsg.text}
          </div>
        )}
      </div>

      {/* Criteria table */}
      <CriteriaTable
        criteria={criteria}
        onCriterionChange={isPublished ? undefined : updateCriterion}
        readOnly={isPublished}
      />
    </div>
  );
}
