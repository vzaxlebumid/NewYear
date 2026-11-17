/* Catch the Gifts — аркада: лови подарки мешком Санты, избегай льдинок. */
(function () {
  'use strict';
  var NY = window.NY;
  var W = 480, H = 640, TIME = 60;
  var st, cv, g, root, raf, overlay, hud, alive = false, handlers = [], dpr, keys = {};
  var COLS = [['#ff7d9c', '#ffe6a8'], ['#7cf0d0', '#ffffff'], ['#ffc15e', '#ff7d9c'], ['#a592ff', '#7cf0d0'], ['#75c8ff', '#ffffff']];

  function addH(t, ev, fn, o) { t.addEventListener(ev, fn, o); handlers.push([t, ev, fn, o]); }

  function reset() {
    st = { state: 'idle', time: TIME, score: 0, combo: 0, items: [], parts: [], texts: [], spawn: 0.6, elapsed: 0, last: 0, freeze: 0, flash: 0, goldCaught: false,
      p: { x: W / 2, tx: W / 2, w: 104, y: H - 76 }, stars: [] , caught: 0};
    for (var i = 0; i < 50; i++) st.stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6 });
  }

  function mount(stage) {
    root = stage; alive = true; keys = {};
    stage.innerHTML = '<div class="gv-hud gifts-hud"><span>Очки <b id="gf-score">0</b></span><span>Время <b id="gf-time">60</b></span><span>Серия <b id="gf-combo">x1</b></span><span>Рекорд <b id="gf-best">0</b></span></div>' +
      '<div class="gf-wrap"><canvas id="gf-cv" aria-label="Игра Catch the Gifts"></canvas><div class="gv-overlay" id="gf-ov"></div></div>' +
      '<p class="gv-hint">Стрелки ← → или A / D. На телефоне — веди пальцем. Лови подарки, обходи льдинки.</p>';
    cv = NY.$('#gf-cv', stage); g = cv.getContext('2d'); overlay = NY.$('#gf-ov', stage);
    hud = { score: NY.$('#gf-score', stage), time: NY.$('#gf-time', stage), combo: NY.$('#gf-combo', stage), best: NY.$('#gf-best', stage) };
    hud.best.textContent = NY.best('gifts');
    fit(); reset(); showOverlay('start');
    addH(window, 'resize', fit);
    addH(window, 'keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
      keys[e.code] = true;
      if ((e.code === 'Space' || e.code === 'Enter') && st.state !== 'play') act();
    });
    addH(window, 'keyup', function (e) { keys[e.code] = false; });
    var wrap = cv.parentNode;
    function pm(e) { var r = cv.getBoundingClientRect(); st.p.tx = NY.clamp((e.clientX - r.left) / r.width * W, st.p.w / 2, W - st.p.w / 2); }
    addH(wrap, 'pointermove', function (e) { if (st.state === 'play') pm(e); });
    addH(wrap, 'pointerdown', function (e) { if (e.target.closest('button')) return; if (st.state === 'play') pm(e); });
    addH(document, 'visibilitychange', function () { if (document.hidden && st.state === 'play') { st.state = 'paused'; showOverlay('pause'); } });
    st.last = performance.now(); raf = requestAnimationFrame(loop);
  }

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var wrap = cv.parentNode, maxH = Math.max(320, window.innerHeight - 220);
    var w = Math.min(wrap.clientWidth || 480, 520, maxH * W / H);
    cv.style.width = w + 'px'; cv.style.height = (w * H / W) + 'px';
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
    overlay.style.width = cv.style.width; overlay.style.height = cv.style.height;
  }

  function act() {
    if (st.state === 'idle' || st.state === 'over') { reset(); st.state = 'play'; hideOverlay(); NY.audio.sfx('click'); updateHud(true); }
    else if (st.state === 'paused') { st.state = 'play'; st.last = performance.now(); hideOverlay(); }
  }
  function showOverlay(kind) {
    var h = '';
    if (kind === 'start') h = '<h3>Catch the Gifts</h3><p>60 секунд. Лови подарки, держи серию и не лови льдинки.</p><button class="btn">Начать</button>';
    else if (kind === 'pause') h = '<h3>Пауза</h3><button class="btn">Продолжить</button>';
    else { var r = st.rec; h = '<h3>Время вышло</h3><p class="big">' + st.score + ' очков</p><p>' + (r.isNew ? 'Новый рекорд!' : 'Рекорд: ' + r.best) + '</p><button class="btn">Сыграть ещё</button>'; }
    overlay.innerHTML = h; overlay.classList.add('show');
    NY.$('button', overlay).addEventListener('click', function (e) { e.stopPropagation(); act(); });
  }
  function hideOverlay() { overlay.classList.remove('show'); }

  function updateHud(force) {
    var t = Math.ceil(st.time);
    if (force || hud.score.textContent !== '' + st.score) hud.score.textContent = st.score;
    if (force || hud.time.textContent !== '' + t) hud.time.textContent = t;
    var m = mult(); hud.combo.textContent = 'x' + m;
  }
  function mult() { return 1 + Math.min(3, Math.floor(st.combo / 5)); }

  function spawn() {
    var d = st.elapsed, r = Math.random();
    var iceP = Math.min(0.28, 0.12 + d * 0.0025);
    var speed = 190 + Math.min(230, d * 4.2);
    if (r < 0.055) st.items.push({ k: 'gold', x: NY.rand(30, W - 30), y: -40, s: 36, v: speed * 1.05, rot: 0, vr: 2.5, pts: 100 });
    else if (r < 0.055 + iceP) st.items.push({ k: 'ice', x: NY.rand(24, W - 24), y: -40, s: 34, v: speed * 1.1, rot: 0, vr: NY.rand(-2, 2) });
    else {
      var sizes = [[28, 10], [38, 20], [50, 30]], sz = NY.pick(sizes), c = NY.pick(COLS);
      st.items.push({ k: 'gift', x: NY.rand(30, W - 30), y: -40, s: sz[0], v: speed * NY.rand(0.85, 1.1), rot: NY.rand(-0.3, 0.3), vr: NY.rand(-1, 1), pts: sz[1], c: c });
    }
  }

  function loop(ts) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.04, (ts - st.last) / 1000 || 0.016); st.last = ts;
    if (st.state === 'play') update(dt);
    draw(dt);
  }

  function floatText(x, y, t, c) { st.texts.push({ x: x, y: y, t: t, c: c, l: 1 }); }
  function puff(x, y, c, n) { for (var i = 0; i < n; i++) st.parts.push({ x: x, y: y, vx: NY.rand(-130, 130), vy: -NY.rand(40, 200), l: 1, c: c }); }

  function update(dt) {
    var p = st.p;
    st.time -= dt; st.elapsed += dt;
    if (st.time <= 0) { st.time = 0; return finish(); }
    var spd = st.freeze > 0 ? 0.35 : 1; st.freeze = Math.max(0, st.freeze - dt);
    var dir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    if (dir) p.tx = NY.clamp(p.tx + dir * 620 * spd * dt, p.w / 2, W - p.w / 2);
    p.x += (p.tx - p.x) * Math.min(1, dt * 14 * spd);
    st.spawn -= dt;
    if (st.spawn <= 0) { spawn(); st.spawn = Math.max(0.3, 0.85 - st.elapsed * 0.009) * NY.rand(0.75, 1.15); }
    for (var i = st.items.length - 1; i >= 0; i--) {
      var it = st.items[i]; it.y += it.v * dt; it.rot += it.vr * dt;
      var rimY = p.y, half = it.s / 2;
      if (it.y + half >= rimY && it.y - half <= rimY + 26 && Math.abs(it.x - p.x) < p.w / 2 + half * 0.35) { catchIt(it); st.items.splice(i, 1); continue; }
      if (it.y - half > H) {
        if (it.k !== 'ice') st.combo = 0;
        st.items.splice(i, 1);
      }
    }
    for (i = st.parts.length - 1; i >= 0; i--) { var q = st.parts[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 520 * dt; q.l -= dt * 1.6; if (q.l <= 0) st.parts.splice(i, 1); }
    for (i = st.texts.length - 1; i >= 0; i--) { var t = st.texts[i]; t.y -= 46 * dt; t.l -= dt * 1.1; if (t.l <= 0) st.texts.splice(i, 1); }
    st.flash = Math.max(0, st.flash - dt * 2);
    updateHud();
  }

  function catchIt(it) {
    var p = st.p;
    if (it.k === 'ice') {
      st.score = Math.max(0, st.score - 15); st.combo = 0; st.freeze = 0.9; st.flash = 1;
      floatText(it.x, p.y - 10, '−15', '#9fd9ff'); puff(it.x, p.y, '#bfe9ff', 14); NY.audio.sfx('ice');
    } else if (it.k === 'gold') {
      st.combo++; var pts = it.pts * mult(); st.score += pts; st.time = Math.min(TIME + 10, st.time + 4);
      floatText(it.x, p.y - 10, '+' + pts + ' и +4 с', '#ffd27a'); puff(it.x, p.y, '#ffd27a', 26); NY.audio.sfx('gold'); NY.achieve('gold');
    } else {
      st.combo++; var gp = it.pts * mult(); st.score += gp; st.caught++;
      floatText(it.x, p.y - 10, '+' + gp, it.c[0]); puff(it.x, p.y, it.c[0], 10); NY.audio.sfx('catch');
    }
  }

  function finish() {
    st.state = 'over'; NY.audio.sfx('win');
    st.rec = NY.record('gifts', st.score); hud.best.textContent = st.rec.best; updateHud(true);
    if (st.score >= 150) NY.achieve('gift150'); if (st.score >= 400) NY.achieve('gift400');
    setTimeout(function () { if (alive && st.state === 'over') showOverlay('over'); }, 350);
  }

  /* ---------- Отрисовка ---------- */
  function draw(dt) {
    var s = cv.width / W; g.setTransform(s, 0, 0, s, 0, 0);
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b1236'); sky.addColorStop(0.7, '#25346d'); sky.addColorStop(1, '#4a5f9b');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    var tt = performance.now() / 1000, i;
    g.fillStyle = '#fff';
    for (i = 0; i < st.stars.length; i++) { var a = st.stars[i]; g.globalAlpha = 0.35 + 0.5 * Math.sin(tt * 1.4 + a.p); g.beginPath(); g.arc(a.x, a.y, a.r, 0, 6.283); g.fill(); }
    g.globalAlpha = 1;
    // силуэт крыш
    g.fillStyle = '#121c45';
    for (i = 0; i < 8; i++) { var bx = i * 66 - 10, bh = 70 + ((i * 37) % 50); g.fillRect(bx, H - bh, 54, bh); g.beginPath(); g.moveTo(bx - 4, H - bh); g.lineTo(bx + 27, H - bh - 28); g.lineTo(bx + 58, H - bh); g.fill(); }
    g.fillStyle = '#ffd27a';
    for (i = 0; i < 8; i++) { if ((i * 5 + 1) % 3) g.fillRect(i * 66 + 10, H - 50 - ((i * 37) % 50) + 12, 9, 11); }
    g.fillStyle = '#eaf4ff'; g.fillRect(0, H - 22, W, 22);
    // предметы
    for (i = 0; i < st.items.length; i++) item(st.items[i]);
    sack(st.p);
    for (i = 0; i < st.parts.length; i++) { var q = st.parts[i]; g.globalAlpha = Math.max(0, q.l); g.fillStyle = q.c; g.fillRect(q.x, q.y, 4, 4); }
    g.globalAlpha = 1;
    g.font = '700 20px system-ui, sans-serif'; g.textAlign = 'center';
    for (i = 0; i < st.texts.length; i++) { var t = st.texts[i]; g.globalAlpha = Math.max(0, t.l); g.fillStyle = t.c; g.fillText(t.t, t.x, t.y); }
    g.globalAlpha = 1;
    if (st.flash > 0) { g.fillStyle = 'rgba(150,215,255,' + st.flash * 0.28 + ')'; g.fillRect(0, 0, W, H); }
    if (st.freeze > 0) { g.strokeStyle = 'rgba(160,220,255,.55)'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6); }
  }

  function item(it) {
    g.save(); g.translate(it.x, it.y); g.rotate(it.rot);
    var h = it.s / 2;
    if (it.k === 'ice') {
      g.fillStyle = '#bfe9ff'; g.strokeStyle = '#eaf9ff'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, -h * 1.1); g.lineTo(h * 0.55, -h * 0.1); g.lineTo(h * 0.25, h * 1.1); g.lineTo(-h * 0.3, h * 0.6); g.lineTo(-h * 0.6, -h * 0.2); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(-2, -h * 0.8); g.lineTo(h * 0.2, -h * 0.1); g.lineTo(-h * 0.2, 0); g.fill();
    } else {
      var c1 = it.k === 'gold' ? '#ffcc4d' : it.c[0], c2 = it.k === 'gold' ? '#fff2b8' : it.c[1];
      if (it.k === 'gold') { g.fillStyle = 'rgba(255,214,110,.22)'; g.beginPath(); g.arc(0, 0, h * 1.7 + Math.sin(performance.now() / 150) * 2, 0, 6.283); g.fill(); }
      g.fillStyle = c1; rr(-h, -h, it.s, it.s, 4); g.fill();
      g.fillStyle = c2; g.fillRect(-it.s * 0.07, -h, it.s * 0.14, it.s); g.fillRect(-h, -it.s * 0.07, it.s, it.s * 0.14);
      g.strokeStyle = c2; g.lineWidth = 2.2; g.beginPath(); g.ellipse(-h * 0.3, -h - 3, h * 0.3, h * 0.22, -0.5, 0, 6.283); g.ellipse(h * 0.3, -h - 3, h * 0.3, h * 0.22, 0.5, 0, 6.283); g.stroke();
    }
    g.restore();
  }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  function sack(p) {
    var x = p.x, y = p.y, w = p.w;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, H - 18, w * 0.5, 6, 0, 0, 6.283); g.fill();
    var gr = g.createLinearGradient(0, y, 0, y + 60); gr.addColorStop(0, '#e4455a'); gr.addColorStop(1, '#a62a43');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - w / 2, y + 4); g.quadraticCurveTo(x - w * 0.62, y + 56, x - w * 0.3, y + 60); g.lineTo(x + w * 0.3, y + 60); g.quadraticCurveTo(x + w * 0.62, y + 56, x + w / 2, y + 4); g.closePath(); g.fill();
    g.fillStyle = '#f6fbff'; g.beginPath(); g.ellipse(x, y + 4, w / 2 + 4, 11, 0, 0, 6.283); g.fill();
    g.fillStyle = '#1b2650'; g.beginPath(); g.ellipse(x, y + 3, w / 2 - 6, 6, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#ffd27a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 10, y + 24); g.quadraticCurveTo(x, y + 34, x + 10, y + 24); g.stroke();
    // помощник — шапочка и глаза
    g.fillStyle = '#ffd7bd'; g.beginPath(); g.arc(x, y + 38, 11, 0, 6.283); g.fill();
    g.fillStyle = '#26324f'; g.beginPath(); g.arc(x - 4, y + 37, 1.5, 0, 6.283); g.arc(x + 4, y + 37, 1.5, 0, 6.283); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y + 43, 7, 4, 0, 0, 3.14); g.fill();
  }

  function destroy() {
    alive = false; cancelAnimationFrame(raf);
    handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2], h[3]); }); handlers = []; keys = {};
    if (root) root.innerHTML = '';
  }
  NY.games.gifts = { title: 'Catch the Gifts', mount: mount, destroy: destroy };
})();
