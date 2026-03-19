/**
 * Shared frontend utilities.
 */

/**
 * Compose Tailwind class names (simple version, no clsx/cn dependency).
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Build a proxied backend URL.
 * @param {string} backendPath - e.g. '/api/toc/start'
 * @returns {string}
 */
export function proxyUrl(backendPath) {
  return `/api/proxy?path=${encodeURIComponent(backendPath)}`;
}
