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
