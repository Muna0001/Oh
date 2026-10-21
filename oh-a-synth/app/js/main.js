/*
 * Boot: wires engine + panel + keyboard + MIDI, and the header, which works
 * as the native app's does: the loaded patch's name opens the patch list,
 * and MENU holds New, Save, Favourites, Export, Import, Delete, the patch
 * folder and Audio/MIDI Settings.
 */
(function () {
  'use strict';

  var LS_KEY = 'ohasynth.userPatches.v1';
  var FAV_KEY = 'ohasynth.favourites.v1';      // patch ids, as the native app's
  var SINK_KEY = 'ohasynth.audioOutput.v1';    // chosen output device id

  // This browser's storage. Reads fall back when it is blocked; writes
  // report whether they were kept.
  function readLS(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function el(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function download(name, data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function slug(name) {
    return (name || 'patch').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'patch';
  }

  // The release, as `project(... VERSION)` in plugin/CMakeLists.txt: bump
  // both together.
  Oha.VERSION = '1.1.0';

  window.addEventListener('DOMContentLoaded', function () {
    var engine = new Oha.Engine();
    window.ohaEngine = engine; // handy for debugging / headless use

    Oha.buildPanel(engine, document.getElementById('panel'));
    Oha.buildMonitor(engine, document.getElementById('monitor'));
    Oha.buildBender(engine, document.getElementById('bender'));
    Oha.buildKeyboard(engine, document.getElementById('keyboard'));
    var midi = Oha.initMIDI(engine);

    // ----- patches --------------------------------------------------
    // Ids as in the native app: "F:<name>" for factory, "U:<name>" for
    // the user's own.
    var userPatches = readLS(LS_KEY, {});
    var favourites = readLS(FAV_KEY, []);
    // the loaded patch; `category` is its type, '' for none
    var current = { id: null, name: 'INIT', user: false, category: '' };

    var patchBtn = document.getElementById('patch-button');
    var patchName = document.getElementById('patch-button-name');
    var prevBtn = document.getElementById('patch-prev');
    var nextBtn = document.getElementById('patch-next');
    var bankBtn = document.getElementById('patch-bank');
    var settingsBtn = document.getElementById('settings-button');
    var importInput = document.getElementById('patch-import-file');
    bankBtn.appendChild(Oha.icon('bars-3'));
    settingsBtn.appendChild(Oha.icon('cog-6-tooth'));
    prevBtn.appendChild(Oha.icon('chevron-up'));
    nextBtn.appendChild(Oha.icon('chevron-down'));

    // The display has room for DISPLAY_CHARS characters; behind them every
    // segment of every cell shows faintly ('~' lights them all in DSEG14).
    var DISPLAY_CHARS = 16;
    patchBtn.querySelector('.oha-display-ghost').textContent = new Array(DISPLAY_CHARS + 1).join('~');
    function displayText(name) {
      // '!' is DSEG14's blank cell, as wide as a character (a space is not)
      return String(name).toUpperCase().slice(0, DISPLAY_CHARS).replace(/ /g, '!');
    }

    function patchFor(id) {
      if (!id) return null;
      var name = id.slice(2);
      if (id.slice(0, 2) === 'U:') return userPatches[name] || null;
      for (var i = 0; i < Oha.PRESETS.length; i++)
        if (Oha.PRESETS[i].name === name) return Oha.PRESETS[i];
      return null;
    }
    function show() {
      patchName.textContent = displayText(current.name);
      patchBtn.setAttribute('aria-label', 'Patch: ' + current.name);
      patchBtn.title = current.name;
    }
    function select(id) {
      var p = patchFor(id);
      if (!p) return;
      engine.start();
      engine.loadPatch(p);
      current = { id: id, name: p.name || id.slice(2), user: id.slice(0, 2) === 'U:',
                  category: typeOf(p) };
      show();
    }
    // a patch's type, if it is one the browser knows
    function typeOf(p) {
      var c = p && typeof p.category === 'string' ? p.category.toUpperCase() : '';
      return Oha.PATCH_CATEGORIES.indexOf(c) >= 0 ? c : '';
    }
    function isFavourite(id) { return !!id && favourites.indexOf(id) >= 0; }
    function userNames() { return Object.keys(userPatches).sort(); }

    function notKept() {
      var body = el('div', 'oha-dialog-body');
      el('p', null, body, 'This browser is not keeping saved data (a private window, or site data ' +
        'is blocked), so the change lasts only until the page closes. Export Patch keeps a copy as a file.');
      Oha.dialog({ title: 'Not saved in this browser', body: body });
    }

    // the patch browser: ALL and FAVOURITES, the types that have patches
    // (factory and the user's own), then USER. Opens on the loaded patch's
    // type, else USER for a user patch, else ALL.
    patchBtn.addEventListener('click', function () {
      function row(id) {
        return { id: id, text: id.slice(2), fav: isFavourite(id), current: id === current.id,
                 type: typeOf(patchFor(id)) };
      }
      function byName(a, b) { return a.text.localeCompare(b.text); }
      var factory = Oha.PRESETS.map(function (p) { return row('F:' + p.name); });
      var users = userNames().map(function (n) { return row('U:' + n); });
      var favs = favourites.filter(function (id) { return patchFor(id); }).map(row);
      var groups = [{ name: 'ALL', items: factory.concat(users).sort(byName) }];
      if (favs.length) groups.push({ name: 'FAVOURITES', items: favs });
      groups.push({ separator: true });
      var start = 0;
      Oha.PATCH_CATEGORIES.forEach(function (c) {
        var items = factory.concat(users).filter(function (r) { return r.type === c; });
        if (!items.length) return;
        if (c === current.category) start = groups.length;
        groups.push({ name: c, items: items.sort(byName) });
      });
      if (users.length) {
        groups.push({ separator: true });
        if (current.user && !current.category) start = groups.length;
        groups.push({ name: 'USER', items: users });
      }
      Oha.patchBrowser(patchBtn, groups, start, select, patchBtn.parentNode);
    });

    // the step buttons: the previous / next patch type by type, as the
    // browser lists them (each type's patches A to Z, the types in order,
    // then the user's patches with none), wrapping round, without opening it
    function stepOrder() {
      function byName(a, b) { return a.slice(2).localeCompare(b.slice(2)); }
      var ids = Oha.PRESETS.map(function (p) { return 'F:' + p.name; })
        .concat(userNames().map(function (n) { return 'U:' + n; }));
      var order = [];
      Oha.PATCH_CATEGORIES.concat(['']).forEach(function (c) {
        order = order.concat(ids.filter(function (id) { return typeOf(patchFor(id)) === c; }).sort(byName));
      });
      return order;
    }
    function step(delta) {
      var ids = stepOrder();
      var i = ids.indexOf(current.id);
      select(ids[i < 0 ? (delta > 0 ? 0 : ids.length - 1) : (i + delta + ids.length) % ids.length]);
    }
    prevBtn.addEventListener('click', function () { step(-1); });
    nextBtn.addEventListener('click', function () { step(1); });

    // the patch menu (☰, left of the display)
    bankBtn.addEventListener('click', function () {
      var fav = isFavourite(current.id);
      Oha.popupMenu(bankBtn, [
        { heading: current.name },
        { id: 'new', text: 'New Patch' },
        { id: 'save', text: 'Save Patch…' },
        { id: 'fav', text: fav ? 'Remove from Favourites' : 'Add to Favourites', icon: 'heart',
          disabled: !current.id },
        { separator: true },
        { id: 'export', text: 'Export Patch…' },
        { id: 'import', text: 'Import Patch…' },
        { id: 'delete', text: 'Delete Patch', disabled: !current.user }
      ], function (choice) {
        switch (choice) {
          case 'new':
            engine.loadPatch(Oha.defaultPatch());
            current = { id: null, name: 'INIT', user: false, category: '' };
            show();
            break;
          case 'save': saveDialog(); break;
          case 'fav':
            favourites = favourites.filter(function (id) { return id !== current.id; });
            if (!fav) favourites.push(current.id);
            if (!writeLS(FAV_KEY, favourites)) notKept();
            break;
          case 'export': {
            var p = engine.getPatch();
            p.name = current.name;
            if (current.category) p.category = current.category;
            download(slug(p.name) + '.ohasynth.json', p);
            break;
          }
          case 'import': importInput.click(); break;
          case 'delete':
            if (!current.user) break;
            delete userPatches[current.name];
            favourites = favourites.filter(function (id) { return id !== current.id; });
            writeLS(LS_KEY, userPatches);
            writeLS(FAV_KEY, favourites);
            select('F:' + Oha.PRESETS[0].name);
            break;
        }
      });
    });

    // the settings menu (⚙, right of the bar)
    settingsBtn.addEventListener('click', function () {
      Oha.popupMenu(settingsBtn, [
        { id: 'folder', text: 'Show Patch Folder' },
        { id: 'settings', text: 'Audio/MIDI Settings…' },
        { separator: true },
        { id: 'about', text: 'About Oh-a-synth' }
      ], function (choice) {
        if (choice === 'folder') folderDialog();
        else if (choice === 'settings') settingsDialog();
        else if (choice === 'about') aboutDialog();
      });
    });

    // The app's name, version, maker and credits; the same content as
    // AboutOverlay in the app and plugin.
    function aboutDialog() {
      var body = el('div', 'oha-dialog-body oha-about');
      var brand = el('div', 'oha-about-brand', body);
      el('span', 'oha-brand', brand, 'Oh-a-synth');
      var stripes = el('span', 'oha-stripes', brand);
      for (var i = 0; i < 4; i++) el('i', null, stripes);
      el('p', 'oha-sub', body, 'POLYPHONIC SYNTHESIZER');
      el('p', null, body, 'Version ' + Oha.VERSION + ' · Web app');
      var made = el('p', null, body, 'Made by Oh Music Tools · ');
      var link = el('a', null, made, 'ohmusictools.com');
      link.href = 'https://ohmusictools.com';
      link.target = '_blank';
      link.rel = 'noopener';
      el('p', null, body, 'Designed and built by Nathan Mueller');
      el('p', 'oha-dialog-dim', body, '© 2026 Oh Music Tools. All rights reserved.');
      el('div', 'oha-settings-head', body, 'CREDITS');
      var list = el('ul', 'oha-about-credits', body);
      [['Archivo', ' typeface, Omnibus-Type · SIL OFL 1.1'],
       ['DSEG14', ' display typeface, keshikan · SIL OFL 1.1'],
       ['Heroicons', ' icons, Tailwind Labs · MIT']].forEach(function (c) {
        var li = el('li', null, list);
        el('b', null, li, c[0]);
        li.appendChild(document.createTextNode(c[1]));
      });
      Oha.dialog({ title: 'About Oh-a-synth', body: body });
    }

    function saveDialog() {
      var body = el('div', 'oha-dialog-body');
      var label = el('label', 'oha-dialog-label', body, 'Name this patch:');
      label.htmlFor = 'save-patch-name';
      var input = el('input', 'oha-dialog-input', body);
      input.id = 'save-patch-name';
      input.type = 'text';
      input.maxLength = 24;
      input.spellcheck = false;
      input.value = current.name;
      // its type, from the patch it started as
      var typeLabel = el('label', 'oha-dialog-label oha-dialog-gap', body, 'Type:');
      typeLabel.htmlFor = 'save-patch-type';
      var type = el('select', 'oha-dialog-input', body);
      type.id = 'save-patch-type';
      el('option', null, type, 'NONE').value = '';
      Oha.PATCH_CATEGORIES.forEach(function (c) { el('option', null, type, c).value = c; });
      type.value = current.category;
      Oha.dialog({
        title: 'Save Patch',
        body: body,
        buttons: [{ text: 'Cancel', value: null }, { text: 'Save', value: 'save', primary: true }],
        onClose: function (v) {
          var name = (input.value || '').trim().toUpperCase();
          if (v !== 'save' || !name) return;
          var p = engine.getPatch();
          p.name = name;
          if (type.value) p.category = type.value;
          userPatches[name] = p;
          current = { id: 'U:' + name, name: name, user: true, category: type.value };
          show();
          if (!writeLS(LS_KEY, userPatches)) notKept();
        }
      });
    }

    importInput.addEventListener('change', function () {
      var f = importInput.files[0];
      if (!f) return;
      f.text().then(function (txt) {
        var data = JSON.parse(txt);
        // accept a single patch or an array of patches
        var list = Array.isArray(data) ? data : [data];
        var last = null;
        list.forEach(function (p) {
          if (!p || typeof p !== 'object') return;
          var name = String(p.name || 'IMPORTED').trim().toUpperCase().slice(0, 24) || 'IMPORTED';
          p.name = name;
          userPatches[name] = p;
          last = name;
        });
        if (!last) throw new Error('no patches');
        if (!writeLS(LS_KEY, userPatches)) notKept();
        select('U:' + last);
      }).catch(function () {
        var body = el('div', 'oha-dialog-body');
        el('p', null, body, 'That file is not a readable Oh-a-synth patch.');
        Oha.dialog({ title: 'Import Patch', body: body });
      });
      importInput.value = '';
    });

    // A browser can't open a folder on disk: this shows where the patches
    // live instead, and can export them all at once.
    function folderDialog() {
      var body = el('div', 'oha-dialog-body');
      var names = userNames();
      el('p', null, body, 'Your own patches are saved in this browser, on this computer. ' +
        'To use one in the Mac app or another browser, load it and choose Export Patch.');
      if (names.length) {
        var list = el('ul', 'oha-dialog-list', body);
        names.forEach(function (n) {
          var li = el('li', null, list, n);
          if (isFavourite('U:' + n)) li.insertBefore(Oha.icon('heart'), li.firstChild);
        });
      } else {
        el('p', 'oha-dialog-dim', body, 'No saved patches yet.');
      }
      var buttons = [{ text: 'Close', value: null, primary: !names.length }];
      if (names.length) buttons.unshift({ text: 'Export All…', value: 'all', primary: true });
      Oha.dialog({
        title: 'Patch Folder',
        body: body,
        buttons: buttons,
        onClose: function (v) {
          if (v === 'all')
            download('oh-a-synth-patches.ohasynth.json',
                     names.map(function (n) { return userPatches[n]; }));
        }
      });
    }

    // ----- Audio/MIDI Settings --------------------------------------
    function applySink(id) {
      if (!engine.ctx || !engine.ctx.setSinkId) return Promise.resolve();
      return engine.ctx.setSinkId(id || '');
    }
    engine.on('started', function () {
      var id = readLS(SINK_KEY, '');
      if (id) applySink(id).catch(function () { /* that device has gone */ });
    });

    function settingsDialog() {
      var body = el('div', 'oha-dialog-body oha-settings');

      el('div', 'oha-settings-head', body, 'AUDIO');
      var audioState = el('p', null, body);
      if (engine.running) {
        var ctx = engine.ctx;
        var lat = ctx.outputLatency || ctx.baseLatency;
        audioState.textContent = 'On, at ' + ctx.sampleRate + ' Hz' +
          (lat ? ', about ' + Math.round(lat * 1000) + ' ms of output latency.' : '.');
      } else {
        audioState.textContent = 'Starts with your first click or key press.';
      }
      var canChoose = !!(window.AudioContext && AudioContext.prototype.setSinkId &&
                         navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);
      var outRow = el('div', 'oha-settings-row', body);
      var outLabel = el('label', null, outRow, 'Output');
      outLabel.htmlFor = 'audio-output';
      var out = el('select', 'oha-dialog-input', outRow);
      out.id = 'audio-output';
      el('option', null, out, 'System default').value = '';
      var outNote = el('p', 'oha-dialog-dim', body);
      if (canChoose) {
        navigator.mediaDevices.enumerateDevices().then(function (devs) {
          var n = 0;
          devs.forEach(function (d) {
            if (d.kind !== 'audiooutput' || !d.deviceId || d.deviceId === 'default') return;
            var o = el('option', null, out, d.label || 'Output ' + (++n));
            o.value = d.deviceId;
          });
          out.value = readLS(SINK_KEY, '');
          if (out.value !== readLS(SINK_KEY, '')) out.value = '';
          if (out.options.length < 2)
            outNote.textContent = 'To use another output, choose it in your computer\'s sound settings.';
        });
        out.addEventListener('change', function () {
          writeLS(SINK_KEY, out.value);
          applySink(out.value).then(function () { outNote.textContent = ''; }, function () {
            outNote.textContent = 'That output could not be used; staying on the current one.';
          });
        });
      } else {
        out.disabled = true;
        outNote.textContent = 'This browser always plays through the system output; ' +
          'change it in your computer\'s sound settings.';
      }

      el('div', 'oha-settings-head', body, 'MIDI');
      var midiState = el('p', null, body);
      var midiDetail = el('p', 'oha-dialog-dim', body);
      var inputs = el('div', 'oha-settings-inputs', body);
      var rescan = el('button', 'oha-dialog-btn', body, 'Re-scan');
      rescan.type = 'button';
      rescan.addEventListener('click', function () { midi.rescan(); });

      function renderMidi() {
        var s = midi.status();
        midiState.textContent = s.text.replace(/^MIDI: /, '');
        midiState.classList.toggle('ok', s.ok);
        midiDetail.textContent = s.detail;
        inputs.innerHTML = '';
        midi.inputs().forEach(function (inp, i) {
          var row = el('label', 'oha-settings-check', inputs);
          var box = el('input', null, row);
          box.type = 'checkbox';
          box.id = 'midi-input-' + i;
          box.checked = inp.enabled;
          box.addEventListener('change', function () { midi.setEnabled(inp.id, box.checked); });
          el('span', null, row, inp.name);
        });
      }
      renderMidi();
      var live = true;
      midi.onChange(function () { if (live) renderMidi(); });

      Oha.dialog({
        title: 'Audio/MIDI Settings',
        body: body,
        onClose: function () { live = false; }
      });
    }

    // ----- audio autostart ------------------------------------------
    // Browsers only allow audio after a user gesture, so power on with
    // the first interaction of any kind. Note/param events that arrive
    // while starting are queued by the engine and flushed when ready.
    function powerOn() { engine.start(); }
    window.addEventListener('pointerdown', powerOn, { capture: true });
    window.addEventListener('keydown', powerOn, { capture: true });
    engine.on('started', function () {
      window.removeEventListener('pointerdown', powerOn, { capture: true });
      window.removeEventListener('keydown', powerOn, { capture: true });
    });

    // MIDI input is not a user gesture, so playing an external keyboard
    // before touching the page leaves audio suspended — the synth hears
    // the notes but cannot sound. Show a banner explaining the one click
    // it takes to unblock.
    var audioHint = document.createElement('div');
    audioHint.id = 'audio-hint';
    audioHint.appendChild(Oha.icon('speaker-wave'));
    audioHint.appendChild(document.createTextNode(
      'Audio is blocked by the browser — click anywhere to enable sound'));
    document.body.appendChild(audioHint);
    engine.on('note', function () {
      setTimeout(function () {
        if (!engine.running) audioHint.classList.add('show');
      }, 250);
    });
    engine.on('started', function () { audioHint.classList.remove('show'); });

    // load the first factory preset so it sounds great immediately
    engine.loadPatch(Oha.PRESETS[0]);
    current = { id: 'F:' + Oha.PRESETS[0].name, name: Oha.PRESETS[0].name, user: false,
                category: typeOf(Oha.PRESETS[0]) };
    show();
  });
})();
