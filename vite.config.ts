import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { devApi, routePages, structuredData } from './scripts/vite-plugins.js';

export default defineConfig(({ mode }) => {
  // Make STRIPE_* / LEVELUP_* from a local .env available to the dev API (never to
  // the browser: only VITE_-prefixed variables are exposed to client code, and none are used).
  const env = loadEnv(mode, process.cwd(), ['STRIPE_', 'LEVELUP_', 'SUPABASE_PUBLISHABLE_KEY', 'BLACKPATER_', 'PORTAL_', 'CRON_SECRET']);
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;

  return {
    plugins: [react(), structuredData(), devApi(), routePages()],
    server: { host: '0.0.0.0', port: 3000, strictPort: true, allowedHosts: true },
    preview: { host: '0.0.0.0', port: 3000, strictPort: true, allowedHosts: true }
  };
});
