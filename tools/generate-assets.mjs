#!/usr/bin/env node
/*
 * generate-assets.mjs — regenerates every raster asset the site ships:
 * OG images, favicon PNGs, and the labeled §8 media placeholders (correct
 * aspect ratio, at the real filenames, so real screenshots/footage can
 * replace them later without touching any layout).
 *
 * Dev tool only — never runs at page load. Needs a Chromium-family browser
 * for headless rendering (Edge, Chrome, or Chromium; auto-detected).
 *
 *   node tools/generate-assets.mjs
 */
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontsURL = pathToFileURL(join(root, 'assets', 'fonts')).href;
const work = join(tmpdir(), `oh-assets-${process.pid}`);

const BROWSERS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];
const browser = BROWSERS.find(existsSync);
if (!browser) {
  console.error('No Chromium-family browser found — install Chrome/Edge.');
  process.exit(1);
}

const FONTS = `
  @font-face { font-family: Archivo; src: url('${fontsURL}/Archivo-Variable.woff2') format('woff2');
    font-weight: 100 900; font-stretch: 62% 125%; }
  @font-face { font-family: Archivo; src: url('${fontsURL}/Archivo-Variable-Italic.woff2') format('woff2');
    font-weight: 100 900; font-stretch: 62% 125%; font-style: italic; }
  @font-face { font-family: 'Departure Mono'; src: url('${fontsURL}/DepartureMono-Regular.woff2') format('woff2'); }
  @font-face { font-family: 'IBM Plex Mono'; src: url('${fontsURL}/IBMPlexMono-Regular.woff2') format('woff2'); }
`;

const page = (w, h, body, extra = '') => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONTS}
* { margin: 0; box-sizing: border-box; }
html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
body { font-family: Archivo, Helvetica, sans-serif; }
.stripes { display: flex; gap: 6px; }
.stripes i { width: 14px; height: 40px; }
.stripes i:nth-child(1) { background: #c8413b; }
.stripes i:nth-child(2) { background: #e0a33b; }
.stripes i:nth-child(3) { background: #e6d06b; }
.stripes i:nth-child(4) { background: #4f9ed9; }
${extra}
</style></head><body>${body}</body></html>`;

/* ---------- OG cards (1200x630) ---------- */
const ogHome = page(1200, 630, `
  <div class="card">
    <div class="mark">Oh<span>!</span></div>
    <div class="line">A synth and a sample organizer,<br>built by one person for real records.</div>
    <div class="foot"><span class="sw s1"></span><span class="sw s2"></span>muna0001.github.io/Oh</div>
  </div>`, `
  .card { width: 100%; height: 100%; background: #141416; color: #ece5d5;
    padding: 70px 90px; display: flex; flex-direction: column; justify-content: space-between; }
  .mark { font-size: 290px; font-weight: 900; font-stretch: 125%; letter-spacing: -0.04em; line-height: 0.8; }
  .mark span { color: #ff5a3c; }
  .line { font-size: 44px; font-weight: 500; color: #b9b2a2; line-height: 1.3; }
  .foot { display: flex; align-items: center; gap: 16px; font-size: 26px; color: #6f6f76; }
  .sw { width: 26px; height: 26px; border-radius: 6px; display: inline-block; }
  .s1 { background: #c8413b; } .s2 { background: #4ade80; }`);

const ogSynth = page(1200, 630, `
  <div class="card">
    <div class="cheek left"></div><div class="cheek right"></div>
    <div class="inner">
      <div class="brand"><em>Oh a Synth</em><span class="stripes"><i></i><i></i><i></i><i></i></span></div>
      <div class="sub">POLYPHONIC SYNTHESIZER</div>
      <div class="line">A polysynth inspired by the 80s.<br>Play it in your browser. Free.</div>
    </div>
  </div>`, `
  .card { width: 100%; height: 100%; background: linear-gradient(#2e2e33, #2b2b30);
    color: #ece5d5; position: relative; }
  .cheek { position: absolute; top: 0; bottom: 0; width: 64px;
    background: linear-gradient(160deg, #5e3d27, #372315); }
  .cheek.left { left: 0; } .cheek.right { right: 0; }
  .inner { padding: 90px 140px; display: flex; flex-direction: column; height: 100%; }
  .brand { display: flex; align-items: center; gap: 30px; font-size: 110px; font-weight: 800; letter-spacing: -0.01em; }
  .sub { font-size: 30px; letter-spacing: 0.35em; color: #b9b2a2; margin-top: 18px; }
  .line { font-size: 46px; font-weight: 500; color: #ece5d5; margin-top: auto; max-width: 34ch; line-height: 1.25; }`);

const ogChord = page(1200, 630, `
  <div class="card">
    <div class="cheek left"></div><div class="cheek right"></div>
    <div class="inner">
      <div class="brand"><em>Oh a Chord</em><span class="stripes"><i></i><i></i><i></i><i></i></span></div>
      <div class="sub">IPAD CHORD INSTRUMENT</div>
      <div class="line">Press one key. Get a full chord.<br>Coming to the App Store.</div>
    </div>
  </div>`, `
  .card { width: 100%; height: 100%; background: linear-gradient(#2e2e33, #2b2b30);
    color: #ece5d5; position: relative; }
  .cheek { position: absolute; top: 0; bottom: 0; width: 64px;
    background: linear-gradient(160deg, #8a5a37, #4a2e19); }
  .cheek.left { left: 0; } .cheek.right { right: 0; }
  .inner { padding: 90px 140px; display: flex; flex-direction: column; height: 100%; }
  .brand { display: flex; align-items: center; gap: 30px; font-size: 100px; font-weight: 800; letter-spacing: -0.01em; }
  .sub { font-size: 30px; letter-spacing: 0.35em; color: #b9b2a2; margin-top: 18px; }
  .line { font-size: 46px; font-weight: 500; color: #ece5d5; margin-top: auto; max-width: 34ch; line-height: 1.25; }`);

const ogComber = page(1200, 630, `
  <div class="card">
    <div class="brand">OH A COMBER</div>
    <div class="sub">— sample organizer</div>
    <div class="line">&gt; Your sample library, finally searchable._</div>
  </div>`, `
  .card { width: 100%; height: 100%; background: #0a0f0d; color: #e2e8e5;
    padding: 90px 100px; display: flex; flex-direction: column;
    border: 24px solid #111916; position: relative; }
  .card::after { content: ""; position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(to bottom, rgba(74,222,128,0.05) 0 2px, transparent 2px 5px); }
  .brand { font-family: 'Departure Mono', monospace; font-size: 96px; color: #4ade80;
    text-shadow: 0 0 40px rgba(74,222,128,0.35); letter-spacing: 0.02em; }
  .sub { font-family: 'IBM Plex Mono', monospace; font-size: 34px; color: #7a8a82; margin-top: 10px; }
  .line { font-family: 'IBM Plex Mono', monospace; font-size: 42px; color: #e2e8e5;
    margin-top: auto; }`);

const ogAbout = page(1200, 630, `
  <div class="card">
    <div class="mark">Oh<span>!</span></div>
    <div class="who">Nate Mueller</div>
    <div class="line">Designer, developer, music lover.<br>Builds Oh a Synth and Oh a Comber. Records as Oacoma.</div>
  </div>`, `
  .card { width: 100%; height: 100%; background: #141416; color: #ece5d5;
    padding: 80px 90px; display: flex; flex-direction: column; }
  .mark { font-size: 120px; font-weight: 900; font-stretch: 125%; letter-spacing: -0.04em; }
  .mark span { color: #ff5a3c; }
  .who { font-size: 76px; font-weight: 800; margin-top: auto; }
  .line { font-size: 38px; color: #b9b2a2; line-height: 1.35; margin-top: 20px; }`);

/* ---------- labeled media placeholders ---------- */
function placeholder(w, h, world, title, detail, file) {
  const worlds = {
    synth: `
      .ph { background: linear-gradient(#2e2e33, #2b2b30); color: #ece5d5; border: 2px solid #1a1a1d; }
      .ph .tag { color: #b9b2a2; } .ph .file { color: #8a8270; }
      .ph .rule { background: linear-gradient(to right, #c8413b, #e0a33b, #e6d06b, #4f9ed9); }`,
    comber: `
      .ph { background: #0a0f0d; color: #e2e8e5; border: 2px solid #1e2e27;
        font-family: 'IBM Plex Mono', monospace; }
      .ph .title { font-family: 'Departure Mono', monospace; color: #4ade80; }
      .ph .tag { color: #7a8a82; } .ph .file { color: #166534; }
      .ph .rule { background: #166534; }`,
    chord: `
      .ph { background: linear-gradient(#2e2e33, #2b2b30); color: #ece5d5; border: 2px solid #1a1a1d; }
      .ph .tag { color: #b9b2a2; } .ph .file { color: #8a8270; }
      .ph .rule { background: linear-gradient(to right, #8a5a37, #e0a33b, #4f9ed9, #c8413b); }`,
    home: `
      .ph { background: #232327; color: #ece5d5; border: 2px solid #1a1a1d; }
      .ph .tag { color: #b9b2a2; } .ph .file { color: #6f6f76; }
      .ph .rule { background: #ff5a3c; }`,
  };
  return page(w, h, `
    <div class="ph">
      <div class="tag">PLACEHOLDER — DROP REAL MEDIA AT THIS PATH</div>
      <div class="mid">
        <div class="rule"></div>
        <div class="title">${title}</div>
        <div class="detail">${detail}</div>
      </div>
      <div class="file">${file}</div>
    </div>`, `
    .ph { width: 100%; height: 100%; padding: ${Math.round(h * 0.06)}px;
      display: flex; flex-direction: column; justify-content: space-between; }
    .tag { font-size: ${Math.round(h * 0.026)}px; letter-spacing: 0.25em; }
    .rule { width: ${Math.round(w * 0.09)}px; height: 8px; margin-bottom: ${Math.round(h * 0.035)}px; }
    .title { font-size: ${Math.round(h * 0.075)}px; font-weight: 800; }
    .detail { font-size: ${Math.round(h * 0.038)}px; margin-top: ${Math.round(h * 0.02)}px;
      opacity: 0.75; max-width: 34ch; line-height: 1.4; }
    .file { font-size: ${Math.round(h * 0.028)}px; }
    ${worlds[world]}`);
}

/* ---------- favicons ---------- */
const favicon = (px) => page(px, px, `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}">
    <rect width="64" height="64" rx="14" fill="#232327"/>
    <rect x="26" y="10" width="12" height="30" rx="6" fill="#ece5d5"/>
    <circle cx="32" cy="50" r="7" fill="#ff5a3c"/>
  </svg>`, 'body { background: transparent; }');

const ASSETS = [
  { out: 'assets/img/og-home.png', w: 1200, h: 630, html: ogHome },
  { out: 'assets/img/og-synth.png', w: 1200, h: 630, html: ogSynth },
  { out: 'assets/img/og-chord.png', w: 1200, h: 630, html: ogChord },
  { out: 'assets/img/og-comber.png', w: 1200, h: 630, html: ogComber },
  { out: 'assets/img/og-about.png', w: 1200, h: 630, html: ogAbout },
  { out: 'assets/img/favicon-32.png', w: 32, h: 32, html: favicon(32) },
  { out: 'assets/img/apple-touch-icon.png', w: 180, h: 180, html: favicon(180) },

  { out: 'assets/img/synth-hero.png', w: 1280, h: 800, html: placeholder(1280, 800, 'synth', 'Oh a Synth — full panel', 'Native app at boot: STRINGS 1 loaded, CHORUS I lit, wood cheeks in frame.', 'assets/img/synth-hero.png') },
  { out: 'assets/img/synth-ui-dco.png', w: 1280, h: 800, html: placeholder(1280, 800, 'synth', 'DCO section, close crop', 'PWM SRC set to LFO, SUB raised.', 'assets/img/synth-ui-dco.png') },
  { out: 'assets/img/synth-ui-vcf.png', w: 1280, h: 800, html: placeholder(1280, 800, 'synth', 'HPF + VCF sections', 'RES high — self-oscillation state.', 'assets/img/synth-ui-vcf.png') },
  { out: 'assets/img/synth-ui-chorus.png', w: 1280, h: 800, html: placeholder(1280, 800, 'synth', 'CHORUS buttons', 'Button I engaged, LED lit.', 'assets/img/synth-ui-chorus.png') },
  { out: 'assets/img/synth-ui-patches.png', w: 1280, h: 800, html: placeholder(1280, 800, 'synth', 'Patch menu open', 'FAVOURITES / FACTORY / USER sections visible.', 'assets/img/synth-ui-patches.png') },
  { out: 'assets/img/synth-ui-bender.png', w: 1280, h: 800, html: placeholder(1280, 800, 'synth', 'BENDER mid-throw', 'Keys held, LFO TRIG + DCO/VCF minis beside the lever.', 'assets/img/synth-ui-bender.png') },
  { out: 'assets/img/poster-synth-daw.png', w: 1280, h: 720, html: placeholder(1280, 720, 'synth', 'Poster: plugin in a DAW', '15 s silent loop — arp synced, a knob turning.', 'assets/video/synth-daw.mp4 / .webm') },
  { out: 'assets/img/poster-synth-track.png', w: 1280, h: 720, html: placeholder(1280, 720, 'synth', 'Poster: 30 s demo track', 'A musical bed using only Oh a Synth, captions burned in.', 'assets/video/synth-in-a-track.mp4 / .webm') },

  { out: 'assets/img/chord-hero.png', w: 1280, h: 800, html: placeholder(1280, 800, 'chord', 'Oh a Chord — full panel', 'Chord Type + Modifiers on the left, single-octave keyboard on the right, wood cheeks at each edge.', 'assets/img/chord-hero.png') },
  { out: 'assets/img/chord-ui-types.png', w: 1280, h: 800, html: placeholder(1280, 800, 'chord', 'Chord Type + Modifiers', 'MAJ lit, a Modifier held down.', 'assets/img/chord-ui-types.png') },
  { out: 'assets/img/chord-ui-key.png', w: 1280, h: 800, html: placeholder(1280, 800, 'chord', 'Key Mode engaged', 'KEY button reading "key: e", diatonic dots lit on the keyboard.', 'assets/img/chord-ui-key.png') },
  { out: 'assets/img/chord-ui-perform.png', w: 1280, h: 800, html: placeholder(1280, 800, 'chord', 'Performance row', 'Strum, Harp, Arp toggles — Arp lit reading "arp up/dn".', 'assets/img/chord-ui-perform.png') },
  { out: 'assets/img/chord-ui-editor.png', w: 1280, h: 800, html: placeholder(1280, 800, 'chord', 'Settings drawer open', 'MAIN, LFO, DCO, HPF, VCF sections, sliding down over the keyboard.', 'assets/img/chord-ui-editor.png') },
  { out: 'assets/img/chord-ui-presets.png', w: 1280, h: 800, html: placeholder(1280, 800, 'chord', 'Save-preset prompt', 'Name field over the drawer, lit save icon beside the close button.', 'assets/img/chord-ui-presets.png') },

  { out: 'assets/img/comber-before.png', w: 1400, h: 900, html: placeholder(1400, 900, 'comber', 'BEFORE: raw pack folders', 'A file browser deep in nested sample-pack folders.', 'assets/img/comber-before.png') },
  { out: 'assets/img/comber-after.png', w: 1400, h: 900, html: placeholder(1400, 900, 'comber', 'AFTER: the library', 'Same samples scanned — type badges, filters, waveform player.', 'assets/img/comber-after.png') },
  { out: 'assets/img/comber-ui-types.png', w: 1400, h: 900, html: placeholder(1400, 900, 'comber', 'Type chips + badges', 'Sidebar Type filters with live counts, several active.', 'assets/img/comber-ui-types.png') },
  { out: 'assets/img/comber-ui-search.png', w: 1400, h: 900, html: placeholder(1400, 900, 'comber', 'Stacked filters', 'Search + Type + BPM Range narrowing the list.', 'assets/img/comber-ui-search.png') },
  { out: 'assets/img/comber-ui-player.png', w: 1400, h: 900, html: placeholder(1400, 900, 'comber', 'Player bar mid-preview', 'Green waveform, elapsed time, sample playing.', 'assets/img/comber-ui-player.png') },
  { out: 'assets/img/comber-ui-instruments.png', w: 1400, h: 900, html: placeholder(1400, 900, 'comber', 'DRUM PAD tab', 'Pads loaded, one mid-flash.', 'assets/img/comber-ui-instruments.png') },
  { out: 'assets/img/poster-comber-organize.png', w: 1280, h: 720, html: placeholder(1280, 720, 'comber', 'Poster: 30 s primary demo', 'A chaotic sample folder becoming searchable and sorted by type.', 'assets/video/comber-organize.mp4 / .webm') },
  { out: 'assets/img/poster-comber-drag.png', w: 1280, h: 720, html: placeholder(1280, 720, 'comber', 'Poster: drag to DAW', '10 s silent loop — search, preview, drag onto a track.', 'assets/video/comber-drag-to-daw.mp4 / .webm') },
];

await mkdir(work, { recursive: true });
for (const a of ASSETS) {
  const src = join(work, a.out.replaceAll('/', '_') + '.html');
  await writeFile(src, a.html);
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--allow-file-access-from-files', '--default-background-color=00000000',
    `--screenshot=${join(root, a.out)}`,
    `--window-size=${a.w},${a.h}`,
    pathToFileURL(src).href,
  ], { stdio: 'ignore' });
  console.log(`${a.out} (${a.w}x${a.h})`);
}

/* ---------- placeholder video clips ----------------------------------------
   1.5 s still-frame clips rendered from the poster PNGs, at the exact
   §8 filenames, so every <source> on the site resolves from day one.
   Real footage replaces these files 1:1. Uses the browser's MediaRecorder
   (canvas capture): H.264 MP4 + WebM, both supported by Chromium/Edge.   */
const VIDEOS = [
  { base: 'synth-daw', poster: 'assets/img/poster-synth-daw.png' },
  { base: 'synth-in-a-track', poster: 'assets/img/poster-synth-track.png' },
  { base: 'comber-organize', poster: 'assets/img/poster-comber-organize.png' },
  { base: 'comber-drag-to-daw', poster: 'assets/img/poster-comber-drag.png' },
];
const MIMES = [
  { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
  { mime: 'video/webm', ext: 'webm' },
];

const { createServer } = await import('node:http');
const saved = new Map();
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'POST') {
    const name = new URL(req.url, 'http://x').searchParams.get('name');
    const chunks = [];
    for await (const c of req) chunks.push(c);
    saved.set(name, Buffer.concat(chunks));
    res.end('ok');
    return;
  }
  res.statusCode = 404; res.end();
});
await new Promise((ok) => server.listen(8438, ok));

const recorderPage = (posterURL, name, mime) => `<!DOCTYPE html><html><body><script>
(async () => {
  const img = new Image();
  img.src = ${JSON.stringify(posterURL)};
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const rec = new MediaRecorder(canvas.captureStream(10),
    { mimeType: ${JSON.stringify(mime)}, videoBitsPerSecond: 400000 });
  const chunks = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = () => fetch('http://localhost:8438/?name=${name}',
    { method: 'POST', body: new Blob(chunks) });
  rec.start();
  const iv = setInterval(() => ctx.drawImage(img, 0, 0), 100);
  setTimeout(() => { clearInterval(iv); rec.stop(); }, 1500);
})();
<\/script></body></html>`;

const { execFile } = await import('node:child_process');
for (const v of VIDEOS) {
  for (const m of MIMES) {
    const name = `${v.base}.${m.ext}`;
    const posterURL = pathToFileURL(join(root, v.poster)).href;
    const src = join(work, `rec-${name}.html`);
    await writeFile(src, recorderPage(posterURL, name, m.mime));
    const child = execFile(browser, [
      '--headless=new', '--disable-gpu', '--allow-file-access-from-files',
      '--mute-audio', pathToFileURL(src).href,
    ], () => {});
    const t0 = Date.now();
    while (!saved.has(name) && Date.now() - t0 < 20000) {
      await new Promise((ok) => setTimeout(ok, 250));
    }
    child.kill();
    if (saved.has(name)) {
      await writeFile(join(root, 'assets', 'video', name), saved.get(name));
      console.log(`assets/video/${name} (${saved.get(name).length} bytes)`);
    } else {
      console.warn(`FAILED assets/video/${name}`);
    }
  }
}
server.close();

await rm(work, { recursive: true, force: true });
console.log('assets generated');
