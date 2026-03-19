/**
 * /toc-audit — Intake form
 *
 * Server component: exports metadata + renders the client form.
 */
import { TocAuditForm } from './TocAuditForm';

export const metadata = { title: 'Нов TOC одит — CraftPolicy' };

export default function TocAuditPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Нов документен одит</h1>
        <p className="mt-1 text-sm text-gray-500">
          Качи Privacy Policy и/или Terms &amp; Conditions за анализ с Claude AI.
        </p>
      </div>
      <TocAuditForm />
    </div>
  );
}
