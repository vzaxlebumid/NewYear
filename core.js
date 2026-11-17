/* Общее ядро: пространство имён, хранилище, достижения, уведомления. */
(function () {
  'use strict';
  var NY = window.NY = { games: {} };
  NY.$ = function (s, r) { return (r || document).querySelector(s); };
  NY.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  NY.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  NY.rand = function (a, b) { return a + Math.random() * (b - a); };
  NY.pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };
  NY.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  NY.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------- Хранилище (localStorage с безопасным запасным вариантом) ---------- */
  var KEY = 'ny-site-v1', mem = null;
  function blank() {
    return { records: { runner: 0, gifts: 0 }, chess: { games: 0, whiteWins: 0, blackWins: 0, draws: 0 },
      ach: {}, counters: { greet: 0, globe: 0 }, settings: { vol: 0.6, muted: false, light: null, seenShow: false } };
  }
  function merge(base, src) {
    for (var k in src) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && base[k] && typeof base[k] === 'object') merge(base[k], src[k]);
      else base[k] = src[k];
    }
    return base;
  }
  function load() {
    if (mem) return mem;
    mem = blank();
    try { var raw = localStorage.getItem(KEY); if (raw) merge(mem, JSON.parse(raw)); } catch (e) { /* приватный режим */ }
    return mem;
  }
  NY.data = function () { return load(); };
  NY.save = function () { try { localStorage.setItem(KEY, JSON.stringify(load())); } catch (e) { /* нет места/запрещено */ } };
  NY.resetAll = function () { mem = blank(); NY.save(); };

  /* Лёгкий режим эффектов: по умолчанию автоопределение */
  NY.isLight = function () {
    var s = load().settings.light;
    if (s !== null && s !== undefined) return !!s;
    var weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
    return !!(NY.reduced || weak);
  };

  /* ---------- Рекорды ---------- */
  NY.record = function (game, score) {
    var d = load(), prev = d.records[game] || 0, isNew = score > prev;
    if (isNew) { d.records[game] = score; NY.save(); }
    NY.emit('records');
    return { best: Math.max(prev, score), isNew: isNew, prev: prev };
  };
  NY.best = function (game) { return load().records[game] || 0; };

  /* ---------- События ---------- */
  var handlers = {};
  NY.on = function (n, f) { (handlers[n] = handlers[n] || []).push(f); };
  NY.emit = function (n, a) { (handlers[n] || []).forEach(function (f) { try { f(a); } catch (e) { console.error(e); } }); };

  /* ---------- Уведомления ---------- */
  var toastBox;
  NY.toast = function (title, text, cls) {
    toastBox = toastBox || NY.$('#toasts');
    if (!toastBox) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (cls || '');
    var h = document.createElement('strong'); h.textContent = title;
    el.appendChild(h);
    if (text) { var p = document.createElement('span'); p.textContent = text; el.appendChild(p); }
    toastBox.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () { el.classList.remove('in'); setTimeout(function () { el.remove(); }, 500); }, 3800);
  };

  /* ---------- Достижения ---------- */
  NY.ACH = [
    { id: 'show',    name: 'Первый салют',        desc: 'Посмотреть праздничное представление до конца' },
    { id: 'run100',  name: 'Первые сугробы',      desc: 'Набрать 100 очков в Santa Runner' },
    { id: 'run500',  name: 'Лихой возничий',      desc: 'Набрать 500 очков в Santa Runner' },
    { id: 'run1000', name: 'Рождественский экспресс', desc: 'Набрать 1000 очков в Santa Runner' },
    { id: 'gift150', name: 'Полный мешок',        desc: 'Набрать 150 очков в Catch the Gifts' },
    { id: 'gift400', name: 'Помощник Санты',      desc: 'Набрать 400 очков в Catch the Gifts' },
    { id: 'gold',    name: 'Золотая находка',     desc: 'Поймать золотой подарок' },
    { id: 'chess1',  name: 'Первая партия',       desc: 'Довести партию в шахматы до конца' },
    { id: 'castle',  name: 'Крепость',            desc: 'Сделать рокировку' },
    { id: 'promo',   name: 'Снеговик-король',     desc: 'Превратить пешку' },
    { id: 'enpass',  name: 'На проходе',          desc: 'Взять пешку на проходе' },
    { id: 'mate',    name: 'Шах и мат',           desc: 'Поставить мат' },
    { id: 'globe',   name: 'Метель в ладонях',    desc: 'Встряхнуть снежный шар 5 раз' },
    { id: 'greet',   name: 'Мастер слова',        desc: 'Получить 5 поздравлений' }
  ];
  NY.achieve = function (id) {
    var d = load();
    if (d.ach[id]) return false;
    var a = NY.ACH.filter(function (x) { return x.id === id; })[0];
    if (!a) return false;
    d.ach[id] = Date.now(); NY.save();
    NY.toast('Достижение: ' + a.name, a.desc, 'ach');
    if (NY.audio) NY.audio.sfx('ach');
    NY.emit('ach', id);
    return true;
  };
  NY.achCount = function () { return Object.keys(load().ach).length; };
})();
