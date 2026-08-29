#!/usr/bin/env node
/*
 * sync-content.mjs — keeps the HTML shells in step with /content/*.json.
 *
 * The JSON files are the single source of truth for copy and meta. The
 * shells carry the same copy statically (for SEO, JS-off visitors, and
 * zero content-flash); this script regenerates those static parts from
 * JSON so they can never drift.
 *
 *   node tools/sync-content.mjs          # check: exit 1 + report if drifted
 *   node tools/sync-content.mjs --write  # rewrite shells + sitemap.xml
 *
 * This is a dev convenience, not a build step — the site runs from a plain
 * static server whether or not this has ever been executed.
 *
 * What it stamps, per shell:
 *   <title>, meta description, canonical, og:/twitter: tags   <- meta.*
 *   [data-slot]           text content (escaped)
 *   [data-slot-md]        markdown -> HTML via js/vendor/marked.esm.js
 *   [data-slot-attr]      attribute values (only when non-empty)
 *   [data-slot-showif]    the hidden attribute
 *   <nav data-nav>        the nav list from site.json (+ aria-current)
 * Plus sitemap.xml from site.json + each page's meta.path.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from '../js/vendor/marked.esm.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');

const esc = (s) => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escAttr = (s) => esc(s).replaceAll('"', '&quot;');

const resolve = (data, path) =>
  path.split('.').reduce((n, k) => (n == null ? undefined : n[k]), data);

async function loadJSON(name) {
  return JSON.parse(await readFile(join(root, 'content', `${name}.json`), 'utf8'));
}

/* Replace the inner content of every tag carrying attr="path".
   Assumes slot elements do not nest a same-named element inside — true for
   the shells, which keep slot content to text or simple markdown output. */
function fillSlots(html, data, attr, toHTML) {
  const re = new RegExp(
    `<([a-z0-9]+)((?:[^>"]|"[^"]*")*?\\s${attr}="([^"]+)"(?:[^>"]|"[^"]*")*)>`,
    'g'
  );
  let out = '';
  let last = 0;
  for (const m of html.matchAll(re)) {
    const [tagOpen, tagName, attrs, path] = m;
    const value = resolve(data, path);
    const start = m.index + tagOpen.length;
    const close = `</${tagName}>`;
    const end = html.indexOf(close, start);
    if (end === -1) continue;
    out += html.slice(last, start);
    out += (typeof value === 'string' || typeof value === 'number')
      ? toHTML(String(value))
      : html.slice(start, end); // path unresolved -> leave as-is
    last = end;
    void attrs;
  }
  out += html.slice(last);
  return out;
}

/* Rewrite attributes named in data-slot-attr="attr:path, attr2:path2". */
function fillAttrSlots(html, data) {
  return html.replace(
    /<[a-z0-9]+(?:[^>"]|"[^"]*")*?\sdata-slot-attr="([^"]+)"(?:[^>"]|"[^"]*")*>/g,
    (tag, spec) => {
      let result = tag;
      for (const pair of spec.split(',')) {
        const i = pair.indexOf(':');
        if (i < 1) continue;
        const attr = pair.slice(0, i).trim();
        const value = resolve(data, pair.slice(i + 1).trim());
        if (typeof value !== 'string' || value === '') continue;
        const attrRe = new RegExp(`(\\s${attr}=")[^"]*(")`);
        result = attrRe.test(result)
          ? result.replace(attrRe, `$1${escAttr(value)}$2`)
          : result.replace(/>$/, ` ${attr}="${escAttr(value)}">`);
      }
      return result;
    }
  );
}

/* Set or clear [hidden] according to the showif path's emptiness. */
function fillShowIf(html, data) {
  return html.replace(
    /<[a-z0-9]+(?:[^>"]|"[^"]*")*?\sdata-slot-showif="([^"]+)"(?:[^>"]|"[^"]*")*>/g,
    (tag, path) => {
      const v = resolve(data, path);
      const show = typeof v === 'string' ? v.trim() !== '' : Boolean(v);
      let result = tag.replace(/\shidden(?:="[^"]*")?(?=[\s>])/g, '');
      if (!show) result = result.replace(/^<([a-z0-9]+)/, '<$1 hidden');
      return result;
    }
  );
}

function stampNav(html, site, currentPage) {
  const items = site.nav.map((item) => {
    const current = item.page === currentPage ? ' aria-current="page"' : '';
    return `          <li><a href="${escAttr(item.href)}" data-page="${escAttr(item.page)}"${current}>${esc(item.label)}</a></li>`;
  }).join('\n');
  return html.replace(
    /(<nav [^>]*data-nav[^>]*>)[\s\S]*?(<\/nav>)/g,
    `$1\n        <ul>\n${items}\n        </ul>\n      $2`
  );
}

function stampMeta(html, site, meta) {
  if (!meta) return html;
  const url = `${site.siteUrl}/${meta.path}`;
  const og = `${site.siteUrl}/${meta.ogImage}`;
  const subs = [
    [/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`],
    [/(<meta name="description" content=")[^"]*(")/, `$1${escAttr(meta.description)}$2`],
    [/(<link rel="canonical" href=")[^"]*(" data-canonical>)/, `$1${escAttr(url)}$2`],
    [/(<meta property="og:title" content=")[^"]*(")/, `$1${escAttr(meta.title)}$2`],
    [/(<meta property="og:description" content=")[^"]*(")/, `$1${escAttr(meta.description)}$2`],
    [/(<meta property="og:url" content=")[^"]*(")/, `$1${escAttr(url)}$2`],
    [/(<meta property="og:image" content=")[^"]*(")/, `$1${escAttr(og)}$2`],
    [/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escAttr(meta.title)}$2`],
    [/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escAttr(meta.description)}$2`],
    [/(<meta name="twitter:image" content=")[^"]*(")/, `$1${escAttr(og)}$2`],
  ];
  for (const [re, replacement] of subs) html = html.replace(re, replacement);
  return html;
}

async function processShell(file, site) {
  const src = await readFile(join(root, file), 'utf8');
  const page = (src.match(/<html [^>]*data-page="([^"]+)"/) || [])[1];
  if (!page) return null;
  const extras = ((src.match(/data-extra-content="([^"]+)"/) || [])[1] || '')
    .split(',').map((s) => s.trim()).filter(Boolean);

  const pageData = await loadJSON(page === 'home' ? 'home' : page);
  const data = { ...pageData, site };
  for (const name of extras) data[name] = await loadJSON(name);

  let out = src;
  out = stampMeta(out, site, pageData.meta);
  out = stampNav(out, site, page);
  out = fillSlots(out, data, 'data-slot', esc);
  out = fillSlots(out, data, 'data-slot-md', (v) => `\n          ${marked.parse(v).trim()}\n        `);
  out = fillAttrSlots(out, data);
  out = fillShowIf(out, data);
  return { file, page, src, out, path: pageData.meta && pageData.meta.path };
}

function sitemap(site, pages) {
  const d = new Date(); // local date — toISOString() can land a day ahead
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const urls = pages.filter((p) => p.path).map((p) =>
    `  <url>\n    <loc>${esc(`${site.siteUrl}/${p.path}`)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const site = await loadJSON('site');
const shells = (await readdir(root)).filter((f) => f.endsWith('.html'));
const results = (await Promise.all(shells.map((f) => processShell(f, site))))
  .filter(Boolean);

let drift = 0;
for (const r of results) {
  if (r.src !== r.out) {
    drift++;
    if (write) {
      await writeFile(join(root, r.file), r.out);
      console.log(`wrote ${r.file}`);
    } else {
      console.log(`DRIFT ${r.file} — shell does not match content JSON`);
    }
  }
}

const sitemapPath = join(root, 'sitemap.xml');
const newSitemap = sitemap(site, results);
const oldSitemap = await readFile(sitemapPath, 'utf8').catch(() => '');
// lastmod-only changes don't count as drift
const stripDates = (s) => s.replace(/<lastmod>[^<]*<\/lastmod>/g, '');
if (stripDates(oldSitemap) !== stripDates(newSitemap)) {
  if (write) {
    await writeFile(sitemapPath, newSitemap);
    console.log('wrote sitemap.xml');
  } else {
    console.log('DRIFT sitemap.xml');
    drift++;
  }
}

if (!write && drift) {
  console.log(`\n${drift} file(s) out of sync. Run: node tools/sync-content.mjs --write`);
  process.exit(1);
}
console.log(write ? 'sync complete' : 'shells in sync with content JSON');
