'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UploadSection } from '@/components/toc/UploadSection';
import { proxyUrl } from '@/lib/utils';

const BUSINESS_TYPES = [
  { value: 'ecommerce', label: 'eCommerce' },
  { value: 'saas',      label: 'SaaS' },
  { value: 'b2b',       label: 'B2B' },
];

// ── Polling ────────────────────────────────────────────────────────────────────

function useAuditPolling(auditUid, onComplete, onError) {
  useEffect(() => {
    if (!auditUid) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(proxyUrl(`/api/toc/${auditUid}/status`));
        const data = await res.json();
        if (data.status === 'completed' || data.status === 'partial') {
          clearInterval(interval);
          onComplete(auditUid, data.status);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          onError(data.error_details || 'Анализът приключи с грешка.');
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 10_000); // 10s interval per plan

    return () => clearInterval(interval);
  }, [auditUid, onComplete, onError]);
}

// ── Question rendering ─────────────────────────────────────────────────────────

function QuestionField({ questionKey, question, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-sm text-gray-700 leading-relaxed flex-1">{question.question}</p>
      <div className="flex gap-3 shrink-0 pt-0.5">
        {['true', 'false'].map((val) => (
          <label key={val} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={questionKey}
              value={val}
              checked={value === (val === 'true')}
              onChange={() => onChange(questionKey, val === 'true')}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-600">{val === 'true' ? 'Да' : 'Не'}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────────

export function TocAuditForm() {
  const router = useRouter();

  // Form state
  const [clientName,    setClientName]    = useState('');
  const [siteUrl,       setSiteUrl]       = useState('');
  const [businessType,  setBusinessType]  = useState('saas');
  const [privacyFile,   setPrivacyFile]   = useState(null);
  const [tocFile,       setTocFile]       = useState(null);
  const [answers,       setAnswers]       = useState({});

  // Questions loaded from backend
  const [questions,     setQuestions]     = useState(null);

  // Submission state
  const [submitting,    setSubmitting]    = useState(false);
  const [auditUid,      setAuditUid]      = useState(null);
  const [pollingStatus, setPollingStatus] = useState(''); // progress message
  const [formError,     setFormError]     = useState(null);
  const [elapsed,       setElapsed]       = useState(0);

  // ── Load questions when business type changes ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch(proxyUrl(`/api/toc/questions?business_type=${businessType}`))
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.questions) {
          setQuestions(data.questions);
          // Pre-fill answers with true (most common case)
          const defaults = {};
          Object.keys(data.questions).forEach(k => { defaults[k] = true; });
          setAnswers(defaults);
        }
      })
      .catch(() => {}); // silently ignore — questions are optional
    return () => { cancelled = true; };
  }, [businessType]);

  // ── Elapsed time counter while polling ───────────────────────────────────────
  useEffect(() => {
    if (!auditUid) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [auditUid]);

  // ── Polling callbacks ────────────────────────────────────────────────────────
  const handleComplete = useCallback((uid, status) => {
    setPollingStatus(status === 'partial' ? 'Частичен успех — пренасочване...' : 'Завършено — пренасочване...');
    setTimeout(() => router.push(`/toc-report/${uid}`), 800);
  }, [router]);

  const handlePollError = useCallback((msg) => {
    setAuditUid(null);
    setSubmitting(false);
    setFormError(`Анализът се провали: ${msg}`);
  }, []);

  useAuditPolling(auditUid, handleComplete, handlePollError);

  // ── Form validation ──────────────────────────────────────────────────────────
  function validate() {
    if (!clientName.trim()) return 'Въведи ime на клиента.';
    if (!siteUrl.trim())    return 'Въведи URL на сайта.';
    if (!privacyFile && !tocFile) return 'Качи поне един документ (Privacy Policy или T&C).';
    return null;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const err = validate();
    if (err) { setFormError(err); return; }

    setSubmitting(true);
    setElapsed(0);
    setPollingStatus('Изпращане...');

    try {
      const fd = new FormData();
      fd.append('client_name',   clientName.trim());
      fd.append('site_url',      siteUrl.trim());
      fd.append('business_type', businessType);
      fd.append('questions_answers_json', JSON.stringify(answers));
      if (privacyFile) fd.append('privacy', privacyFile);
      if (tocFile)     fd.append('toc',     tocFile);

      const res  = await fetch(proxyUrl('/api/toc/start'), { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok || !data.audit_uid) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setAuditUid(data.audit_uid);
      setPollingStatus('Анализът стартира — Claude чете документите...');
    } catch (err) {
      setSubmitting(false);
      setFormError(`Неуспешно изпращане: ${err.message}`);
    }
  }

  // ── Render helpers ───────────────────────────────────────────────────────────

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

  // ── Polling overlay ──────────────────────────────────────────────────────────
  if (auditUid) {
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;

    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-10 text-center shadow-sm">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
        <h2 className="text-lg font-semibold text-blue-900">Анализиране...</h2>
        <p className="mt-2 text-sm text-blue-700">{pollingStatus}</p>
        <p className="mt-4 text-xs text-blue-500">
          Изминало: {timeStr} — Анализът може да отнеме 2–5 минути.
          <br />Страницата ще се пренасочи автоматично.
        </p>
        <div className="mt-6 mx-auto max-w-xs rounded-lg bg-white border border-blue-200 px-4 py-3">
          <p className="text-xs text-gray-500">Одит ID</p>
          <p className="mt-0.5 font-mono text-sm text-gray-700">{auditUid}</p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Global error banner */}
      {formError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Section 1 — Client info */}
      <Section num="1" title="Информация за клиента">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Клиент <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Acme Ltd."
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              URL на сайта <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={siteUrl}
              onChange={e => setSiteUrl(e.target.value)}
              placeholder="https://acme.com"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Тип бизнес</label>
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

      {/* Section 2 — Privacy Policy upload */}
      <Section num="2" title="Privacy Policy">
        <UploadSection
          label="Privacy Policy документ"
          fieldName="privacy"
          onFileSelect={setPrivacyFile}
        />
      </Section>

      {/* Section 3 — T&C upload */}
      <Section num="3" title="Terms & Conditions">
        <UploadSection
          label="Terms & Conditions документ"
          fieldName="toc"
          onFileSelect={setTocFile}
        />
        {!privacyFile && !tocFile && (
          <p className="mt-2 text-xs text-amber-600">
            Качи поне един от двата документа.
          </p>
        )}
      </Section>

      {/* Section 4 — Contextual questions */}
      {questions && Object.keys(questions).length > 0 && (
        <Section num="4" title="Контекстни въпроси">
          <p className="mb-3 text-xs text-gray-500">
            Отговорите се използват за прескачане на неприложими критерии.
          </p>
          <div className="space-y-2">
            {Object.entries(questions).map(([key, q]) => (
              <QuestionField
                key={key}
                questionKey={key}
                question={q}
                value={answers[key] ?? true}
                onChange={(k, v) => setAnswers(prev => ({ ...prev, [k]: v }))}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">
          {privacyFile && tocFile
            ? '2 документа готови'
            : privacyFile
            ? 'Privacy Policy готова'
            : tocFile
            ? 'T&C готов'
            : 'Нито един документ'}
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Изпращане...</>
            : <><CheckCircle2 className="h-4 w-4" /> Стартирай одит</>}
        </button>
      </div>
    </form>
  );
}
