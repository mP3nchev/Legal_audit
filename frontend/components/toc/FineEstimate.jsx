import { Scale, AlertTriangle } from 'lucide-react';
import { estimateFines } from '@/lib/zzp-fines';

const fmt = n => `${Math.round(n).toLocaleString('bg-BG')} €`;

const T = {
  bg: {
    title:    'Прогнозна санкция по ЗЗП',
    subtitle: 'Ориентир за онлайн магазин (търговец / юридическо лице), въз основа на констатациите в Общите условия',
    total:    'Ориентировъчна обща санкция',
    range:    'Законов диапазон за засегнатите разпоредби',
    article:  'Разпоредба',
    findings: 'Засегнати изисквания',
    est:      'Ориентир',
    scope:    'Законов диапазон',
    perCase:  'за всеки отделен случай',
    none:     'При текущите оценки няма констатации, за които да се прогнозира санкция по включените разпоредби.',
    note:     'Индикативна оценка, не правно становище. Ориентирът е около средата на законовия диапазон и се измества според тежестта на констатацията. Действителната санкция се определя от компетентния орган за всеки конкретен случай и може да бъде многократно по-висока, ако нарушенията са повече от един случай. Оценката не включва неравноправни клаузи и разпоредби извън списъка.',
  },
  en: {
    title:    'Estimated Consumer Protection Act Penalty',
    subtitle: 'Indicative figure for an online shop (trader / legal entity), based on the findings in the Terms & Conditions',
    total:    'Estimated total penalty',
    range:    'Statutory range for the affected provisions',
    article:  'Provision',
    findings: 'Affected requirements',
    est:      'Estimate',
    scope:    'Statutory range',
    perCase:  'per separate case',
    none:     'With the current scores there are no findings for which a penalty under the included provisions is estimated.',
    note:     'Indicative estimate, not legal advice. The figure sits around the middle of the statutory range and shifts with the severity of the finding. The actual penalty is set by the competent authority for each case and can be many times higher if there is more than one case. The estimate excludes unfair terms and provisions outside the list.',
  },
};

/** Server/client safe: pure render from the criteria array. */
export function FineEstimate({ criteria, lang = 'bg' }) {
  const t = T[lang === 'en' ? 'en' : 'bg'];
  const { rows, totalMin, totalMax, totalEstimate } = estimateFines(criteria);

  return (
    <section id="fine-estimate" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
          <Scale className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--cp-neutral-100)' }}>{t.title}</h2>
          <p className="text-xs" style={{ color: 'var(--cp-neutral-80)' }}>{t.subtitle}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border p-5 text-sm"
          style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)', color: 'var(--cp-neutral-80)' }}>
          {t.none}
        </div>
      ) : (
        <>
          <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#0175ff', opacity: 0.8 }}>{t.total}</p>
            <p className="mt-1 text-4xl font-bold" style={{ color: '#0175ff' }}>{fmt(totalEstimate)}</p>
            <p className="mt-2 text-xs" style={{ color: '#4a5568' }}>
              {t.range}: {fmt(totalMin)} - {fmt(totalMax)}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border"
            style={{ borderColor: 'var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
            {rows.map((r, i) => (
              <div key={r.key} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto]"
                style={{ borderTop: i ? '1px solid var(--cp-neutral-40)' : 'none' }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--cp-neutral-100)' }}>{r.title}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--cp-neutral-80)' }}>{r.refs}</p>
                  <p className="mt-2 text-xs" style={{ color: 'var(--cp-neutral-80)' }}>
                    <span className="font-semibold">{t.findings}:</span>{' '}
                    {r.hits.map(h => h.name).join('; ')}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs" style={{ color: 'var(--cp-neutral-80)' }}>{t.est}</p>
                  <p className="text-xl font-bold" style={{ color: '#0175ff' }}>{fmt(r.estimate)}</p>
                  <p className="text-xs" style={{ color: 'var(--cp-neutral-80)' }}>
                    {t.scope}: {fmt(r.min)} - {fmt(r.max)}{r.perCase ? ` (${t.perCase})` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex items-start gap-2 rounded-xl border p-4"
        style={{ borderColor: 'var(--cp-blue-40)', backgroundColor: 'var(--cp-blue-5)' }}>
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--cp-blue-150)' }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--cp-neutral-90)' }}>{t.note}</p>
      </div>
    </section>
  );
}
