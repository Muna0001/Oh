# NOTES — Source analysis for the Oh! product site

Everything below was extracted from the two application repos and adversarially
verified against the source (7-agent extraction + verification pass, plus
first-hand reads of every load-bearing file). Every hex value, label, and
feature claim cites where it lives in the code. **Nothing on the site may claim
more than what is recorded here.**

- Oh a Synth — `/Users/natemueller/Documents/GitHub/ohahsynth` (in-app spelling: **Oh-a-synth**)
- Oh a Comber — `/Users/natemueller/Documents/GitHub/SampleOrganizer` (in-app spelling: **OH A COMBER / Oh a comber**)

---

## 1. Oh a Synth

### 1.1 What it is (verified)

A **6-voice emulation of the Roland Juno-106** (README.md:3), shipped as three
parts sharing one DSP design:

1. **Web app** — vanilla JS, zero build, runs from `file://` or any static
   server; hosted at https://muna0001.github.io/Ohasynth/. The entire signal
   path runs per-sample inside one AudioWorklet processor.
2. **Standalone Mac app** — JUCE 8.0.6, installs to `/Applications/Oh-a-synth.app`.
3. **DAW plugin** — **AU + VST3 only** (`FORMATS AU VST3 Standalone`,
   plugin/CMakeLists.txt:28). **No AAX, no VST2, no Windows or Linux targets
   configured anywhere.** macOS 11.0+ universal binary (arm64 + x86_64).

The JS worklet and the C++ `OhaDSP.h` are deliberate line-for-line equivalents
(README "Keeping the two DSP cores in sync"). Builds are **ad-hoc signed, not
notarized** — README.md:154-157: "Proper distribution needs an Apple Developer
ID." (This grounds the site's "shipping status" line.)

### 1.2 Design tokens as built

Web palette — `css/ohasynth.css:3-16`, mirrored exactly by the plugin's
`col::` namespace (PluginEditor.h:11-21):

| Token | Value | Paints |
|---|---|---|
| `--panel` | `#2b2b30` | main charcoal panel body |
| `--panel-2` | `#232327` | section bodies, recessed chrome |
| `--panel-edge` | `#1a1a1d` | 1px borders around the three big bars |
| `--cream` | `#ece5d5` | legends, section titles, fader indicator line |
| `--cream-dim` | `#b9b2a2` | dimmed labels, sub-brand, off-state text |
| `--red` | `#c8413b` | stripe 1; MAIN + VCF section accents; audio-hint toast |
| `--orange` | `#e0a33b` | stripe 2; DCO + ENV accents |
| `--yellow` | `#e6d06b` | stripe 3 (stripes only) |
| `--blue` | `#4f9ed9` | stripe 4; ARPEGGIO + LFO + VCA accents |
| `--green` | `#9bba5e` | HPF + CHORUS accents; MIDI-ok status; EXT clock readout |
| `--led` | `#ff5a3c` | lit LEDs + their glow (`box-shadow: 0 0 8px`) |
| LED off | `#4a1410` | unlit LED dot |
| page bg | `#141416` | html/body behind the instrument |

Supporting values: header gradient `#323237→#2a2a2e`; panel gradient
`#2e2e33→#2b2b30`; bottom bar `#2b2b30→#242428`; recessed fills `#1d1d20`;
inset borders `#0f0f11`; slider groove `#0a0a0b`; slider value fill `#585860`;
fader/button borders `#101012`; toggled fill `#3d3d45` + inset ring `#55555e`;
section borders `#38383e`; control borders `#46464c`; keyboard well `#0d0d0f`;
white keys `#f4efe2→#e7e0cd` bordered `#b6ae99` (held `#d8d2bf→#c9c2ac`);
black keys `#3a3a3e→#141416` (held `#5a5a60→#2c2c30`); key labels `#8a8270`.

**Wood exists only in the plugin editor** (PluginEditor.cpp:879-922,
`drawWoodCheek`): 34px walnut end cheeks, diagonal gradient
**`0xff5e3d27 → 0xff372315`**, grain = 26 seeded quadratic black strokes at
alpha 0.05-0.15, inner bevel highlight `0x33ffffff`; two 10px Phillips screws
per cheek, gradient `0xff8d8d94 → 0xff3c3c41`, cross slots `#232327`. The web
UI has **no** wood — hero screenshots showing cheeks must come from the
native app/plugin.

Surfaces are pure CSS (gradients + 1px borders + inset shadows) — no textures,
no images. Font: `"Helvetica Neue", Helvetica, Arial, sans-serif`, nothing
bundled. Corner radii: 8px outer bars, 6px sections, 4px buttons, 3px small
controls, 2px fader caps. Icon (`assets/icon.png`, wired via `ICON_BIG` in
CMakeLists.txt:20): cream "Oh!" wordmark, a red dot plus five colored dashes,
cream-and-black keybed on a charcoal rounded square.

### 1.3 UI vernacular (use these words on the site)

- A sound is a **patch** — never "preset" in UI (`PATCHES` combo placeholder,
  "New Patch", "Save Patch…", `PATCH NAME` field). Categories: **Factory /
  User** (web), **FAVOURITES / FACTORY / USER** (plugin).
- **Favourites** — British spelling, ♥ glyph ("Add to Favourites ♥"). Native
  builds only; the web app has no favourites.
- Panel sections, in order: **ARPEGGIO** (blue), **MAIN** (red), **LFO**
  (blue), **DCO** (orange), **HPF** (green), **VCF** (red), **VCA** (blue),
  **ENV** (orange), **CHORUS** (green).
- Controls: RANGE `16' / 8' / 4'`; `⊓ PULSE` / `⊿ SAW`; **PWM SRC** `MAN/LFO`;
  **SUB**, **NOISE**; HPF switch labeled **FREQ** `0/1/2/3`; VCF **FREQ, RES,
  ENV POL ↑/↓, ENV, LFO, KYBD**; VCA **MODE** `ENV/GATE`, **LEVEL**; ENV
  **A D S R**; CHORUS buttons **I** and **II** (both = I+II); MAIN **VOLUME,
  VEL**; ARPEGGIO **ON, HOLD, MODE (UP / UP&DN / DOWN), RANGE (1/2/3), RATE,
  SYNC, BPM**, external tempo readout `EXT <bpm>`.
- **BENDER** — spring-back lever (not a wheel) with **DCO** and **VCF** mini
  depth sliders and momentary **LFO TRIG** button.
- Wordmark: *Oh-a-synth* (italic, 800) + 4 stripes + `POLYPHONIC SYNTHESIZER`
  (letterspaced 0.25em). Patch file extension: **`.ohasynth.json`**.
- Keyboard help text: `Z / X : octave · A W S E D F T G Y H U J … : play`.

### 1.4 Engine architecture (for the playable browser synth, §6)

**Signal path per voice** (worklet.js:9-14, verified in code):
DCO (polyBLEP saw + pulse w/ PWM + square sub −1 oct + shared noise)
→ 4-position HPF → 24 dB/oct ZDF ladder VCF (tanh-bounded, self-oscillating)
→ VCA (env or gate). Global: one triangle LFO with delay/fade-in, one shared
ADSR bank, BBD chorus on the summed output, then
`tanh(out × volume × 1.6)` soft-clip and a 12 Hz DC blocker per channel.
**The tanh stage is the limiter — it's already in the engine.**

- **Voices:** 6 (`NUM_VOICES = 6`). Allocation: same note → free voice →
  oldest releasing → steal oldest. Per-voice component tolerances on VCF
  cutoff (`V_FC_OFF`) and VCA gain (`V_VCA_OFF`); DCO pitch never drifts
  ("that is the Juno character").
- **DCO:** mix = `saw*0.5 + pulse*0.5 + sub*0.6 + noise*0.55`; PW 50%→~6%
  (floor 0.05); pitch = `261.625565 × 2^((note−60)/12) × rangeMult`.
- **HPF:** pos 0 = 150 Hz low-shelf **boost** (+0.55), 1 = flat, 2 = 245 Hz
  HP, 3 = 520 Hz HP. Plugin labels: "0 (Boost)", "1 (Flat)", "2", "3".
- **VCF:** ZDF 4-pole ladder; cutoff 20 Hz–22 kHz log (clamped 8 Hz–0.45·fs);
  k = res×4.6, self-osc ≥ ~res 0.87; env→cutoff up to 9 octaves (polarity
  switch); LFO→cutoff ±3 oct; bend→cutoff ±3 oct; key follow up to 1.05
  oct/oct centered on MIDI 60.
- **ENV:** one ADSR, RC exponential; attack targets 1.28 and knees at 1.0
  ("snappy analog knee"); A raw 1.5 ms–3.2 s, D/R raw 2.5 ms–10 s; retriggers
  from current level. GATE mode = 2.5 ms smoothed gate.
- **LFO:** triangle 0.1–30 Hz; delay 0–2.5 s + fade; restarts when all keys
  released; LFO TRIG forces full depth; mod wheel adds vibrato (+0.4 depth).
- **Chorus** (the only audio effect — **no delay, no reverb**): one 25 ms
  delay line, two antiphase taps, 4-point Hermite; wet path 9 kHz LP + 60 Hz
  AC-coupling. Modes: I = 0.513 Hz "slow & lush", II = 0.863 Hz, I+II =
  9.75 Hz "fast shallow warble" (MN3009-referenced constants).
- **Arpeggiator:** UP / UP&DN (endpoints not repeated: 1-2-3-2) / DOWN;
  range 1–3 oct; free 0.5–20 Hz or synced to 12 divisions
  `1/1, 1/2., 1/2, 1/4., 1/4, 1/8., 1/8, 1/16., 1/16, 1/32., 1/32, 1/64`;
  HOLD latch; 50% gate. Tempo priority: DAW transport (plugin only) → MIDI
  beat clock (24 ppqn, drift-corrected, ~0.5 s dropout fallback) → BPM field
  (40–300).
- **MIDI (web):** notes + velocity, 14-bit bend, CC1 mod, CC64 sustain
  (handled in `engine.js`, not the worklet), CC120/123 all-off, clock
  0xF8/0xFA/0xFB/0xFC. All inputs, all channels, no sysex. Chrome/Edge/
  Firefox; **Safari has no Web MIDI**. Status element doubles as re-scan
  button with specific error strings.
- **Velocity:** real Juno-106 ignores velocity; here VEL maps it gently to
  VCA level (`gain = 1 − velSens×(1 − vel^1.4)`), 0 = authentic.
- **Presets (8, identical web + plugin):** STRINGS 1 (boot patch), PWM PAD,
  FAT BASS, BRASS 1, CHORUS PLUCK, LESLIE ORGAN, RES SWEEP PAD, SOFT KEYS.
  LESLIE ORGAN uses chorus mode 3 = I+II (presets.js:73 `chorus: 3`) — the
  9.75 Hz warble is its rotary-speaker impression.
- **Keyboard span:** on-screen keybed covers MIDI 24–96 = C1..C7, six
  octaves, 43 white keys (keyboard.js LOW=24/HIGH=96; plugin
  `setAvailableRange(24, 96)`, PluginEditor.cpp:636-650).
- **Parameter smoothing:** continuous (slider) params run through a
  per-sample one-pole Smoother bank inside the worklet (worklet.js:187-203);
  the app's own README claims "parameter changes are smoothed
  sample-accurately (no zipper noise)" (README.md:107-109). Switch/enum
  params are not smoothed — say "slider moves", not "every parameter".
- **Params:** all normalized 0..1 or small enums except `arpBpm` (40–300).
  Full schema in `engine.js:20-59` (`Oha.PARAMS`), matching the plugin APVTS.

**Reusability for the site:** `js/engine/{worklet,engine,presets}.js` are
plain-script IIFEs writing to `window.Oha` (NOT ES modules), dependency-free,
~1100 lines total. `Oha.Engine` is explicitly headless ("can be reused without
any DOM"). Worklet loads via blob URL → data URL → main-thread
ScriptProcessor fallback, so it works everywhere including `file://`. The
engine node connects **directly** to `ctx.destination`; volume/limiting live
inside the worklet. All params travel as port messages (no AudioParams).
Plan: vendor the three files unmodified + a ~10-line ES-module shim
(`import './worklet.js'`-for-side-effects pattern or explicit global read).
`start()` must be called from a user gesture; safe to call repeatedly.
Window blur already triggers all-notes-off (keyboard.js:125).

### 1.5 Screenshot-worthy states

1. **Hero:** native app/plugin at boot — STRINGS 1 loaded, CHORUS I LED lit,
   wood cheeks + screws, all nine color-coded sections, cream/charcoal keybed.
   (Web boots to the same patch but has no cheeks — shoot native.)
2. **Arpeggiator synced:** ON + HOLD + SYNC LEDs lit, RATE readout showing
   `1/8`, BPM dimmed with green `EXT 120.0`.
3. **MENU / patch browser open (native):** New Patch, Save Patch…, Add to
   Favourites ♥, Export/Import, Show Patch Folder; combo showing FAVOURITES /
   FACTORY / USER headings.
4. **Keys held, BENDER mid-throw:** held-key highlights, lever off center,
   LFO TRIG + DCO/VCF minis beside it.

### 1.6 Marketing guardrails (synth)

- **NEVER NAME THE HARDWARE.** Site copy must not say "Juno", "Juno-106",
  "106", or "Roland" anywhere — not in body copy, headings, meta tags,
  JSON-LD, alt text, or generated OG images. Position it as **a polysynth
  inspired by the classic sounds of the 80s** — inspired by, never "an
  emulation of" a named instrument. (Decision by Nate, 2026-08-03, for
  trademark distance.) The facts below still describe the DSP accurately
  and remain the source of truth for *technical* claims; they are an
  internal engineering record, not copy. When the era's hardware must be
  referred to, use "those machines", "the machines this draws on", or
  "that era".
- Formats: **AU, VST3, Standalone — macOS 11+ only.** Never AAX/Pro Tools,
  never Windows/Linux (brief said "VST3, AU, and AAX, macOS and Windows" —
  the repo wins).
- Not notarized; distribution pending an Apple Developer ID (README) — the
  site's "shipping status" line is true and sourced.
- One LFO, one ADSR (shared VCF/VCA), no detune/drift, no delay/reverb, no
  MPE, 6 voices exactly. Don't imply otherwise.
- Chorus is deliberately cleaner than real BBD hardware (no clock noise/hiss)
  — frame as a feature.
- Favourites/MENU/Show Patch Folder are native-only; web has SAVE / DEL /
  EXPORT / IMPORT + localStorage (`ohasynth.userPatches.v1`), DEL is silently
  a no-op on factory patches, and there's no INIT button in the web UI.
- Web latency ~3–12 ms (`latencyHint: 'interactive'`); plugin runs at host
  buffer size.
- Patches interchange across web/app/plugin via flat `.ohasynth.json`
  (missing params fall back to defaults). Web IMPORT also accepts an array.
- British spelling "Favourites" in any copy that names the feature.

---

## 2. Oh a Comber

### 2.1 What it is (verified)

An **Electron 33 + React 18 + Vite 6 desktop app** that indexes sample
libraries **in place** — files are never moved, renamed, or copied; the SQLite
database (better-sqlite3, `samples.db` in userData, WAL mode) is an index
only, and drag-out hands the DAW the **original file path**. Product name
**"Oh a comber"** (electron-builder.yml:2), header wordmark **"OH A COMBER —
sample organizer"** (App.jsx:163), appId `com.muna0001.ohacomber`, v1.0.0,
category `public.app-category.music`.

**Build targets (electron-builder.yml):** macOS dmg+zip (arm64 + x64,
hardened runtime, ad-hoc-sign rescue hook `build/adhoc-sign.js`) and
**Windows NSIS x64** (`OhAComber-Setup-*.exe`). No Linux. No auto-update.
Unsigned on both platforms today (Gatekeeper right-click-Open / SmartScreen).

### 2.2 Design tokens as built (`src/App.css:1-13`)

| Token | Value | Paints |
|---|---|---|
| `--green` | `#4ade80` | primary phosphor green: accents, hover fills, waveform progress/cursor, pad numbers |
| `--green-dim` | `#86efac` | melodic type badges (synth/vocal/keys/guitar/strings/brass) |
| `--green-dark` | `#166534` | active fills, drum-family badge borders, black piano keys, scrollbar thumb |
| `--green-glow` | `rgba(74,222,128,0.15)` | focus rings, active white piano key |
| `--bg` | `#0a0f0d` | near-black canvas (green cast); inverted text on green fills |
| `--bg-surface` | `#111916` | header, sidebar, player bar, panels |
| `--bg-hover` | `#1a2721` | row/key hover |
| `--border` | `#1e2e27` | universal 1px hairlines; waveform's unplayed bars |
| `--text` | `#e2e8e5` | primary text |
| `--text-muted` | `#7a8a82` | labels, placeholders, badges |
| `--radius` | `8px` | global radius (4px/3px smaller elements) |

Active row tint `rgba(74,222,128,0.06)` + `inset 3px 0 0 var(--green)` left
edge. Electron window background `#001a00` (main.js:27). The three greens are
exactly Tailwind green-400/300/800.

**Surfaces:** flat matte terminal chrome — zero gradients, zero texture.
Ghost buttons (transparent + hairline border) that invert to solid green on
hover. Custom 6px scrollbars. Only two depth cues in the whole app: the
context-menu shadow and the focus glow ring. **Icons are Unicode/ASCII only**
(▶ ■ ⏸ ★ ☆ ▲ ▼, `[+]` / `[-]`, bare letter `K`) — no icon font, no SVG.

**Fonts:** body = system stack, 13px. Wordmark = **'VT323' pixel font at
22px/3px tracking, loaded from Google Fonts** (not bundled — falls back to
generic monospace offline). Label style: 10px / 600 / uppercase / 1.5px
tracking. Tabular numerals on times.

### 2.3 UI vernacular

- An audio file is a **sample**; the indexed collection is the **Library**
  ("Scan Library", "N samples indexed", "Click 'Scan Library' to index your
  samples").
- A top-level folder under a scan root is a **Pack** (column header; matched
  by search).
- Instrument/drum category is **Type**; musical genre is **Genre**;
  starred = **★ FAVORITES** (American spelling here, unlike the synth).
- The playable area is **INSTRUMENTS `[+]`** with tabs **KEYBOARD** and
  **DRUM PAD**; a pad slot reads **EMPTY**; "Keys 1–9 to trigger pads";
  "Right-click pad to clear"; per-row **K** button = "Load to keyboard".
- Empty state: "No samples found" / "Click 'Scan Library' to index your
  samples". Player empty: "No sample selected".
- **No concept of a tag or a collection exists in the UI.**

### 2.4 Real features (all verified end-to-end)

- **Scan Library** — native folder picker (multi-select), recursive scan.
  Extensions, exactly: `.wav .aiff .aif .mp3 .flac .ogg .m4a .wma .aac`.
  Per file: metadata via music-metadata (duration, sample rate, channels,
  key, BPM), BPM fallback from filename regex (`NNN bpm`, 40–300), pack from
  first-level folder, type + genre classification, content hash (MD5 of
  first 8 KB + size). Progress readout "Scanning… X / Y".
- **Type classification** — filename/folder **pattern matching** (16 types +
  `other`): guitar, keys, strings, brass, vocal, synth, bass, fx, kick,
  snare, hihat, clap, cymbal, tom, percussion, loop. NOT audio analysis.
- **Genre classification** — hardcoded map of 16 known pack folder names +
  24 path regexes (Lo-Fi, Trap, EDM, Ambient, House, Hip Hop, R&B, DnB, …).
  NOT audio analysis.
- **Search** — matches filename, path, and pack, debounced 150 ms.
- **Filters** — Type chips with live counts, Genre chips, ★ FAVORITES toggle
  (appears once ≥1 favorite exists), **BPM Range** min/max inputs.
- **Sortable columns** — Name, Type, BPM, Duration, Format (Pack not
  sortable). Arrow-key navigation steps through the list and auto-plays.
- **Player bar** — play/pause, filename, `m:ss / m:ss`, wavesurfer.js
  waveform (48px; click to seek); Web Audio playback, **always loops**;
  streams over custom `sample://` protocol; AIFF converted on-the-fly via
  macOS `afconvert` (macOS only — AIFF won't preview on Windows).
- **Drag out to DAW** — native `startDrag` with the real file path.
- **Reveal in Finder** — right-click context menu (label hardcoded even on
  Windows).
- **KEYBOARD sampler** — 24-key piano (C3–B4), chromatic repitch via
  playback rate, computer-key map `A W S E D F T G Y H U J K O L P ;`,
  50 ms release ramp.
- **DRUM PAD** — 3×3 grid (7-8-9 / 4-5-6 / 1-2-3), number keys trigger,
  click empty pad to assign current sample, right-click clears, 120 ms
  trigger flash. Assignments are in-memory only (lost on restart).
- **MIDI** — Web MIDI with hot-plug: keyboard sampler notes 24–83 (C3 =
  original pitch), 14-bit pitch bend ±2 semitones; pads on notes 48–56
  (note-on on an empty pad assigns the current sample). Electron auto-grants
  the permission (no prompt).
- **Duplicate handling** — content-hash groups; one canonical copy stays
  visible (prefers `/samples/` paths, then shortest), the rest hidden from
  every list/count. No management UI — automatic and invisible.
- **Stats** — "N samples indexed", BPM min–max, per-type and per-genre
  counts in the sidebar.
- **Re-scan semantics** — scanning again upserts by path
  (`ON CONFLICT(path) DO UPDATE`, database.js:64-88); the update list does
  NOT include `favorite`, so favorites survive re-scans. Duplicate flags are
  recomputed after each scan (main.js:102-108).
- **Runtime network caveat** — the app itself makes one third-party request
  when online: the VT323 wordmark font loads from Google Fonts
  (index.html:5-7). "Nothing is uploaded / no accounts / no sync / no
  telemetry" is true; an absolute "no network at all" is not.

### 2.5 Screenshot-worthy states

1. Full library after a scan, sample playing — sidebar counts, type badges,
   green waveform in the player. The signature look.
2. KEYBOARD tab with a sample loaded ("Loaded: {filename} — keys A–; to play").
3. DRUM PAD tab, several pads assigned, one mid-flash.
4. Filters stacked: ★ FAVORITES on + Type chips + BPM Range narrowing the list.

### 2.6 Marketing guardrails (Comber)

- **No tagging.** The DB column + IPC exist but no UI ever calls them
  (verified by grep). package.json's own description ("with tagging")
  oversells; the site must not. The §8 video caption "searchable and tagged"
  becomes "searchable and sorted by type."
- Musical key is stored but never displayed/filterable — don't advertise.
- BPM is **read from metadata/filenames**, not detected by audio analysis.
- Type/Genre classification is **name-pattern matching**, not AI/ML — say
  "classifies from names and folder structure," never "listens" or "AI."
- List views cap at 1000 rows per query (large libraries index fine; a
  single view shows at most 1000).
- AIFF preview is macOS-only; playback always loops; no volume control.
- Pads/keyboard-sample don't persist across restarts.
- Windows build is unsigned (SmartScreen); macOS ad-hoc signed.
- "It never touches your files" is TRUE and provable (index-only DB,
  real-path drag-out) — this is the strongest honest claim we have.

---

## 3. Brief vs. reality — discrepancies (repos win)

1. **AAX / Windows for the synth:** brief says "VST3, AU, and AAX, macOS and
   Windows." Reality: **AU + VST3 + Standalone, macOS 11+ only.** Site says
   exactly that.
2. **"Cream/ivory silkscreened panel" for the synth:** the app is a
   **charcoal panel (#2b2b30) with cream (#ece5d5) silkscreened legends**,
   walnut appearing only as the plugin's end cheeks. The site's synth world
   is therefore charcoal-with-cream-legends framed by walnut cheeks — not an
   ivory panel.
3. **"Pull P1 phosphor greens from the app":** the app's greens are Tailwind
   green-400/300/800 (`#4ade80/#86efac/#166534`), cooler and more minty than
   true P1. Per the brief's own rule, the app's exact values win; the site's
   amber accent (`#ffb000`, the classic P3 phosphor) is the one permitted
   outside color.
4. **Comber tagging:** advertised in package.json, stubbed in reality — off
   the site (see 2.6).
5. **Naming:** apps spell themselves "Oh-a-synth" and "Oh a comber"; the
   brief's line naming ("Oh!", "Oh a Synth", "Oh a Comber") is used for site
   branding, with in-app spellings visible in screenshots (acceptable — same
   words, different casing/hyphens; the synth page spec table lists the
   product name as it installs: Oh-a-synth).
6. **Synth demo controls (§6):** brief suggests exposing "filter cutoff,
   resonance, envelope amount, and chorus/ensemble" — all four exist with the
   app's own names (VCF FREQ, RES, ENV, CHORUS I/II) and are the right picks.
7. **Comber pixel font:** the app's actual pixel face is VT323 (Google
   Fonts); the brief suggests Departure Mono for the site. Decision: Departure
   Mono for display (higher quality at display sizes, freely licensed —
   license to be verified when vendored), noting VT323 is what the app itself
   uses.
8. **Oacoma/music content:** nothing in either repo. `music.json` ships with
   empty link fields that render only when filled — no invented URLs.

---

## 4. Proposed token system (three worlds, one roof)

### Home — "Oh!"
| Role | Value | Traceable to |
|---|---|---|
| `--oh-bg` | `#141416` | synth page background (ohasynth.css:22) |
| `--oh-surface` | `#232327` | synth `--panel-2` |
| `--oh-paper` | `#ece5d5` | synth `--cream` — the "off-white paper" type color |
| `--oh-ink` | `#ff5a3c` | synth `--led` — the single ink accent (the "!" glows like a power LED) |
| `--oh-swatch-synth` | `#c8413b` | synth `--red` (stripe 1) |
| `--oh-swatch-comber` | `#4ade80` | Comber `--green` |

Type: **Archivo variable font** (OFL, self-hosted woff2, width axis 62–125%).
Wordmark/headlines at width 125 / weight 900, tight tracking; body at width
100 / weight 400. One font file serves the Home AND synth pages.
Layout: instrument-catalog — narrow measure, oversized headline blocks, two
full-bleed product features, no cards.
Signature: WebGL extruded "!" (`gl/wordmark.js`), matte cream material,
pointer-tracked key light with `--oh-ink` rim; the "!" recurs as list bullet,
loading indicator, and nav hover marker. No other decoration.

### Oh a Synth page
| Role | Value | Traceable to |
|---|---|---|
| `--syn-panel` | `#2b2b30` | `--panel` |
| `--syn-panel-deep` | `#232327` / edge `#1a1a1d` | `--panel-2` / `--panel-edge` |
| `--syn-cream` | `#ece5d5` / dim `#b9b2a2` | `--cream` / `--cream-dim` |
| `--syn-walnut` | `#5e3d27 → #372315` | plugin wood cheeks (PluginEditor.cpp:881-882) |
| `--syn-led` | `#ff5a3c` | `--led` |
| section accents | `#c8413b #e0a33b #4f9ed9 #9bba5e` (+`#e6d06b` stripes) | panel.js section map |

Type: **Archivo** — condensed (width ~66) uppercase letterspaced for panel
legending; normal width for body. Exactly the screen-printed-label brief.
Layout: the page IS a front panel — feature sections styled like
`.oha-section` blocks with 2px accent-underlined headers; spec sheet as a
hardware manual back page (cream rules on charcoal).
Signature: the playable synth hero (engine vendored from the repo, 4 exposed
controls: VCF FREQ, RES, ENV, CHORUS I/II + patch stepper), framed by GLSL
walnut cheeks with a mouse-tracked specular sweep (`gl/cabinet.js`). Cursor:
fine crosshair `(pointer: fine)` only.

### Oh a Comber page
| Role | Value | Traceable to |
|---|---|---|
| `--crt-green` | `#4ade80` | `--green` |
| `--crt-green-dim` | `#86efac` | `--green-dim` |
| `--crt-green-dark` | `#166534` | `--green-dark` |
| `--crt-bg` | `#0a0f0d` / surface `#111916` / border `#1e2e27` | app tokens |
| `--crt-text` | `#e2e8e5` / muted `#7a8a82` | app tokens |
| `--crt-amber` | `#ffb000` | P3 amber phosphor — the era's other monitor standard; alerts/CTAs only |

Type: **Departure Mono** (display/chrome; license verified before vendoring)
+ **IBM Plex Mono** (OFL) for body at a comfortable size — long paragraphs
never set in the pixel face.
Layout: everything inside a bordered "screen" — hairline-divided panels
mirroring the app's chrome; ghost buttons that invert to solid green on
hover, exactly like the app; Unicode/ASCII glyphs as the only icons.
Signature: full-page CRT shader pass (`gl/crt.js`: barrel distortion,
scanlines, phosphor bloom, slow drift — hero-region-only fallback if
readability suffers) + once-per-session skippable boot sequence + blinking
block-caret cursor with phosphor trail. All disabled under reduced-motion.

### Shared skeleton
Both product pages: hero → problem/promise → 4–6 feature sections
(media alternating) → demo video → spec panel → FAQ → CTA repeat. Same
`render.js` slot system, same section rhythm, completely different skins.
