import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Custom Vite plugin to handle /api requests locally matching Vercel Serverless Functions behavior
function vercelApiDevPlugin() {
  return {
    name: 'vite-plugin-vercel-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, `http://${req.headers.host}`);
          let pathname = urlObj.pathname.replace(/^\/api\//, ''); // e.g. "auth/login" or "workouts/123"

          // Match Vercel file route logic
          let filePath = null;
          let queryParams = {};

          // Check direct matches (e.g. api/auth/login.js)
          const directFile = path.join(process.cwd(), 'api', `${pathname}.js`);
          const indexFile = path.join(process.cwd(), 'api', pathname, 'index.js');

          if (fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
            filePath = directFile;
          } else if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
            filePath = indexFile;
          } else {
            // Dynamic route matching, e.g. api/workouts/[id].js or api/progress/exercise/[exerciseId].js
            const parts = pathname.split('/');
            
            // Check api/workouts/[id].js -> parts = ['workouts', '123']
            if (parts.length === 2) {
              const dynFile = path.join(process.cwd(), 'api', parts[0], '[id].js');
              if (fs.existsSync(dynFile)) {
                filePath = dynFile;
                queryParams.id = parts[1];
              }
            } else if (parts.length === 3 && parts[0] === 'progress' && parts[1] === 'exercise') {
              const dynFile = path.join(process.cwd(), 'api', 'progress', 'exercise', '[exerciseId].js');
              if (fs.existsSync(dynFile)) {
                filePath = dynFile;
                queryParams.exerciseId = parts[2];
              }
            } else if (parts.length === 2 && parts[0] === 'measurements') {
              const dynFile = path.join(process.cwd(), 'api', 'measurements', '[id].js');
              if (fs.existsSync(dynFile)) {
                filePath = dynFile;
                queryParams.id = parts[1];
              }
            }
          }

          if (!filePath) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'API route not found' }));
          }

          // Parse body if method is POST/PUT/PATCH
          if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const bodyText = Buffer.concat(buffers).toString('utf-8');
            try {
              req.body = bodyText ? JSON.parse(bodyText) : {};
            } catch (e) {
              req.body = {};
            }
          } else {
            req.body = {};
          }

          // Parse query string & merge params
          const query = {};
          for (const [k, v] of urlObj.searchParams.entries()) {
            query[k] = v;
          }
          req.query = { ...query, ...queryParams };

          // Polyfill Vercel res helpers (status, json)
          res.status = function(code) {
            this.statusCode = code;
            return this;
          };
          res.json = function(data) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };

          // Import and run handler
          const module = await server.ssrLoadModule(filePath);
          const handler = module.default || module;
          return await handler(req, res);
        } catch (error) {
          console.error('[API Dev Error]', error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
          }
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), vercelApiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000
  }
});
