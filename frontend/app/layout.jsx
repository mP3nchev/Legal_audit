import './globals.css';

export const metadata = {
  title:       'CraftPolicy — Legal Document Audit',
  description: 'Privacy Policy & Terms and Conditions Analyzer',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bg">
      <body className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
            <span className="text-lg font-bold text-blue-700 tracking-tight">CraftPolicy</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">Legal Document Audit</span>
            <nav className="ml-auto flex gap-4">
              <a href="/toc-audit"  className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Нов одит</a>
              <a href="/dashboard"  className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Одити</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
