/**
 * LevelUp Ecosystem runtime for static client sites.
 *
 * Progressive enhancement: the HTML is complete without this script. When the
 * LevelUp database is reachable it:
 *   - swaps self-hosted media for the versions managed in the dashboard
 *     (content block "media": { "<file name>": "<url>" }),
 *   - fills [data-lu-text="key"] elements from content block "texts",
 *   - shows or hides the "Built by LevelUp" credit (websites.show_powered_by),
 *   - counts page views for the dashboard's Analytics page: one per page load
 *     and per client-side navigation, with only the path, the referrer and the
 *     browser language. No cookie, no storage, no identifier; nothing is sent
 *     under Do Not Track or when window.LEVELUP.analytics is false. The
 *     database keeps daily counters only and accepts views from this site's
 *     own domains (blackpater.com, www.blackpater.com).
 */
(function () {
  'use strict';

  var cfg = window.LEVELUP;
  if (!cfg || !cfg.supabaseUrl || !cfg.publishableKey || !/^ws_[a-z0-9]{8,32}$/.test(cfg.websiteId || '')) return;

  var headers = { apikey: cfg.publishableKey, Authorization: 'Bearer ' + cfg.publishableKey, 'Content-Type': 'application/json' };
  var page = document.documentElement.dataset.luPage || 'site';

  function rpc(name, body) {
    return fetch(cfg.supabaseUrl + '/rest/v1/rpc/' + name, { method: 'POST', headers: headers, body: JSON.stringify(body) })
      .then(function (r) { return r.ok ? r.json() : null; });
  }

  function blocks() {
    var q = '/rest/v1/content_blocks?select=page,block_key,data&website_id=eq.' + encodeURIComponent(cfg.websiteId) +
      '&page=in.(site,' + encodeURIComponent(page) + ')';
    return fetch(cfg.supabaseUrl + q, { headers: headers }).then(function (r) { return r.ok ? r.json() : []; });
  }

  // Only https URLs (or same-origin paths) are accepted from the database.
  // URLs end up in style attributes and <style> text: besides the scheme, refuse
  // anything that could close the url() or the declaration (quotes, parens,
  // backslash, semicolon, braces, whitespace, angle brackets).
  function safeUrl(u) {
    return typeof u === 'string' &&
      (/^https:\/\//.test(u) || /^\/[^/]/.test(u)) &&
      !/[\s'"()\\;{}<>]/.test(u)
      ? u
      : null;
  }

  function applyMedia(map) {
    var files = Object.keys(map || {});
    if (!files.length) return;
    files.forEach(function (file) {
      var url = safeUrl(map[file]);
      if (!url || !/^[a-z0-9]+\.[a-z0-9]+$/.test(file)) return;
      var local = '/media/' + file;
      document.querySelectorAll('[src="' + local + '"],[data-src="' + local + '"]').forEach(function (el) {
        if (el.getAttribute('src') === local) el.setAttribute('src', url);
        if (el.dataset.src === local) el.dataset.src = url;
      });
      document.querySelectorAll('[style*="' + local + '"]').forEach(function (el) {
        el.setAttribute('style', el.getAttribute('style').split(local).join(url));
      });
      document.querySelectorAll('style').forEach(function (st) {
        if (st.textContent.indexOf(local) !== -1) st.textContent = st.textContent.split(local).join(url);
      });
    });
  }

  function applyTexts(texts) {
    if (!texts) return;
    var lang = document.documentElement.lang || 'fr';
    document.querySelectorAll('[data-lu-text]').forEach(function (el) {
      var v = texts[el.dataset.luText];
      if (v && typeof v === 'object') v = v[lang] || v.fr || v.en;
      if (typeof v === 'string' && v.trim()) el.textContent = v;
    });
  }

  Promise.all([rpc('get_public_website', { p_website_id: cfg.websiteId }), blocks()])
    .then(function (res) {
      var site = res[0], list = res[1] || [];
      var byKey = {};
      list.forEach(function (b) { byKey[b.block_key] = b.data; });
      applyMedia(byKey.media);
      applyTexts(byKey.texts);
      if (site && site.show_powered_by === false) {
        document.querySelectorAll('[data-lu-built-by]').forEach(function (el) { el.hidden = true; });
      }
    })
    .catch(function () { /* static content stays as is */ });

  // ------------------------------------------------------------------ page views

  function doNotTrack() {
    var n = window.navigator || {};
    var v = n.doNotTrack || window.doNotTrack || n.msDoNotTrack;
    return v === '1' || v === 'yes' || v === 1;
  }

  var lastPath = null;
  var lastHref = null;
  function pageview() {
    var path = location.pathname || '/';
    if (path === lastPath) return;
    // First view: the page that sent the visitor; afterwards the previous page
    // of this site (counted as a direct visit by the database).
    var referrer = lastHref === null ? document.referrer : lastHref;
    lastPath = path;
    lastHref = location.href;
    var lang = navigator.language || '';
    var body = JSON.stringify({
      p_website_id: cfg.websiteId,
      p_path: path.slice(0, 2000),
      p_referrer: /^https?:\/\//i.test(referrer || '') ? String(referrer).slice(0, 2000) : null,
      p_lang: /^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$/.test(lang) ? lang : null
    });
    var url = cfg.supabaseUrl + '/rest/v1/rpc/track_pageview';
    function post(keepalive) {
      return fetch(url, { method: 'POST', headers: headers, credentials: 'omit', keepalive: keepalive, body: body });
    }
    // keepalive: the view is still sent if the visitor leaves right away. A
    // browser that cannot keep this request alive gets a normal request.
    try {
      post(true).catch(function () {
        return post(false);
      }).catch(function () { /* analytics never break the page */ });
    } catch (e) { /* idem */ }
  }

  if (cfg.analytics !== false && !doNotTrack() && !window.__levelupPageviews) {
    window.__levelupPageviews = true;
    // Client-side routes (src/app/router.tsx uses pushState / replaceState).
    ['pushState', 'replaceState'].forEach(function (m) {
      var original = history[m];
      if (typeof original !== 'function') return;
      history[m] = function () {
        var result = original.apply(this, arguments);
        pageview();
        return result;
      };
    });
    window.addEventListener('popstate', pageview);
    pageview();
  }
})();
