import { defineConfig, type Plugin } from 'vite';
import { createIcsProxyMiddleware } from './server/ics-proxy.ts';

function icsProxyPlugin(): Plugin {
  const middleware = createIcsProxyMiddleware();
  return {
    name: 'ics-proxy',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

/** GitHub Project Pages: https://<user>.github.io/<repo>/ */
const GITHUB_PAGES_BASE = '/Overlap/';

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? GITHUB_PAGES_BASE : '/',
  plugins: [icsProxyPlugin()],
}));
