// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  TEST ONLY — delete this file when test mode is no longer needed.
//
// Activated when: client_name = "CP_TEST" AND site_url = "https://craftpolicy.com/"
// Purpose: instant simulated audit — no API calls, no token consumption.
//
// Structure: 2 criteria per Tier (8 total), Privacy Policy only.
//            Exactly 2 criteria with score ≤ 3  →  2 priority recommendations.
// ─────────────────────────────────────────────────────────────────────────────

/** @type {import('./toc-score-calculator').Criterion[]} */
const CRITERIA = [
  // ── Tier 1 — Critical (multiplier 3) ────────────────────────────────────────
  {
    id: 101, tier: 1, multiplier: 3, skipped: false,
    name:        'Идентификация на администратора на данни',
    score:       4,
    explanation: 'Политиката посочва ясно наименованието и адреса на администратора. Липсва единствено ЕИК/ДДС номер за пълна идентификация.',
  },
  {
    id: 102, tier: 1, multiplier: 3, skipped: false,
    name:        'Правно основание за обработка на лични данни',
    score:       2,                                          // ← Препоръка 1
    explanation: 'Документът не посочва конкретно правно основание по чл. 6 GDPR за всяка категория данни. Необходима е спешна корекция за постигане на съответствие.',
  },

  // ── Tier 2 — Important (multiplier 2) ───────────────────────────────────────
  {
    id: 103, tier: 2, multiplier: 2, skipped: false,
    name:        'Права на субектите на данни (достъп, коригиране, изтриване)',
    score:       5,
    explanation: 'Изчерпателно описание на всички права по GDPR — достъп, коригиране, изтриване, преносимост и ограничаване на обработката.',
  },
  {
    id: 104, tier: 2, multiplier: 2, skipped: false,
    name:        'Срокове за съхранение на личните данни',
    score:       4,
    explanation: 'Посочени са общи срокове. Препоръчително е да се добави структурирана таблица с конкретни срокове по категории данни.',
  },

  // ── Tier 3 — Standard (multiplier 1.5) ──────────────────────────────────────
  {
    id: 105, tier: 3, multiplier: 1.5, skipped: false,
    name:        'Бисквитки и технологии за проследяване',
    score:       3,                                          // ← Препоръка 2
    explanation: 'Политиката споменава бисквитки, но не ги класифицира (задължителни / аналитични / маркетингови) и не описва механизъм за оттегляне на съгласие.',
  },
  {
    id: 106, tier: 3, multiplier: 1.5, skipped: false,
    name:        'Трансфер на данни извън ЕС/ЕИП',
    score:       4,
    explanation: 'Посочени са третите държави получатели и приложените стандартни договорни клаузи (СДК). Добра практика.',
  },

  // ── Tier 4 — Improvement (multiplier 1) ─────────────────────────────────────
  {
    id: 107, tier: 4, multiplier: 1, skipped: false,
    name:        'Информация за жалби до надзорен орган (КЗЛД)',
    score:       5,
    explanation: 'Налице е ясна информация с линк към уебсайта на КЗЛД и описание на процедурата за подаване на жалба.',
  },
  {
    id: 108, tier: 4, multiplier: 1, skipped: false,
    name:        'Контакти на длъжностното лице по защита на данните (DPO)',
    score:       4,
    explanation: 'Посочен имейл адрес на DPO. Препоръчително е да се добави и физически адрес за кореспонденция.',
  },
];

// Pre-calculated scores (verified against toc-score-calculator logic):
//   Tier 1: (4+2)*3 = 18  / 2*5*3 = 30  → 60.0 %
//   Tier 2: (5+4)*2 = 18  / 2*5*2 = 20  → 90.0 %
//   Tier 3: (3+4)*1.5=10.5/ 2*5*1.5=15  → 70.0 %
//   Tier 4: (5+4)*1 =  9  / 2*5*1 = 10  → 90.0 %
//   Total : 55.5 / 75 → 74.0 % → "Адекватно"

export const TEST_PRIVACY_RESULT = {
  criteria: CRITERIA,
  tier_scores: {
    tier1: { score: 18,   max: 30, pct: 60.0 },
    tier2: { score: 18,   max: 20, pct: 90.0 },
    tier3: { score: 10.5, max: 15, pct: 70.0 },
    tier4: { score: 9,    max: 10, pct: 90.0 },
  },
  total_score:     55.5,
  total_max_score: 75,
  total_pct:       74.0,
  verbal_scale:    'Адекватно',
  low_score_count: 2,
};

export const TEST_AUDIT_META = {
  uid:           '__test__',
  client_name:   'CP_TEST',
  site_url:      'https://craftpolicy.com/',
  business_type: 'saas',
  status:        'completed',
  created_at:    '2026-03-21T10:00:00.000Z',
  published_at:  null,
  share_uid:     null,
};
