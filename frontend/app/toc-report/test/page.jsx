// ⚠️  TEST ONLY — delete this file (and lib/test-audit-fixture.js) when done.
//
// Route: /toc-report/test
// Renders a simulated Privacy Policy audit from static fixture data.
// No backend calls — no tokens consumed.

import Link from 'next/link';
import { ArrowLeft, ExternalLink, FlaskConical } from 'lucide-react';
import { EditModeClient }   from '@/app/toc-report/[uid]/EditModeClient';
import { VerbalScale }      from '@/components/toc/VerbalScale';
import { PriorityTimeline } from '@/components/toc/PriorityTimeline';
import { TEST_AUDIT_META, TEST_PRIVACY_RESULT } from '@/lib/test-audit-fixture';

export const metadata = { title: 'TEST — CraftPolicy Audit' };

export default function TestReportPage() {
  const audit  = TEST_AUDIT_META;
  const result = TEST_PRIVACY_RESULT;

  return (
    <div className="space-y-8">

      {/* Test mode banner */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <span>
          <strong>TEST MODE</strong> — симулиран одит с предварителни данни.
          Не се консумират токени. За изтриване: премахни{' '}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">lib/test-audit-fixture.js</code>{' '}
          и <code className="rounded bg-amber-100 px-1 font-mono text-xs">app/toc-report/test/</code>.
        </span>
      </div>

      {/* Header */}
      <div>
        <Link
          href="/toc-audit"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Нов одит
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{audit.client_name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
            Завършен
          </span>
          <a
            href={audit.site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-500 hover:underline"
          >
            {audit.site_url} <ExternalLink className="h-3 w-3" />
          </a>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 font-mono">
            TEST
          </span>
        </div>
      </div>

      {/* Privacy Policy section */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Privacy Policy</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EditModeClient
              auditUid="__test__"
              docType="privacy"
              initialResult={result}
              isPublished={false}
              shareUid={null}
            />
          </div>
          <div className="space-y-4">
            <VerbalScale pct={result.total_pct} />
            <PriorityTimeline criteria={result.criteria} docType="privacy" />
          </div>
        </div>
      </section>

    </div>
  );
}
