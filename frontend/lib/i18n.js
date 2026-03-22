// Audit form UI translations — Bulgarian & English.
// Used exclusively by TocAuditForm; extend for other components when needed.

export const i18n = {
  bg: {
    lang:             'bg',
    langLabel:        'Език на одита',

    // Navigation
    navNewAudit:      'Нов одит',
    navAudits:        'Одити',

    // Form sections
    s1Title:          'Информация за клиента',
    s2Title:          'Privacy Policy',
    s3Title:          'Terms & Conditions',
    s4Title:          'Контекстни въпроси',

    // Fields
    clientLabel:      'Клиент',
    clientPlaceholder:'Acme Ltd.',
    urlLabel:         'URL на сайта',
    urlPlaceholder:   'https://acme.com',
    bizTypeLabel:     'Тип бизнес',

    // Questions
    questionsHint:    'Отговорите се използват за прескачане на неприложими критерии.',
    yes:              'Да',
    no:               'Не',

    // Upload
    uploadHint:       'Качи поне един от двата документа.',

    // Doc status labels
    docBoth:          '2 документа готови',
    docPrivacy:       'Privacy Policy готова',
    docToc:           'T&C готов',
    docNone:          'Нито един документ',

    // Submit
    submitBtn:        'Стартирай одит',
    sending:          'Изпращане...',

    // Validation
    errClient:        'Въведи иmе на клиента.',
    errUrl:           'Въведи URL на сайта.',
    errDoc:           'Качи поне един документ (Privacy Policy или T&C).',

    // Polling overlay
    pollSending:      'Изпращане...',
    pollStarted:      'Анализът стартира — Claude чете документите...',
    pollDone:         'Завършено — пренасочване...',
    pollPartial:      'Частичен успех — пренасочване...',
    pollFailed:       'Анализът се провали: ',
    sendFailed:       'Неуспешно изпращане: ',
    analyzingTitle:   'Анализиране...',
    elapsedLabel:     'Изминало',
    auditDuration:    'Анализът може да отнеме 2–5 минути.',
    auditRedirect:    'Страницата ще се пренасочи автоматично.',
    auditIdLabel:     'Одит ID',
  },

  en: {
    lang:             'en',
    langLabel:        'Audit Language',

    navNewAudit:      'New Audit',
    navAudits:        'Audits',

    s1Title:          'Client Information',
    s2Title:          'Privacy Policy',
    s3Title:          'Terms & Conditions',
    s4Title:          'Contextual Questions',

    clientLabel:      'Client',
    clientPlaceholder:'Acme Ltd.',
    urlLabel:         'Site URL',
    urlPlaceholder:   'https://acme.com',
    bizTypeLabel:     'Business Type',

    questionsHint:    'Answers are used to skip non-applicable criteria.',
    yes:              'Yes',
    no:               'No',

    uploadHint:       'Upload at least one of the two documents.',

    docBoth:          '2 documents ready',
    docPrivacy:       'Privacy Policy ready',
    docToc:           'T&C ready',
    docNone:          'No documents',

    submitBtn:        'Start Audit',
    sending:          'Sending...',

    errClient:        'Enter client name.',
    errUrl:           'Enter site URL.',
    errDoc:           'Upload at least one document (Privacy Policy or T&C).',

    pollSending:      'Sending...',
    pollStarted:      'Analysis started — Claude is reading the documents...',
    pollDone:         'Complete — redirecting...',
    pollPartial:      'Partial success — redirecting...',
    pollFailed:       'Analysis failed: ',
    sendFailed:       'Failed to submit: ',
    analyzingTitle:   'Analyzing...',
    elapsedLabel:     'Elapsed',
    auditDuration:    'Analysis may take 2–5 minutes.',
    auditRedirect:    'Page will redirect automatically.',
    auditIdLabel:     'Audit ID',
  },
};

// ── Report page translations (test page + future real report) ─────────────────
export const reportI18n = {
  bg: {
    // Cover
    auditTitle:       'GDPR & Privacy Policy\nCompliance Audit',
    tagline:          'Оценка на съответствието на ниво ръководство с приложими препоръки',
    confidenceLabel:  'Ниво на достоверност',
    confidenceText:   'Одитът съчетава автоматизиран анализ на документи с AI-базирана оценка за осигуряване на надеждни резултати, валидирани спрямо критериите на GDPR.',
    website:          'Уебсайт',
    scanDate:         'Дата на одита',
    preparedFor:      'Подготвено за',
    preparedBy:       'Подготвено от',

    // Scope
    scopeTitle:       'Обхват & Методология',
    scopeSubtitle:    'Какво и как тествахме',
    whatTestedLabel:  'Подложено на правен одит:',
    whatTested: [
      'Правна идентичност на администратора — основа за всяка регулаторна проверка',
      'Законови основания за обработка — липсата им е водещата причина за санкции по чл. 6 GDPR',
      'Легитимен интерес — аргументиран балансиращ тест и защитима правна обосновка по чл. 13(1)(d)',
      'Механизми за съгласие — валидност, гранулираност и реална свобода на избор съгласно чл. 7 GDPR',
      'Права на субектите — декларирани права без работещ механизъм носят същата регулаторна отговорност като пълното им отсъствие',
      'Срокове за съхранение — неопределените срокове нарушават принципа за ограничение по чл. 5(1)(е)',
      'Международни трансфери — най-високорисковата зона след решението Schrems II; SCCs, TIA и допълнителни мерки',
      'Получатели на данни — пълна прозрачност, категоризация и правно основание за всяко споделяне',
      'Бисквитки и технологии за проследяване — съответствие с ePrivacy и практиката на надзорните органи',
      'Уведомяване при нарушения — процедурна готовност по чл. 33–34 GDPR и 72-часовото задължение',
    ],
    methodCards: [
      {
        heading: 'Методология от 37 правни критерия',
        body: 'Над 80% от одитираните от CraftPolicy политики съдържат поне едно критично нарушение, невидимо без структурирана правна рамка. Методологията е разработена в съответствие с насоките на EDPB и оценява всеки документ в четири нива на правна критичност. Целта е единствена: да открие това, което регулаторът ще намери преди вас.',
      },
      {
        heading: 'Претеглена оценка на регулаторната ви експозиция',
        body: 'Не всички нарушения носят еднакъв риск. Критичните експозиции носят до 5× по-висока тежест, защото именно те са обект на регулаторен интерес и основание за санкции. Резултатът е точна карта на правната ви уязвимост.',
      },
      {
        heading: 'Правна оценка и план за защита',
        body: 'Одитът приключва с недвусмислена правна оценка и приоритизиран план за отстраняване с няколко препоръки. Всяка препоръка е обвързана с конкретен правен риск и член от GDPR. Това не е доклад за архив. Това е работен инструмент и отправна точка за надграждане на документацията Ви.',
      },
    ],
    limitationsLabel: 'Прозрачност относно одита:',
    limitations: [
      'Одитът обхваща изцяло текстовото съдържание на предоставения документ — всеки раздел, клауза и формулировка се оценяват индивидуално спрямо приложимите GDPR изисквания.',
      'Техническото изпълнение на consent механизми (банери, CMP платформи) представлява самостоятелна дисциплина и се препоръчва като допълнителен технически преглед.',
      'Одитът установява регулаторната позиция на документа към датата на оценката. Имплементацията на препоръките и изготвянето на нова политика са достъпни като допълнителни услуги, предоставяни от екипа на CraftPolicy.',
    ],

    // Audit table
    tableTitle:       'Детайлна одитна таблица',
    colNum:           '#',
    colCriterion:     'Критерий',
    colScore:         'Оценка',
    colFindings:      'Констатации & обяснение',
    tierWord:         'Ниво',
    complianceWord:   'съответствие',

    // Privacy Analysis
    analysisTitle:    'Анализ на Privacy Policy',
    analysisSubtitle: 'Оценка на критериите за съответствие с детайлни обяснения',
    totalCriteria:    'Общо критерии',
    nonCompliant:     'Несъответствие',
    compliant:        'Съответствие',
    finalScoreLabel:  'Краен резултат — Privacy Policy',
    pointsWord:       'точки',

    // Verbal scale labels (for FinalScoreBar)
    verbal: {
      'Критичен риск':         'Критичен риск',
      'Несъответствие':        'Несъответствие',
      'Частично съответствие': 'Частично',
      'Адекватно':             'Адекватно',
      'Високо съответствие':   'Високо',
      'Пълно съответствие':    'Пълно съответствие',
    },
    verbalRisk: {
      critical: 'Критичен риск',
      high:     'Висок риск',
      medium:   'Среден риск',
      good:     'Добро ниво',
    },

    // Recommendations
    recTitle:    'Приоритетни препоръки',
    recSubtitle: 'Критични проблеми, изискващи незабавно внимание',
    recCritical: '⚠ Критичен риск',
    recSuggested:'Препоръчано подобрение',
    recLevel:    'Ниво',
    recAction:   'Препоръчано действие:',
    recUrgent:   'Спешно: Актуализирайте документа, за да включва конкретна информация относно',
    recGdpr:     'съгласно чл. 13 GDPR.',
  },

  en: {
    auditTitle:       'GDPR & Privacy Policy\nCompliance Audit',
    tagline:          'Executive-level compliance assessment with actionable recommendations',
    confidenceLabel:  'Confidence Level',
    confidenceText:   'This audit combines automated document analysis with AI-assisted evaluation to ensure high-confidence findings derived from the submitted document and validated against GDPR criteria.',
    website:          'Website',
    scanDate:         'Scan Date',
    preparedFor:      'Prepared For',
    preparedBy:       'Prepared By',

    scopeTitle:       'Scope & Methodology',
    scopeSubtitle:    'What we tested and how we tested it',
    whatTestedLabel:  'Subjected to Legal Audit:',
    whatTested: [
      'Legal identity of the controller — the foundation for every regulatory review',
      'Legal bases for processing — their absence is the leading cause of sanctions under Art. 6 GDPR',
      'Legitimate interest — an argued balancing test and defensible legal justification under Art. 13(1)(d)',
      'Consent mechanisms — validity, granularity, and genuine freedom of choice under Art. 7 GDPR',
      'Data subject rights — declared rights without a working mechanism carry the same regulatory liability as their complete absence',
      'Retention periods — undefined periods violate the storage limitation principle under Art. 5(1)(e)',
      'International transfers — the highest-risk area following the Schrems II ruling; SCCs, TIAs, and supplementary measures',
      'Data recipients — full transparency, categorisation, and legal basis for every sharing',
      'Cookies and tracking technologies — compliance with ePrivacy and supervisory authority practice',
      'Breach notification — procedural readiness under Arts. 33–34 GDPR and the 72-hour obligation',
    ],
    methodCards: [
      {
        heading: 'Methodology of 37 Legal Criteria',
        body: 'Over 80% of the privacy policies audited by CraftPolicy contain at least one critical violation invisible without a structured legal framework. The methodology is developed in accordance with EDPB guidelines and assesses each document across four levels of legal criticality. The objective is singular: to uncover what the regulator will find before you do.',
      },
      {
        heading: 'Weighted Assessment of Your Regulatory Exposure',
        body: 'Not all violations carry equal risk. Critical exposures carry up to 5× greater weight because they are precisely what regulators target and the basis for sanctions. The result is an accurate map of your legal vulnerability.',
      },
      {
        heading: 'Legal Assessment and Protection Plan',
        body: 'The audit concludes with an unambiguous legal assessment and a prioritised remediation plan with actionable recommendations. Each recommendation is tied to a specific legal risk and a GDPR article. This is not a report for the archive. It is a working tool and a starting point for upgrading your documentation.',
      },
    ],
    limitationsLabel: 'Transparency about the audit:',
    limitations: [
      'The audit covers the full textual content of the submitted document — every section, clause and formulation is assessed individually against the applicable GDPR requirements.',
      'Technical implementation of consent mechanisms (banners, CMP platforms) is a separate discipline and is recommended as an additional technical review.',
      'The audit establishes the regulatory position of the document as at the date of assessment. Implementation of recommendations and drafting of a new policy are available as additional services provided by the CraftPolicy team.',
    ],

    tableTitle:       'Detailed Audit Table',
    colNum:           '#',
    colCriterion:     'Criterion',
    colScore:         'Score',
    colFindings:      'Findings & Explanation',
    tierWord:         'Level',
    complianceWord:   'compliance',

    analysisTitle:    'Privacy Policy Analysis',
    analysisSubtitle: 'Compliance criteria evaluation with detailed explanations',
    totalCriteria:    'Total Criteria',
    nonCompliant:     'Non-Compliant',
    compliant:        'Compliant',
    finalScoreLabel:  'Final Privacy Policy Score',
    pointsWord:       'points',

    verbal: {
      'Критичен риск':         'Critical Risk',
      'Несъответствие':        'Non-Compliance',
      'Частично съответствие': 'Partial',
      'Адекватно':             'Adequate',
      'Високо съответствие':   'High',
      'Пълно съответствие':    'Full Compliance',
    },
    verbalRisk: {
      critical: 'Critical Risk',
      high:     'High Risk',
      medium:   'Medium Risk',
      good:     'Good Level',
    },

    recTitle:    'Priority Recommendations',
    recSubtitle: 'Critical issues requiring immediate attention',
    recCritical: '⚠ Critical Risk',
    recSuggested:'Recommended Improvement',
    recLevel:    'Level',
    recAction:   'Recommended Action:',
    recUrgent:   'Urgent: Update the document to include specific information regarding',
    recGdpr:     'per Art. 13 GDPR.',
  },
};
