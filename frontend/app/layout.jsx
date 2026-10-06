import './globals.css';
import NavHeader from './NavHeader';

export const metadata = {
  title:       'CraftPolicy - Legal Document Audit',
  description: 'Privacy Policy & Terms and Conditions Analyzer',
  robots:      { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="bg">
<body className="min-h-screen bg-gray-50">
        <NavHeader />
        <main className="mx-auto max-w-[80rem] px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
