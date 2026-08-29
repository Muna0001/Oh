/*
 * analytics.js — loads a tracker only when one is configured.
 *
 * content/site.json:
 *   "analytics": { "provider": "goatcounter", "siteId": "" }
 *
 * With siteId empty (as shipped) this module does nothing at all — no
 * request leaves the page. GoatCounter is cookieless, so no consent banner
 * is needed when it is enabled.
 */
import { getSiteData } from './render.js';

async function init() {
  try {
    const site = await getSiteData();
    const { provider, siteId } = site.analytics || {};
    if (!provider || !siteId) return;

    if (provider === 'goatcounter') {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://gc.zgo.at/count.js';
      s.dataset.goatcounter = `https://${siteId}.goatcounter.com/count`;
      document.head.appendChild(s);
    }
    // Other providers: add a branch here; nothing loads unconfigured.
  } catch {
    /* no site.json -> no tracking */
  }
}

init();
