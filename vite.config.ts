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

export default defineConfig({
  plugins: [icsProxyPlugin()],
});
