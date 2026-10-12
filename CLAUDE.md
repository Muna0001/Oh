# Oh! site: working notes

Static site for ohmusictools.com; GitHub Pages deploys every push to `main`.

- **Copy rule:** never name the hardware Oh a Synth draws on, or its maker
  (see README).
- Edit page copy in `content/*.json`, then `node tools/sync-content.mjs --write`.
- The browser synth is only on the unlisted `oh-a-synth/play.html`
  (noindex, linked from nowhere, not in the sitemap). The product page sells
  the Mac app and plugins and doesn't embed it. `sync-content.mjs` doesn't
  stamp that page, so copy nav or footer changes into it by hand.
- `js/synth/vendor/` is a byte-identical copy of the synth engine from the
  private `Muna0001/ohasynth` repo (`js/engine/`). Never edit it here:
  change it there, re-copy, check with `cmp`.
- Replacing a video or poster: bump its `?v=N`.

Status and the to-do list for the synth (release, pricing, site copy that
waits on the download) live in `CLAUDE.md` in `Muna0001/ohasynth`.
