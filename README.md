# Oh! — product site

Static marketing site for the **Oh!** software line: **Oh a Synth** (a
polysynth inspired by the 80s, playable in the browser) and **Oh a Comber**
(a sample library organizer). Four pages, no build step, no framework, no
bundler.

> **Copy rule:** the site never names the hardware the synth draws on. It is
> positioned as *a polysynth inspired by the classic sounds of the 80s* —
> never as an emulation of a named instrument. Keep it that way when editing
> `content/oh-a-synth.json` — see NOTES-source-analysis.md §1.6.

```
index.html          Home
oh-a-synth.html     Product: the synth
oh-a-comber.html    Product: the sample organizer
about.html          Nate + Oacoma
```

## Run it locally

```sh
python3 -m http.server 8437
```

Open <http://localhost:8437>. Any static server works; there is nothing to
compile. The site also works served from a subdirectory (all paths are
relative).

## How content editing works

**All copy lives in `/content/*.json`. Edit a JSON file, run the sync
script, commit. That's the whole workflow.**

```sh
# after editing any content/*.json:
node tools/sync-content.mjs --write
```

Why the sync step exists: every piece of copy also sits *statically* in the
HTML shells (so search engines, social scrapers, and JS-off visitors get
real content, and there's no flash of content swapping). The shells are
generated *from* the JSON by `tools/sync-content.mjs` — you never edit copy
in the HTML by hand. At runtime, `js/render.js` re-applies the same JSON to
the same slots, which is what makes a plain JSON edit show up even if you
forget to run the sync (for everyone with JavaScript, i.e. almost everyone).
Run without `--write` to *check* for drift (useful in CI or a pre-commit
hook); it exits 1 and names the stale files.

The script also stamps, from `content/site.json`:

- the nav in every shell (`nav` array),
- `<title>`, meta description, canonical, and OG/Twitter tags (each page's
  `meta` block),
- `sitemap.xml`.

What lives where:

| File | Contents |
|---|---|
| `content/site.json` | site URL, nav, contact email, forms + analytics config, footer |
| `content/home.json` | home hero, both product blocks, maker note |
| `content/oh-a-synth.json` | synth page: hero, features, demo, offer, specs, FAQ |
| `content/oh-a-comber.json` | comber page: hero, features, demo, waitlist, specs, FAQ |
| `content/about.json` | about intro, Oacoma section, contact |
| `content/music.json` | Oacoma: YouTube video id, albums + streaming links |

Fields that hold markdown (`intro.body`, `oacoma.body`) render through the
vendored `js/vendor/marked.esm.js` — same renderer in the browser and in
the sync script, so output is identical.

### Slot reference (for template edits)

- `data-slot="path.to.field"` — plain text
- `data-slot-md="path"` — markdown → HTML
- `data-slot-attr="href:path, alt:other.path"` — attribute values
  (only applied when the value is a non-empty string)
- `data-slot-showif="path"` — element hidden until the value is non-empty
- Array items use numeric segments: `features.2.label`, `faq.items.0.q`

## Adding a future Oh! product

1. Copy an existing product shell (e.g. `oh-a-synth.html`) to
   `oh-a-thing.html`; set `<html data-page="oh-a-thing">` and update the
   JSON-LD block.
2. Create `content/oh-a-thing.json` with the same shape (`meta`, `hero`,
   `features`, `specs`, `faq`, …).
3. Add one entry to the `nav` array in `content/site.json`.
4. `node tools/sync-content.mjs --write` (stamps nav everywhere, fills the
   new shell, regenerates the sitemap).

`js/render.js` needs no changes — it reads the page name from `data-page`.

## Forms (waitlist / notify-me)

No backend. `content/site.json` holds:

```json
"forms": { "provider": "", "endpoint": "", "fallbackMailto": "muna0001@gmail.com" }
```

- **`endpoint` empty (as shipped):** the forms stay hidden and each capture
  block shows a pre-filled `mailto:` link instead — nothing can be
  submitted into a void.
- **To go live:** create a Formspree/Tally form (anything that accepts a
  POST of form data and returns 2xx with `Accept: application/json`), paste
  its URL into `endpoint`, done. The email field posts as `email`, plus a
  hidden `list` field (`synth-notify` / `comber-waitlist`) so one endpoint
  can serve both lists.

`js/forms.js` handles and styles all states: empty, invalid email,
submitting, success, error (with the mailto as recovery path).

## Analytics

`content/site.json`:

```json
"analytics": { "provider": "goatcounter", "siteId": "" }
```

Empty `siteId` (as shipped) = **no tracker loads, no request leaves the
page**. To enable: create a GoatCounter account (cookieless, no consent
banner needed) and set `siteId` to your GoatCounter code.

## Dropping in real media

Every media slot already ships as a labeled placeholder PNG at the **final
filename and aspect ratio** — replace the file, keep the name, and the
layout doesn't change:

| Drop this file | What it is |
|---|---|
| `assets/video/synth-in-a-track.mp4` + `.webm` | 30 s musical demo, the synth page's main video |
| `assets/video/synth-daw.mp4` + `.webm` | 15 s silent loop, plugin in a DAW |
| `assets/img/synth-hero.png` | native app panel, STRINGS 1 + CHORUS I |
| `assets/img/synth-ui-{dco,vcf,chorus,patches,bender}.png` | feature-section screenshots |
| `assets/img/poster-synth-{track,daw}.png` | poster frames for the two videos |
| `assets/video/comber-organize.mp4` + `.webm` | 30 s primary Comber demo |
| `assets/video/comber-drag-to-daw.mp4` + `.webm` | 10 s silent drag-to-DAW loop |
| `assets/img/comber-{before,after}.png` | the before/after pair above the fold |
| `assets/img/comber-ui-{types,search,player,instruments}.png` | feature screenshots |
| `assets/img/poster-comber-{organize,drag}.png` | poster frames |

Videos: MP4 + WebM, captions burned in, no audio needed for the silent
loops. They lazy-start on scroll, show a pause control, and fall back to
poster + native controls under reduced motion or with JS off.

To regenerate the placeholder/OG/favicon PNGs (requires Chrome or Edge
installed): `node tools/generate-assets.mjs`.

## Changing the deploy URL

Set `siteUrl` in `content/site.json`, then
`node tools/sync-content.mjs --write` — canonicals, OG URLs, sitemap, all
updated. Also update the URL in `robots.txt` (one line) and the JSON-LD
blocks in the shells if the domain changes.

## The interactive layers

Everything below is **enhancement**. Each page is complete, readable, and
convertible without any of it — with JavaScript off, with WebGL
unavailable, or with `prefers-reduced-motion: reduce`.

### The playable synth (`js/synth/`)

The instrument on the Oh a Synth page runs the **real engine from the app**.
`js/synth/vendor/` holds `worklet.js`, `engine.js`, and `presets.js` copied
byte-for-byte from the Ohasynth repo's `js/engine/`; `js/synth/engine.js`
wraps them in an ES module and adds site policy (analyser for the meter,
suspend when hidden or scrolled away). **To update the sound, re-copy those
three files — never edit them here.**

- `engine.js` — module wrapper, output metering, audio lifecycle
- `presets.js` — re-exports the 8 factory patches + a demo phrase per patch
- `keyboard.js` — pointer, computer keys (`awsedftgyhujk`, `z`/`x` octave),
  and Web MIDI; full keyboard operation with arrow keys and Space/Enter
- `ui.js` — the panel: patch stepper, DEMO cycle, VCF FREQ/RES/ENV, CHORUS

Audio rules it holds to: the `AudioContext` is created only inside a user
gesture; the page is silent until the visitor powers it on *or* plays a
key; the context suspends when the tab is hidden or the hero scrolls out of
view; output runs through the engine's own `tanh` limiter plus a 0.85 gain;
voices are capped at 6 by the engine with proper stealing.

Only 4 controls are exposed on purpose — this is a taste demo, not the
product. To change which ones, edit the `section(...)` calls in `ui.js`;
any parameter id from `Oha.PARAMS` works.

### WebGL scenes (`js/gl/`)

- `core.js` — shared runner for the fragment-shader scenes. Pauses on tab
  hide and when the canvas leaves the viewport (IntersectionObserver, never
  scroll events), renders a single static frame under reduced motion, and
  returns `null` if WebGL is missing so callers keep their CSS fallback.
- `cabinet.js` — the synth's panel, walnut cheeks, and a pointer-tracked
  specular sheen that warms with the synth's real output level.
- `crt.js` — the Comber's phosphor grille, bloom, drift, and grain.
- `wordmark.js` — the extruded "Oh!" exclamation point (Three.js).

**Three.js is lazy-loaded.** It is ~1.3 MB, far more than the whole rest of
the site, so `wordmark.js` waits for browser idle and only then dynamically
imports it. Until it lands (and forever, without WebGL), the CSS "!" is
what you see. Nothing about the layout shifts either way.

**What the CRT deliberately does not do:** the brief asked for the whole
page to be rendered through a barrel-distorted CRT shader. That was built
and cut — warping live DOM text destroys legibility at 13–16 px. The effect
is now an overlay on the hero screen and framed panels, so the text under
it stays sharp, selectable, and searchable. Casualties: barrel distortion
of the text itself (the bezel's inner shadow suggests the curve instead)
and per-glyph chromatic aberration. Legibility won.

### Cursors and motion

`js/cursor.js` swaps in a crosshair (synth) or blinking block caret with a
phosphor trail (Comber). It only engages when `(pointer: fine)` matches and
reduced motion is off, and it never touches focus rings. `js/boot.js` runs
the Comber's typed boot sequence once per session (sessionStorage), skippable
by any click or keypress, with a hard timeout so it can never strand the page.

`prefers-reduced-motion: reduce` is honored in one pass: CSS animations and
transitions are neutered in `base.css`, all rAF loops render one frame and
idle, the boot sequence and custom cursors are disabled, videos stop
autoplaying and keep their poster plus native controls.

## Fonts & licenses

Self-hosted woff2 in `assets/fonts/`: Archivo (variable, OFL), IBM Plex
Mono (OFL), Departure Mono (OFL, © Helena Zhang). See
`assets/fonts/FONTS-LICENSES.txt`. `js/vendor/marked.esm.js` is marked
v12 (MIT); `vendor/three/three.module.js` is Three.js r170 (MIT).

The App Store badge (`assets/img/app-store-badge.svg`) is Apple's official
artwork, downloaded from Apple's App Store Marketing Tools and self-hosted.
It is used unmodified per Apple's marketing guidelines — only its display
size changes, proportionally, at 48px tall (Apple's floor is 40px) with
clear space around it. See `assets/img/APP-STORE-BADGE-README.txt` for the
source URL and how to swap the white variant or another locale in. Apple,
the Apple logo and the App Store badge are trademarks of Apple Inc.

The store link itself lives in `content/site.json` under `appStore.chord`
(`url` plus `label`, which is the badge's alt text) — one edit point for
every badge on the site.

Nothing is fetched from a third-party origin at runtime except, when you
configure them, the analytics tracker and the YouTube embed — and the
YouTube player only loads after the visitor clicks the play facade.

## Checks before you ship

```bash
node tools/sync-content.mjs
```

Exits non-zero if any shell has drifted from its content JSON. Worth
running before every commit; it is the only thing that can silently rot.

Everything else is verified by looking at it: serve the site, and check
the four pages at 375 px wide, with the keyboard only, and with
`prefers-reduced-motion` on in your OS settings.
