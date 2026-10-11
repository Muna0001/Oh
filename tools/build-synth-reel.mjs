#!/usr/bin/env node
/*
 * build-synth-reel.mjs: bundles the Oh-a-Synth explainer's drawing code into
 * js/synth-reel.js, so the product page can play its feature demos live in a
 * <canvas>, as the Oh-a-Chord page does with tools/build-chord-reel.mjs.
 *
 *   node tools/build-synth-reel.mjs [path/to/oh-a-chord/showreel]
 *
 * Source: the showreel folder in the oh-a-chord repo (default
 * ../oh-a-chord/showreel), after its own build has run there:
 *   node synth_panel.mjs && python3 synth_explainer_score.py
 * That photographs the app's panel (build/synth-panel/) and plays the score on
 * the app's engine (build/synth-explainer.js and -scope.bin). Those outputs
 * are what this bundles; the audio itself isn't needed.
 *
 * Writes:
 *   js/synth-reel.js           kit.js, synth-kit.js and the explainer's scenes,
 *                              wrapped in one function: the page sees
 *                              window.OhSynthReel only
 *   assets/synth-reel/         the panel photos (A.png, B.png, name-<i>.png)
 *                              and scope.bin: the engine's output for the two
 *                              scenes that draw it (DCO, chorus), 8-bit at
 *                              24 kHz, each normalized to its own peak
 *   assets/fonts/VT323.woff2   the monitors' VCR face (SIL OFL, with licence)
 *
 * Patches to the source, each asserted so a changed source fails loudly:
 *   - draw into any canvas, not the reel's fixed 1920x1080 #c
 *   - reset() keeps a per-context base scale (x and y), for crisp HiDPI output
 *   - assets load from assets/synth-reel/, the layout is inlined, and the
 *     scope comes from the compact scope.bin
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..');
const REEL = resolve(process.argv[2] || join(SITE, '..', 'oh-a-chord', 'showreel'));
const BUILD = join(REEL, 'build');
const OUT = join(SITE, 'js', 'synth-reel.js');
const ASSETS = join(SITE, 'assets', 'synth-reel');

const read = (f) => readFileSync(join(REEL, f), 'utf8');
function patch(src, from, to, what) {
  if (!src.includes(from)) throw new Error(`patch failed (${what}): source changed`);
  return src.replace(from, to);
}
for (const f of ['synth-explainer.js', 'synth-explainer-scope.bin', 'synth-panel/layout.json', 'synth-panel/A.png'])
  if (!existsSync(join(BUILD, f))) throw new Error(`missing ${join(BUILD, f)}: run synth_panel.mjs and synth_explainer_score.py in the showreel folder first`);

// ---- the score
let score = readFileSync(join(BUILD, 'synth-explainer.js'), 'utf8');
score = patch(score, 'window.SCORE = ', 'const REEL_SCORE = ', 'score global');
const SC = JSON.parse(score.slice('const REEL_SCORE = '.length, score.lastIndexOf(';')));
const bt = (b) => b * SC.beat;

// ---- the scenes the page plays: name -> [first beat, last beat]
const SCENES = { patches: [4, 12], dco: [12, 20], vcf: [20, 28], chorus: [36, 44], arp: [44, 52], bender: [52, 58] };

// ---- assets: the panel photos, and the engine's output where a scene draws it
mkdirSync(ASSETS, { recursive: true });
const layout = JSON.parse(readFileSync(join(BUILD, 'synth-panel', 'layout.json'), 'utf8'));
for (const f of ['A.png', 'B.png', ...layout.presets.map((_, i) => `name-${i}.png`)])
  copyFileSync(join(BUILD, 'synth-panel', f), join(ASSETS, f));
{
  const raw = readFileSync(join(BUILD, 'synth-explainer-scope.bin'));
  const pcm = new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
  const SR = 48000, parts = [];
  for (const name of ['dco', 'chorus']) {
    const [b0, b1] = SCENES[name];
    // a little before the scene, for the scope's trigger and gain look-back
    const s0 = Math.max(0, Math.floor((bt(b0) - 0.2) * SR) & ~1), s1 = Math.ceil(bt(b1) * SR);
    let peak = 1;
    for (let i = s0 * 2; i < s1 * 2; i++) peak = Math.max(peak, Math.abs(pcm[i]));
    const n = (s1 - s0) >> 1;                         // 24 kHz: average each pair
    const seg = Buffer.alloc(8 + 2 * n);
    seg.writeInt32LE(s0, 0); seg.writeInt32LE(n, 4);
    for (let k = 0; k < n; k++) for (let ch = 0; ch < 2; ch++) {
      const v = (pcm[2 * (s0 + 2 * k) + ch] + pcm[2 * (s0 + 2 * k + 1) + ch]) / 2;
      seg.writeInt8(Math.round(v / peak * 127), 8 + 2 * k + ch);
    }
    parts.push(seg);
  }
  writeFileSync(join(ASSETS, 'scope.bin'), Buffer.concat(parts));
}
copyFileSync(join(REEL, 'fonts', 'VT323.woff2'), join(SITE, 'assets', 'fonts', 'VT323.woff2'));
copyFileSync(join(REEL, 'fonts', 'OFL-VT323.txt'), join(SITE, 'assets', 'fonts', 'OFL-VT323.txt'));

// ---- kit.js
let kit = read('kit.js');
kit = patch(kit, 'const SC = window.SCORE;', 'const SC = REEL_SCORE;', 'score source');
kit = patch(kit,
  "const W = document.getElementById('c').width, H = document.getElementById('c').height, CX = W / 2, CY = H / 2;",
  'const W = 1920, H = 1080, CX = W / 2, CY = H / 2;', 'frame size');
kit = patch(kit, "const canvas = document.getElementById('c');",
  'const canvas = document.createElement(\'canvas\'); canvas.width = W; canvas.height = H;', 'canvas');
kit = patch(kit, 'c.setTransform(1, 0, 0, 1, 0, 0);',
  'c.setTransform(c.__sx || 1, 0, 0, c.__sy || 1, 0, 0);', 'base scale');
const tail = kit.indexOf('window.render = render;');
if (tail < 0) throw new Error('patch failed (tail): source changed');
kit = kit.slice(0, tail);

// ---- synth-kit.js
let skit = read('synth-kit.js');
skit = patch(skit, "const DIR = 'build/synth-panel/';",
  "const DIR = new URL('../assets/synth-reel/', document.currentScript ? document.currentScript.src : location.href).href;", 'asset folder');
skit = patch(skit, "  LAY = await (await fetch(DIR + 'layout.json')).json();", '  LAY = JSON.parse(JSON.stringify(REEL_LAYOUT));', 'layout');
skit = patch(skit, "  [IMG.A, IMG.B, IMG.icon] = await Promise.all(['A', 'B', 'icon'].map(n => loadImg(DIR + n + '.png')));",
  "  [IMG.A, IMG.B] = await Promise.all(['A', 'B'].map(n => loadImg(DIR + n + '.png')));", 'photos (no icon)');
skit = patch(skit, '  SCOPE = new Int16Array(await (await fetch(PS.scope)).arrayBuffer());', '  SCOPE = await loadScope();', 'scope');
skit = patch(skit, 'window.READY = Promise.all([window.READY, ASSETS]).then(() => true);\n', '', 'no page global');

// ---- the explainer's scenes (its whole inline scene script; nothing in it
// runs at load except constant setup)
const html = read('synth-explainer.html');
const start = html.indexOf('<script>\n/*\n * Oh-a-Synth — the 30-second explainer.');
const end = html.lastIndexOf('</script>');
if (start < 0 || end < start) throw new Error('could not find the explainer scene script');
const scenes = html.slice(start + '<script>'.length, end);

// ---- the page-facing API
const extra = String.raw`
// ================================================================= API ==
// scope.bin: per segment, int32 first sample (48 kHz), int32 count (24 kHz),
// then int8 L/R pairs. Rebuilt into the full-length 16-bit stereo buffer the
// scopes read, with the missing samples interpolated.
async function loadScope() {
  const dv = new DataView(await (await fetch(DIR + 'scope.bin')).arrayBuffer());
  const out = new Int16Array(Math.ceil(SC.length * SR) * 2);
  for (let o = 0; o < dv.byteLength;) {
    const s0 = dv.getInt32(o, true), n = dv.getInt32(o + 4, true);
    o += 8;
    for (let k = 0; k < n; k++) for (let ch = 0; ch < 2; ch++) {
      const a = dv.getInt8(o + 2 * k + ch), b = k + 1 < n ? dv.getInt8(o + 2 * k + 2 + ch) : a;
      out[2 * (s0 + 2 * k) + ch] = a * 256;
      out[2 * (s0 + 2 * k + 1) + ch] = (a + b) * 128;
    }
    o += 2 * n;
  }
  return out;
}
// Each scene maps page time (0..length, looping) to explainer time.
const scene = (b0, b1, demo, hold = 0) => ({
  length: bt(b1) - bt(b0) + hold,
  draw: (u) => { const t = Math.min(bt(b0) + u, bt(b1) - 0.01); demo(t, panelState(t)); },
});
const REEL_SCENES = {
  ${Object.entries({ patches: 'demo1', dco: 'demo2', vcf: 'demo3', chorus: 'demo5', arp: 'demo6', bender: 'demo7' })
    .map(([k, d]) => `${k}: scene(${SCENES[k][0]}, ${SCENES[k][1]}, ${d}${k === 'bender' ? ', 0.8' : ''}),`).join('\n  ')}
};
const FADE = 0.28;
// sx and sy are the canvas size over the scene size, set separately so the
// drawing always reaches every edge of the canvas.
function drawScene(c2d, name, u, sx, sy) {
  const sc = REEL_SCENES[name];
  if (!sc || !LAY) return;
  const prev = ctx;
  ctx = c2d; ctx.__sx = sx; ctx.__sy = sy == null ? sx : sy;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = T.panel2; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  reset();
  ctx.save();
  rrect(0, 0, WIN.w, WIN.h, 8); ctx.fillStyle = T.panel2; ctx.fill();
  rrect(0, 0, WIN.w, WIN.h, 8); ctx.clip();
  sc.draw(u);
  // a short dip at the loop point, so the jump back to the start isn't a cut
  const edge = Math.max(1 - prog(u, 0, FADE), prog(u, sc.length - FADE, sc.length));
  if (edge > 0.001) { ctx.fillStyle = rgba(T.panel2, E.inOutCubic(edge)); ctx.fillRect(0, 0, WIN.w, WIN.h); }
  ctx.restore();
  rrect(0, 0, WIN.w, WIN.h, 8); ctx.strokeStyle = 'rgba(236,229,213,0.22)'; ctx.lineWidth = 2; ctx.stroke();
  ctx = prev;
}
const here = document.currentScript && document.currentScript.src;
const vt = new FontFace('VT323', 'url(' + new URL('../assets/fonts/VT323.woff2', here || location.href) + ')');
document.fonts.add(vt);
window.OhSynthReel = {
  width: WIN.w, height: WIN.h,
  scenes: Object.fromEntries(Object.entries(REEL_SCENES).map(([k, v]) => [k, { length: v.length }])),
  draw: drawScene,
  ready: Promise.all([
    vt.load(), ASSETS,
    document.fonts.load('400 20px Archivo'), document.fonts.load('700 20px Archivo'),
    document.fonts.load('800 20px Archivo'),
  ]).then(() => true),
};
`;

const banner = `/*
 * synth-reel.js: GENERATED by tools/build-synth-reel.mjs. Do not edit by hand.
 *
 * The Oh-a-Synth explainer's drawing code (showreel/kit.js, synth-kit.js and
 * the scenes in showreel/synth-explainer.html, in the oh-a-chord repo), so the
 * product page can play its feature demos live in a <canvas>, on the app's
 * real panel (assets/synth-reel/). Wrapped in one function: the page sees
 * window.OhSynthReel only. Driven by js/synth-demos.js.
 */
`;
// the panel's layout goes ahead of synth-kit.js, whose asset loader reads it at once
const lay = 'const REEL_LAYOUT = ' + JSON.stringify(layout) + ';\n';
const out = banner + '(function () {\n' + score + '\n' + lay + kit + '\n' + skit + '\n' + scenes + '\n' + extra + '\n})();\n';
writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${(out.length / 1024).toFixed(1)} KB) and ${ASSETS} from ${REEL}`);
