/* Дополнения: обратный отсчёт, генератор поздравлений, снежный шар. */
(function () {
  'use strict';
  var NY = window.NY, $ = NY.$;

  function plural(n, a, b, c) { var m = n % 100, d = n % 10; return (m > 10 && m < 20) ? c : d === 1 ? a : (d >= 2 && d <= 4) ? b : c; }

  /* ---------- Обратный отсчёт ---------- */
  function newYearInfo(now) {
    now = now || new Date();
    var y = now.getFullYear();
    if (now.getMonth() === 0 && now.getDate() <= 14) return { here: true, year: y };
    return { here: false, year: y + 1, target: new Date(y + 1, 0, 1, 0, 0, 0, 0) };   // 1 января 00:00 по локальному времени
  }
  NY.newYear = newYearInfo;

  function initCountdown() {
    var box = $('#countdown'); if (!box) return;
    var label = $('#cd-label'), cells = { d: $('#cd-d'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s') }, units = $('#cd-units');
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function tick() {
      var info = newYearInfo();
      if (info.here) { label.textContent = 'Новый ' + info.year + ' год уже наступил. С праздником!'; units.hidden = true; return; }
      units.hidden = false;
      label.textContent = 'До Нового ' + info.year + ' года осталось';
      var ms = Math.max(0, info.target - new Date()), s = Math.floor(ms / 1000);
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
      cells.d.firstChild.textContent = d; cells.d.lastChild.textContent = plural(d, 'день', 'дня', 'дней');
      cells.h.firstChild.textContent = pad(h); cells.h.lastChild.textContent = plural(h, 'час', 'часа', 'часов');
      cells.m.firstChild.textContent = pad(m); cells.m.lastChild.textContent = plural(m, 'минута', 'минуты', 'минут');
      cells.s.firstChild.textContent = pad(sec); cells.s.lastChild.textContent = plural(sec, 'секунда', 'секунды', 'секунд');
    }
    tick(); setInterval(tick, 1000);
  }

  /* ---------- Поздравления ---------- */
  var GREET = [
    'Пусть новый год начнётся с хорошей новости, а закончится ещё лучшей.',
    'Желаю тебе тихих зимних вечеров, ярких идей и людей рядом, с которыми тепло без камина.',
    'Пусть всё, что ты загадаешь под бой курантов, окажется чуть проще, чем кажется.',
    'С Новым годом! Пусть в следующем году будет больше поводов смеяться и меньше — спешить.',
    'Пусть снег заметёт все заботы, а огни гирлянд подскажут, куда идти дальше.',
    'Новый год — как чистая страница. Пиши на ней смело и крупным почерком.',
    'Желаю лёгких дорог, добрых встреч и мандаринов ровно столько, чтобы хватило до весны.',
    'Пусть в доме пахнет хвоей, на столе будет что-то вкусное, а на душе — спокойно.',
    'С праздником! Пусть всё важное успевается, а лишнее остаётся в старом году.',
    'Пусть каждый день нового года находит повод для маленького чуда.',
    'Желаю тебе уверенности в себе, друзей рядом и немного волшебства в обычных днях.',
    'Пусть зима будет уютной, весна — щедрой, лето — тёплым, а осень — золотой.',
    'Хочу пожелать смелых планов и лёгкого сердца, чтобы эти планы сбывались.',
    'Пусть звёзды этой ночи светят тебе весь год.'
  ];
  var greetState = { last: -1 };
  function initGreeting() {
    var out = $('#greet-text'), btn = $('#greet-btn'), cp = $('#greet-copy');
    if (!out) return;
    function next() {
      var i; do { i = (Math.random() * GREET.length) | 0; } while (i === greetState.last && GREET.length > 1);
      greetState.last = i;
      out.classList.remove('swap'); void out.offsetWidth;
      out.textContent = GREET[i]; out.classList.add('swap');
      var d = NY.data().counters; d.greet++; NY.save(); if (d.greet >= 5) NY.achieve('greet');
      NY.audio.sfx('click');
    }
    btn.addEventListener('click', next);
    cp.addEventListener('click', function () {
      var txt = out.textContent;
      function ok() { NY.toast('Скопировано', 'Поздравление можно вставить в сообщение.'); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok(); } catch (e) { NY.toast('Не удалось скопировать', 'Выдели текст и скопируй вручную.'); }
        ta.remove();
      }
    });
    var info = newYearInfo();
    out.textContent = 'Нажми кнопку — и получишь поздравление с Новым ' + info.year + ' годом.';
  }

  /* ---------- Снежный шар ---------- */
  function initGlobe() {
    var host = $('#globe-cv'); if (!host) return;
    var cv = host, g = cv.getContext('2d'), S = 260, dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = S * dpr; cv.height = S * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var N = NY.isLight() ? 70 : 130, flakes = [], raf = 0, last = 0, lastShake = 0, GROUND = 196;
    for (var i = 0; i < N; i++) flakes.push({ x: 20 + Math.random() * 220, y: GROUND - Math.random() * 6, vx: 0, vy: 0, r: 1 + Math.random() * 1.7, rest: true });
    function draw() {
      g.clearRect(0, 0, S, S); g.fillStyle = '#fff';
      for (var i = 0; i < flakes.length; i++) { var f = flakes[i]; g.globalAlpha = 0.9; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.283); g.fill(); }
      g.globalAlpha = 1;
    }
    function step(ts) {
      var dt = Math.min(0.04, (ts - last) / 1000 || 0.016); last = ts; var moving = 0;
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i]; if (f.rest) continue;
        f.vx *= 1 - 1.4 * dt; f.vy += 70 * dt; f.vy *= 1 - 0.9 * dt;
        f.x += (f.vx + Math.sin(ts / 400 + i) * 14) * dt; f.y += f.vy * dt;
        var dx = f.x - S / 2, dy = f.y - S / 2, rad = Math.sqrt(dx * dx + dy * dy);
        if (rad > 112) { f.x = S / 2 + dx / rad * 112; f.y = S / 2 + dy / rad * 112; f.vx *= -0.3; f.vy *= -0.3; }
        if (f.y >= GROUND - Math.random() * 4 && f.vy > 0) { f.y = GROUND - Math.random() * 6; f.rest = true; f.vx = f.vy = 0; } else moving++;
      }
      draw();
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    function shake() {
      var now = performance.now(); if (now - lastShake < 900) return; lastShake = now;
      flakes.forEach(function (f) { f.rest = false; f.y = GROUND - 4 - Math.random() * 20; f.vx = NY.rand(-200, 200); f.vy = -NY.rand(120, 330); });
      var wrap = $('#globe'); wrap.classList.remove('shaking'); void wrap.offsetWidth; wrap.classList.add('shaking');
      NY.audio.sfx('shake');
      var d = NY.data().counters; d.globe++; NY.save(); if (d.globe >= 5) NY.achieve('globe');
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    }
    $('#globe-btn').addEventListener('click', shake);
    var wrapEl = $('#globe'), px = 0, py = 0, acc = 0, lt = 0;
    wrapEl.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse' && e.buttons !== 1) return;
      var t = performance.now(); if (t - lt > 400) acc = 0; lt = t;
      acc += Math.abs(e.clientX - px) + Math.abs(e.clientY - py); px = e.clientX; py = e.clientY;
      if (acc > 380) { acc = 0; shake(); }
    });
    wrapEl.addEventListener('click', shake);
    window.addEventListener('devicemotion', function (e) {
      var a = e.accelerationIncludingGravity; if (!a) return;
      if (Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z) > 32) shake();
    });
    draw();
  }

  NY.extras = { initCountdown: initCountdown, initGreeting: initGreeting, initGlobe: initGlobe };
})();
