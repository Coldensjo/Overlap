/**
 * Normalizes calendar subscription URLs for browser fetch.
 * Quinyx and others often provide webcal:// links.
 */
export function normalizeCalendarUrl(url: string): string {
  let normalized = url.trim();

  if (/^webcals:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized.slice('webcals://'.length);
  } else if (/^webcal:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized.slice('webcal://'.length);
  }

  return normalized;
}
