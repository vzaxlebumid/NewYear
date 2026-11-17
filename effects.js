/* Визуальные эффекты: снег, фейерверки, искры, ёлка. */
(function () {
  'use strict';
  var NY = window.NY, $ = NY.$;

  /* ---------- Фоновый снег ---------- */
  var snow = { cv: null, g: null, flakes: [], on: true, raf: 0, w: 0, h: 0, last: 0 };
  function snowCount() { return NY.isLight() ? 40 : Math.min(130, Math.round(window.innerWidth / 11)); }
  function snowResize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    snow.w = window.innerWidth; snow.h = window.innerHeight;
    snow.cv.width = snow.w * dpr; snow.cv.height = snow.h * dpr;
    snow.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = snowCount();
    while (snow.flakes.length < n) snow.flakes.push(mkFlake(true));
    snow.flakes.length = n;
  }
  function mkFlake(anywhere) {
    var z = Math.random();
    return { x: Math.random() * snow.w, y: anywhere ? Math.random() * snow.h : -10, r: 0.8 + z * 2.4, v: 18 + z * 46, d: Math.random() * 6.28, s: 0.4 + Math.random() * 0.8, a: 0.25 + z * 0.55 };
  }
  function snowFrame(ts) {
    snow.raf = requestAnimationFrame(snowFrame);
    var dt = Math.min(0.05, (ts - snow.last) / 1000 || 0.016); snow.last = ts;
    var g = snow.g; g.clearRect(0, 0, snow.w, snow.h);
    g.fillStyle = '#eaf6ff';
    for (var i = 0; i < snow.flakes.length; i++) {
      var f = snow.flakes[i];
      f.y += f.v * dt; f.d += f.s * dt; f.x += Math.sin(f.d) * 14 * dt;
      if (f.y > snow.h + 8) { snow.flakes[i] = f = mkFlake(false); }
      g.globalAlpha = f.a; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;
  }
  function snowStart() { if (!snow.raf && snow.on) { snow.last = performance.now(); snow.raf = requestAnimationFrame(snowFrame); } }
  function snowStop() { cancelAnimationFrame(snow.raf); snow.raf = 0; }

  /* ---------- Фейерверки и искры ---------- */
  var fx = { cv: null, g: null, p: [], rockets: [], raf: 0, w: 0, h: 0, last: 0, emitters: [] };
  var COLORS = ['#ffd27a', '#8ff3da', '#a7d8ff', '#ff9bb8', '#c9b3ff', '#fff2c4'];
  function fxMax() { return NY.isLight() ? 160 : 420; }
  function fxResize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    fx.w = window.innerWidth; fx.h = window.innerHeight;
    fx.cv.width = fx.w * dpr; fx.cv.height = fx.h * dpr;
    fx.g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function burst(x, y, color, n) {
    var max = fxMax();
    n = Math.min(n, Math.max(0, max - fx.p.length));
    var col2 = NY.pick(COLORS), ring = Math.random() < 0.4;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * 6.283 + Math.random() * 0.1, sp = ring ? 150 + Math.random() * 20 : 40 + Math.random() * 190;
      fx.p.push({ x: x, y: y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, dec: 0.5 + Math.random() * 0.45, c: i % 3 ? color : col2, g: 120, sz: 1.6 });
    }
  }
  function launch(tx, ty, color) {
    fx.rockets.push({ x: tx + NY.rand(-40, 40), y: fx.h + 10, ty: ty, vy: -NY.rand(520, 680), c: color || NY.pick(COLORS), trail: [] });
    NY.audio.sfx('whistle');
  }
  function sparkle(x, y, col) {
    if (fx.p.length >= fxMax()) return;
    fx.p.push({ x: x, y: y, px: x, py: y, vx: NY.rand(-14, 14), vy: -NY.rand(14, 40), life: 1, dec: 0.45 + Math.random() * 0.4, c: col || '#ffe4a0', g: -4, sz: 1.2 + Math.random() * 1.4 });
  }
  function fxFrame(ts) {
    fx.raf = requestAnimationFrame(fxFrame);
    var dt = Math.min(0.05, (ts - fx.last) / 1000 || 0.016); fx.last = ts;
    var g = fx.g, i, p;
    g.clearRect(0, 0, fx.w, fx.h);
    for (i = fx.emitters.length - 1; i >= 0; i--) {
      var e = fx.emitters[i];
      e.acc += dt * e.rate;
      while (e.acc >= 1) { e.acc -= 1; var pt = e.fn(); if (pt) sparkle(pt[0], pt[1], pt[2]); }
    }
    for (i = fx.rockets.length - 1; i >= 0; i--) {
      var r = fx.rockets[i];
      r.y += r.vy * dt; r.vy += 260 * dt;
      r.trail.push(r.x, r.y); if (r.trail.length > 12) r.trail.splice(0, 2);
      g.strokeStyle = r.c; g.globalAlpha = 0.8; g.lineWidth = 2; g.beginPath(); g.moveTo(r.trail[0], r.trail[1]);
      for (var k = 2; k < r.trail.length; k += 2) g.lineTo(r.trail[k], r.trail[k + 1]);
      g.stroke();
      if (r.y <= r.ty || r.vy > -60) {
        burst(r.x, r.y, r.c, NY.isLight() ? 38 : 70); fx.rockets.splice(i, 1);
        NY.audio.sfx('boom'); NY.audio.sfx('crackle');
      }
    }
    g.lineCap = 'round';
    for (i = fx.p.length - 1; i >= 0; i--) {
      p = fx.p[i];
      p.px = p.x; p.py = p.y;
      p.vx *= 1 - 0.9 * dt; p.vy = p.vy * (1 - 0.9 * dt) + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.dec * dt;
      if (p.life <= 0) { fx.p[i] = fx.p[fx.p.length - 1]; fx.p.pop(); continue; }
      g.globalAlpha = Math.min(1, p.life * 1.4); g.strokeStyle = p.c; g.lineWidth = p.sz;
      g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x + 0.01, p.y); g.stroke();
    }
    g.globalAlpha = 1;
    if (!fx.p.length && !fx.rockets.length && !fx.emitters.length) { cancelAnimationFrame(fx.raf); fx.raf = 0; g.clearRect(0, 0, fx.w, fx.h); }
  }
  function fxKick() { if (!fx.raf) { fx.last = performance.now(); fx.raf = requestAnimationFrame(fxFrame); } }

  /* ---------- Ёлка (SVG генерируется кодом) ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function el(n, a, parent) {
    var e = document.createElementNS(SVGNS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  // Детерминированный генератор, чтобы ёлка выглядела одинаково при повторе
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

  function buildTree(host) {
    host.innerHTML = '';
    var svg = el('svg', { viewBox: '0 0 400 540', class: 'tree-svg', 'aria-hidden': 'true' }, host);
    var defs = el('defs', {}, svg);
    var lg = el('linearGradient', { id: 'tg', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': '#2f9d82' }, lg); el('stop', { offset: '1', 'stop-color': '#0d4a46' }, lg);
    var sg = el('radialGradient', { id: 'sg' }, defs);
    el('stop', { offset: '0', 'stop-color': '#fff6cf' }, sg); el('stop', { offset: '1', 'stop-color': '#ffbd4a' }, sg);
    var tr = el('linearGradient', { id: 'trk', x1: '0', x2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': '#5a3a2a' }, tr); el('stop', { offset: '1', 'stop-color': '#37241d' }, tr);

    var r = rng(2027), cx = 200;
    el('rect', { x: 182, y: 470, width: 36, height: 44, fill: 'url(#trk)', rx: 3 }, svg);

    var tiers = [{ y0: 395, y1: 480, hw: 150 }, { y0: 305, y1: 420, hw: 125 }, { y0: 215, y1: 335, hw: 100 }, { y0: 130, y1: 250, hw: 74 }, { y0: 62, y1: 160, hw: 50 }];
    var bulbs = [], orn = [];
    tiers.forEach(function (t, i) {
      var g = el('g', { class: 'tier t' + i }, svg);
      var d = 'M' + cx + ' ' + t.y0 + ' L' + (cx + t.hw) + ' ' + (t.y1 - 12);
      var segs = 5;
      for (var s = 1; s <= segs; s++) {
        var x = cx + t.hw - (2 * t.hw * s / segs);
        d += ' Q' + (x + t.hw / segs) + ' ' + (t.y1 + 8) + ' ' + x + ' ' + (t.y1 - 12);
      }
      d += ' Z';
      el('path', { d: d, fill: 'url(#tg)' }, g);
      el('path', { d: 'M' + cx + ' ' + t.y0 + ' L' + (cx + t.hw) + ' ' + (t.y1 - 12) + ' L' + (cx + t.hw * 0.2) + ' ' + (t.y1 - 4) + ' Z', fill: '#000', opacity: '0.14' }, g);
      // снег на ветках
      var sn = 'M' + (cx - t.hw * 0.55) + ' ' + (t.y0 + (t.y1 - t.y0) * 0.55);
      for (var q = 1; q <= 4; q++) sn += ' q' + (t.hw * 0.14) + ' ' + (10 + (q % 2) * 6) + ' ' + (t.hw * 0.275) + ' 0';
      el('path', { d: sn, fill: 'none', stroke: '#e9f6ff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.85 }, g);
      // гирлянда по дуге яруса
      var gy = t.y0 + (t.y1 - t.y0) * 0.62, gh = t.hw * 0.78 * (0.75 + 0.25 * (t.y1 - t.y0) / 120);
      var path = el('path', { d: 'M' + (cx - gh) + ' ' + gy + ' Q' + cx + ' ' + (gy + 34) + ' ' + (cx + gh) + ' ' + gy, fill: 'none', stroke: '#d8c28a', 'stroke-width': 1.5, opacity: 0.7, class: 'garland' }, g);
      var nb = Math.round(5 + t.hw / 28);
      for (var b = 0; b < nb; b++) {
        var u = (b + 0.5) / nb, bx = (1 - u) * (1 - u) * (cx - gh) + 2 * u * (1 - u) * cx + u * u * (cx + gh), by = (1 - u) * (1 - u) * gy + 2 * u * (1 - u) * (gy + 34) + u * u * gy;
        var col = ['#ffd27a', '#8ff3da', '#ff9bb8', '#a7d8ff'][(b + i) % 4];
        var bulb = el('circle', { cx: bx, cy: by + 2, r: 4.2, fill: col, class: 'bulb', style: 'animation-delay:' + (r() * 2.4).toFixed(2) + 's' }, g);
        bulbs.push(bulb);
      }
      // шары
      for (var o = 0; o < 3 + i % 2; o++) {
        var oy = t.y0 + (t.y1 - t.y0) * (0.35 + r() * 0.5), half = t.hw * ((oy - t.y0) / (t.y1 - t.y0)) * 0.8;
        var ox = cx + (r() * 2 - 1) * half;
        el('circle', { cx: ox, cy: oy, r: 6.5 - i * 0.4, fill: ['#ff9bb8', '#a7d8ff', '#ffd27a', '#c9b3ff'][(o + i) % 4], stroke: 'rgba(255,255,255,.45)', 'stroke-width': 1, class: 'orn' }, g);
        el('circle', { cx: ox - 2, cy: oy - 2, r: 1.8, fill: '#fff', opacity: 0.8 }, g);
      }
    });
    // звезда
    var star = el('g', { class: 'star' }, svg);
    var pts = [];
    for (var s = 0; s < 10; s++) { var rad = s % 2 ? 11 : 26, ang = -Math.PI / 2 + s * Math.PI / 5; pts.push((cx + Math.cos(ang) * rad).toFixed(1) + ',' + (50 + Math.sin(ang) * rad).toFixed(1)); }
    el('circle', { cx: cx, cy: 50, r: 44, fill: 'url(#sg)', opacity: 0.1, class: 'star-halo' }, star);
    el('polygon', { points: pts.join(' '), fill: 'url(#sg)', stroke: '#fff1bd', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, star);
    // подарки у ёлки
    var gifts = [[96, 492, 44, 34, '#a7d8ff', '#fff'], [138, 500, 30, 26, '#ff9bb8', '#ffe6a8'], [250, 494, 46, 32, '#c9b3ff', '#8ff3da'], [214, 504, 28, 22, '#ffd27a', '#ff9bb8']];
    var gg = el('g', { class: 'gifts' }, svg);
    gifts.forEach(function (x) {
      el('rect', { x: x[0], y: x[1], width: x[2], height: x[3], rx: 3, fill: x[4] }, gg);
      el('rect', { x: x[0] + x[2] / 2 - 3, y: x[1], width: 6, height: x[3], fill: x[5], opacity: 0.9 }, gg);
      el('rect', { x: x[0], y: x[1] + x[3] / 2 - 3, width: x[2], height: 6, fill: x[5], opacity: 0.9 }, gg);
    });
    return svg;
  }

  NY.fx = {
    init: function () {
      snow.cv = $('#snow'); snow.g = snow.cv.getContext('2d');
      fx.cv = $('#fx'); fx.g = fx.cv.getContext('2d');
      snowResize(); fxResize(); snowStart();
      var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { snowResize(); fxResize(); }, 150); });
    },
    snowOn: function (v) { snow.on = v; if (v) snowStart(); else snowStop(); },
    refresh: function () { snowResize(); },
    burst: function (x, y, c, n) { burst(x, y, c || NY.pick(COLORS), n || 60); fxKick(); },
    launch: function (x, y, c) { launch(x, y, c); fxKick(); },
    emitter: function (rate, fn) { var e = { rate: rate, acc: 0, fn: fn }; fx.emitters.push(e); fxKick(); return e; },
    stopEmitter: function (e) { var i = fx.emitters.indexOf(e); if (i >= 0) fx.emitters.splice(i, 1); },
    clear: function () { fx.p.length = 0; fx.rockets.length = 0; fx.emitters.length = 0; },
    buildTree: buildTree,
    COLORS: COLORS
  };
})();
