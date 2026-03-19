'use client';

/**
 * PriorityTimeline — shows criteria with score ≤ 3 ordered by priority
 * (Tier 1 first, then by score ascending).
 *
 * Props:
 *   criteria  {Criterion[]}  — flat array (privacy or toc)
 *   docType   {string}       — 'privacy' | 'toc'
 */

const TIER_URGENCY = {
  1: { label: 'Критично',     bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  2: { label: 'Важно',        bg: 'bg-orange-100',  text: 'text-orange-700', dot: 'bg-orange-400' },
  3: { label: 'Препоръчано',  bg: 'bg-yellow-100',  text: 'text-yellow-700', dot: 'bg-yellow-400' },
  4: { label: 'Подобрение',   bg: 'bg-blue-100',    text: 'text-blue-700',   dot: 'bg-blue-400'   },
};

const SCORE_LABEL = { 1: 'Липсва', 2: 'Критично слабо', 3: 'Под стандарта' };

export function PriorityTimeline({ criteria = [], docType }) {
  const issues = criteria
    .filter(c => !c.skipped && c.score !== null && c.score <= 3)
    .sort((a, b) => a.tier - b.tier || a.score - b.score);

  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <p className="text-sm font-medium text-green-800">Няма критични проблеми</p>
        <p className="mt-1 text-xs text-green-600">Всички критерии имат оценка ≥ 4</p>
      </div>
    );
  }

  const typeLabel = docType === 'privacy' ? 'Privacy Policy' : 'T&C';

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Приоритетни подобрения — {typeLabel}
          <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 font-medium">{issues.length}</span>
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {issues.map((c, idx) => {
          const urgency = TIER_URGENCY[c.tier] ?? TIER_URGENCY[4];
          return (
            <div key={c.id} className="flex gap-3 px-5 py-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`h-4 w-4 rounded-full ${urgency.dot} mt-0.5`} />
                {idx < issues.length - 1 && <div className="flex-1 w-px bg-gray-200 mt-1" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{c.name}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${urgency.bg} ${urgency.text}`}>
                      {urgency.label}
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-gray-600">
                      {c.score}/5
                    </span>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  Tier {c.tier} · {SCORE_LABEL[c.score] ?? `Оценка ${c.score}`}
                </p>
                {c.explanation && (
                  <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">{c.explanation}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
