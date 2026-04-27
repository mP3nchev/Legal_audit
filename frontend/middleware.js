import { NextResponse } from 'next/server';

/**
 * Middleware — protects all internal routes behind a password cookie.
 *
 * Public routes (no auth required):
 *   /toc-report/share/[share_uid]  — public read-only report
 *   /login                          — login page
 *   /_next/*                        — Next.js internals
 *   /api/*                          — API proxy (has its own x-api-key guard)
 *   static assets (*.svg, *.ico)
 *
 * All other routes require the cp_auth cookie to match CP_SESSION_TOKEN.
 */

const SESSION_TOKEN = process.env.CP_SESSION_TOKEN ?? 'cp_session_2026_default';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (
    pathname === '/login' ||
    pathname.startsWith('/toc-report/share/')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('cp_auth')?.value;
  if (token === SESSION_TOKEN) {
    return NextResponse.next();
  }

  // Not authenticated — redirect to login
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   _next/static, _next/image, favicons, .svg/.ico/.png files, /api/ routes
     */
    '/((?!_next/static|_next/image|favicon|.*\\.(?:svg|ico|png|webp|jpg|jpeg|gif|woff2?)$|api/).*)',
  ],
};
