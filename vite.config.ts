import { defineConfig, Plugin } from 'vite';
import { resolve } from 'path';

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', 'http://localhost');
        const pathname = url.pathname;

        if (pathname.startsWith('/api/')) {
          const routeMap: Record<string, string> = {
            '/api/analytics/collect': './api/analytics/collect.ts',
            '/api/admin/auth': './api/admin/auth.ts',
            '/api/admin/overview': './api/admin/overview.ts',
            '/api/admin/players': './api/admin/players.ts',
            '/api/admin/gameplay': './api/admin/gameplay.ts',
            '/api/admin/retention': './api/admin/retention.ts',
            '/api/admin/health': './api/admin/health.ts',
            '/api/admin/logs': './api/admin/logs.ts',
            '/api/admin/alerts': './api/admin/alerts.ts',
            '/api/admin/settings': './api/admin/settings.ts',
            '/api/admin/reset': './api/admin/reset.ts',
            '/api/webhook': './api/webhook.ts',
          };

          const targetFile = routeMap[pathname];
          if (targetFile) {
            try {
              let rawBody = '';
              for await (const chunk of req) {
                rawBody += chunk;
              }

              let parsedBody: any = rawBody;
              try {
                if (rawBody) parsedBody = JSON.parse(rawBody);
              } catch {}

              const query: Record<string, string> = {};
              url.searchParams.forEach((v, k) => {
                query[k] = v;
              });

              const enhancedRes = res as any;
              if (!enhancedRes.status) {
                enhancedRes.status = function (code: number) {
                  this.statusCode = code;
                  return this;
                };
              }
              if (!enhancedRes.json) {
                enhancedRes.json = function (data: any) {
                  this.setHeader('Content-Type', 'application/json');
                  this.end(JSON.stringify(data));
                  return this;
                };
              }

              const enhancedReq = req as any;
              enhancedReq.body = parsedBody;
              enhancedReq.query = query;

              const mod = await server.ssrLoadModule(targetFile);
              if (mod && mod.default) {
                await mod.default(enhancedReq, enhancedRes);
                return;
              }
            } catch (err: any) {
              console.error(`[Dev API Error on ${pathname}]`, err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Dev API Error' }));
              return;
            }
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/',

  server: {
    port: 5173,
    open: false,
  },

  plugins: [apiDevMiddleware()],

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html'),
      },
    },
  },
});
