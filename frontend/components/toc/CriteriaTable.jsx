'use client';

/**
 * CriteriaTable — interactive table with sliders for scoring criteria.
 *
 * Props:
 *   criteria        {Criterion[]}                      — flat array from API
 *   onCriterionChange(id, field, value) {Function}     — called on slider / explanation change
 *   readOnly        {boolean}                          — hides sliders, shows static scores
 */

const TIER_LABELS = {
  1: 'Tier 1 — Задължителни',
  2: 'Tier 2 — Основни',
  3: 'Tier 3 — Допълнителни',
  4: 'Tier 4 — Препоръчителни',
};

const SCORE_COLORS = {
  1: 'text-red-600',
  2: 'text-orange-500',
  3: 'text-yellow-600',
  4: 'text-blue-600',
  5: 'text-green-600',
};

const SCORE_LABELS = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' };

function TierSummary({ tierCriteria }) {
  const active = tierCriteria.filter(c => !c.skipped && c.score !== null);
  if (active.length === 0) return null;
  const multiplier = active[0]?.multiplier ?? 1;
  const score = active.reduce((s, c) => s + (c.score ?? 0) * multiplier, 0);
  const max   = active.length * 5 * multiplier;
  const pct   = max > 0 ? Math.round((score / max) * 100) : 0;

  return (
    <tr className="bg-gray-50 border-t border-b border-gray-200">
      <td colSpan={4} className="px-4 py-2 text-right text-xs text-gray-500 font-medium">
        Tier резултат:
      </td>
      <td className="px-4 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
        {score} / {max} <span className="text-gray-400">({pct}%)</span>
      </td>
    </tr>
  );
}

export function CriteriaTable({ criteria = [], onCriterionChange, readOnly = false }) {
  // Group by tier, preserving original order
  const tiers = [1, 2, 3, 4];
  const byTier = Object.fromEntries(
    tiers.map(t => [t, criteria.filter(c => c.tier === t)])
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-10">#</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Критерий</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 w-16">Tier</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 w-28">Оценка</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Обяснение</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map(tierNum => {
            const tierCriteria = byTier[tierNum];
            if (!tierCriteria || tierCriteria.length === 0) return null;

            return [
              /* Tier header row */
              <tr key={`tier-header-${tierNum}`} className="bg-blue-50 border-t-2 border-blue-200">
                <td colSpan={5} className="px-4 py-2 text-xs font-bold text-blue-800 uppercase tracking-wide">
                  {TIER_LABELS[tierNum]}
                  <span className="ml-2 font-normal text-blue-600 normal-case tracking-normal">
                    (×{tierCriteria[0]?.multiplier ?? 1} множител)
                  </span>
                </td>
              </tr>,

              /* Criteria rows */
              ...tierCriteria.map((c, idx) => (
                <tr
                  key={c.id}
                  className={[
                    'border-b border-gray-100 transition-colors',
                    c.skipped ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-gray-50',
                    !c.skipped && c.score !== null && c.score <= 3 ? 'border-l-2 border-l-orange-300' : '',
                  ].join(' ')}
                >
                  {/* № */}
                  <td className="px-3 py-3 text-xs text-gray-400 align-top">{c.id}</td>

                  {/* Name */}
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{c.name}</p>
                  </td>

                  {/* Tier badge */}
                  <td className="px-3 py-3 text-center align-top">
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      T{c.tier}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-3 py-3 align-top">
                    {c.skipped ? (
                      <span className="inline-block rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-500">N/A</span>
                    ) : readOnly ? (
                      <span className={`text-base font-bold ${SCORE_COLORS[c.score] ?? 'text-gray-600'}`}>
                        {c.score ?? '—'} / 5
                      </span>
                    ) : (
                      <div className="flex flex-col items-center gap-1 min-w-[80px]">
                        <span className={`text-base font-bold tabular-nums ${SCORE_COLORS[c.score] ?? 'text-gray-400'}`}>
                          {c.score ?? '—'}
                        </span>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={c.score ?? 1}
                          onChange={e => onCriterionChange?.(c.id, 'score', Number(e.target.value))}
                          className="w-full h-1.5 accent-blue-600 cursor-pointer"
                          aria-label={`Оценка за ${c.name}`}
                        />
                        <div className="flex justify-between w-full text-[9px] text-gray-400 leading-none">
                          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Explanation */}
                  <td className="px-4 py-3 align-top">
                    {c.skipped ? (
                      <span className="text-xs text-gray-400 italic">Пропуснат</span>
                    ) : readOnly ? (
                      <p className="text-xs text-gray-600 leading-relaxed">{c.explanation || '—'}</p>
                    ) : (
                      <textarea
                        value={c.explanation ?? ''}
                        onChange={e => onCriterionChange?.(c.id, 'explanation', e.target.value)}
                        rows={2}
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700 resize-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition min-w-[200px]"
                        placeholder="Обяснение..."
                      />
                    )}
                  </td>
                </tr>
              )),

              /* Tier summary row */
              <TierSummary key={`tier-summary-${tierNum}`} tierCriteria={tierCriteria} />,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
