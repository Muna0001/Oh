/*
 * music.js — about-page only: the Oacoma embed and album grid.
 *
 * Everything renders from content/music.json. With videoId empty (as
 * shipped) the embed slot stays a labeled placeholder. When set, the slot
 * becomes a click-to-load facade: no YouTube request leaves the page until
 * the visitor asks for the video (youtube-nocookie.com when they do).
 * Albums render as art + outbound links; an empty albums array keeps the
 * grid hidden.
 */
document.addEventListener('oh:content', (e) => {
  const music = e.detail && e.detail.music;
  if (!music) return;

  // --- YouTube facade ---
  const slot = document.querySelector('[data-yt]');
  const videoId = music.youtube && music.youtube.videoId;
  if (slot && videoId) {
    const frame = slot.querySelector('.frame');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'yt-facade';
    btn.innerHTML = `<span class="yt-play" aria-hidden="true">▶</span><span>${
      (music.youtube.title || 'Play video')
    }</span>`;
    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.width = '560';
      iframe.height = '315';
      iframe.src =
        `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1`;
      iframe.title = music.youtube.title || 'Oacoma on YouTube';
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);
    }, { once: true });
    frame.replaceChildren(btn);
    const cap = slot.querySelector('figcaption');
    if (cap) cap.textContent = music.youtube.title || 'Oacoma on YouTube';
  }

  // --- album grid ---
  const grid = document.querySelector('[data-albums]');
  const note = document.querySelector('[data-albums-note]');
  const albums = Array.isArray(music.albums) ? music.albums : [];
  if (grid && albums.length) {
    grid.hidden = false;
    if (note) note.hidden = true;
    for (const album of albums) {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = album.art || '';
      img.alt = `${album.title || 'Album'} — album art`;
      img.loading = 'lazy';
      img.width = 300;
      img.height = 300;
      li.appendChild(img);
      const h = document.createElement('p');
      h.className = 'album-title';
      h.textContent = album.year ? `${album.title} (${album.year})` : album.title;
      li.appendChild(h);
      const links = document.createElement('ul');
      links.className = 'album-links';
      const labels = music.linkLabels || {};
      for (const [key, url] of Object.entries(album.links || {})) {
        if (!url) continue;
        const a = document.createElement('a');
        a.href = url;
        a.rel = 'noopener';
        a.textContent = labels[key] || key;
        const item = document.createElement('li');
        item.appendChild(a);
        links.appendChild(item);
      }
      li.appendChild(links);
      grid.appendChild(li);
    }
  }
  // Hide the explanatory note once any streaming link exists.
  if (note && music.links && Object.values(music.links).some((v) => v)) {
    note.hidden = true;
  }
});
