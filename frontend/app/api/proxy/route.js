import { NextResponse } from 'next/server';

/**
 * Universal backend proxy.
 * Usage: GET|POST /api/proxy?path=/api/toc/...
 *
 * - Injects x-api-key server-side (never exposed to browser)
 * - Forwards multipart/form-data (file uploads) unchanged
 * - Forwards JSON bodies unchanged
 * - Env vars read inside handlers to avoid Next.js build-time caching
 */

function getConfig() {
  const backendUrl = (process.env.BACKEND_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const apiKey     = process.env.INTERNAL_API_KEY;
  return { backendUrl, apiKey };
}

function targetUrl(request) {
  const { backendUrl } = getConfig();
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  return `${backendUrl}${path}`;
}

async function proxyRequest(request, method) {
  const { apiKey } = getConfig();

  if (!apiKey) {
    console.error('[proxy] INTERNAL_API_KEY not set');
    return NextResponse.json({ error: 'Server misconfigured', code: 'E500' }, { status: 500 });
  }

  const url = targetUrl(request);

  try {
    const contentType = request.headers.get('content-type') || '';
    const headers = { 'x-api-key': apiKey };
    let body;

    if (method !== 'GET' && method !== 'HEAD') {
      if (contentType.includes('multipart/form-data')) {
        // Pass FormData through — fetch will set the correct boundary header
        body = await request.formData();
      } else if (contentType.includes('application/json')) {
        body = await request.text();
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(url, { method, headers, body });
    const data     = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error('[proxy] error:', err.message, 'url:', url);
    return NextResponse.json({ error: 'Proxy error', details: err.message }, { status: 502 });
  }
}

export const GET    = (req) => proxyRequest(req, 'GET');
export const POST   = (req) => proxyRequest(req, 'POST');
export const PUT    = (req) => proxyRequest(req, 'PUT');
export const PATCH  = (req) => proxyRequest(req, 'PATCH');
export const DELETE = (req) => proxyRequest(req, 'DELETE');
