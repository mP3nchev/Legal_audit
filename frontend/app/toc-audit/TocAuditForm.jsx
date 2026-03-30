'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UploadSection } from '@/components/toc/UploadSection';
import { proxyUrl }      from '@/lib/utils';
import { i18n }          from '@/lib/i18n';

const BUSINESS_TYPES = [
  { value: 'ecommerce', label: 'eCommerce' },
  { value: 'saas',      label: 'SaaS' },
  { value: 'b2b',       label: 'B2B' },
];

// ── Section wrapper — defined OUTSIDE to avoid remount on every keystroke ──────
function Section({ num, title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {num}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Question field — defined OUTSIDE for the same reason ─────────────────────
function QuestionField({ questionKey, question, value, onChange, yes, no }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-sm text-gray-700 leading-relaxed flex-1">{question.question}</p>
      <div className="flex gap-3 shrink-0 pt-0.5">
        {[['true', yes], ['false', no]].map(([val, label]) => (
          <label key={val} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={questionKey}
              value={val}
              checked={value === (val === 'true')}
              onChange={() => onChange(questionKey, val === 'true')}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-600">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Polling hook ──────────────────────────────────────────────────────────────
function useAuditPolling(auditUid, onComplete, onError) {
  useEffect(() => {
    if (!auditUid) return;
    const interval = setInterval(async () => {
      try {
        const res  = await fetch(proxyUrl(`/api/toc/${auditUid}/status`));
        const data = await res.json();
        if (data.status === 'completed' || data.status === 'partial') {
          clearInterval(interval);
          onComplete(auditUid, data.status);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          onError(data.error_details || 'Unknown error');
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [auditUid, onComplete, onError]);
}

// ── Language toggle ───────────────────────────────────────────────────────────
function LangToggle({ language, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">
        {i18n[language].langLabel}:
      </span>
      {['bg', 'en'].map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
            language === lang
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {lang === 'bg' ? '🇧🇬 БГ' : '🇬🇧 EN'}
        </button>
      ))}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function TocAuditForm() {
  const router = useRouter();

  // Form state
  const [language,      setLanguage]      = useState('bg');
  const [clientName,    setClientName]    = useState('');
  const [siteUrl,       setSiteUrl]       = useState('');
  const [businessType,  setBusinessType]  = useState('saas');
  const [privacyFile,   setPrivacyFile]   = useState(null);
  const [tocFile,       setTocFile]       = useState(null);
  const [answers,       setAnswers]       = useState({});
  const [questions,     setQuestions]     = useState(null);
  const [questionsErr,  setQuestionsErr]  = useState(null);

  // Submission state
  const [submitting,    setSubmitting]    = useState(false);
  const [auditUid,      setAuditUid]      = useState(null);
  const [pollingStatus, setPollingStatus] = useState('');
  const [formError,     setFormError]     = useState(null);
  const [elapsed,       setElapsed]       = useState(0);

  const t = i18n[language];

  // ── Test-mode detection ──────────────────────────────────────────────────────
  // ⚠️ TEMPORARY — remove together with lib/test-audit-fixture.js and app/toc-report/test/
  const isTestMode =
    clientName.trim() === 'CP_TEST' &&
    siteUrl.trim()    === 'https://craftpolicy.com/';

  // ── Load questions when business type changes ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setQuestionsErr(null);
    const url = proxyUrl(`/api/toc/questions?business_type=${businessType}`);
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.questions) {
          setQuestions(data.questions);
          const defaults = {};
          Object.keys(data.questions).forEach(k => { defaults[k] = true; });
          setAnswers(defaults);
        } else {
          setQuestionsErr(`Backend error: ${JSON.stringify(data)}`);
        }
      })
      .catch(err => {
        if (!cancelled) setQuestionsErr(`Fetch failed: ${err.message} (url: ${url})`);
      });
    return () => { cancelled = true; };
  }, [businessType]);

  // ── Elapsed time counter ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!auditUid) return;
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [auditUid]);

  // ── Polling callbacks ────────────────────────────────────────────────────────
  const handleComplete = useCallback((uid, status) => {
    const tCb = i18n[language];
    setPollingStatus(status === 'partial' ? tCb.pollPartial : tCb.pollDone);
    setTimeout(() => router.push(`/toc-report/${uid}?lang=${language}`), 800);
  }, [router, language]);

  const handlePollError = useCallback((msg) => {
    const tCb = i18n[language];
    setAuditUid(null);
    setSubmitting(false);
    setFormError(`${tCb.pollFailed}${msg}`);
  }, [language]);

  useAuditPolling(auditUid, handleComplete, handlePollError);

  // ── Validation ───────────────────────────────────────────────────────────────
  function validate() {
    if (!clientName.trim()) return t.errClient;
    if (!siteUrl.trim())    return t.errUrl;
    if (!isTestMode && !privacyFile && !tocFile) return t.errDoc;
    return null;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const err = validate();
    if (err) { setFormError(err); return; }

    // ⚠️ TEST MODE — bypass API
    if (isTestMode) {
      router.push(`/toc-report/test?lang=${language}`);
      return;
    }

    setSubmitting(true);
    setElapsed(0);
    setPollingStatus(t.pollSending);

    try {
      const fd = new FormData();
      fd.append('client_name',          clientName.trim());
      fd.append('site_url',             siteUrl.trim());
      fd.append('business_type',        businessType);
      fd.append('language',             language);
      fd.append('questions_answers_json', JSON.stringify(answers));
      if (privacyFile) fd.append('privacy', privacyFile);
      if (tocFile)     fd.append('toc',     tocFile);

      const res  = await fetch(proxyUrl('/api/toc/start'), { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok || !data.audit_uid) throw new Error(data.error || `HTTP ${res.status}`);

      setAuditUid(data.audit_uid);
      setPollingStatus(t.pollStarted);
    } catch (err) {
      setSubmitting(false);
      setFormError(`${t.sendFailed}${err.message}`);
    }
  }

  // ── Polling overlay ───────────────────────────────────────────────────────────
  if (auditUid) {
    const mins    = Math.floor(elapsed / 60);
    const secs    = elapsed % 60;
    const timeStr = mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;

    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-10 text-center shadow-sm">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
        <h2 className="text-lg font-semibold text-blue-900">{t.analyzingTitle}</h2>
        <p className="mt-2 text-sm text-blue-700">{pollingStatus}</p>
        <p className="mt-4 text-xs text-blue-500">
          {t.elapsedLabel}: {timeStr} — {t.auditDuration}
          <br />{t.auditRedirect}
        </p>
        <div className="mt-6 mx-auto max-w-xs rounded-lg bg-white border border-blue-200 px-4 py-3">
          <p className="text-xs text-gray-500">{t.auditIdLabel}</p>
          <p className="mt-0.5 font-mono text-sm text-gray-700">{auditUid}</p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Language toggle + error */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <LangToggle language={language} onChange={setLanguage} />
        {formError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex-1">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
      </div>

      {/* Section 1 — Client info */}
      <Section num="1" title={t.s1Title}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t.clientLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder={t.clientPlaceholder}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t.urlLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={siteUrl}
              onChange={e => setSiteUrl(e.target.value)}
              placeholder={t.urlPlaceholder}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">{t.bizTypeLabel}</label>
          <div className="flex gap-3">
            {BUSINESS_TYPES.map(bt => (
              <label key={bt.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="business_type"
                  value={bt.value}
                  checked={businessType === bt.value}
                  onChange={() => setBusinessType(bt.value)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">{bt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* Section 2 — Privacy Policy */}
      <Section num="2" title={t.s2Title}>
        <UploadSection label={t.s2Title} fieldName="privacy" onFileSelect={setPrivacyFile} />
      </Section>

      {/* Section 3 — T&C */}
      <Section num="3" title={t.s3Title}>
        <UploadSection label={t.s3Title} fieldName="toc" onFileSelect={setTocFile} />
        {!privacyFile && !tocFile && (
          <p className="mt-2 text-xs text-amber-600">{t.uploadHint}</p>
        )}
      </Section>

      {/* Section 4 — Contextual questions */}
      {questionsErr && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-mono break-all">
          ⚠ Questions load error: {questionsErr}
        </div>
      )}
      {questions && Object.keys(questions).length > 0 && (
        <Section num="4" title={t.s4Title}>
          <p className="mb-3 text-xs text-gray-500">{t.questionsHint}</p>
          <div className="space-y-2">
            {Object.entries(questions).map(([key, q]) => (
              <QuestionField
                key={key}
                questionKey={key}
                question={q}
                value={answers[key] ?? true}
                onChange={(k, v) => setAnswers(prev => ({ ...prev, [k]: v }))}
                yes={t.yes}
                no={t.no}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Submit row */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">
          {privacyFile && tocFile ? t.docBoth
            : privacyFile         ? t.docPrivacy
            : tocFile             ? t.docToc
            :                       t.docNone}
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.sending}</>
            : <><CheckCircle2 className="h-4 w-4" /> {t.submitBtn}</>}
        </button>
      </div>
    </form>
  );
}
