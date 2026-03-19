'use client';

/**
 * ScoreCards — displays total score + tier breakdown as summary cards.
 *
 * Props:
 *   scoringResult  {ScoringResult}  — from backend or toc-score-calculator
 *   docType        {string}         — 'privacy' | 'toc'
 */

const VERBAL_COLOR = {
  'Критичен риск':         { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200'    },
  'Несъответствие':        { bg: 'bg-orange-100',  text: 'text-orange-800', border: 'border-orange-200' },
  'Частично съответствие': { bg: 'bg-yellow-100',  text: 'text-yellow-800', border: 'border-yellow-200' },
  'Адекватно':             { bg: 'bg-blue-100',    text: 'text-blue-800',   border: 'border-blue-200'   },
  'Високо съответствие':   { bg: 'bg-emerald-100', text: 'text-emerald-800',border: 'border-emerald-200'},
  'Пълно съответствие':    { bg: 'bg-green-100',   text: 'text-green-800',  border: 'border-green-200'  },
};

function pctBar(pct) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped >= 76 ? 'bg-green-500' : clamped >= 61 ? 'bg-blue-500' : clamped >= 51 ? 'bg-yellow-400' : clamped >= 31 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function ScoreCards({ scoringResult, docType }) {
  if (!scoringResult) return null;

  const { tier_scores, total_score, total_max_score, total_pct, verbal_scale, low_score_count } = scoringResult;
  const rounded = Math.round(total_pct);
  const colors  = VERBAL_COLOR[verbal_scale] ?? VERBAL_COLOR['Адекватно'];
  const label   = docType === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';

  return (
    <div className="space-y-4">
      {/* Total score card */}
      <div className={`rounded-xl border p-5 ${colors.bg} ${colors.border}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${colors.text} opacity-70`}>{label}</p>
            <p className={`mt-1 text-4xl font-extrabold tabular-nums ${colors.text}`}>{rounded}%</p>
            <p className={`mt-0.5 text-sm font-medium ${colors.text}`}>{verbal_scale}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-medium ${colors.text}`}>{total_score} / {total_max_score}</p>
            <p className={`text-xs ${colors.text} opacity-70`}>точки</p>
            {low_score_count > 0 && (
              <p className="mt-2 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                ⚠ {low_score_count} нис{low_score_count === 1 ? 'ка' : 'ки'} оценк{low_score_count === 1 ? 'а' : 'и'}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3">{pctBar(total_pct)}</div>
      </div>

      {/* Tier breakdown cards */}
      {tier_scores && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(t => {
            const ts = tier_scores[`tier${t}`];
            if (!ts || ts.max === 0) return (
              <div key={t} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-400">Tier {t}</p>
                <p className="mt-1 text-sm text-gray-400">—</p>
              </div>
            );
            const p = Math.round(ts.pct);
            return (
              <div key={t} className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs font-medium text-gray-500">Tier {t}</p>
                <p className="mt-1 text-xl font-bold text-gray-800 tabular-nums">{p}%</p>
                <p className="text-[10px] text-gray-400">{ts.score} / {ts.max}</p>
                <div className="mt-2">{pctBar(ts.pct)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
