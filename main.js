/* Главный сценарий: экраны, праздничное представление, игровая площадка. */
(function () {
  'use strict';
  var NY = window.NY, $ = NY.$, $$ = NY.$$;
  var current = 'start', timers = [], emitter = null, showDone = false, openId = null;

  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; if (emitter) { NY.fx.stopEmitter(emitter); emitter = null; } }

  function go(name) {
    current = name;
    $$('.screen').forEach(function (s) {
      var on = s.id === 'screen-' + name;
      s.classList.toggle('active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (on) s.scrollTop = 0;
    });
    $('#dock').classList.toggle('on', name !== 'start');
  }

  /* ---------- Праздничное представление ---------- */
  function setGreeting() {
    var y = NY.newYear().year;
    $('#show-title').textContent = 'С Новым ' + y + ' годом!';
  }

  function runShow() {
    clearTimers(); NY.fx.clear();
    var tree = $('#tree'), greet = $('#show-greet'), actions = $('#show-actions'), skip = $('#btn-skip');
    go('show'); setGreeting(); showDone = false;
    tree.className = 'tree'; NY.fx.buildTree(tree);
    greet.classList.remove('on'); actions.classList.remove('on'); skip.classList.remove('on');
    $('.tree-glow').classList.remove('on');
    NY.audio.init(); NY.audio.restart(); NY.audio.sfx('magic');
    var light = NY.isLight() || NY.reduced, rockets = NY.reduced ? 3 : light ? 6 : 10;

    at(300, function () { tree.classList.add('grow'); });
    at(2700, function () { tree.classList.add('lit'); $('.tree-glow').classList.add('on'); NY.audio.sfx('magic'); });
    at(3100, function () {
      emitter = NY.fx.emitter(light ? 14 : 28, function () {
        var r = tree.getBoundingClientRect();
        return [r.left + r.width * NY.rand(0.22, 0.78), r.top + r.height * NY.rand(0.1, 0.95), Math.random() < 0.5 ? '#ffe4a0' : '#bfeaff'];
      });
    });
    for (var i = 0; i < rockets; i++) {
      (function (i) {
        at(3600 + i * (NY.reduced ? 1400 : 850), function () {
          var w = window.innerWidth, h = window.innerHeight, side = i % 2 ? 1 : -1;
          NY.fx.launch(w * (0.5 + side * NY.rand(0.12, 0.4)), h * NY.rand(0.12, 0.42));
        });
      })(i);
    }
    at(4800, function () { greet.classList.add('on'); skip.classList.add('on'); });
    at(4800 + 5200 + (rockets - 8) * 120, finishShow);
  }

  function finishShow() {
    if (showDone) return; showDone = true;
    $('#show-actions').classList.add('on'); $('#btn-skip').classList.remove('on');
    NY.achieve('show');
    var s = NY.data().settings; s.seenShow = true; NY.save();
  }

  function skipShow() {
    clearTimers();
    var tree = $('#tree'); tree.classList.add('instant', 'grow', 'lit');
    $('.tree-glow').classList.add('on'); $('#show-greet').classList.add('on');
    emitter = NY.fx.emitter(NY.isLight() ? 10 : 20, function () {
      var r = tree.getBoundingClientRect();
      return [r.left + r.width * NY.rand(0.22, 0.78), r.top + r.height * NY.rand(0.1, 0.95), '#ffe4a0'];
    });
    finishShow();
  }

  /* ---------- Площадка ---------- */
  function openHub() {
    clearTimers(); NY.fx.clear();
    go('hub'); renderRecords(); renderAch();
  }

  function renderRecords() {
    $$('[data-rec]').forEach(function (el) {
      var k = el.getAttribute('data-rec');
      if (k === 'chess') { var c = NY.data().chess; el.textContent = c.games ? 'Партий: ' + c.games : 'Партий пока нет'; }
      else { var b = NY.best(k); el.textContent = b ? 'Рекорд: ' + b : 'Рекорда пока нет'; }
    });
  }
  function renderAch() {
    var d = NY.data().ach, list = $('#ach-list'); list.innerHTML = '';
    NY.ACH.forEach(function (a) {
      var li = document.createElement('li'), got = !!d[a.id];
      li.className = got ? 'got' : '';
      var s = document.createElement('span'); s.className = 'mark'; s.textContent = got ? '★' : '☆';
      var t = document.createElement('div'); var n = document.createElement('b'); n.textContent = a.name; var p = document.createElement('small'); p.textContent = a.desc;
      t.appendChild(n); t.appendChild(p); li.appendChild(s); li.appendChild(t); list.appendChild(li);
    });
    $('#ach-count').textContent = NY.achCount() + ' из ' + NY.ACH.length;
  }

  function openGame(id) {
    var game = NY.games[id]; if (!game) return;
    openId = id;
    var gv = $('#gameview');
    $('#gv-title').textContent = game.title;
    gv.classList.add('open'); gv.setAttribute('aria-hidden', 'false'); gv.scrollTop = 0;
    document.body.classList.add('playing');
    NY.fx.snowOn(false);
    game.mount($('#gv-stage'));
    gv.focus({ preventScroll: true });
  }
  function closeGame() {
    if (!openId) return;
    NY.games[openId].destroy(); openId = null;
    var gv = $('#gameview'); gv.classList.remove('open'); gv.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('playing');
    NY.fx.snowOn(true); renderRecords(); renderAch();
  }

  /* ---------- Звук: панель ---------- */
  function updateDock() {
    var playing = NY.audio.isPlaying(), muted = NY.audio.muted() || NY.audio.volume() === 0;
    var p = $('#dk-play'); p.classList.toggle('paused', !playing); p.setAttribute('aria-label', playing ? 'Пауза музыки' : 'Включить музыку');
    var m = $('#dk-mute'); m.classList.toggle('off', muted); m.setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
    $('#dk-vol').value = muted ? 0 : NY.audio.volume();
  }

  function init() {
    NY.fx.init();
    NY.extras.initCountdown(); NY.extras.initGreeting(); NY.extras.initGlobe();
    $('#chess-art').innerHTML = '<div class="pair"><span>' + NY.games.chess.piece('k', 'w') + '</span><span>' + NY.games.chess.piece('q', 'b') + '</span></div><div class="pair low"><span>' + NY.games.chess.piece('n', 'w') + '</span><span>' + NY.games.chess.piece('p', 'b') + '</span><span>' + NY.games.chess.piece('b', 'w') + '</span></div>';

    $('#btn-start').addEventListener('click', function () { runShow(); });
    $('#btn-to-hub').addEventListener('click', function () { NY.audio.sfx('click'); openHub(); });
    $('#btn-replay').addEventListener('click', function () { runShow(); });
    $('#btn-replay2').addEventListener('click', function () { runShow(); });
    $('#btn-skip').addEventListener('click', skipShow);
    $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { NY.audio.sfx('click'); openGame(b.getAttribute('data-open')); }); });
    $$('.card').forEach(function (c) {
      c.addEventListener('click', function (e) { if (e.target.closest('button')) return; openGame(c.getAttribute('data-game')); });
    });
    $('#gv-back').addEventListener('click', function () { NY.audio.sfx('back'); closeGame(); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openId) closeGame(); });

    $('#dk-play').addEventListener('click', function () { NY.audio.init(); NY.audio.toggle(); });
    $('#dk-mute').addEventListener('click', function () {
      NY.audio.init();
      if (NY.audio.muted() || NY.audio.volume() === 0) { if (NY.audio.volume() === 0) NY.audio.setVolume(0.6); NY.audio.setMuted(false); } else NY.audio.setMuted(true);
    });
    $('#dk-vol').addEventListener('input', function (e) { NY.audio.init(); NY.audio.setVolume(parseFloat(e.target.value)); });
    NY.on('audio', updateDock); updateDock();

    var chk = $('#chk-light'); chk.checked = NY.isLight();
    chk.addEventListener('change', function () { NY.data().settings.light = chk.checked; NY.save(); NY.fx.refresh(); });
    $('#btn-reset').addEventListener('click', function () {
      if (window.confirm('Удалить все рекорды и достижения?')) { var s = NY.data().settings; NY.resetAll(); NY.data().settings = s; NY.save(); renderRecords(); renderAch(); NY.toast('Готово', 'Рекорды и достижения сброшены.'); }
    });
    NY.on('records', renderRecords); NY.on('ach', renderAch);
    renderRecords(); renderAch();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
