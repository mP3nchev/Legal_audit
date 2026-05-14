/**
 * Shared report sections — used by both the edit view (/toc-report/[uid])
 * and the public share page (/toc-report/share/[share_uid]).
 *
 * Server component (no 'use client').
 */

import { Globe, Calendar, User, Building2 } from 'lucide-react';


// ── Detail cell ───────────────────────────────────────────────────────────────
function DetailCell({ icon, label, value }) {
  return (
    <div className="px-6 py-4" style={{ backgroundColor: 'var(--cp-white)' }}>
      <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--cp-neutral-80)' }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-medium break-all" style={{ color: 'var(--cp-neutral-100)' }}>{value}</p>
    </div>
  );
}

// ── Cover section ─────────────────────────────────────────────────────────────
export function CoverSection({ audit, t }) {
  const locale   = t.lang === 'en' ? 'en-GB' : 'bg-BG';
  const scanDate = audit.created_at
    ? new Date(audit.created_at).toLocaleDateString(locale, {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Sofia',
      })
    : '-';

  const auditTitle  = audit.report_title?.trim()   || t.auditTitle;
  const tagline     = audit.report_tagline?.trim() || t.tagline;
  const partnerLogo = audit.partner_logo_data ?? null;

  return (
    <section id="cover" className="scroll-mt-24">
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--cp-neutral-40)', backgroundColor: 'var(--cp-white)' }}>
        <div className="px-8 py-10" style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
          <div className="mb-6 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/craftpolicy-logo.svg" alt="CraftPolicy" className="h-8 w-auto" />
            {partnerLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partnerLogo} alt="Partner logo" className="h-8 w-auto object-contain" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight lg:text-4xl"
            style={{ color: 'var(--cp-blue-100)', whiteSpace: 'pre-line' }}>
            {auditTitle}
          </h1>
          <p className="mt-3 text-base" style={{ color: '#4a5568' }}>{tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: 'var(--cp-neutral-40)' }}>
          <DetailCell icon={<Globe     className="h-4 w-4" />} label={t.website}     value={audit.site_url || '-'} />
          <DetailCell icon={<Calendar  className="h-4 w-4" />} label={t.scanDate}    value={scanDate} />
          <DetailCell icon={<User      className="h-4 w-4" />} label={t.preparedFor} value={audit.client_name || '-'} />
          <DetailCell icon={<Building2 className="h-4 w-4" />} label={t.preparedBy}  value="CraftPolicy Audit team" />
        </div>
        {/* border-t confidence note removed — replaced by new ScopeSection design */}
      </div>
    </section>
  );
}

// ── Scope helpers ─────────────────────────────────────────────────────────────

const AUDIT_ITEMS = [
  {
    tag: 'Чл. 4 & 13',
    title: 'Кой обработва данните ви и на какво основание',
    desc: 'Пълна идентификация на администратора и обработващите лица',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    tag: 'Чл. 6',
    title: 'Правно основание за всяка цел на обработка',
    desc: 'Съгласие, договор, законово задължение или легитимен интерес',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="7.5" cy="15.5" r="4.5"/>
        <path d="M10.5 12.5l8-8M18.5 4.5l1.5 1.5M15 8l1.5 1.5"/>
      </svg>
    ),
  },
  {
    tag: 'Чл. 7',
    title: 'Как е получено съгласието и може ли да се оттегли',
    desc: 'Яснота, отделност и свобода на избора при всяко искане',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <polyline points="7 12 10 15 17 8"/>
      </svg>
    ),
  },
  {
    tag: 'Гл. III',
    title: 'Права на физическите лица',
    desc: 'Достъп, коригиране, изтриване, ограничаване и преносимост',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="12" cy="7" r="4"/>
        <path d="M5 21v-1a7 7 0 0 1 14 0v1"/>
        <path d="M16 10l2 2 4-4" strokeWidth="1.6"/>
      </svg>
    ),
  },
  {
    tag: 'Чл. 5(1)(e)',
    title: 'Колко дълго се съхраняват данните и защо',
    desc: 'Конкретни срокове или ясни критерии за тяхното определяне',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="12" cy="12" r="9"/>
        <polyline points="12 7 12 12 15 15"/>
      </svg>
    ),
  },
  {
    tag: 'Schrems II',
    title: 'Предаване на данни извън ЕС',
    desc: 'SCCs, оценка на трансфера и допълнителни защитни мерки',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9"/>
        <path d="M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9"/>
        <path d="M3.5 9h17M3.5 15h17"/>
      </svg>
    ),
  },
  {
    tag: 'Чл. 13(1)(e)',
    title: 'С кого се споделят данните и за каква цел',
    desc: 'Категории получатели, партньори и обработващи лица',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="6" cy="12" r="2.5"/>
        <circle cx="19" cy="6" r="2.5"/>
        <circle cx="19" cy="18" r="2.5"/>
        <path d="M8.3 11l8.4-3.6M8.3 13l8.4 3.6"/>
      </svg>
    ),
  },
  {
    tag: 'ePrivacy',
    title: 'Бисквитки и технологии за проследяване',
    desc: 'Видове, цели и съответствие с изискванията на ePrivacy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M12 2a7 7 0 0 0-7 7"/>
        <path d="M5 9c0 3.5 1.5 6.5 4 8.5"/>
        <path d="M12 9a3 3 0 0 0-3 3c0 2 .8 4 2 6"/>
        <path d="M12 9a3 3 0 0 1 3 3c0 2.2-1 4.5-2.5 6.5"/>
        <path d="M19 9a7 7 0 0 1-1.5 4.5"/>
        <path d="M12 2a7 7 0 0 1 7 7"/>
        <path d="M9 21c1 .5 2 .8 3 .8"/>
      </svg>
    ),
  },
];

const TEXT_MUTED  = '#3D5068';
const TEXT_SUBTLE = '#7A8FA8';
const BORDER      = '#DDE6F0';
const SURFACE_ALT = '#F4F8FC';

// ── Scope & Methodology section (concept-a-v4 design) ─────────────────────────
export function ScopeSection({ t }) {
  const isEn = t.lang === 'en';

  return (
    <section id="scope" className="scroll-mt-24">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--cp-neutral-100)', letterSpacing: '-0.3px' }}>
            {t.scopeTitle}
          </h2>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_SUBTLE }}>
            {t.scopeSubtitle}
          </p>
        </div>
      </div>

      {/* ── 2-col grid ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* LEFT — Audit scope card */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--cp-white)', border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: '#1a7a52', boxShadow: '0 0 0 3px #e5f5ee' }} />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
              {isEn ? 'Subjected to Legal Audit' : 'Подложено на правен одит'}
            </span>
          </div>

          {AUDIT_ITEMS.map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3 transition-colors"
              style={{ borderBottom: i < AUDIT_ITEMS.length - 1 ? `1px solid #EEF3F9` : 'none' }}>
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-150)' }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--cp-neutral-100)' }}>
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: TEXT_SUBTLE }}>
                  {item.desc}
                </p>
              </div>
              <span className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap"
                style={{
                  color: 'var(--cp-blue-150)',
                  backgroundColor: 'var(--cp-blue-15)',
                  border: '1px solid var(--cp-blue-40)',
                  letterSpacing: '0.2px',
                }}>
                {item.tag}
              </span>
            </div>
          ))}
        </div>

        {/* RIGHT — methodology stack */}
        <div className="flex flex-col gap-4">

          {/* Methodology card */}
          <div className="relative overflow-hidden rounded-2xl p-6"
            style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
            {/* Decorative circle */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full"
              style={{ backgroundColor: 'rgba(1,117,255,0.05)' }} />
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: '#0175ff', letterSpacing: '0.8px', opacity: 0.7 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  {isEn ? 'Methodology' : 'Методология'}
                </div>
                <div className="text-xl leading-snug font-semibold" style={{ color: '#0175ff' }}>
                  {isEn ? '37 criteria, categorised\nacross 4 risk levels!' : '37 критерия, категоризирани\nв 4 степени на риск!'}
                </div>
              </div>
              <div className="shrink-0 rounded-xl px-4 py-3 text-center"
                style={{ backgroundColor: 'rgba(1,117,255,0.1)', border: '1px solid rgba(1,117,255,0.2)' }}>
                <div className="text-3xl leading-none font-bold" style={{ color: '#0175ff' }}>37</div>
                <div className="mt-1 block text-[10px]" style={{ color: '#4a5568', letterSpacing: '0.3px' }}>
                  {isEn ? 'criteria' : 'критерия'}
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#4a5568' }}>
              {isEn
                ? 'Over 80% of audited policies contain at least one critical violation invisible without a structured legal framework. Methodology developed per EDPB guidelines. The goal is singular: uncover what the regulator will find before you do.'
                : 'Над 80% от одитираните политики съдържат поне едно критично нарушение, невидимо без структурирана правна рамка. Методологията е разработена в съответствие с насоките на EDPB. Целта е единствена: да открие това, което регулаторът ще намери преди вас.'}
            </p>
          </div>

          {/* Feature card 1 — weighted risk */}
          <div className="flex items-start gap-4 rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--cp-white)', borderColor: BORDER }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-100)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <line x1="12" y1="3" x2="12" y2="21"/>
                <path d="M5 21h14"/>
                <path d="M12 3l-6 6h12l-6-6z" strokeLinejoin="round"/>
                <path d="M6 9l-3 6h6l-3-6z"/>
                <path d="M18 9l-3 6h6l-3-6z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--cp-neutral-100)' }}>
                {isEn ? 'Weighted Regulatory Risk Assessment' : 'Претеглена оценка на регулаторния риск'}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
                {isEn
                  ? 'Not all violations carry equal risk. Critical findings carry up to 5× greater weight — precisely where supervisory authorities look first.'
                  : 'Не всички нарушения носят еднакъв риск. Критичните констатации имат до 5 пъти по-висока тежест — точно там, където надзорните органи търсят най-напред.'}
              </p>
            </div>
          </div>

          {/* Feature card 2 — prioritised plan */}
          <div className="flex items-start gap-4 rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--cp-white)', borderColor: BORDER }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--cp-blue-15)', color: 'var(--cp-blue-100)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2.5"/>
                <path d="M3 12l1.5-1.5L3 9" strokeLinejoin="round"/>
                <path d="M3 16v5" strokeWidth="1.6"/>
                <path d="M3 16l3-2-3-2" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--cp-neutral-100)' }}>
                {isEn ? 'Prioritised Remediation Plan' : 'Приоритизиран план за отстраняване'}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
                {isEn
                  ? 'The audit concludes with specific recommendations ordered by legal weight. Each is tied to an exact GDPR article — a working tool, not a report for the archive.'
                  : 'Одитът приключва с конкретни препоръки, наредени по правна тежест. Всяка е обвързана с точен член от GDPR — работен инструмент, не доклад за архив.'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Urgency — full width ── */}
      <div className="relative mt-5 overflow-hidden rounded-2xl"
        style={{ background: 'linear-gradient(-133deg, #accef7, #e7edf5)' }}>
        {/* Decorative circle */}
        <div className="pointer-events-none absolute -bottom-14 -right-14 h-56 w-56 rounded-full"
          style={{ backgroundColor: 'rgba(1,117,255,0.05)' }} />

        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:gap-8 lg:px-10 lg:py-8">

          {/* Label */}
          <div className="lg:w-56 shrink-0">
            <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: '#0175ff', opacity: 0.7, letterSpacing: '0.7px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {isEn ? 'Why Now' : 'Защо сега'}
            </div>
            <div className="text-lg leading-snug font-semibold" style={{ color: '#0175ff' }}>
              {isEn ? 'Act before the regulator does' : 'Действайте преди\nрегулаторът да го направи'}
            </div>
          </div>

          {/* Separator */}
          <div className="hidden lg:block w-px self-stretch min-h-14 shrink-0"
            style={{ backgroundColor: 'rgba(1,117,255,0.2)' }} />

          {/* Stats */}
          <div className="flex gap-8 shrink-0">
            <div>
              <div className="text-3xl leading-none font-bold" style={{ color: '#0175ff' }}>1.2 млрд €</div>
              <div className="mt-1.5 text-xs leading-snug" style={{ color: '#4a5568' }}>
                {isEn ? 'GDPR fines in Europe\nfor 2025' : 'санкции по GDPR\nв Европа за 2025 г.'}
              </div>
            </div>
            <div>
              <div className="text-3xl leading-none font-bold" style={{ color: '#0175ff' }}>+22%</div>
              <div className="mt-1.5 text-xs leading-snug" style={{ color: '#4a5568' }}>
                {isEn ? 'growth in breach\nnotifications' : 'ръст на уведомленията\nза нарушения'}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="hidden lg:block w-px self-stretch min-h-14 shrink-0"
            style={{ backgroundColor: 'rgba(1,117,255,0.2)' }} />

          {/* Note */}
          <div className="flex-1">
            <p className="text-sm leading-relaxed" style={{ color: '#4a5568' }}>
              {isEn
                ? 'The audit identifies vulnerabilities while remediation is still a matter of choice, not obligation. Prevention costs are many times lower than fines, reputational risk, and forced compliance.'
                : 'Одитът идентифицира уязвимостите, докато отстраняването им е въпрос на избор, не на задължение. Разходите за превенция са многократно по-ниски от глобата, репутационния риск и принудителното привеждане в съответствие.'}
            </p>
          </div>

        </div>

        {/* Disclaimer */}
        <div className="px-6 pb-3 pt-2.5 lg:px-10"
          style={{ borderTop: '1px solid rgba(1,117,255,0.15)', fontSize: '10.5px', color: '#4a5568', lineHeight: 1.5 }}>
          * {isEn
            ? 'Data per DLA Piper: GDPR Fines & Data Breach Survey 2025.'
            : 'Данните са по анализа на DLA Piper: GDPR Fines & Data Breach Survey 2025.'}
        </div>
      </div>

    </section>
  );
}
