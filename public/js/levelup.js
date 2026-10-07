/**
 * LevelUp Ecosystem runtime for static client sites.
 *
 * Progressive enhancement: the HTML is complete without this script. When the
 * LevelUp database is reachable it:
 *   - swaps self-hosted media for the versions managed in the dashboard
 *     (content block "media": { "<file name>": "<url>" }),
 *   - fills [data-lu-text="key"] elements from content block "texts",
 *   - shows or hides the "Built by LevelUp" credit (websites.show_powered_by).
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
  function safeUrl(u) {
    return typeof u === 'string' && (/^https:\/\//.test(u) || /^\/[^/]/.test(u)) ? u : null;
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
})();
