import fs from 'node:fs';
import path from 'node:path';
import { NOT_FOUND, ROUTES, SITE_URL } from '../shared/routes.js';

/** Serves the same API handlers as Vercel during `vite dev`. */
export function devApi() {
  return {
    name: 'blackpater-dev-api',
    apply: 'serve',
    async configureServer(server) {
      const { createApiRoutes } = await import('../api/_lib/routes.js');
      const routes = createApiRoutes();
      server.middlewares.use((req, res, next) => {
        const handler = routes[(req.url || '').split('?')[0]];
        if (!handler) return next();
        Promise.resolve(handler(req, res)).catch(next);
      });
    }
  };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta ${attr}="${key.replace(/[:]/g, '\\:')}" content=")[^"]*(")`);
  return html.replace(re, `$1${escapeHtml(value)}$2`);
}

/** Rewrites the head of index.html for one route: title, description, canonical, social cards. */
export function renderRouteHtml(template, { path: routePath, meta, indexable }) {
  const url = routePath ? `${SITE_URL}${routePath === '/' ? '/' : routePath}` : null;
  const { title, description } = meta.fr;
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  if (url) {
    html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
    html = setMeta(html, 'property', 'og:url', url);
    html = html.replace(/(<link rel="alternate" hreflang="[a-z-]+" href=")[^"]*(">)/g, `$1${url}$2`);
  } else {
    html = html.replace(/<link rel="canonical" href="[^"]*">\n?/, '').replace(/<link rel="alternate" hreflang="[a-z-]+" href="[^"]*">\n?/g, '');
  }
  if (!indexable) {
    html = html.replace(/<meta name="(robots|googlebot|bingbot)" content="[^"]*">/g, '<meta name="$1" content="noindex, follow">');
  }
  // Hidden pre-render text inside #root (replaced by React on load).
  html = html.replace(
    /(<div class="sr-prerender"[^>]*>)[\s\S]*?(<\/div>\s*<\/div>\s*<script)/,
    `$1\n    <h1>${escapeHtml(title)}</h1>\n    <p>${escapeHtml(description)}</p>\n  $2`
  );
  return html;
}

function sitemap(date) {
  const urls = ROUTES.filter((r) => r.indexable)
    .map((r) => {
      const loc = `${SITE_URL}${r.path === '/' ? '/' : r.path}`;
      const priority = r.path === '/' ? '1.0' : r.path.split('/').length > 2 ? '0.7' : '0.8';
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${date}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** After `vite build`: one HTML file per route + 404.html + sitemap.xml + stable asset fallbacks. */
export function routePages() {
  let outDir = 'dist';
  return {
    name: 'blackpater-route-pages',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      for (const route of ROUTES) {
        if (route.path === '/') continue;
        const file = path.join(outDir, route.file);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, renderRouteHtml(template, route));
      }
      fs.writeFileSync(path.join(outDir, NOT_FOUND.file), renderRouteHtml(template, { ...NOT_FOUND, path: null, indexable: false }));
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap(new Date().toISOString().slice(0, 10)));

      // Emit stable fallback copies in dist/assets so stale cached HTML pages never 404 across deploys.
      const assetsDir = path.join(outDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        const assetFiles = fs.readdirSync(assetsDir);
        const entryJs = assetFiles.find((f) => /^index-[A-Za-z0-9_-]+\.js$/.test(f));
        const entryCss = assetFiles.find((f) => /^index-[A-Za-z0-9_-]+\.css$/.test(f));
        if (entryJs) {
          const srcJs = path.join(assetsDir, entryJs);
          fs.copyFileSync(srcJs, path.join(assetsDir, 'app.js'));
          if (entryJs !== 'index-Droh65ZD.js') {
            fs.copyFileSync(srcJs, path.join(assetsDir, 'index-Droh65ZD.js'));
          }
        }
        if (entryCss) {
          fs.copyFileSync(path.join(assetsDir, entryCss), path.join(assetsDir, 'app.css'));
        }
        fs.writeFileSync(path.join(assetsDir, 'router-noop.js'), 'export {};\n');
        fs.writeFileSync(path.join(assetsDir, 'router-CjYhHRKd.js'), 'export {};\n');
      }
    }
  };
}
