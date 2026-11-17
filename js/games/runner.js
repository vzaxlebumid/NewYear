/* Santa Runner — бег Санты на санях с оленем по ночному зимнему лесу. */
(function () {
  'use strict';
  var NY = window.NY;
  var W = 900, H = 320, GROUND = 252;
  var st, cv, g, root, raf, overlay, scoreEl, bestEl, dpr, alive = false, handlers = [];

  function addH(t, ev, fn, o) { t.addEventListener(ev, fn, o); handlers.push([t, ev, fn, o]); }

  function reset() {
    st = { state: 'idle', t: 0, speed: 310, dist: 0, score: 0, nextObs: 1.1, obs: [], parts: [], flakes: [], stars: [], last: 0, shake: 0, flash: 0, mile: 0,
      p: { x: 120, y: GROUND, vy: 0, air: false, leg: 0 } };
    for (var i = 0; i < 38; i++) st.flakes.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 1.8, v: 30 + Math.random() * 50 });
    for (i = 0; i < 40; i++) st.stars.push({ x: Math.random() * W, y: Math.random() * 150, r: Math.random() * 1.2 + 0.3, p: Math.random() * 6 });
    st.ridge = []; for (i = 0; i < 14; i++) st.ridge.push(Math.random());
  }

  function mount(stage) {
    root = stage; alive = true;
    stage.innerHTML = '<div class="gv-hud"><span>Очки <b id="rn-score">0</b></span><span>Рекорд <b id="rn-best">0</b></span></div>' +
      '<div class="rn-wrap"><canvas id="rn-cv" aria-label="Игра Santa Runner"></canvas><div class="gv-overlay" id="rn-ov"></div></div>' +
      '<p class="gv-hint">Пробел или ↑ — прыжок. На телефоне — касание экрана. ↓ — быстрее вниз.</p>';
    cv = NY.$('#rn-cv', stage); g = cv.getContext('2d');
    overlay = NY.$('#rn-ov', stage); scoreEl = NY.$('#rn-score', stage); bestEl = NY.$('#rn-best', stage);
    bestEl.textContent = NY.best('runner');
    fit(); reset(); showOverlay('start');
    addH(window, 'resize', fit);
    addH(window, 'keydown', onKey);
    addH(cv.parentNode, 'pointerdown', function (e) { if (e.target.closest('button')) return; e.preventDefault(); act(); });
    addH(document, 'visibilitychange', function () { if (document.hidden && st.state === 'play') pause(); });
    st.last = performance.now(); raf = requestAnimationFrame(loop);
  }

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.parentNode.clientWidth || 800;
    W = w < 640 ? 560 : 900;
    cv.style.height = (w * H / W) + 'px';
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
  }

  function onKey(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); if (!e.repeat) act(); }
    else if (e.code === 'ArrowDown' && st.state === 'play') { st.p.vy += 500; }
    else if (e.code === 'KeyP' && st.state === 'play') pause();
  }

  function act() {
    if (st.state === 'idle') start();
    else if (st.state === 'over') { if (performance.now() - st.overAt > 450) start(); }
    else if (st.state === 'paused') resume();
    else if (st.state === 'play') jump();
  }
  function jump() {
    var p = st.p;
    if (!p.air) { p.vy = -800; p.air = true; NY.audio.sfx('jump'); for (var i = 0; i < 6; i++) spark(p.x + 20, GROUND, -1); }
  }
  function start() {
    var best = st && st.best;
    reset(); st.state = 'play'; hideOverlay(); NY.audio.sfx('click'); scoreEl.textContent = '0';
  }
  function pause() { st.state = 'paused'; showOverlay('pause'); }
  function resume() { st.state = 'play'; hideOverlay(); st.last = performance.now(); }

  function showOverlay(kind) {
    var h = '';
    if (kind === 'start') h = '<h3>Santa Runner</h3><p>Доставь подарки вовремя: перепрыгивай сугробы, снеговиков и ёлки.</p><button class="btn" data-a="go">Поехали</button>';
    else if (kind === 'pause') h = '<h3>Пауза</h3><p>Коснись экрана или нажми пробел, чтобы продолжить.</p><button class="btn" data-a="go">Продолжить</button>';
    else if (kind === 'over') {
      var r = st.rec;
      h = '<h3>Сани перевернулись</h3><p class="big">' + st.score + ' очков</p><p>' + (r.isNew ? 'Новый рекорд!' : 'Рекорд: ' + r.best) + '</p><button class="btn" data-a="go">Ещё заезд</button>';
    }
    overlay.innerHTML = h; overlay.classList.add('show');
    var b = NY.$('button', overlay); if (b) b.addEventListener('click', function (e) { e.stopPropagation(); act(); });
  }
  function hideOverlay() { overlay.classList.remove('show'); }

  function spark(x, y, dir) {
    st.parts.push({ x: x, y: y, vx: dir * NY.rand(40, 140), vy: -NY.rand(20, 120), l: 1, c: Math.random() < 0.5 ? '#ffe4a0' : '#d9f1ff' });
  }

  function spawn() {
    var types = [
      { k: 'drift', w: 62, h: 26 }, { k: 'snowman', w: 36, h: 66 }, { k: 'tree', w: 42, h: 76 }, { k: 'gifts', w: 46, h: 42 }
    ];
    var t = NY.pick(types), x = W + 40;
    st.obs.push({ k: t.k, x: x, w: t.w, h: t.h });
    if (st.dist > 1500 && Math.random() < 0.28) { var t2 = NY.pick([types[0], types[3]]); st.obs.push({ k: t2.k, x: x + t.w + 46 + Math.random() * 20, w: t2.w, h: t2.h }); }
  }

  function loop(ts) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.04, (ts - st.last) / 1000 || 0.016); st.last = ts;
    if (st.state === 'play') update(dt);
    else if (st.state === 'idle') st.t += dt;
    st.t += st.state === 'play' ? dt : 0;
    draw(dt);
  }

  function update(dt) {
    var p = st.p;
    st.speed = Math.min(780, st.speed + 7 * dt);
    st.dist += st.speed * dt;
    var sc = Math.floor(st.dist / 40);
    if (sc !== st.score) {
      st.score = sc; scoreEl.textContent = sc;
      if (sc >= st.mile + 100) { st.mile = Math.floor(sc / 100) * 100; st.flash = 1; NY.audio.sfx('milestone'); }
    }
    p.vy += 2300 * dt; p.y += p.vy * dt;
    if (p.y >= GROUND) { p.y = GROUND; p.vy = 0; p.air = false; }
    p.leg += dt * st.speed * 0.03;
    st.nextObs -= dt;
    if (st.nextObs <= 0) { spawn(); st.nextObs = (0.95 + Math.random() * 0.85) * (460 / st.speed) * 1.45; }
    for (var i = st.obs.length - 1; i >= 0; i--) {
      var o = st.obs[i]; o.x -= st.speed * dt;
      if (o.x + o.w < -20) { st.obs.splice(i, 1); continue; }
      // хитбокс саней уже, чем рисунок
      var px = p.x + 18, pw = 92, py = p.y - 52, ph = 50;
      var ox = o.x + 5, ow = o.w - 10, oy = GROUND - o.h + 6, oh = o.h - 6;
      if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) return crash();
    }
    if (!p.air && Math.random() < 0.5) spark(p.x + 8, GROUND, -1);
    for (i = st.parts.length - 1; i >= 0; i--) {
      var q = st.parts[i]; q.x += q.vx * dt - st.speed * dt * 0.4; q.y += q.vy * dt; q.vy += 300 * dt; q.l -= dt * 1.8;
      if (q.l <= 0) st.parts.splice(i, 1);
    }
  }

  function crash() {
    st.state = 'over'; st.overAt = performance.now(); st.shake = 0.5;
    NY.audio.sfx('hit');
    for (var i = 0; i < 24; i++) spark(st.p.x + 50, st.p.y - 30, Math.random() < 0.5 ? -1 : 1);
    st.rec = NY.record('runner', st.score); bestEl.textContent = st.rec.best;
    if (st.score >= 100) NY.achieve('run100'); if (st.score >= 500) NY.achieve('run500'); if (st.score >= 1000) NY.achieve('run1000');
    setTimeout(function () { if (alive && st.state === 'over') showOverlay('over'); }, 500);
  }

  /* ---------- Отрисовка ---------- */
  function draw(dt) {
    var s = cv.width / W; g.setTransform(s, 0, 0, s, 0, 0);
    if (st.shake > 0) { st.shake -= dt; g.translate(NY.rand(-4, 4) * st.shake * 2, NY.rand(-3, 3) * st.shake * 2); }
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a1233'); sky.addColorStop(0.6, '#1c2c61'); sky.addColorStop(1, '#3a4f86');
    g.fillStyle = sky; g.fillRect(-10, -10, W + 20, H + 20);
    // звёзды
    var tt = performance.now() / 1000, i;
    g.fillStyle = '#fff';
    for (i = 0; i < st.stars.length; i++) { var a = st.stars[i]; g.globalAlpha = 0.4 + 0.5 * Math.sin(tt * 1.5 + a.p); g.beginPath(); g.arc(a.x, a.y, a.r, 0, 6.283); g.fill(); }
    g.globalAlpha = 1;
    // луна
    g.fillStyle = '#fff4d1'; g.beginPath(); g.arc(760, 66, 26, 0, 6.283); g.fill();
    g.fillStyle = '#1c2c61'; g.beginPath(); g.arc(770, 60, 23, 0, 6.283); g.fill();
    var off = st.state === 'idle' ? tt * 30 : st.dist;
    // дальние холмы и ёлки
    layer(off * 0.12, '#25386f', 175, 40, 0.9);
    layer(off * 0.28, '#1a2a58', 205, 34, 1.1);
    pines(off * 0.45, '#0f1c42', 232, 48);
    // земля
    g.fillStyle = '#e6f2ff'; g.fillRect(-10, GROUND - 2, W + 20, H - GROUND + 12);
    g.fillStyle = '#c4dbf3'; g.fillRect(-10, GROUND + 22, W + 20, H);
    g.fillStyle = '#b3cdea';
    for (i = 0; i < 26; i++) { var gx = ((i * 97 - off * 1) % (W + 80) + (W + 80)) % (W + 80) - 40; g.fillRect(gx, GROUND + 8 + (i % 3) * 9, 18 + (i % 4) * 8, 2); }
    // препятствия
    for (i = 0; i < st.obs.length; i++) obstacle(st.obs[i]);
    // санта
    santa(st.p, st.state !== 'over');
    // частицы
    for (i = 0; i < st.parts.length; i++) { var q = st.parts[i]; g.globalAlpha = Math.max(0, q.l); g.fillStyle = q.c; g.fillRect(q.x, q.y, 2.5, 2.5); }
    g.globalAlpha = 1;
    // снег
    g.fillStyle = '#fff'; g.globalAlpha = 0.8;
    for (i = 0; i < st.flakes.length; i++) {
      var f = st.flakes[i];
      if (st.state !== 'paused') { f.y += f.v * dt; f.x -= (st.state === 'play' ? st.speed * 0.25 : 15) * dt; if (f.y > H) { f.y = -4; f.x = Math.random() * W; } if (f.x < -4) f.x = W + 4; }
      g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;
    if (st.flash > 0) { st.flash -= dt * 1.5; g.fillStyle = 'rgba(255,230,160,' + (st.flash * 0.18) + ')'; g.fillRect(0, 0, W, H); }
  }

  function layer(o, col, base, amp, k) {
    g.fillStyle = col; g.beginPath(); g.moveTo(-10, H);
    for (var x = -10; x <= W + 10; x += 20) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin((x + o) * 0.008 * k) * Math.cos((x + o) * 0.0037)));
    g.lineTo(W + 10, H); g.closePath(); g.fill();
  }
  function pines(o, col, base, h) {
    g.fillStyle = col; g.fillRect(-10, base, W + 20, H);
    var step = 70, shift = ((o % step) + step) % step, n = Math.ceil(W / step) + 2, idx0 = Math.floor(o / step);
    for (var i = 0; i < n; i++) {
      var x = i * step - shift, hh = h * (0.7 + 0.5 * ((((idx0 + i) * 7919) % 10) / 10));
      g.beginPath(); g.moveTo(x, base + 4); g.lineTo(x + 20, base - hh * 0.55); g.lineTo(x + 10, base - hh * 0.55); g.lineTo(x + 24, base - hh); g.lineTo(x + 38, base - hh * 0.55); g.lineTo(x + 28, base - hh * 0.55); g.lineTo(x + 48, base + 4); g.closePath(); g.fill();
    }
  }

  function obstacle(o) {
    var x = o.x, y = GROUND;
    if (o.k === 'drift') {
      g.fillStyle = '#f4faff'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - o.h * 1.5, x + o.w * 0.5, y - o.h); g.quadraticCurveTo(x + o.w - 8, y - o.h * 0.9, x + o.w, y); g.fill();
      g.fillStyle = '#c4dbf3'; g.beginPath(); g.ellipse(x + o.w * 0.55, y - 3, o.w * 0.35, 4, 0, 0, 6.283); g.fill();
    } else if (o.k === 'snowman') {
      g.fillStyle = '#f7fbff'; circ(x + 18, y - 17, 17); circ(x + 18, y - 47, 12);
      g.fillStyle = '#26324f'; circ(x + 14, y - 49, 1.6); circ(x + 22, y - 49, 1.6); g.fillRect(x + 8, y - 66, 20, 3); g.fillRect(x + 11, y - 74 + 8, 14, 8);
      g.fillStyle = '#ff9a3c'; g.beginPath(); g.moveTo(x + 19, y - 46); g.lineTo(x + 32, y - 44); g.lineTo(x + 19, y - 43); g.fill();
      g.fillStyle = '#ff6b8a'; g.fillRect(x + 8, y - 37, 20, 4);
    } else if (o.k === 'tree') {
      g.fillStyle = '#4a3226'; g.fillRect(x + 18, y - 8, 6, 8);
      for (var i = 0; i < 3; i++) { g.fillStyle = i % 2 ? '#1f7a66' : '#26907a'; g.beginPath(); g.moveTo(x + 21, y - 76 + i * 20); g.lineTo(x + 40 - i * 2, y - 48 + i * 18); g.lineTo(x + 2 + i * 2, y - 48 + i * 18); g.closePath(); g.fill(); }
      g.fillStyle = '#ffd27a'; circ(x + 21, y - 76, 3);
    } else {
      g.fillStyle = '#ff6b8a'; g.fillRect(x, y - 24, 30, 24); g.fillStyle = '#ffe6a8'; g.fillRect(x + 12, y - 24, 6, 24); g.fillRect(x, y - 15, 30, 5);
      g.fillStyle = '#7ac8ff'; g.fillRect(x + 16, y - 42, 28, 18); g.fillStyle = '#fff'; g.fillRect(x + 27, y - 42, 6, 18); g.fillRect(x + 16, y - 36, 28, 5);
    }
  }
  function circ(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }

  function santa(p, running) {
    var x = p.x, y = p.y, ph = running ? Math.sin(p.leg) : 0, air = p.air;
    g.save();
    if (!running) g.rotate(0.04);
    // полозья
    g.strokeStyle = '#d6b36a'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x + 2, y - 4); g.lineTo(x + 78, y - 4); g.quadraticCurveTo(x + 92, y - 4, x + 90, y - 16); g.stroke();
    // сани
    g.fillStyle = '#c23d55'; g.beginPath(); g.moveTo(x + 6, y - 14); g.lineTo(x + 80, y - 14); g.quadraticCurveTo(x + 84, y - 38, x + 70, y - 40); g.lineTo(x + 14, y - 40); g.quadraticCurveTo(x + 4, y - 36, x + 6, y - 14); g.fill();
    g.fillStyle = '#ffd27a'; g.fillRect(x + 8, y - 26, 72, 3);
    // мешок
    g.fillStyle = '#e6b36a'; g.beginPath(); g.ellipse(x + 26, y - 46, 17, 15, 0, 0, 6.283); g.fill();
    g.fillStyle = '#ffd27a'; g.fillRect(x + 20, y - 62, 12, 6);
    // санта
    g.fillStyle = '#e33d4f'; g.beginPath(); g.ellipse(x + 55, y - 46, 14, 14, 0, 0, 6.283); g.fill();
    g.fillStyle = '#ffd7bd'; circ(x + 58, y - 66, 8);
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x + 60, y - 60, 8, 7, 0, 0, 3.14); g.fill();
    g.fillStyle = '#e33d4f'; g.beginPath(); g.moveTo(x + 49, y - 69); g.lineTo(x + 58, y - 88); g.lineTo(x + 68, y - 68); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.fillRect(x + 49, y - 71, 20, 4); circ(x + 58, y - 88, 3.2);
    g.fillStyle = '#222'; circ(x + 62, y - 67, 1.1);
    // упряжь
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 84, y - 28); g.lineTo(x + 108, y - 34); g.stroke();
    // олень
    var rx = x + 108, ry = y - 8;
    g.strokeStyle = '#7a4d32'; g.lineWidth = 4.5;
    var l1 = air ? -0.9 : ph * 0.7, l2 = air ? 0.6 : -ph * 0.7;
    leg(rx + 4, ry - 22, l1); leg(rx + 22, ry - 22, l2); leg(rx - 6, ry - 22, -l2 * 0.8); leg(rx + 30, ry - 22, -l1 * 0.8);
    g.fillStyle = '#a56a45'; g.beginPath(); g.ellipse(rx + 16, ry - 30, 22, 12, 0, 0, 6.283); g.fill();
    g.fillStyle = '#a56a45'; g.beginPath(); g.moveTo(rx + 28, ry - 36); g.lineTo(rx + 40, ry - 56); g.lineTo(rx + 50, ry - 52); g.lineTo(rx + 38, ry - 26); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(rx + 50, ry - 56, 9, 6.5, 0.3, 0, 6.283); g.fill();
    g.fillStyle = '#e33d4f'; circ(rx + 58, ry - 55, 3.4);
    g.fillStyle = '#222'; circ(rx + 48, ry - 59, 1.2);
    g.strokeStyle = '#e8cfa3'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(rx + 42, ry - 62); g.lineTo(rx + 38, ry - 76); g.moveTo(rx + 40, ry - 70); g.lineTo(rx + 33, ry - 72); g.moveTo(rx + 40, ry - 74); g.lineTo(rx + 46, ry - 79); g.stroke();
    g.restore();
  }
  function leg(x, y, a) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * 14, y + 22 - Math.abs(Math.sin(a)) * 3); g.stroke(); }

  function destroy() {
    alive = false; cancelAnimationFrame(raf);
    handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2], h[3]); }); handlers = [];
    if (root) root.innerHTML = '';
  }

  NY.games.runner = { title: 'Santa Runner', mount: mount, destroy: destroy };
})();
