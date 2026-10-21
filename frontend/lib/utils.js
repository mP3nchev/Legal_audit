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

/**
 * Replace em dashes with " - " and en dashes with "-" in every string of a value
 * (objects and arrays are walked). Used for data coming from the database.
 */
export function normalizeDashes(value) {
  if (typeof value === 'string') return value.replace(/\s*\u2014\s*/g, ' - ').replace(/\u2013/g, '-');
  if (Array.isArray(value))      return value.map(normalizeDashes);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalizeDashes(v)]));
  }
  return value;
}
