/*
 * Web MIDI: note on/off + velocity, pitch bend, mod wheel (CC1),
 * sustain pedal (CC64). Listens on every input that is on, all channels.
 *
 * Audio/MIDI Settings (main.js) shows the status and the inputs, and can
 * switch an input off; the messages say what to do when MIDI can't work
 * (wrong browser, insecure origin, denied permission). Inputs switched off
 * are remembered by name in this browser.
 */
(function () {
  'use strict';
  window.Oha = window.Oha || {};

  var OFF_KEY = 'ohasynth.midiOff.v1';
  function loadOff() {
    try { return JSON.parse(localStorage.getItem(OFF_KEY)) || []; } catch (e) { return []; }
  }
  function saveOff(list) {
    try { localStorage.setItem(OFF_KEY, JSON.stringify(list)); } catch (e) { /* not kept */ }
  }

  // Returns { status(), inputs(), setEnabled(id, on), rescan(), onChange(fn) }.
  // status() is { text, ok, detail }; inputs() is [{ id, name, enabled }].
  Oha.initMIDI = function (engine) {
    var state = { text: 'MIDI: starting…', ok: false, detail: '' };
    var listeners = [];
    var off = loadOff();
    var access = null;
    function changed() { listeners.forEach(function (fn) { fn(); }); }
    function setStatus(txt, ok, detail) {
      state = { text: txt, ok: !!ok, detail: detail || '' };
      changed();
    }

    var api = {
      status: function () { return state; },
      inputs: function () {
        var list = [];
        if (access) access.inputs.forEach(function (inp) {
          list.push({ id: inp.id, name: inp.name, enabled: off.indexOf(inp.name) < 0 });
        });
        return list;
      },
      setEnabled: function (id, on) {
        if (!access) return;
        access.inputs.forEach(function (inp) {
          if (inp.id !== id) return;
          off = off.filter(function (n) { return n !== inp.name; });
          if (!on) off.push(inp.name);
        });
        saveOff(off);
        refresh();
      },
      rescan: function () { request(); },
      onChange: function (fn) { listeners.push(fn); }
    };

    if (!navigator.requestMIDIAccess) {
      if (window.isSecureContext === false)
        setStatus('MIDI needs https or localhost', false,
          'Web MIDI is disabled on insecure http:// pages. Open the app via ' +
          'https, localhost, or directly as a file.');
      else
        setStatus('MIDI is not supported in this browser', false,
          'This browser has no Web MIDI (Safari does not support it). ' +
          'Use Chrome, Edge, or Firefox for MIDI keyboards.');
      api.rescan = function () {};
      return api;
    }

    function refresh() {
      var on = [];
      access.inputs.forEach(function (inp) {
        var enabled = off.indexOf(inp.name) < 0;
        inp.onmidimessage = enabled ? onMessage : null;
        if (enabled) on.push(inp.name);
      });
      var count = 0;
      access.inputs.forEach(function () { count++; });
      if (on.length)
        setStatus('MIDI: ' + on.join(', '), true, 'Playing from ' + on.join(', ') + '.');
      else if (count)
        setStatus('MIDI: all inputs off', false, 'Switch an input on below to play from it.');
      else
        setStatus('MIDI: no devices', false,
          'No MIDI inputs found. Connect a keyboard, then re-scan.');
    }

    function request() {
      navigator.requestMIDIAccess({ sysex: false }).then(function (a) {
        access = a;
        a.onstatechange = refresh;
        refresh();
      }, function () {
        setStatus('MIDI: permission denied', false,
          'The browser blocked MIDI access. Re-scan to ask again, or allow ' +
          'MIDI in the site settings (icon next to the address bar).');
      });
    }
    request();

    function onMessage(ev) {
      var d = ev.data;
      if (!d || !d.length) return;

      // System realtime messages are single bytes and must be handled
      // before the channel-message mask below (0xF8 & 0xF0 == 0xF0).
      // These arrive 24x per beat, so do no extra work here.
      if (d[0] >= 0xf8) {
        switch (d[0]) {
          case 0xf8: engine.clockTick(); break;   // clock
          case 0xfa: engine.clockStart(); break;  // start
          case 0xfb: engine.clockStart(); break;  // continue
          case 0xfc: engine.clockStop(); break;   // stop
        }
        return;
      }

      if (d.length < 2) return;
      var status = d[0] & 0xf0;
      // Try to start audio. MIDI input is not a user gesture, so this can
      // fail under autoplay policy — main.js shows a "click to enable
      // audio" banner in that case.
      engine.start();
      switch (status) {
        case 0x90: // note on (vel 0 == note off)
          if (d[2] > 0) engine.noteOn(d[1], d[2] / 127);
          else engine.noteOff(d[1]);
          break;
        case 0x80:
          engine.noteOff(d[1]);
          break;
        case 0xE0: { // pitch bend, 14-bit
          var v = ((d[2] << 7) | d[1]) - 8192;
          engine.pitchBend(v / 8192);
          break;
        }
        case 0xB0:
          if (d[1] === 1) engine.modWheel(d[2] / 127);
          else if (d[1] === 64) engine.setSustain(d[2] >= 64);
          else if (d[1] === 120 || d[1] === 123) engine.allNotesOff();
          break;
      }
    }

    return api;
  };
})();
