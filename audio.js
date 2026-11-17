/* Музыка и звуки: всё синтезируется Web Audio API — никаких внешних файлов и лицензионных рисков.
   Мелодии: «Jingle Bells» (Дж. Пирпонт, 1857) и «We Wish You a Merry Christmas» (народная) — общественное достояние. */
(function () {
  'use strict';
  var NY = window.NY;
  var ctx = null, master, musicGain, sfxGain, noiseBuf;
  var playing = false, timer = null, idx = 0, loopStart = 0;
  var song = null;

  var BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    var m = /^([A-G])(#|b)?(\d)$/.exec(n);
    var midi = 12 * (+m[3] + 1) + BASE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function parse(str) {
    return str.trim().split(/\s+/).map(function (tok) { var p = tok.split(':'); return { n: p[0], b: parseFloat(p[1]) }; });
  }

  function buildSong() {
    var events = [], t = 0;
    function section(o) {
      var spb = 60 / o.bpm, pos = 0;
      parse(o.melody).forEach(function (x) {
        if (x.n !== 'R') events.push({ t: t + pos * spb, f: freq(x.n), d: x.b * spb, k: 'lead' });
        pos += x.b;
      });
      var bar = o.pickup || 0;
      o.chords.forEach(function (ch, i) {
        var bt = t + (o.pickup || 0) * spb + i * o.bpb * spb, root = freq(ch[0]), tones = ch.slice(1).map(freq);
        events.push({ t: bt, f: root, d: spb * 1.6, k: 'bass' });
        if (o.bpb === 4) events.push({ t: bt + 2 * spb, f: freq(ch[1] || ch[0]) / 1, d: spb * 1.2, k: 'bass2' });
        events.push({ t: bt, f: tones, d: o.bpb * spb, k: 'pad' });
        for (var b = 0; b < o.bpb; b++) events.push({ t: bt + b * spb, k: 'shake', acc: b === 0 });
      });
      t += pos * spb;
    }
    var jA = 'E5:1 E5:1 E5:2 E5:1 E5:1 E5:2 E5:1 G5:1 C5:1.5 D5:.5 E5:4 ';
    var jB1 = 'F5:1 F5:1 F5:1.5 F5:.5 F5:1 E5:1 E5:1 E5:.5 E5:.5 E5:1 D5:1 D5:1 E5:1 D5:2 G5:2 ';
    var jB2 = 'F5:1 F5:1 F5:1.5 F5:.5 F5:1 E5:1 E5:1 E5:.5 E5:.5 G5:1 G5:1 F5:1 D5:1 C5:4';
    var C = ['C3', 'G3', 'C4', 'E4'], F = ['F2', 'C3', 'F3', 'A3'], G = ['G2', 'D3', 'G3', 'B3'];
    section({ bpm: 126, bpb: 4, melody: jA + jB1 + jA + jB2,
      chords: [C, C, C, C, F, F, C, G, C, C, C, C, F, F, G, C] });
    var G3 = ['G2', 'B3', 'D4'], C3 = ['C3', 'E3', 'G3'], D3 = ['D3', 'F#3', 'A3'];
    section({ bpm: 116, bpb: 3, pickup: 1,
      melody: 'D5:1 G5:1 G5:.5 A5:.5 G5:.5 F#5:.5 E5:1 E5:1 E5:1 A5:1 A5:.5 B5:.5 A5:.5 G5:.5 F#5:1 D5:1 D5:1 B5:1 B5:.5 C6:.5 B5:.5 A5:.5 G5:1 E5:1 E5:.5 E5:.5 E5:1 A5:1 F#5:1 G5:3',
      chords: [G3, C3, D3, D3, G3, C3, D3, G3] });
    t += 1.2;
    events.sort(function (a, b) { return a.t - b.t; });
    return { events: events, len: t };
  }

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      var comp = ctx.createDynamicsCompressor();
      master = ctx.createGain(); musicGain = ctx.createGain(); sfxGain = ctx.createGain();
      musicGain.gain.value = 0.9; sfxGain.gain.value = 0.9;
      musicGain.connect(master); sfxGain.connect(master); master.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var s = NY.data().settings;
      applyVol(s.muted ? 0 : s.vol);
      song = buildSong();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  function applyVol(v) {
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(Math.pow(v, 1.6), ctx.currentTime, 0.04);
  }

  /* ---------- Инструменты ---------- */
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function bell(f, t, d) {
    var parts = [[1, 0.2, 1], [2.005, 0.07, 0.55], [4.1, 0.025, 0.3]];
    parts.forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * p[0];
      env(g, t, 0.006, p[1], Math.max(0.5, d * 1.5) * p[2]);
      o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 2.2);
    });
  }
  function bass(f, t, d) {
    var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 520;
    env(g, t, 0.015, 0.16, d);
    o.connect(lp); lp.connect(g); g.connect(musicGain); o.start(t); o.stop(t + d + 0.1);
  }
  function pad(fs, t, d) {
    fs.forEach(function (f) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f / 2 * 2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.018, t + 0.12);
      g.gain.linearRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + d + 0.05);
    });
  }
  function shake(t, acc) {
    var s = ctx.createBufferSource(), g = ctx.createGain(), hp = ctx.createBiquadFilter();
    s.buffer = noiseBuf; hp.type = 'highpass'; hp.frequency.value = 7000;
    env(g, t, 0.004, acc ? 0.05 : 0.026, 0.06);
    s.connect(hp); hp.connect(g); g.connect(musicGain); s.start(t, Math.random() * 0.3, 0.12);
  }
  function play(ev, when) {
    if (ev.k === 'lead') bell(ev.f, when, ev.d);
    else if (ev.k === 'bass' || ev.k === 'bass2') bass(ev.f, when, ev.d);
    else if (ev.k === 'pad') pad(ev.f, when, ev.d);
    else if (ev.k === 'shake') shake(when, ev.acc);
  }

  function tick() {
    var now = ctx.currentTime;
    for (var guard = 0; guard < 400; guard++) {
      var ev = song.events[idx], when = loopStart + ev.t;
      if (when > now + 0.6) break;
      if (when >= now - 0.05) play(ev, Math.max(when, now));
      idx++;
      if (idx >= song.events.length) { idx = 0; loopStart += song.len; }
    }
  }

  var A = NY.audio = {
    init: function () { return ensure(); },
    start: function () {
      if (!ensure()) return;
      if (playing) return;
      playing = true;
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.2);
      loopStart = ctx.currentTime + 0.15 - song.events[idx].t;
      tick(); timer = setInterval(tick, 120);
      NY.emit('audio');
    },
    pause: function () {
      if (!ctx || !playing) return;
      playing = false; clearInterval(timer);
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.06);
      NY.emit('audio');
    },
    toggle: function () { if (playing) A.pause(); else A.start(); },
    isPlaying: function () { return playing; },
    restart: function () { idx = 0; if (playing) { A.pause(); } A.start(); },
    volume: function () { return NY.data().settings.vol; },
    setVolume: function (v) {
      var s = NY.data().settings; s.vol = v; if (v > 0) s.muted = false; NY.save();
      if (ctx) applyVol(s.muted ? 0 : v); NY.emit('audio');
    },
    muted: function () { return NY.data().settings.muted; },
    setMuted: function (m) {
      var s = NY.data().settings; s.muted = m; NY.save();
      if (ctx) applyVol(m ? 0 : s.vol); NY.emit('audio');
    },
    sfx: function (name) {
      if (!ctx || NY.data().settings.muted) return;
      var fn = SFX[name]; if (fn) fn(ctx.currentTime + 0.005);
    }
  };

  /* ---------- Звуковые эффекты ---------- */
  function tone(t, f, d, type, vol, slideTo) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + d);
    env(g, t, 0.006, vol || 0.1, d);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + d + 0.05);
  }
  function noise(t, d, vol, hz, type) {
    var s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf; f.type = type || 'lowpass'; f.frequency.setValueAtTime(hz, t);
    if ((type || 'lowpass') === 'lowpass') f.frequency.exponentialRampToValueAtTime(80, t + d);
    env(g, t, 0.004, vol, d);
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t, Math.random() * 0.2, d + 0.05);
  }
  function arp(t, notes, step, type, vol) { notes.forEach(function (n, i) { tone(t + i * step, n, 0.35, type || 'sine', vol || 0.08); }); }
  var SFX = {
    click: function (t) { tone(t, 740, 0.07, 'sine', 0.09, 980); },
    back:  function (t) { tone(t, 600, 0.08, 'sine', 0.08, 420); },
    jump:  function (t) { tone(t, 300, 0.14, 'square', 0.035, 640); },
    hit:   function (t) { noise(t, 0.3, 0.2, 900); tone(t, 170, 0.3, 'sawtooth', 0.1, 55); },
    milestone: function (t) { arp(t, [784, 988], 0.08, 'sine', 0.06); },
    catch: function (t) { tone(t, 620, 0.1, 'triangle', 0.1, 980); },
    gold:  function (t) { arp(t, [784, 988, 1175, 1568], 0.06, 'triangle', 0.08); },
    ice:   function (t) { noise(t, 0.25, 0.12, 6000, 'highpass'); tone(t, 260, 0.25, 'sawtooth', 0.06, 110); },
    move:  function (t) { tone(t, 380, 0.07, 'triangle', 0.12, 250); },
    capture: function (t) { tone(t, 300, 0.1, 'triangle', 0.14, 160); noise(t, 0.08, 0.08, 2500); },
    check: function (t) { tone(t, 660, 0.12, 'square', 0.04); tone(t + 0.12, 880, 0.18, 'square', 0.04); },
    win:   function (t) { arp(t, [523, 659, 784, 1047, 1319], 0.1, 'triangle', 0.09); },
    ach:   function (t) { arp(t, [880, 1109, 1319, 1760], 0.07, 'sine', 0.08); },
    boom:  function (t) { noise(t, 0.7, 0.16, 1400); tone(t, 110, 0.5, 'sine', 0.16, 40); },
    crackle: function (t) { for (var i = 0; i < 6; i++) noise(t + 0.15 + i * 0.05 + Math.random() * 0.04, 0.03, 0.03, 7000, 'highpass'); },
    whistle: function (t) { tone(t, 500, 0.5, 'sine', 0.035, 1800); },
    magic: function (t) { arp(t, [523, 659, 784, 988, 1175, 1568, 2093], 0.09, 'sine', 0.06); },
    shake: function (t) { for (var i = 0; i < 9; i++) noise(t + i * 0.05, 0.05, 0.04, 8000, 'highpass'); },
    tick:  function (t) { tone(t, 1200, 0.03, 'sine', 0.03); }
  };

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
})();
