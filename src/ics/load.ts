import { t } from '../i18n/index.ts';
import { normalizeCalendarUrl } from './url.ts';

export class IcsLoadError extends Error {
  hint?: string;

  constructor(message: string, hint?: string) {
    super(message);
    this.name = 'IcsLoadError';
    this.hint = hint;
  }
}

export async function loadFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new IcsLoadError('Could not read file as text.'));
      }
    };
    reader.onerror = () => reject(new IcsLoadError('Failed to read file.'));
    reader.readAsText(file);
  });
}

class ProxyNotAvailableError extends Error {
  constructor() {
    super('PROXY_NOT_AVAILABLE');
    this.name = 'ProxyNotAvailableError';
  }
}

async function loadViaProxy(fetchUrl: string): Promise<string> {
  const proxyUrl = `/api/ics?url=${encodeURIComponent(fetchUrl)}`;
  const response = await fetch(proxyUrl);

  if (response.status === 404) {
    throw new ProxyNotAvailableError();
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* not JSON */
    }
    throw new IcsLoadError(message);
  }

  return response.text();
}

async function loadDirect(fetchUrl: string): Promise<string> {
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new IcsLoadError(
      t('errHttp', { status: response.status, text: response.statusText }),
    );
  }
  return response.text();
}

export async function loadFromUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new IcsLoadError(t('errUrlEmpty'));
  }

  const fetchUrl = normalizeCalendarUrl(trimmed);

  // Same-origin proxy avoids CORS (Quinyx, etc.)
  try {
    return await loadViaProxy(fetchUrl);
  } catch (proxyErr) {
    if (proxyErr instanceof IcsLoadError) throw proxyErr;
    if (!(proxyErr instanceof ProxyNotAvailableError)) {
      // Network error reaching proxy — try direct as last resort
    }
  }

  // Fallback if proxy middleware isn't running (e.g. static file open)
  try {
    return await loadDirect(fetchUrl);
  } catch (err) {
    if (err instanceof IcsLoadError) throw err;

    const message = err instanceof Error ? err.message : String(err);
    const isCors =
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('CORS');

    if (isCors) {
      throw new IcsLoadError(t('errCors'), t('errCorsHint'));
    }
    throw new IcsLoadError(t('errFetch', { msg: message }));
  }
}