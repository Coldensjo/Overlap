import { isIP } from 'node:net';

/** Block SSRF targets: loopback, link-local, and private networks. */
export function assertPublicHttpUrl(rawUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP(S) calendar URLs are allowed');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    throw new Error('Local hostnames are not allowed');
  }

  const ipVersion = isIP(hostname);
  if (ipVersion === 4 || ipVersion === 6) {
    if (isBlockedIp(hostname, ipVersion)) {
      throw new Error('Private or reserved IP addresses are not allowed');
    }
    return parsed;
  }

  return parsed;
}

function isBlockedIp(host: string, version: 4 | 6): boolean {
  if (version === 4) {
    const parts = host.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;

    const [a, b] = parts;
    if (a === 127 || a === 0) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  const lower = host.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('fe80')) return true;

  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice('::ffff:'.length);
    if (isIP(mapped) === 4) {
      return isBlockedIp(mapped, 4);
    }
  }

  return false;
}
