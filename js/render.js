/*
 * render.js — fills data-slot elements from /content/*.json.
 *
 * The HTML shells already contain the same copy as static fallback, so this
 * module is a no-op visually when shells and JSON are in sync (run
 * `node tools/sync-content.mjs --write` after editing JSON to keep them so).
 * With JavaScript disabled, or if a fetch fails, the static copy stands.
 *
 * Slot vocabulary (all resolved against the merged data object):
 *   data-slot="hero.h1"          -> element.textContent
 *   data-slot-md="promise.body"  -> element.innerHTML via marked (block)
 *   data-slot-attr="href:maker.linkHref, src:demo.poster"
 *                                -> sets one or more attributes
 *   data-slot-showif="music.links.spotify"
 *                                -> removes [hidden] when value is non-empty,
 *                                   sets it when empty
 *
 * Data namespaces: the page's own JSON is the root; site.json is under
 * "site."; extra files listed in <html data-extra-content="music"> are
 * merged under their own name ("music.").
 *
 * Adding a product page needs no changes here: one new content JSON, one
 * shell with data-page pointing at it, one nav entry in site.json.
 */
/* marked is ~90 KB and only pages with a data-slot-md field need it, so it
   is imported on demand rather than on every page. */
let markedPromise = null;
const getMarked = () => {
  if (!markedPromise) {
    markedPromise = import('./vendor/marked.esm.js').then((m) => m.marked);
  }
  return markedPromise;
};

const cache = new Map();

async function fetchJSON(name) {
  if (!cache.has(name)) {
    cache.set(name, fetch(`content/${name}.json`).then((r) => {
      if (!r.ok) throw new Error(`${name}.json: HTTP ${r.status}`);
      return r.json();
    }));
  }
  return cache.get(name);
}

/** Shared accessor so forms.js / analytics.js reuse one request. */
export function getSiteData() {
  return fetchJSON('site');
}

export function resolve(data, path) {
  return path.split('.').reduce(
    (node, key) => (node == null ? undefined : node[key]),
    data
  );
}

async function renderSlots(root, data) {
  for (const el of root.querySelectorAll('[data-slot]')) {
    const v = resolve(data, el.dataset.slot);
    if (typeof v === 'string' || typeof v === 'number') el.textContent = v;
  }
  const mdEls = root.querySelectorAll('[data-slot-md]');
  if (mdEls.length) {
    const marked = await getMarked();
    for (const el of mdEls) {
      const v = resolve(data, el.dataset.slotMd);
      if (typeof v === 'string') el.innerHTML = marked.parse(v);
    }
  }
  for (const el of root.querySelectorAll('[data-slot-attr]')) {
    for (const pair of el.dataset.slotAttr.split(',')) {
      const i = pair.indexOf(':');
      if (i < 1) continue;
      const attr = pair.slice(0, i).trim();
      const v = resolve(data, pair.slice(i + 1).trim());
      if (typeof v === 'string' && v !== '') el.setAttribute(attr, v);
    }
  }
  for (const el of root.querySelectorAll('[data-slot-showif]')) {
    const v = resolve(data, el.dataset.slotShowif);
    el.hidden = !(typeof v === 'string' ? v.trim() !== '' : Boolean(v));
  }
}

async function main() {
  const html = document.documentElement;
  const page = html.dataset.page;
  if (!page) return;
  try {
    const names = ['site', page === 'home' ? 'home' : page];
    const extras = (html.dataset.extraContent || '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    const [site, pageData, ...extraData] = await Promise.all(
      [...names, ...extras].map(fetchJSON)
    );
    const data = { ...pageData, site };
    extras.forEach((name, i) => { data[name] = extraData[i]; });
    await renderSlots(document, data);
    document.dispatchEvent(new CustomEvent('oh:content', { detail: data }));
  } catch {
    /* static fallback copy stays — by design (file://, offline, JSON typo) */
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true });
} else {
  main();
}
