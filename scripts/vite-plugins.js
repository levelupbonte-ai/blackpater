import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { NOT_FOUND, ROUTES, SITE_URL } from '../shared/routes.js';
import { structuredDataTag } from '../shared/structured-data.js';

/** JSON-LD from the offer catalog (shared/structured-data.js), dev and build. */
export function structuredData() {
  return {
    name: 'blackpater-structured-data',
    transformIndexHtml(html) {
      return html.replace('<!--structured-data-->', structuredDataTag());
    }
  };
}

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
  // Function replacers: a value such as "$2.60" must never be read as a group reference.
  return html.replace(re, (_, a, b) => `${a}${escapeHtml(value)}${b}`);
}

/** Rewrites the head of index.html for one route: title, description, canonical, social cards. */
export function renderRouteHtml(template, { path: routePath, meta, indexable }, body = null) {
  const url = routePath ? `${SITE_URL}${routePath === '/' ? '/' : routePath}` : null;
  // French is the default language of the site (and of the prerendered HTML).
  const { title, description } = meta.fr;
  let html = template.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  if (url) {
    html = html.replace(/<link rel="canonical" href="[^"]*">/, () => `<link rel="canonical" href="${url}">`);
    html = setMeta(html, 'property', 'og:url', url);
    html = html.replace(/(<link rel="alternate" hreflang="[a-z-]+" href=")[^"]*(">)/g, (_, a, b) => `${a}${url}${b}`);
  } else {
    html = html.replace(/<link rel="canonical" href="[^"]*">\n?/, '').replace(/<link rel="alternate" hreflang="[a-z-]+" href="[^"]*">\n?/g, '');
  }
  if (!indexable) {
    html = html.replace(/<meta name="(robots|googlebot|bingbot)" content="[^"]*">/g, '<meta name="$1" content="noindex, follow">');
  }
  if (body) {
    // Real page content, rendered at build time; the browser hydrates it.
    html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<\/div>\s*(<script)/, (_, s) => `<div id="root" data-ssr>${body}</div>\n${s}`);
  } else {
    // Hidden pre-render text inside #root (replaced by React on load).
    html = html.replace(
      /(<div class="sr-prerender"[^>]*>)[\s\S]*?(<\/div>\s*<\/div>\s*<script)/,
      (_, a, b) => `${a}\n    <h1>${escapeHtml(title)}</h1>\n    <p>${escapeHtml(description)}</p>\n  ${b}`
    );
  }
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

/** Builds src/entry-server.tsx for Node and returns its render(path), or null. */
async function loadServerRenderer(root) {
  if (process.env.BP_SKIP_PRERENDER === '1') return null;
  try {
    const { build } = await import('vite');
    const react = (await import('@vitejs/plugin-react')).default;
    const ssrOut = path.join(root, 'node_modules', '.bp-ssr');
    await build({
      configFile: false,
      root,
      logLevel: 'warn',
      plugins: [react()],
      build: {
        ssr: path.join(root, 'src/entry-server.tsx'),
        outDir: ssrOut,
        emptyOutDir: true,
        rollupOptions: { output: { format: 'esm', entryFileNames: 'entry-server.mjs' } }
      }
    });
    const mod = await import(`${pathToFileURL(path.join(ssrOut, 'entry-server.mjs')).href}?t=${Date.now()}`);
    return mod.render;
  } catch (err) {
    console.warn(`prerender unavailable: ${err?.message || err}`);
    return null;
  }
}

/** After `vite build`: one HTML file per route + 404.html + sitemap.xml + stable asset fallbacks. */
export function routePages() {
  let outDir = 'dist';
  let root = process.cwd();
  return {
    name: 'blackpater-route-pages',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      root = config.root;
    },
    async closeBundle() {
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      const render = await loadServerRenderer(root);
      for (const route of ROUTES) {
        let body = null;
        // Indexable pages get their real content in the HTML; private or
        // per-visitor pages (payment results, client space) keep the shell.
        if (render && route.indexable) {
          try {
            body = render(route.path);
          } catch (err) {
            console.warn(`prerender skipped for ${route.path}: ${err?.message || err}`);
          }
        }
        const file = path.join(outDir, route.file);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, renderRouteHtml(template, route, body));
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
