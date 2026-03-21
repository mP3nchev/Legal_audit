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
    whatTested:       'Тествано',
    howTested:        'Метод на анализ',
    limitations:      'Ограничения',

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
    whatTested:       'What We Tested',
    howTested:        'How We Tested',
    limitations:      'Limitations',

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
