'use client';

import { usePathname } from 'next/navigation';

/**
 * NavHeader — hides itself on public share pages (/toc-report/share/*).
 * Must be a client component to read the current pathname.
 */
export default function NavHeader() {
  const pathname = usePathname();
  if (pathname.startsWith('/toc-report/share/')) return null;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-[80rem] px-4 py-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/craftpolicy-logo.svg" alt="CraftPolicy" className="h-6" />
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">Legal Document Audit</span>
        <nav className="ml-auto flex gap-4">
          <a href="/toc-audit"  className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Нов одит</a>
          <a href="/dashboard"  className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Одити</a>
        </nav>
      </div>
    </header>
  );
}
