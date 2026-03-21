// ⚠️ TEST ONLY — delete together with lib/test-audit-fixture.js when done.
// Route: /toc-report/test  |  Trigger: client_name=CP_TEST + site=https://craftpolicy.com/

import { AlertTriangle, ExternalLink, FlaskConical } from 'lucide-react';
import { TEST_AUDIT_META, TEST_PRIVACY_RESULT } from '@/lib/test-audit-fixture';

export const metadata = { title: 'TEST — CraftPolicy Legal Audit' };

// ── Brand palette ─────────────────────────────────────────────────────────────
// #0175ff  #0155B9  #449AFF  #ACCEF7  #C6E0FF  #D6E9FF  #D2E2F5  #E2E8F1  #edf0f4
// #1c1c1c  #4d4d4d  #d2d2d2  #d8dbde  #f4f4f4

const TIER_LABELS = {
  1: 'Организационна прозрачност',
  2: 'Правно основание & съхранение на данни',
  3: 'Потребителски права & проследяване',
  4: 'Допълнителни изисквания',
};

// ── Donut chart (pure SVG, no library) ───────────────────────────────────────
function DonutChart({ pct, label }) {
  const r     = 54;
  const cx    = 64;
  const cy    = 64;
  const circ  = 2 * Math.PI * r;         // 339.29
  const filled = (pct / 100) * circ;

  return (
    <svg viewBox="0 0 128 128" width="160" height="160">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F1" strokeWidth="13" />
      {/* Fill — start at 12 o'clock via dashoffset */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#0175ff" strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '64px 64px' }}
      />
      {/* Inner text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="24" fontWeight="800" fill="#1c1c1c">
        {Math.round(pct)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0175ff"
        letterSpacing="1">
        {label.toUpperCase()}
      </text>
    </svg>
  );
}

// ── Vertical bar chart (tier breakdown) ──────────────────────────────────────
function TierBarChart({ tierScores }) {
  const bars = [
    { key: 'tier1', label: 'Tier 1 — Critical',  color: '#0155B9' },
    { key: 'tier2', label: 'Tier 2 — Important', color: '#0175ff' },
    { key: 'tier3', label: 'Tier 3 — Standard',  color: '#449AFF' },
    { key: 'tier4', label: 'Tier 4 — Minor',     color: '#ACCEF7' },
  ];
  const maxH = 96; // px

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#4d4d4d' }}>
        Резултат по категория
      </p>
      <div className="flex items-end gap-3" style={{ height: `${maxH + 28}px` }}>
        {bars.map(({ key, label, color }) => {
          const ts  = tierScores[key] ?? { pct: 0, score: 0, max: 0 };
          const pct = Math.round(ts.pct);
          const h   = Math.max(4, (pct / 100) * maxH);
          return (
            <div key={key} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs font-bold tabular-nums" style={{ color: '#1c1c1c' }}>{pct}%</span>
              <div
                className="w-full rounded-t-sm"
                style={{ height: `${h}px`, backgroundColor: color }}
                title={`${label}: ${ts.score}/${ts.max}`}
              />
              <span className="text-[10px] text-center leading-tight" style={{ color: '#4d4d4d' }}>
                {key.replace('tier', 'T')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Verbal scale bar ──────────────────────────────────────────────────────────
function VerbalScaleBar({ pct }) {
  const segs = [
    { range: '0–30%',   label: 'Критичен риск',     min: 0,  max: 30  },
    { range: '31–50%',  label: 'Несъответствие',     min: 31, max: 50  },
    { range: '51–60%',  label: 'Частично',           min: 51, max: 60  },
    { range: '61–75%',  label: 'Адекватно',          min: 61, max: 75  },
    { range: '76–89%',  label: 'Високо',             min: 76, max: 89  },
    { range: '90–100%', label: 'Пълно съответствие', min: 90, max: 100 },
  ];

  const rounded   = Math.round(pct);
  const activeIdx = segs.findIndex(s => rounded >= s.min && rounded <= s.max);

  // Inactive shades (dark → light going left to right)
  const inactiveBg = ['#0155B9', '#1e6ed4', '#449AFF', '#6badff', '#ACCEF7', '#C6E0FF'];

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #d8dbde' }}>
        {segs.map((s, i) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={i}
              className="flex-1 py-2.5 text-center text-xs font-bold transition-all"
              style={{
                backgroundColor: isActive ? '#0175ff' : inactiveBg[i],
                color:           isActive || i <= 2 ? 'white' : '#1c1c1c',
                outline:         isActive ? '2px solid #0155B9' : 'none',
                outlineOffset:   '-2px',
              }}
            >
              {s.range}
            </div>
          );
        })}
      </div>
      <div className="flex mt-1.5">
        {segs.map((s, i) => (
          <div key={i} className="flex-1 text-center">
            <span
              className="text-[10px] leading-tight"
              style={{
                color:      i === activeIdx ? '#0175ff' : '#4d4d4d',
                fontWeight: i === activeIdx ? '700' : '400',
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Score dots ────────────────────────────────────────────────────────────────
function ScoreDots({ score, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            display:         'inline-block',
            width:           '11px',
            height:          '11px',
            borderRadius:    '50%',
            backgroundColor: i < score ? '#0175ff' : '#d2d2d2',
          }}
        />
      ))}
      <span className="ml-1.5 text-xs font-bold tabular-nums" style={{ color: '#4d4d4d' }}>
        {score}/{max}
      </span>
    </div>
  );
}

// ── Priority card ─────────────────────────────────────────────────────────────
function PriorityCard({ criterion, index }) {
  const critical = criterion.tier === 1;
  return (
    <div
      className="rounded-xl p-5"
      style={{
        borderLeft:      `5px solid ${critical ? '#0155B9' : '#449AFF'}`,
        backgroundColor: critical ? '#D6E9FF' : '#edf0f4',
        border:          `1px solid ${critical ? '#ACCEF7' : '#D2E2F5'}`,
        borderLeftWidth: '5px',
        borderLeftColor: critical ? '#0155B9' : '#449AFF',
      }}
    >
      <div className="flex gap-4">
        {/* Icon + urgency */}
        <div className="shrink-0 pt-0.5">
          <AlertTriangle
            className="h-5 w-5"
            style={{ color: critical ? '#0155B9' : '#449AFF' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-1"
                style={{ color: critical ? '#0155B9' : '#4d4d4d' }}
              >
                {critical ? '⚠ Критичен риск' : 'Препоръчано подобрение'} · Tier {criterion.tier}
              </p>
              <p className="text-base font-bold" style={{ color: '#1c1c1c' }}>
                {criterion.name}
              </p>
            </div>
            <ScoreDots score={criterion.score} />
          </div>

          <p className="mt-3 text-sm leading-relaxed" style={{ color: '#4d4d4d' }}>
            {criterion.explanation}
          </p>

          <div className="mt-4 pt-3" style={{ borderTop: '1px solid #D2E2F5' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#1c1c1c' }}>
              Препоръчано действие:
            </p>
            <p className="text-sm" style={{ color: '#4d4d4d' }}>
              <strong>Спешно:</strong> Актуализирайте документа, за да включва конкретна и ясна информация
              относно <em>{criterion.name.toLowerCase()}</em> в съответствие с изискванията на GDPR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compliance audit table ────────────────────────────────────────────────────
function AuditTable({ criteria }) {
  const byTier = [1, 2, 3, 4].map(t => ({
    tier:  t,
    label: TIER_LABELS[t],
    items: criteria.filter(c => c.tier === t),
  }));

  const scoreColor = (score) => {
    if (score >= 4) return '#0175ff';
    if (score === 3) return '#4d4d4d';
    return '#c0392b';
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #d8dbde' }}>
      {/* Table header */}
      <div
        className="grid text-xs font-bold uppercase tracking-wide px-4 py-3"
        style={{
          gridTemplateColumns: '48px 1fr 160px 1fr',
          backgroundColor:     '#0155B9',
          color:               'white',
          gap:                 '16px',
        }}
      >
        <div>#</div>
        <div>Критерий</div>
        <div>Оценка</div>
        <div>Констатации & обяснение</div>
      </div>

      {/* Tier groups */}
      {byTier.map(({ tier, label, items }) => (
        <div key={tier}>
          {/* Tier group header */}
          <div
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide"
            style={{ backgroundColor: '#E2E8F1', color: '#0155B9', borderTop: '1px solid #d8dbde' }}
          >
            Tier {tier} — {label}
          </div>

          {/* Criteria rows */}
          {items.map((c, idx) => (
            <div
              key={c.id}
              className="grid px-4 py-4 items-start"
              style={{
                gridTemplateColumns: '48px 1fr 160px 1fr',
                gap:                 '16px',
                borderTop:           '1px solid #f4f4f4',
                backgroundColor:     idx % 2 === 0 ? 'white' : '#edf0f4',
              }}
            >
              {/* # */}
              <div
                className="text-sm font-bold tabular-nums text-center pt-0.5 rounded-full w-7 h-7 flex items-center justify-center"
                style={{ backgroundColor: '#D2E2F5', color: '#0155B9' }}
              >
                {c.id - 100}
              </div>

              {/* Criterion name */}
              <div>
                <p className="text-sm font-semibold leading-snug" style={{ color: '#1c1c1c' }}>
                  {c.name}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: '#4d4d4d' }}>
                  Tier {c.tier} · множител ×{c.multiplier}
                </p>
              </div>

              {/* Score */}
              <div className="flex flex-col gap-1.5">
                <ScoreDots score={c.score} />
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: scoreColor(c.score) }}
                >
                  {c.score >= 4
                    ? 'Съответствие'
                    : c.score === 3
                    ? 'Под стандарта'
                    : 'Критично слабо'}
                </span>
              </div>

              {/* Explanation */}
              <p className="text-sm leading-relaxed" style={{ color: '#4d4d4d' }}>
                {c.explanation}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TestReportPage() {
  const audit  = TEST_AUDIT_META;
  const result = TEST_PRIVACY_RESULT;
  const { criteria, tier_scores, total_pct, total_score, total_max_score, low_score_count } = result;

  const priorityIssues = criteria
    .filter(c => !c.skipped && c.score !== null && c.score <= 3)
    .sort((a, b) => a.tier - b.tier || a.score - b.score);

  const dateStr = new Date(audit.created_at).toLocaleDateString('bg-BG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-8 pb-12" style={{ color: '#1c1c1c' }}>

      {/* ── TEST MODE banner ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm"
        style={{ backgroundColor: '#D6E9FF', border: '1px solid #ACCEF7', color: '#0155B9' }}
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 shrink-0" />
          <span>
            <strong>TEST MODE</strong> — симулиран одит · няма реални API извиквания · не се харчат токени
          </span>
        </div>
        <span className="text-xs font-mono shrink-0">{dateStr}</span>
      </div>

      {/* ── Section header ───────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#449AFF' }}>
          Privacy Policy Audit
        </p>
        <h1 className="text-2xl font-extrabold" style={{ color: '#1c1c1c' }}>
          {audit.client_name}
        </h1>
        <a
          href={audit.site_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm mt-1 hover:underline"
          style={{ color: '#0175ff' }}
        >
          {audit.site_url} <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* ── Executive Summary ────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold uppercase tracking-wide mb-4" style={{ color: '#1c1c1c' }}>
          Обобщена оценка
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Donut card */}
          <div
            className="rounded-xl p-5 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'white', border: '1px solid #E2E8F1' }}
          >
            <DonutChart pct={total_pct} label={result.verbal_scale} />
            <p className="mt-2 text-xs text-center" style={{ color: '#4d4d4d' }}>
              {total_score} / {total_max_score} точки
            </p>
          </div>

          {/* Key risks card */}
          <div
            className="rounded-xl p-5 flex flex-col justify-between"
            style={{ backgroundColor: 'white', border: '1px solid #E2E8F1' }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#4d4d4d' }}>
                Ключови рискове
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs" style={{ color: '#4d4d4d' }}>Идентифицирани проблеми</p>
                  <p className="text-3xl font-extrabold tabular-nums" style={{ color: '#0155B9' }}>
                    {low_score_count}
                  </p>
                  <p className="text-xs" style={{ color: '#4d4d4d' }}>ниски оценки</p>
                </div>
                <div style={{ borderTop: '1px solid #E2E8F1', paddingTop: '12px' }}>
                  <p className="text-xs" style={{ color: '#4d4d4d' }}>Критични корекции</p>
                  <p className="text-3xl font-extrabold tabular-nums" style={{ color: '#c0392b' }}>
                    {priorityIssues.filter(c => c.tier === 1).length}
                  </p>
                  <p className="text-xs" style={{ color: '#4d4d4d' }}>Tier 1 проблема</p>
                </div>
              </div>
            </div>
            <div
              className="mt-4 rounded-lg p-3 text-xs leading-relaxed"
              style={{ backgroundColor: '#edf0f4', color: '#4d4d4d' }}
            >
              <strong style={{ color: '#1c1c1c' }}>Какво означава това:</strong> Документът демонстрира
              частично съответствие, но има критични пропуски, изискващи незабавна корекция.
            </div>
          </div>

          {/* Bar chart card */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: 'white', border: '1px solid #E2E8F1' }}
          >
            <TierBarChart tierScores={tier_scores} />
            <div className="mt-3 grid grid-cols-2 gap-1">
              {[1, 2, 3, 4].map(t => {
                const ts = tier_scores[`tier${t}`];
                return (
                  <div key={t} className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ['#0155B9','#0175ff','#449AFF','#ACCEF7'][t-1] }}
                    />
                    <span className="text-[10px]" style={{ color: '#4d4d4d' }}>
                      T{t}: {Math.round(ts?.pct ?? 0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ── Verbal Scale ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold uppercase tracking-wide mb-4" style={{ color: '#1c1c1c' }}>
          Скала за съответствие
        </h2>
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'white', border: '1px solid #E2E8F1' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: '#4d4d4d' }}>Ниво на съответствие</p>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#0175ff', color: 'white' }}
            >
              Текущ статус: {result.verbal_scale}
            </span>
          </div>
          <VerbalScaleBar pct={total_pct} />
        </div>
      </section>

      {/* ── Priority Improvements ─────────────────────────────────────────── */}
      {priorityIssues.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide" style={{ color: '#1c1c1c' }}>
                Приоритетни подобрения
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#4d4d4d' }}>
                Критичните проблеми, изискващи незабавно внимание
              </p>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#D6E9FF', color: '#0155B9' }}
            >
              {priorityIssues.length} проблема
            </span>
          </div>
          <div className="space-y-4">
            {priorityIssues.map((c, i) => (
              <PriorityCard key={c.id} criterion={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Detailed Audit Table ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide" style={{ color: '#1c1c1c' }}>
              Детайлна одитна таблица
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#4d4d4d' }}>
              Privacy Policy · {criteria.length} критерия · 4 нива
            </p>
          </div>
        </div>
        <AuditTable criteria={criteria} />
      </section>

    </div>
  );
}
