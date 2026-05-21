import type { IncomingMessage, ServerResponse } from 'node:http';
import { normalizeCalendarUrl } from '../src/ics/url.ts';
import { assertPublicHttpUrl } from './url-guard.ts';

export async function fetchIcsFromUrl(rawUrl: string): Promise<string> {
  const normalized = normalizeCalendarUrl(rawUrl);
  assertPublicHttpUrl(normalized);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(normalized, {
      signal: controller.signal,
      headers: {
        Accept: 'text/calendar, text/plain, */*',
        'User-Agent': 'Overlap/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function readTargetUrl(req: IncomingMessage): string | null {
  const path = req.url ?? '';
  const q = path.indexOf('?');
  if (q === -1) return null;
  const params = new URLSearchParams(path.slice(q + 1));
  return params.get('url');
}

/** Connect-style middleware for Vite dev/preview and the production server. */
export function createIcsProxyMiddleware(): (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => void {
  return (req, res, next) => {
    const path = (req.url ?? '').split('?')[0];
    if (path !== '/api/ics' || req.method !== 'GET') {
      next();
      return;
    }

    void (async () => {
      const target = readTargetUrl(req);
      if (!target) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing url parameter' }));
        return;
      }

      try {
        const text = await fetchIcsFromUrl(target);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.end(text);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: message }));
      }
    })();
  };
}
