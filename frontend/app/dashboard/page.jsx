/**
 * /dashboard — Audit list with pagination
 *
 * Server component: fetches from backend dashboard endpoint.
 */

import Link from 'next/link';
import { PlusCircle, ExternalLink } from 'lucide-react';

const BACKEND_URL  = process.env.BACKEND_API_URL  || 'http://localhost:3001';
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || '';

export const metadata = { title: 'Табло — CraftPolicy' };

async function fetchDashboard(page = 1, limit = 20) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/toc/dashboard?page=${page}&limit=${limit}`,
      {
        headers: { 'x-api-key': INTERNAL_KEY },
        cache: 'no-store',
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return { audits: [], total: 0, page: 1, limit };
  }
}

const STATUS_MAP = {
  completed: { cls: 'bg-green-100 text-green-800',  label: 'Завършен'  },
  partial:   { cls: 'bg-yellow-100 text-yellow-800', label: 'Частичен' },
  pending:   { cls: 'bg-gray-100 text-gray-600',     label: 'Изчакване'},
  running:   { cls: 'bg-blue-100 text-blue-700',     label: 'Анализ...' },
  failed:    { cls: 'bg-red-100 text-red-700',       label: 'Грешка'    },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function ScorePill({ pct, label }) {
  if (pct == null) return <span className="text-xs text-gray-400">—</span>;
  const rounded = Math.round(pct);
  const color = rounded >= 76 ? 'text-green-700' : rounded >= 61 ? 'text-blue-600' : rounded >= 51 ? 'text-yellow-700' : rounded >= 31 ? 'text-orange-600' : 'text-red-600';
  return (
    <div className="text-center">
      <span className={`text-sm font-bold tabular-nums ${color}`}>{rounded}%</span>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}

export default async function DashboardPage({ searchParams }) {
  const page = parseInt(searchParams?.page ?? '1', 10);
  const { audits, total, limit } = await fetchDashboard(page);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Табло</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} одит{total !== 1 ? 'а' : ''}</p>
        </div>
        <Link
          href="/toc-audit"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <PlusCircle className="h-4 w-4" /> Нов одит
        </Link>
      </div>

      {/* Table */}
      {audits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400">Няма одити. Създай първия.</p>
          <Link href="/toc-audit" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Нов одит →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Клиент</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">URL</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Статус</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Privacy %</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">T&C %</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Дата</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Публ.</th>
              </tr>
            </thead>
            <tbody>
              {audits.map(a => {
                const date = a.created_at
                  ? new Date(a.created_at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';
                return (
                  <tr key={a.uid} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/toc-report/${a.uid}`} className="font-medium text-gray-800 hover:text-blue-600 transition">
                        {a.client_name}
                      </Link>
                      <p className="text-[10px] font-mono text-gray-400">{a.uid}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {a.site_url ? (
                        <a href={a.site_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-500 hover:underline truncate">
                          <span className="truncate">{a.site_url.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-center">
                      <ScorePill pct={a.privacy_pct} label="Privacy" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScorePill pct={a.toc_pct} label="T&C" />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{date}</td>
                    <td className="px-4 py-3 text-center">
                      {a.published_at ? (
                        a.share_uid
                          ? <Link href={`/toc-report/share/${a.share_uid}`} target="_blank"
                              className="text-xs text-green-600 hover:underline">Да ↗</Link>
                          : <span className="text-xs text-green-600">Да</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/dashboard?page=${page - 1}`}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition">
              ← Предишна
            </Link>
          )}
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`/dashboard?page=${page + 1}`}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition">
              Следваща →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
