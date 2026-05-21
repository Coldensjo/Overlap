import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createIcsProxyMiddleware } from './ics-proxy.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = resolve(__dirname, '../dist');
const port = Number(process.env.PORT) || 4173;

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.ics': 'text/calendar',
};

const proxy = createIcsProxyMiddleware();

async function serveStatic(
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
): Promise<boolean> {
  let path = (req.url ?? '/').split('?')[0];
  if (path === '/') path = '/index.html';

  const filePath = resolve(distDir, path.replace(/^\/+/, ''));
  const rel = relative(distDir, filePath);
  if (
    !rel ||
    rel === '..' ||
    rel.startsWith(`..${sep}`) ||
    rel.includes(`${sep}..${sep}`)
  ) {
    return false;
  }
  if (!existsSync(filePath)) {
    const fallback = join(distDir, 'index.html');
    if (existsSync(fallback) && !path.includes('.')) {
      const html = await readFile(fallback);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
      return true;
    }
    return false;
  }

  const data = await readFile(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream');
  res.end(data);
  return true;
}

const server = createServer((req, res) => {
  proxy(req, res, () => {
    void serveStatic(req, res).then((ok) => {
      if (!ok && !res.writableEnded) {
        res.statusCode = 404;
        res.end('Not found');
      }
    });
  });
});

server.listen(port, () => {
  console.log(`Overlap running at http://localhost:${port}`);
  console.log('Calendar URL proxy: /api/ics?url=...');
});
