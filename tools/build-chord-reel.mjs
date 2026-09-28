#!/usr/bin/env node
/*
 * build-chord-reel.mjs: bundles the Oh-a-Chord explainer's drawing code into
 * js/chord-reel.js, so the product page can play its feature demos live in a
 * <canvas> instead of as video.
 *
 *   node tools/build-chord-reel.mjs [path/to/oh-a-chord/showreel]
 *
 * Source: the showreel folder in the oh-a-chord repo (default
 * ../oh-a-chord/showreel). Its score (build/explainer.js) is generated from
 * explainer_score.py; only the visual half is needed, so the audio renderer
 * and its numpy/scipy imports are stubbed out.
 *
 * Everything is wrapped in one function, so none of the reel's helpers become
 * page globals. The page talks to window.OhChordReel only. Patches applied to
 * the reel's own code, each asserted so a changed source fails loudly:
 *   - draw into any canvas, not the reel's fixed 1920x1080 #c
 *   - reset() keeps a per-context base scale (x and y), for crisp HiDPI output
 *   - the modifier row matches app 1.1.0 (2, 6, flat 7 / MAJ7, 9, 11)
 *   - the KEY button lights amber like the app (accentLit), not blue
 * Plus a new Key Mode scene, in E major, written here.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..');
const REEL = resolve(process.argv[2] || join(SITE, '..', 'oh-a-chord', 'showreel'));
const OUT = join(SITE, 'js', 'chord-reel.js');

const read = (f) => readFileSync(join(REEL, f), 'utf8');
function patch(src, from, to, what) {
  if (!src.includes(from)) throw new Error(`patch failed (${what}): source changed`);
  return src.replace(from, to);
}

// ---- the score: run explainer_score.py with the audio half stubbed out
const py = `
import sys, types, json
np = types.ModuleType('numpy'); sys.modules['numpy'] = np
sc = types.ModuleType('scipy'); sig = types.ModuleType('scipy.signal')
sig.butter = sig.fftconvolve = sig.sosfilt = None; sc.signal = sig
sys.modules['scipy'] = sc; sys.modules['scipy.signal'] = sig
sys.path.insert(0, ${JSON.stringify(REEL)})
import synth
synth.render = lambda *a, **k: None
synth.OUT = sys.argv[1]
exec(open(${JSON.stringify(join(REEL, 'explainer_score.py'))}).read(), {'__name__': '__main__'})
`;
const tmp = join(SITE, '.chord-reel-build');
const r = spawnSync('python3', ['-c', py, tmp], { encoding: 'utf8' });
if (r.status !== 0) throw new Error('score build failed:\n' + r.stderr);
let score = readFileSync(join(tmp, 'explainer.js'), 'utf8');
spawnSync('rm', ['-rf', tmp]);
score = patch(score, 'window.SCORE = ', 'const REEL_SCORE = ', 'score global');

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
kit = patch(kit, "const MODS = [['6', '♭7', 'MAJ7'], ['9', '11', '13']];",
  "const MODS = [['2', '6', '♭7'], ['MAJ7', '9', '11']];", 'modifier row');
kit = patch(kit, 'capButton(30, by, 76, bh, bar.key, { lit: bar.keyLit, litColor: T.blue, fontSize: 12 });',
  'capButton(30, by, 76, bh, bar.key, { lit: bar.keyLit, fontSize: 12 });', 'KEY colour');
// drop the reel's own playback loop and globals; READY is rebuilt below
const tail = kit.indexOf('window.render = render;');
if (tail < 0) throw new Error('patch failed (tail): source changed');
kit = kit.slice(0, tail);

// ---- the explainer's scenes (its whole inline script; nothing in it runs
// at load except constant setup)
const html = read('explainer.html');
const start = html.indexOf('<script>\n/*\n * Oh-a-Chord');
const end = html.lastIndexOf('</script>');
if (start < 0 || end < start) throw new Error('could not find the explainer scene script');
const scenes = html.slice(start + '<script>'.length, end);

// ---- new: Key Mode in E, and the page-facing API
const extra = String.raw`
// ============================================ Key Mode, in E (site only) ==
// KEY is armed, then the press on E sets the key: the button reads KEY: E,
// the E major dots appear, and that press sounds the I chord. Then IV, V, the
// borrowed bVI and bVII (C and D), and vi.
const KE = {
  length: 6.6,
  armAt: 0.5, setAt: 1.3,
  chords: [
    { at: 1.3, name: 'E', root: 4, notes: [64, 68, 71] },
    { at: 2.2, name: 'A', root: 9, notes: [69, 73, 76] },
    { at: 2.9, name: 'B', root: 11, notes: [71, 75, 78] },
    { at: 3.6, name: 'C', root: 0, notes: [60, 64, 67], borrowed: true },
    { at: 4.3, name: 'D', root: 2, notes: [62, 66, 69], borrowed: true },
    { at: 5.0, name: 'C#m', root: 1, notes: [61, 64, 68] },
  ],
  hold: 5.9,
  scale: [4, 6, 8, 9, 11, 1, 3],
};
function keTag(label, x, y, a) {
  if (a <= 0) return 0;
  const lw = measure(label, F.ui(800, 13), 2).w + 22;
  ctx.save(); ctx.globalAlpha *= a;
  rrect(x, y, lw, 22, 3); ctx.fillStyle = T.orange; ctx.fill();
  text(label, x + 11, y + 16, { font: F.ui(800, 13), color: T.edge, ls: 2 });
  ctx.restore();
  return lw;
}
function keRing(x, y, w, h, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = T.orange; ctx.lineWidth = 3; rrect(x, y, w, h, 8); ctx.stroke();
  ctx.restore();
}
function demoKeyE(t) {
  let k = -1; KE.chords.forEach((c, i) => { if (t >= c.at) k = i; });
  const c = k >= 0 ? KE.chords[k] : null;
  const set = t >= KE.setAt, armed = t >= KE.armAt;
  const releaseAt = k >= 0 && k < KE.chords.length - 1 ? KE.chords[k + 1].at - 0.06 : KE.hold;
  appDemo(t, FULL, {
    word: c ? c.name : 'Chord', prev: k > 0 ? KE.chords[k - 1].name : 'Chord',
    swap: c ? E.outCubic(prog(t, c.at, c.at + 0.14)) : 1,
    typeLit: l => l === 'MAJ',
    lit: c && t < KE.hold ? litFor(c.root, c.notes, 1, t < releaseAt ? 1 : 0) : {},
    dots: set ? KE.scale : [],
    bar: { key: set ? 'KEY: E' : 'KEY', keyLit: armed, latch: false },
  }, () => {
    // the KEY button: tapped, then ringed while it matters
    touch(30 + 38, 772 + 17, t, KE.armAt - 0.08, KE.armAt + 0.12, 0.7);
    const ka = prog(t, KE.armAt, KE.armAt + 0.25) * (1 - prog(t, KE.setAt + 1.0, KE.setAt + 1.3));
    keRing(23, 765, 90, 48, ka);
    keTag('KEY MODE', 23, 735, ka);
    // the press that sets the key: ringed below the black keys, so it can't read as D#
    const r = KR[4], blk = KR[3], top = blk.y + blk.h + 8;
    const sa = prog(t, KE.setAt, KE.setAt + 0.2) * (1 - prog(t, KE.setAt + 0.8, KE.setAt + 1.0));
    keRing(r.x + 3, top, r.w - 6, r.y + r.h - top + 5, sa);
    const sw = measure('SETS THE KEY', F.ui(800, 13), 2).w + 22;
    keTag('SETS THE KEY', r.x + r.w / 2 - sw / 2, top - 30, sa);
    // borrowed chords get a tag over their key
    KE.chords.forEach((ch, i) => {
      if (!ch.borrowed) return;
      const next = i < KE.chords.length - 1 ? KE.chords[i + 1].at : KE.hold;
      const ba = prog(t, ch.at, ch.at + 0.15) * (1 - prog(t, next - 0.15, next));
      const R = KR[ch.root], bw = measure('BORROWED', F.ui(800, 13), 2).w + 22;
      keTag('BORROWED', R.x + R.w / 2 - bw / 2, KB.y - 34, ba);
    });
    KE.chords.forEach((ch, i) => {
      const next = i < KE.chords.length - 1 ? KE.chords[i + 1].at : KE.hold;
      keyTouch(ch.root, t, ch.at - 0.06, next - 0.06);
    });
  });
}

// ================================================================= API ==
// Each scene maps page time (0..length, looping) to reel time.
const REEL_SCENES = {
  chord: { length: bt(28) - bt(12), draw: (u) => { const t = bt(12) + u; (t < bt(20) ? demo2 : demo3)(t); } },
  keymode: { length: KE.length, draw: demoKeyE },
  perform: { length: bt(44) - bt(36), draw: (u) => demo5(bt(36) + u) },
  sound: { length: bt(58) - bt(52) + 1.0, draw: (u) => demo7(Math.min(bt(52) + u, bt(58) - 0.01)) },
};
const FADE = 0.28;
// sx and sy are the canvas size over the scene size. They're set separately
// so the drawing always reaches every edge of the canvas: the page's frame and
// the reel's window differ in shape by about 0.1%, and a single uniform scale
// left a hairline gap that let the still image underneath show through.
function drawScene(c2d, name, u, sx, sy) {
  const sc = REEL_SCENES[name];
  if (!sc) return;
  const prev = ctx;
  ctx = c2d; ctx.__sx = sx; ctx.__sy = sy == null ? sx : sy;
  // paint the whole canvas first, corners included
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
const mono = new FontFace('JetBrains Mono', 'url(' + new URL('../assets/fonts/JetBrainsMono.woff2', here || location.href) + ')', { weight: '100 800' });
document.fonts.add(mono);
window.OhChordReel = {
  width: WIN.w, height: WIN.h,
  scenes: Object.fromEntries(Object.entries(REEL_SCENES).map(([k, v]) => [k, { length: v.length }])),
  draw: drawScene,
  ready: Promise.all([
    mono.load(),
    document.fonts.load('italic 700 40px Archivo'), document.fonts.load('700 20px Archivo'),
    document.fonts.load('800 20px Archivo'),
  ]).then(() => true),
};
`;

const banner = `/*
 * chord-reel.js: GENERATED by tools/build-chord-reel.mjs. Do not edit by hand.
 *
 * The Oh-a-Chord explainer's drawing code (showreel/kit.js and the scenes in
 * showreel/explainer.html, in the oh-a-chord repo), so the product page can
 * play its feature demos live in a <canvas>. Wrapped in one function: the
 * page sees window.OhChordReel only. Driven by js/chord-demos.js.
 */
`;
const out = banner + '(function () {\n' + score + '\n' + kit + '\n' + scenes + '\n' + extra + '\n})();\n';
writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${(out.length / 1024).toFixed(1)} KB) from ${REEL}`);
