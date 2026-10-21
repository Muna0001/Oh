/*
 * The header's dropdown menus and dialogs, styled like the native app's
 * popup menus and alert windows.
 *
 *   Oha.popupMenu(anchor, items, onPick)
 *     items: { heading } | { separator: true } |
 *            { id, text, icon?, checked?, disabled? }
 *     Opens under `anchor`; onPick(id) when an item is chosen.
 *
 *   Oha.patchBrowser(anchor, groups, start, onPick, alignTo?)
 *     groups: { separator: true } |
 *             { name, items: [{ id, text, fav?, current? }] }
 *     Two columns centred under `alignTo` (else `anchor`), 4 below it: the
 *     groups (categories) on the left, the chosen one's patches on the
 *     right, opening on groups[start]. A click
 *     on a group shows its patches; onPick(id) when a patch is chosen. The
 *     same design as PatchBrowser in plugin/Source/PatchBrowser.cpp.
 *
 *   Oha.dialog({ title, body, buttons, onClose })
 *     body: a node; buttons: [{ text, value, primary? }].
 *     onClose(value) with the button's value, or null for Escape / outside.
 *
 * Key presses inside either never reach the computer keyboard's notes.
 */
(function () {
  'use strict';
  window.Oha = window.Oha || {};

  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  var openMenu = null;   // one menu at a time

  Oha.popupMenu = function (anchor, items, onPick) {
    if (openMenu) { var same = openMenu.anchor === anchor; openMenu.close(); if (same) return; }

    var menu = el('div', 'oha-popup', document.body);
    menu.setAttribute('role', 'menu');
    var buttons = [];
    items.forEach(function (it) {
      if (it.separator) { el('div', 'oha-popup-sep', menu); return; }
      if (it.heading) { el('div', 'oha-popup-head', menu).textContent = it.heading; return; }
      var b = el('button', 'oha-popup-item', menu);
      b.type = 'button';
      b.setAttribute('role', it.checked != null ? 'menuitemcheckbox' : 'menuitem');
      if (it.checked != null) b.setAttribute('aria-checked', it.checked ? 'true' : 'false');
      var lead = el('span', 'oha-popup-icon', b);
      if (it.icon) lead.appendChild(Oha.icon(it.icon));
      el('span', 'oha-popup-text', b).textContent = it.text;
      var tail = el('span', 'oha-popup-icon', b);
      if (it.checked) tail.appendChild(Oha.icon('check'));
      if (it.disabled) b.disabled = true;
      else buttons.push(b);
      b.addEventListener('click', function () { close(); onPick(it.id); });
    });

    // under the anchor, kept on screen
    var r = anchor.getBoundingClientRect();
    menu.style.minWidth = Math.max(r.width, 180) + 'px';
    var left = Math.min(r.left, window.innerWidth - menu.offsetWidth - 8);
    menu.style.left = Math.max(8, left) + window.scrollX + 'px';
    menu.style.top = r.bottom + 4 + window.scrollY + 'px';
    var room = window.innerHeight - r.bottom - 16;
    if (menu.offsetHeight > room) menu.style.maxHeight = Math.max(160, room) + 'px';
    anchor.setAttribute('aria-expanded', 'true');

    function focusAt(i) {
      if (!buttons.length) return;
      buttons[(i + buttons.length) % buttons.length].focus();
    }
    menu.addEventListener('keydown', function (ev) {
      ev.stopPropagation();
      var i = buttons.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); focusAt(i + 1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); focusAt(i - 1); }
      else if (ev.key === 'Home') { ev.preventDefault(); focusAt(0); }
      else if (ev.key === 'End') { ev.preventDefault(); focusAt(-1); }
      else if (ev.key === 'Escape' || ev.key === 'Tab') { ev.preventDefault(); close(); anchor.focus(); }
    });
    menu.addEventListener('keyup', function (ev) { ev.stopPropagation(); });
    function outside(ev) { if (!menu.contains(ev.target) && !anchor.contains(ev.target)) close(); }
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('resize', close);

    // start on the checked row (the loaded patch), else the first
    var start = 0;
    buttons.forEach(function (b, i) { if (b.getAttribute('aria-checked') === 'true') start = i; });
    focusAt(start);

    function close() {
      if (!menu.parentNode) return;
      menu.parentNode.removeChild(menu);
      anchor.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('resize', close);
      openMenu = null;
    }
    openMenu = { anchor: anchor, close: close };
  };

  Oha.patchBrowser = function (anchor, groups, start, onPick, alignTo) {
    if (openMenu) { var same = openMenu.anchor === anchor; openMenu.close(); if (same) return; }

    var box = el('div', 'oha-browser', document.body);
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Patches');
    var left = el('div', 'oha-browser-cats', box);
    var right = el('div', 'oha-browser-list', box);
    right.setAttribute('role', 'listbox');

    var cats = [];       // { b: button, gi: group index }
    var rows = [];       // the shown group's patch buttons
    var shown = -1;
    groups.forEach(function (g, gi) {
      if (g.separator) { el('div', 'oha-browser-sep', left); return; }
      var b = el('button', 'oha-browser-cat', left);
      b.type = 'button';
      el('span', 'oha-popup-text', b).textContent = g.name;
      el('span', 'oha-popup-icon', b).appendChild(Oha.icon('chevron-right'));
      b.addEventListener('click', function () { show(gi); });
      cats.push({ b: b, gi: gi });
    });

    function show(gi) {
      shown = gi;
      cats.forEach(function (c) {
        c.b.classList.toggle('on', c.gi === gi);
        c.b.setAttribute('aria-pressed', c.gi === gi ? 'true' : 'false');
      });
      right.textContent = '';
      rows = [];
      groups[gi].items.forEach(function (it) {
        var b = el('button', 'oha-browser-item' + (it.current ? ' current' : ''), right);
        b.type = 'button';
        b.setAttribute('role', 'option');
        b.setAttribute('aria-selected', it.current ? 'true' : 'false');
        var lead = el('span', 'oha-popup-icon', b);
        if (it.current) lead.appendChild(Oha.icon('check'));
        el('span', 'oha-popup-text', b).textContent = it.text;
        var tail = el('span', 'oha-popup-icon', b);
        if (it.fav) tail.appendChild(Oha.icon('heart'));
        b.addEventListener('click', function () { close(); onPick(it.id); });
        rows.push(b);
      });
      if (!rows.length) el('div', 'oha-browser-empty', right).textContent = 'NO PATCHES';
      right.scrollTop = 0;
      var cur = right.querySelector('.current');
      if (cur) cur.scrollIntoView({ block: 'nearest' });
    }
    function catOf(gi) { for (var i = 0; i < cats.length; i++) if (cats[i].gi === gi) return i; return 0; }
    function focusList() {
      var cur = right.querySelector('.current') || rows[0];
      if (cur) cur.focus();
    }

    // centred under alignTo, 4 below it, kept on screen; the list is as
    // tall as the groups and scrolls
    show(groups[start] && !groups[start].separator ? start : cats[0].gi);
    right.style.height = left.offsetHeight + 'px';
    var r = (alignTo || anchor).getBoundingClientRect();
    var x = Math.round(r.left + (r.width - box.offsetWidth) / 2);
    box.style.left = Math.max(8, Math.min(x, window.innerWidth - box.offsetWidth - 8)) + window.scrollX + 'px';
    box.style.top = r.bottom + 4 + window.scrollY + 'px';
    anchor.setAttribute('aria-expanded', 'true');

    box.addEventListener('keydown', function (ev) {
      ev.stopPropagation();
      var ri = rows.indexOf(document.activeElement);
      var inList = ri >= 0;
      var ci = catOf(shown);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        var d = ev.key === 'ArrowDown' ? 1 : -1;
        if (inList) { if (rows.length) rows[(ri + d + rows.length) % rows.length].focus(); }
        else {
          var c = cats[(ci + d + cats.length) % cats.length];
          show(c.gi);
          c.b.focus();
        }
      } else if ((ev.key === 'ArrowRight' || ev.key === 'Enter') && !inList) { ev.preventDefault(); focusList(); }
      else if (ev.key === 'ArrowLeft' && inList) { ev.preventDefault(); cats[ci].b.focus(); }
      else if (ev.key === 'Escape' || ev.key === 'Tab') { ev.preventDefault(); close(); anchor.focus(); }
    });
    box.addEventListener('keyup', function (ev) { ev.stopPropagation(); });
    function outside(ev) { if (!box.contains(ev.target) && !anchor.contains(ev.target)) close(); }
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('resize', close);

    if (rows.length) focusList(); else cats[catOf(shown)].b.focus();

    function close() {
      if (!box.parentNode) return;
      box.parentNode.removeChild(box);
      anchor.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('resize', close);
      openMenu = null;
    }
    openMenu = { anchor: anchor, close: close };
  };

  Oha.dialog = function (opts) {
    if (openMenu) openMenu.close();
    var back = el('div', 'oha-dialog-back', document.body);
    var box = el('div', 'oha-dialog', back);
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    var title = el('div', 'oha-dialog-title', box);
    title.textContent = opts.title;
    title.id = 'oha-dialog-title';
    box.setAttribute('aria-labelledby', title.id);
    if (opts.body) box.appendChild(opts.body);
    var row = el('div', 'oha-dialog-buttons', box);
    var returnTo = document.activeElement;

    function close(value) {
      if (!back.parentNode) return;
      back.parentNode.removeChild(back);
      if (returnTo && returnTo.focus) returnTo.focus();
      if (opts.onClose) opts.onClose(value);
    }
    (opts.buttons || [{ text: 'Close', value: null, primary: true }]).forEach(function (bt) {
      var b = el('button', 'oha-dialog-btn' + (bt.primary ? ' primary' : ''), row);
      b.type = 'button';
      b.textContent = bt.text;
      b.addEventListener('click', function () { close(bt.value); });
    });

    box.addEventListener('keydown', function (ev) {
      ev.stopPropagation();
      if (ev.key === 'Escape') { ev.preventDefault(); close(null); }
      else if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') {
        ev.preventDefault();
        var p = row.querySelector('.primary');
        if (p) p.click();
      }
    });
    box.addEventListener('keyup', function (ev) { ev.stopPropagation(); });
    back.addEventListener('pointerdown', function (ev) { if (ev.target === back) close(null); });

    var first = box.querySelector('input, select, button:not([disabled])');
    if (first) { first.focus(); if (first.select && first.tagName === 'INPUT') first.select(); }
    return { close: close, box: box };
  };
})();
