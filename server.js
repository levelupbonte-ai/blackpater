/**
 * Self-hosting / local production server (`npm run build && npm start`).
 * On Vercel this file is not used: the static build in dist/ is served by the
 * CDN (see vercel.json) and api/stripe/*.js run as Vercel Functions with the
 * exact same handlers.
 */
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRoutes } from './api/_lib/routes.js';
import { NOT_FOUND, REDIRECTS, ROUTES } from './shared/routes.js';
import { SECURITY_HEADERS } from './shared/security-headers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;

if (!fs.existsSync(path.join(distPath, 'index.html'))) {
  console.error('dist/ is missing: run `npm run build` first.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  // Same headers as vercel.json (shared/security-headers.js). HSTS is only
  // meaningful over https; browsers ignore it on http://localhost.
  for (const { key, value } of SECURITY_HEADERS) res.setHeader(key, value);
  next();
});

// API — no body parser: each handler reads its own body (the webhook needs it raw).
for (const [route, handler] of Object.entries(createApiRoutes())) {
  app.all(route, (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  });
}

for (const { source, destination } of REDIRECTS) {
  app.get(source, (req, res) => res.redirect(301, destination));
}

app.use('/assets', express.static(path.join(distPath, 'assets'), { immutable: true, maxAge: '1y', index: false }));
app.use(express.static(distPath, { maxAge: '7d', index: false, redirect: false }));

for (const route of ROUTES) {
  const file = path.join(distPath, route.file);
  app.get([route.path, route.path === '/' ? '/' : `${route.path}/`], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(file);
  });
}

app.use((req, res) => {
  res.status(404).sendFile(path.join(distPath, NOT_FOUND.file));
});

app.use((err, req, res, _next) => {
  console.error(JSON.stringify({ evt: 'server.error', path: req.path, error: err?.name || 'Error' }));
  if (!res.headersSent) res.status(500).json({ error: 'server_error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
