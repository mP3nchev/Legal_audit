'use client';

/**
 * VerbalScale — visual representation of the 6-level verbal scale
 * with a marker on the current position.
 *
 * Props:
 *   pct  {number}  — 0-100
 */

const SCALE = [
  { min: 0,  max: 30,  label: 'Критичен риск',         color: 'bg-red-500'    },
  { min: 31, max: 50,  label: 'Несъответствие',         color: 'bg-orange-400' },
  { min: 51, max: 60,  label: 'Частично съответствие',  color: 'bg-yellow-400' },
  { min: 61, max: 75,  label: 'Адекватно',              color: 'bg-blue-400'   },
  { min: 76, max: 89,  label: 'Високо съответствие',    color: 'bg-emerald-400'},
  { min: 90, max: 100, label: 'Пълно съответствие',     color: 'bg-green-500'  },
];

export function VerbalScale({ pct }) {
  const rounded = Math.round(pct ?? 0);
  const active  = SCALE.find(s => rounded >= s.min && rounded <= s.max) ?? SCALE[0];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Вербална скала</h3>

      {/* Bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {SCALE.map(s => (
          <div
            key={s.label}
            className={`${s.color} flex-none transition-all`}
            style={{ width: `${s.max - s.min + 1}%` }}
            title={`${s.min}–${s.max}% — ${s.label}`}
          />
        ))}
      </div>

      {/* Marker */}
      <div className="relative mt-1 h-4">
        <div
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${Math.min(99, Math.max(1, rounded))}%` }}
        >
          <div className="w-0.5 h-3 bg-gray-800 mx-auto" />
          <div className="w-1.5 h-1.5 bg-gray-800 rounded-full mx-auto -mt-0.5" />
        </div>
      </div>

      {/* Labels */}
      <div className="mt-3 grid gap-1">
        {SCALE.map(s => (
          <div key={s.label} className={`flex items-center gap-2 rounded px-2 py-1 ${s.label === active.label ? 'bg-gray-100' : ''}`}>
            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${s.color}`} />
            <span className={`text-xs ${s.label === active.label ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
              {s.min}–{s.max}%
            </span>
            <span className={`text-xs flex-1 ${s.label === active.label ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
              {s.label}
            </span>
            {s.label === active.label && (
              <span className="text-xs font-bold text-gray-800 tabular-nums">{rounded}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
