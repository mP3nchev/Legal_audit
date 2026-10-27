'use strict';

/**
 * Demo audit generator ("ТЕСТОВ"): builds realistic, fully invented criteria
 * for an eCommerce shop so the report, the penalty estimate and the public
 * link can be shown without using a real client. No EIK, phones, e-mails or links.
 */

const fs   = require('fs');
const path = require('path');

const { calculateTotal, getVerbalScale, countLowScores } = require('../analyzers/toc-score-calculator');

function loadCriteria(file) {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '../config', file), 'utf8'));
  return Object.entries(cfg.tiers)
    .flatMap(([, list]) => list)
    .map(c => ({ id: c.id, name: c.name, tier: c.tier, multiplier: c.multiplier }))
    .sort((a, b) => a.tier - b.tier || a.id - b.id);
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Hand-written findings (scores are forced for these) ──────────────────────
const TOC_FORCED = {
  1:  { score: 2, explanation: 'Условията посочват само търговското име на дружеството. Липсват седалище, адрес на управление и данни за контакт, по които потребителят може бързо да се свърже с търговеца.', recommendation: 'Добавете пълното наименование, седалището и адреса на управление, както и средства за връзка, които позволяват бърза и ефективна комуникация.' },
  7:  { score: 1, explanation: 'Документът не обяснява какво включва крайната цена. Не е ясно дали са включени данъците и разходите за доставка, нито как се изчисляват допълнителните такси при наложен платеж.', recommendation: 'Посочете, че цените са крайни с включени данъци, и опишете отделно разходите за доставка и наложен платеж, включително кога не могат да се изчислят предварително.' },
  9:  { score: 2, explanation: 'Процесът на поръчване е описан общо. Не се уточнява, че бутонът за финализиране на поръчката е с надпис, който ясно означава задължение за плащане.', recommendation: 'Опишете стъпките до сключване на договора и добавете, че поръчката се потвърждава с бутон "Поръчка със задължение за плащане" или равностойна формулировка.' },
  11: { score: 3, explanation: 'Правото на отказ в 14-дневен срок е споменато, но не е описано от кой момент тече срокът при поръчка с повече стоки или доставка на части.', recommendation: 'Уточнете началния момент на срока за отказ при различните видове доставка и начина на упражняване на правото.' },
  12: { score: 2, explanation: 'Изключенията от правото на отказ са изброени непълно, а някои са формулирани по-широко от закона, например за всички стоки с отворена опаковка.', recommendation: 'Приведете списъка с изключения в съответствие с чл. 57 ЗЗП и откажете общи формулировки, които ограничават правото на отказ.' },
  13: { score: 2, explanation: 'Не е посочено кой поема разходите за връщане на стоките. Липсва информация за размера им, когато стоките не могат да се върнат по обичаен начин по пощата.', recommendation: 'Изрично посочете дали разходите за връщане са за сметка на потребителя и в какъв размер, или че ги поема търговецът.' },
  14: { score: 1, explanation: 'Няма стандартен формуляр за отказ, а на сайта не е предвидена функция за отказ от договора онлайн, която да е постоянно достъпна и видима.', recommendation: 'Добавете стандартния формуляр за отказ и функция "откажете се от договора тук" с потвърждение "потвърждавам отказа", както и автоматично потвърждение на траен носител.' },
  15: { score: 3, explanation: 'Гаранционните права са описани, но липсва напомняне за законовата гаранция от две години и за процедурата по подаване на рекламация.', recommendation: 'Добавете напомняне за двугодишната законова гаранция и ясна стъпка по стъпка процедура за рекламации и срокове за отговор.' },
  19: { score: 3, explanation: 'Срокът за доставка е посочен общо ("в разумен срок"), без конкретна дата или максимален срок за изпълнение на поръчката.', recommendation: 'Посочете конкретен срок за доставка и условията при забавяне, както и ограниченията по територия.' },
  22: { score: 2, explanation: 'Условията за връщане са неясни за сроковете, в които се възстановяват платените суми, и не посочват начина на плащане, по който се връщат парите.', recommendation: 'Уточнете, че сумите се възстановяват до 14 дни от уведомяването за отказа, по същия начин на плащане, освен ако потребителят е съгласен на друг.' },
  23: { score: 3, explanation: 'Приеманите методи на плащане са изброени, но не е посочено кои допълнителни такси се налагат при тях.', recommendation: 'Посочете приемите методи на плащане към началото на поръчката и всички такси, свързани с тях.' },
  24: { score: 2, explanation: 'Търговецът си запазва правото да отменя поръчки и да променя цени и характеристики на стоките по своя преценка и без основание, без потребителят да може да се откаже.', recommendation: 'Ограничете едностранните промени до изчерпателно посочени основания и осигурете на потребителя право да се откаже при завишаване на цената.' },
  25: { score: 1, explanation: 'Клаузата изключва отговорността на търговеца за всякакви преки и косвени вреди, включително при неизпълнение на договора, което ограничава правата на потребителя по закон.', recommendation: 'Премахнете общото изключване на отговорността и я ограничете само в рамките, допустими от закона.' },
  26: { score: 3, explanation: 'Непреодолимата сила е определена твърде широко и включва обстоятелства, които са в зоната на контрол на търговеца, като липса на наличност при доставчик.', recommendation: 'Стеснете определението до външни, непредвидими събития и задължете търговеца да уведомява потребителя и да връща платеното.' },
  30: { score: 2, explanation: 'Търговецът може едностранно да променя условията, като промените влизат в сила с публикуването им, без предизвестие и без право на потребителя да прекрати договора.', recommendation: 'Въведете предизвестие за промените и право на потребителя да прекрати договора, ако не е съгласен.' },
  31: { score: 3, explanation: 'Документът е на български, но съдържа неясни и твърде общи формулировки, които затрудняват разбирането на правата и задълженията.', recommendation: 'Опростете езика и добавете кратко резюме на основните права на потребителя в началото.' },
};

const PRIVACY_FORCED = {
  5:  { score: 2, explanation: 'Легитимният интерес е посочен като основание, но не са описани интересът, необходимостта и балансиращият тест спрямо правата на субектите.', recommendation: 'Опишете конкретния легитимен интерес и добавете кратка обосновка защо не нарушава правата на субектите.' },
  9:  { score: 1, explanation: 'Политиката споменава, че данните могат да се предават на доставчици извън ЕС, но не посочва държавите, гаранциите и механизма за трансфера.', recommendation: 'Посочете получателите извън ЕС, правното основание за трансфера (напр. стандартни договорни клаузи) и допълнителните мерки.' },
  12: { score: 2, explanation: 'Не са описани защитните мерки при международните трансфери и как субектът може да получи копие от тях.', recommendation: 'Добавете описание на гаранциите и как субектите могат да поискат копие от тях.' },
  20: { score: 2, explanation: 'Сроковете за съхранение са посочени с общи фрази като "докато е необходимо", без критерии за определянето им.', recommendation: 'Дайте таблица със срокове по категории данни и цели или критерии за тяхното определяне.' },
  21: { score: 3, explanation: 'Правото да се оттегли съгласието е споменато, но не е ясно, че оттеглянето е толкова лесно, колкото даването му.', recommendation: 'Опишете лесен начин за оттегляне на съгласието и последиците от него.' },
  26: { score: 2, explanation: 'Конкретните срокове по отделните цели липсват, а посоченото е само общо за целия документ.', recommendation: 'Посочете конкретен срок за всяка цел на обработка.' },
};

const TOC_SKIPPED     = [38];
const PRIVACY_SKIPPED = [15, 36];

function templated(c, score) {
  const n = `"${c.name}"`;
  if (score >= 5) return { explanation: `Критерият е изпълнен: документът уточнява ясно и пълно въпроса за ${n}.`, recommendation: '' };
  if (score === 4) return { explanation: `Критерият е изпълнен в основни линии. По ${n} има дребни неясноти, които не водят до риск.`, recommendation: 'Препоръчително е формулировките да се уточнят.' };
  if (score === 3) return { explanation: `Критерият е изпълнен частично: по ${n} основните елементи са налице, но липсват важни детайли.`, recommendation: `Допълнете раздела за ${n}, така че да обхваща всички изисквани елементи.` };
  if (score === 2) return { explanation: `Уредбата по ${n} е недостатъчна: формулировките са общи и не покриват изискванията.`, recommendation: `Пренапишете раздела за ${n} с конкретни и проверими формулировки.` };
  return { explanation: `По ${n} в документа практически няма уредба.`, recommendation: `Добавете отделен раздел, който изцяло урежда ${n}.` };
}

/** Pick scores for the free criteria so the weighted total lands on `target` %. */
function build(criteria, forced, skippedIds, target, seed) {
  const rand = rng(seed);
  const items = criteria.map(c => {
    const skipped = skippedIds.includes(c.id);
    const f = forced[c.id];
    const free = !skipped && !f;
    const score = skipped ? null : f ? f.score : [2, 3, 3, 4, 4, 5][Math.floor(rand() * 6)];
    return { ...c, skipped, score, free, forcedText: f };
  });

  const pctOf = () => calculateTotal(items).total_pct;
  for (let i = 0; i < 400 && Math.abs(pctOf() - target) > 0.3; i++) {
    let best = null;
    for (const it of items) {
      if (!it.free) continue;
      for (const d of [-1, 1]) {
        const ns = it.score + d;
        if (ns < 2 || ns > 5) continue;
        const old = it.score; it.score = ns;
        const diff = Math.abs(pctOf() - target);
        it.score = old;
        if (!best || diff < best.diff) best = { it, ns, diff };
      }
    }
    if (!best || best.diff >= Math.abs(pctOf() - target)) break;
    best.it.score = best.ns;
  }

  return items.map(it => {
    if (it.skipped) return { id: it.id, name: it.name, tier: it.tier, multiplier: it.multiplier, skipped: true, score: null, explanation: null };
    const text = it.forcedText ?? templated(it, it.score);
    return {
      id: it.id, name: it.name, tier: it.tier, multiplier: it.multiplier,
      skipped: false, score: it.score,
      explanation: text.explanation, recommendation: text.recommendation || '',
    };
  });
}

/** Shape a criteria array like analyzer.saveTocResult does for the toc_results row. */
function toResultRow(criteria, expectedCount) {
  const { tier_scores, total_score, total_max_score, total_pct } = calculateTotal(criteria);
  const verbal_scale    = getVerbalScale(total_pct);
  const low_score_count = countLowScores(criteria);
  const evaluated_count = criteria.filter(c => !c.skipped).length;

  const low = criteria.filter(c => !c.skipped && c.score !== null && c.score <= 2)
    .sort((a, b) => a.tier - b.tier || a.score - b.score);
  const recSource = low.length >= 3 ? low.slice(0, 7)
    : criteria.filter(c => !c.skipped && c.score !== null).sort((a, b) => a.tier - b.tier || a.score - b.score).slice(0, 5);

  return {
    criteria_json: JSON.stringify(criteria),
    total_score, total_max_score, total_pct,
    tier_scores_json: JSON.stringify(tier_scores),
    low_score_count, verbal_scale,
    recommendations_json: JSON.stringify(recSource.map(c => ({ title: c.name, text: c.explanation || '', recommendation: c.recommendation || '' }))),
    business_summary:
      `Одитът обхваща ${evaluated_count} критерия. Обща оценка: ${total_pct.toFixed(1)}% (${verbal_scale}). ` +
      `Критерии с ниска оценка (≤3): ${low_score_count}.`,
    evaluated_count, expected_count: expectedCount,
  };
}

function generateDemo() {
  const tocCriteria     = build(loadCriteria('toc-criteria-toc.json'),     TOC_FORCED,     TOC_SKIPPED,     48, 4801);
  const privacyCriteria = build(loadCriteria('toc-criteria-privacy.json'), PRIVACY_FORCED, PRIVACY_SKIPPED, 56, 5602);
  return {
    toc:     toResultRow(tocCriteria, 40),
    privacy: toResultRow(privacyCriteria, 37),
  };
}

module.exports = { generateDemo };
