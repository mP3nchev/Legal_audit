'use client';

/**
 * CoverSettings - editor-only panel for the report cover data.
 * Works for draft and published audits. Saved values go to the live record;
 * the public link shows them after "Обнови публикацията".
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Settings2, Loader2, CheckCircle2, AlertCircle, ImagePlus, X } from 'lucide-react';
import { proxyUrl } from '@/lib/utils';

const LOGO_MAX_MB = 2;
const INPUT = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

export function CoverSettings({ audit }) {
  const router   = useRouter();
  const fileRef  = useRef(null);

  const [open,      setOpen]      = useState(false);
  const [clientName, setClientName] = useState(audit.client_name ?? '');
  const [siteUrl,   setSiteUrl]   = useState(audit.site_url ?? '');
  const [auditDate, setAuditDate] = useState((audit.created_at ?? '').slice(0, 10));
  const [title,     setTitle]     = useState(audit.report_title ?? '');
  const [tagline,   setTagline]   = useState(audit.report_tagline ?? '');
  const [language,  setLanguage]  = useState(audit.language === 'en' ? 'en' : 'bg');
  const [logoFile,  setLogoFile]  = useState(null);
  const [logoPrev,  setLogoPrev]  = useState(audit.partner_logo_data ?? null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg,  setMsg]  = useState(null); // { type, text }

  function pickLogo(file) {
    if (!file) return;
    if (!/\.(png|jpe?g|svg|webp)$/i.test(file.name)) {
      setMsg({ type: 'err', text: 'Разрешени формати: PNG, JPG, SVG, WebP.' });
      return;
    }
    if (file.size > LOGO_MAX_MB * 1024 * 1024) {
      setMsg({ type: 'err', text: `Логото трябва да е до ${LOGO_MAX_MB} MB.` });
      return;
    }
    setMsg(null);
    setLogoFile(file);
    setRemoveLogo(false);
    const reader = new FileReader();
    reader.onload = e => setLogoPrev(e.target.result);
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setLogoFile(null);
    setLogoPrev(null);
    setRemoveLogo(true);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSave() {
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('client_name',    clientName);
      fd.append('site_url',       siteUrl);
      fd.append('report_title',   title);
      fd.append('report_tagline', tagline);
      fd.append('language',       language);
      if (auditDate) fd.append('audit_date', auditDate);
      if (logoFile)        fd.append('logo', logoFile);
      else if (removeLogo) fd.append('remove_logo', '1');

      const res  = await fetch(proxyUrl(`/api/toc/${audit.uid}/cover`), { method: 'PATCH', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setLogoFile(null);
      setRemoveLogo(false);
      setMsg({
        type: 'ok',
        text: audit.published_at
          ? 'Запазено. Натисни „Обнови публикацията", за да се види на публичната връзка.'
          : 'Запазено.',
      });
      router.refresh();
    } catch (e) {
      setMsg({ type: 'err', text: `Грешка: ${e.message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm" style={{ borderColor: 'var(--cp-neutral-40)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-semibold"
        style={{ color: 'var(--cp-neutral-100)' }}>
        <Settings2 className="h-4 w-4" style={{ color: 'var(--cp-blue-100)' }} />
        Настройки на корицата
        <span className="ml-auto text-xs font-normal text-gray-400">{open ? 'Скрий' : 'Редактирай'}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t px-5 py-4" style={{ borderColor: 'var(--cp-neutral-40)' }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Клиент">
              <input className={INPUT} value={clientName} onChange={e => setClientName(e.target.value)} />
            </Field>
            <Field label="URL на сайта">
              <input className={INPUT} value={siteUrl} onChange={e => setSiteUrl(e.target.value)} />
            </Field>
            <Field label="Дата на одита">
              <input type="date" className={INPUT} value={auditDate} onChange={e => setAuditDate(e.target.value)} />
            </Field>
            <Field label="Език на публичната версия">
              <select className={INPUT} value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="bg">Български</option>
                <option value="en">English</option>
              </select>
            </Field>
          </div>

          <Field label="Заглавие (празно = стандартното)">
            <input className={INPUT} value={title} onChange={e => setTitle(e.target.value)}
              placeholder="GDPR & Privacy Policy Compliance Audit" />
          </Field>

          <Field label="Подзаглавие / допълнителен текст (празно = стандартното; нови редове се запазват)">
            <textarea className={`${INPUT} resize-y`} rows={5} value={tagline}
              onChange={e => setTagline(e.target.value)} />
          </Field>

          <div>
            <span className="mb-1 block text-xs font-medium text-gray-600">Лого на партньора</span>
            <div className="flex items-center gap-3">
              {logoPrev ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPrev} alt="Лого" className="h-8 w-auto rounded border border-gray-200 bg-white p-1" />
                  <button type="button" onClick={clearLogo}
                    className="flex items-center gap-1 text-xs text-red-600 hover:underline">
                    <X className="h-3.5 w-3.5" /> Премахни
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-400">Няма лого</span>
              )}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <ImagePlus className="h-3.5 w-3.5" /> {logoPrev ? 'Смени' : 'Качи'}
              </button>
              <input ref={fileRef} type="file" className="sr-only" accept=".png,.jpg,.jpeg,.svg,.webp"
                onChange={e => pickLogo(e.target.files?.[0])} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={busy}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0175ff' }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Запази корицата
            </button>
            {msg && (
              <span className={`flex items-center gap-1.5 text-sm ${msg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                {msg.type === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {msg.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
