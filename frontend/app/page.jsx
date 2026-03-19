import { redirect } from 'next/navigation';

// Home → redirect to intake form
export default function Home() {
  redirect('/toc-audit');
}
