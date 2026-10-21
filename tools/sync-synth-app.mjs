#!/usr/bin/env node
/*
 * sync-synth-app.mjs — the full browser build of Oh-a-Synth on the unlisted
 * oh-a-synth/play.html.
 *
 * The web app lives in the private Muna0001/ohasynth repo (index.html, css/,
 * js/). This copies its css/ and js/ unchanged into oh-a-synth/app/, and
 * writes oh-a-synth/play.html from its index.html: the same page with its
 * paths pointing into app/, told not to be indexed, with the site's favicon.
 * Never edit either here: change the app there and run this again.
 *
 *   node tools/sync-synth-app.mjs ../ohasynth          # check: exit 1 if drifted
 *   node tools/sync-synth-app.mjs ../ohasynth --write  # copy + rewrite play.html
 *
 * Like sync-content.mjs, a dev convenience, not a build step.
 */
import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const write = args.includes('--write');
const src = args.find((a) => !a.startsWith('--'));
if (!src) {
  console.error('usage: node tools/sync-synth-app.mjs /path/to/ohasynth [--write]');
  process.exit(2);
}
const app = join(root, 'oh-a-synth', 'app');
const page = join(root, 'oh-a-synth', 'play.html');

async function files(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await files(p)));
    else if (!e.name.startsWith('.')) out.push(p);
  }
  return out;
}

// play.html: the app's index.html, pointed into app/ and kept out of search
function pageFrom(html) {
  const head = [
    '<!-- Unlisted on purpose: nothing links here and search engines are told to',
    '       skip it. The full browser build of Oh-a-Synth, generated from the app\'s',
    '       own index.html by tools/sync-synth-app.mjs; do not edit by hand. -->',
    '  <meta name="robots" content="noindex, nofollow">',
    '  <link rel="icon" href="../favicon.svg" type="image/svg+xml">',
    '  <link rel="icon" href="../assets/img/favicon-32.png" type="image/png" sizes="32x32">',
  ].join('\n');
  const out = html
    .replace(/(href|src)="(css|js)\//g, '$1="app/$2/')
    .replace(/(<meta name="viewport"[^>]*>)/, `$1\n  ${head}`);
  if (out === html || !out.includes('noindex')) throw new Error('index.html is not shaped as expected');
  return out;
}

const want = new Map();   // site path -> contents
for (const dir of ['css', 'js'])
  for (const f of await files(join(src, dir)))
    want.set(join(app, relative(src, f)), await readFile(f));
want.set(page, Buffer.from(pageFrom(await readFile(join(src, 'index.html'), 'utf8'))));

const have = new Set(await files(app).catch(() => []));
const drift = [];
for (const [p, body] of want) {
  const cur = await readFile(p).catch(() => null);
  if (!cur || !cur.equals(body)) drift.push(relative(root, p));
}
const stale = [...have].filter((p) => !want.has(p));
drift.push(...stale.map((p) => relative(root, p) + ' (no longer in the app)'));

if (!write) {
  if (drift.length) {
    console.log('Out of step with the app:\n  ' + drift.join('\n  '));
    process.exit(1);
  }
  console.log('oh-a-synth/play.html and oh-a-synth/app/ match the app.');
  process.exit(0);
}
for (const p of stale) await rm(p);
for (const [p, body] of want) {
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, body);
}
console.log(drift.length ? 'Updated:\n  ' + drift.join('\n  ') : 'Already in step.');
