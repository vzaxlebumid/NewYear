/* Christmas Chess — полноценные шахматы для двух игроков с новогодними фигурами. */
(function () {
  'use strict';
  var NY = window.NY, E = window.ChessEngine;

  /* ---------- Фигуры (SVG) ---------- */
  var PAL = {
    w: { body: '#f4f9ff', shade: '#c4d9f0', accent: '#4aa8ff', line: '#1f3560' },
    b: { body: '#dc3b57', shade: '#a52243', accent: '#ffcf6b', line: '#3b0f26' }
  };
  var SKIN = '#ffe0c8';
  function pieceMarkup(t, c) {
    var p = PAL[c], s = ' stroke="' + p.line + '" stroke-width="2.4" stroke-linejoin="round"', thin = ' stroke="' + p.line + '" stroke-width="1.6" stroke-linejoin="round"';
    var o = '<ellipse cx="50" cy="91" rx="26" ry="5" fill="#000" opacity=".2"/>';
    if (t === 'p') {
      o += '<circle cx="50" cy="71" r="19" fill="' + p.body + '"' + s + '/><circle cx="50" cy="44" r="13" fill="' + p.body + '"' + s + '/>' +
        '<path d="M36 53 Q50 62 64 53 L63 59 Q50 68 37 59Z" fill="' + p.accent + '"' + thin + '/>' +
        '<rect x="38" y="30" width="24" height="4" rx="2" fill="' + p.accent + '"' + thin + '/><rect x="42" y="19" width="16" height="12" rx="2" fill="' + p.accent + '"' + thin + '/>' +
        '<circle cx="45" cy="42" r="1.9" fill="' + p.line + '"/><circle cx="55" cy="42" r="1.9" fill="' + p.line + '"/><path d="M50 45 L64 48 L50 49Z" fill="#ff9a3c"/>' +
        '<circle cx="50" cy="70" r="2" fill="' + p.line + '"/><circle cx="50" cy="78" r="2" fill="' + p.line + '"/>';
    } else if (t === 'r') {
      o += '<rect x="24" y="62" width="52" height="28" rx="3" fill="' + p.body + '"' + s + '/><rect x="45" y="62" width="10" height="28" fill="' + p.accent + '"/><rect x="24" y="72" width="52" height="8" fill="' + p.accent + '"/>' +
        '<rect x="24" y="62" width="52" height="28" rx="3" fill="none"' + s + '/>' +
        '<rect x="31" y="39" width="38" height="25" rx="3" fill="' + p.body + '"' + s + '/><rect x="45" y="39" width="10" height="25" fill="' + p.accent + '"/><rect x="31" y="47" width="38" height="7" fill="' + p.accent + '"/>' +
        '<rect x="31" y="39" width="38" height="25" rx="3" fill="none"' + s + '/>' +
        '<rect x="28" y="34" width="44" height="8" rx="2" fill="' + p.shade + '"' + s + '/>' +
        '<ellipse cx="39" cy="25" rx="10" ry="6" transform="rotate(-22 39 25)" fill="' + p.accent + '"' + thin + '/><ellipse cx="61" cy="25" rx="10" ry="6" transform="rotate(22 61 25)" fill="' + p.accent + '"' + thin + '/><circle cx="50" cy="30" r="4.5" fill="' + p.accent + '"' + thin + '/>';
    } else if (t === 'b') {
      o += '<path d="M27 90 Q50 38 73 90Z" fill="' + p.body + '"' + s + '/><path d="M37 74 Q50 69 63 74 L64 80 Q50 75 36 80Z" fill="' + p.accent + '"' + thin + '/>' +
        '<path d="M40 45 L29 38 L41 40Z M60 45 L71 38 L59 40Z" fill="' + SKIN + '"' + thin + '/><circle cx="50" cy="46" r="11" fill="' + SKIN + '"' + s + '/>' +
        '<path d="M37 41 Q41 22 58 7 Q60 25 63 41Z" fill="' + p.accent + '"' + s + '/><rect x="35" y="38" width="30" height="6" rx="3" fill="#fff"' + thin + '/><circle cx="58" cy="7" r="4.5" fill="#fff"' + thin + '/>' +
        '<circle cx="45.5" cy="48" r="1.7" fill="' + p.line + '"/><circle cx="54.5" cy="48" r="1.7" fill="' + p.line + '"/><path d="M45 53 Q50 57 55 53" fill="none" stroke="' + p.line + '" stroke-width="1.6" stroke-linecap="round"/>';
    } else if (t === 'n') {
      o += '<path d="M29 90 C29 66 36 56 40 48 C33 48 25 44 23 38 C21 32 28 30 34 30 C46 27 59 34 65 48 C70 62 72 78 72 90Z" fill="' + p.body + '"' + s + '/>' +
        '<path d="M50 30 L46 14 M46 14 L39 10 M47 21 L54 16 M60 36 L70 20 M70 20 L78 18 M67 27 L62 21" fill="none" stroke="' + p.accent + '" stroke-width="3.6" stroke-linecap="round"/>' +
        '<path d="M53 35 L59 24 L63 37Z" fill="' + p.shade + '"' + thin + '/><path d="M62 52 Q55 63 62 75" fill="none" stroke="' + p.shade + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M35 70 Q52 79 70 68 L71 77 Q52 87 33 79Z" fill="' + p.accent + '"' + thin + '/><circle cx="45" cy="39" r="2.4" fill="' + p.line + '"/>' +
        '<circle cx="26" cy="38" r="5" fill="#ef3b4b"' + thin + '/>';
    } else if (t === 'q') {
      o += '<path d="M25 90 Q34 60 42 50 L58 50 Q66 60 75 90Z" fill="' + p.body + '"' + s + '/><path d="M37 71 Q50 79 63 71 L64 77 Q50 85 36 77Z" fill="' + p.accent + '"' + thin + '/>' +
        '<path d="M50 54 L50 66 M45 57 L55 63 M55 57 L45 63" stroke="' + p.accent + '" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="50" cy="40" r="10" fill="' + SKIN + '"' + s + '/><path d="M39 41 Q38 29 50 29 Q62 29 61 41 Q58 35 50 35 Q42 35 39 41Z" fill="' + p.shade + '"' + thin + '/>' +
        '<path d="M36 30 L35 13 L44 22 L50 7 L56 22 L65 13 L64 30Z" fill="' + p.accent + '"' + s + '/><circle cx="50" cy="13" r="2.4" fill="#fff"/>' +
        '<circle cx="46" cy="42" r="1.5" fill="' + p.line + '"/><circle cx="54" cy="42" r="1.5" fill="' + p.line + '"/>';
    } else {
      o += '<path d="M25 90 Q29 56 40 50 L60 50 Q71 56 75 90Z" fill="' + p.body + '"' + s + '/><rect x="33" y="72" width="34" height="8" fill="' + p.accent + '"' + thin + '/><rect x="45" y="70" width="10" height="12" rx="1.5" fill="#ffd27a"' + thin + '/>' +
        '<circle cx="50" cy="43" r="11" fill="' + SKIN + '"' + s + '/><path d="M37 45 Q37 67 50 69 Q63 67 63 45 Q57 53 50 53 Q43 53 37 45Z" fill="#fff"' + s + '/>' +
        '<circle cx="45" cy="41" r="1.7" fill="' + p.line + '"/><circle cx="55" cy="41" r="1.7" fill="' + p.line + '"/><ellipse cx="50" cy="47" rx="3" ry="2" fill="#f0a58f"/>' +
        '<path d="M37 37 Q38 17 56 10 Q62 22 63 37Z" fill="' + p.accent + '"' + s + '/><rect x="34" y="34" width="32" height="8" rx="4" fill="#fff"' + thin + '/><circle cx="58" cy="9" r="5.5" fill="#fff"' + thin + '/><path d="M47 24 l1.6 3.4 3.6.4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4z" fill="#ffd27a"/>';
    }
    return '<svg viewBox="0 0 100 100" class="pc" aria-hidden="true">' + o + '</svg>';
  }
  var cache = {};
  function piece(t, c) { var k = t + c; return cache[k] || (cache[k] = pieceMarkup(t, c)); }

  var GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞' };
  var NAMES = { k: 'Дед Мороз', q: 'Снежная королева', r: 'Башня из подарков', b: 'Эльф', n: 'Северный олень', p: 'Снеговик' };
  var LETTER = { q: 'Ф', r: 'Л', b: 'С', n: 'К', k: 'Кр' };

  var root, handlers = [], S;

  function addH(t, ev, fn) { t.addEventListener(ev, fn); handlers.push([t, ev, fn]); }

  function newGame() {
    var pos = E.startPosition();
    S = { hist: [], pos: pos, sel: -1, targets: [], flipped: false, auto: false, over: null, keys: {}, pending: null };
    S.keys[E.posKey(pos)] = 1;
  }

  function mount(stage) {
    root = stage; newGame();
    stage.innerHTML =
      '<div class="ch-layout">' +
        '<div class="ch-side">' +
          '<div class="ch-turn" id="ch-turn"></div><p class="ch-status" id="ch-status"></p>' +
          '<div class="ch-cap" id="ch-cap-b" aria-label="Взятые белые фигуры"></div><div class="ch-cap" id="ch-cap-w" aria-label="Взятые чёрные фигуры"></div>' +
          '<div class="ch-btns"><button class="btn small" id="ch-new">Новая партия</button><button class="btn small ghost" id="ch-undo">Отменить ход</button>' +
          '<button class="btn small ghost" id="ch-flip">Повернуть доску</button><button class="btn small ghost" id="ch-auto" aria-pressed="false">Автоповорот: выкл</button></div>' +
          '<p class="gv-hint left">Белые (ледяные) ходят первыми. Нажми на фигуру, затем на подсвеченную клетку.</p>' +
        '</div>' +
        '<div class="ch-boardwrap"><div class="ch-board" id="ch-board" role="grid" aria-label="Шахматная доска"></div>' +
          '<div class="ch-modal" id="ch-promo" hidden><div class="ch-modal-box"><p>Во что превратить снеговика?</p><div class="ch-promo-row" id="ch-promo-row"></div></div></div>' +
          '<div class="ch-modal" id="ch-end" hidden><div class="ch-modal-box"><h3 id="ch-end-t"></h3><p id="ch-end-p"></p><button class="btn" id="ch-end-b">Новая партия</button></div></div></div>' +
        '<div class="ch-moves"><h4>Ходы</h4><ol id="ch-list"></ol></div>' +
      '</div>';
    buildBoard();
    addH(NY.$('#ch-new', stage), 'click', function () { NY.audio.sfx('click'); newGame(); render(); });
    addH(NY.$('#ch-end-b', stage), 'click', function () { NY.audio.sfx('click'); newGame(); render(); });
    addH(NY.$('#ch-undo', stage), 'click', undo);
    addH(NY.$('#ch-flip', stage), 'click', function () { S.flipped = !S.flipped; NY.audio.sfx('click'); render(); });
    addH(NY.$('#ch-auto', stage), 'click', function (e) { S.auto = !S.auto; e.currentTarget.textContent = 'Автоповорот: ' + (S.auto ? 'вкл' : 'выкл'); e.currentTarget.setAttribute('aria-pressed', S.auto); NY.audio.sfx('click'); if (S.auto) S.flipped = S.pos.turn === 'b'; render(); });
    render();
  }

  function buildBoard() {
    var b = NY.$('#ch-board', root); b.innerHTML = '';
    for (var i = 0; i < 64; i++) {
      var c = document.createElement('button');
      c.type = 'button'; c.className = 'cell'; c.setAttribute('role', 'gridcell');
      c.dataset.i = i;
      c.addEventListener('click', onCell);
      b.appendChild(c);
    }
  }

  function legalFor(sq) { return E.legalMoves(S.pos).filter(function (m) { return m.from === sq; }); }

  function onCell(e) {
    if (S.over || S.pending) return;
    var sq = +e.currentTarget.dataset.i, p = S.pos.b[sq];
    if (S.sel >= 0) {
      var cand = S.targets.filter(function (m) { return m.to === sq; });
      if (cand.length) {
        if (cand[0].promo) return askPromo(cand[0]);
        return doMove(cand[0]);
      }
    }
    if (p && p.c === S.pos.turn && sq !== S.sel) { S.sel = sq; S.targets = legalFor(sq); NY.audio.sfx('click'); }
    else { S.sel = -1; S.targets = []; }
    render();
  }

  function askPromo(m) {
    S.pending = m;
    var row = NY.$('#ch-promo-row', root); row.innerHTML = '';
    ['q', 'r', 'b', 'n'].forEach(function (t) {
      var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'promo-btn'; bt.title = NAMES[t];
      bt.innerHTML = piece(t, S.pos.turn) + '<span>' + NAMES[t] + '</span>';
      bt.addEventListener('click', function () { var mv = S.pending; S.pending = null; NY.$('#ch-promo', root).hidden = true; doMove(mv, t); });
      row.appendChild(bt);
    });
    NY.$('#ch-promo', root).hidden = false;
  }

  function notation(pos, m, promoT, suffix) {
    if (m.castle) return (m.castle === 'K' ? 'O-O' : 'O-O-O') + suffix;
    var s = m.piece === 'p' ? '' : (LETTER[m.piece] || '');
    s += E.sqName(m.from) + (m.cap ? '×' : '–') + E.sqName(m.to);
    if (m.promo) s += '=' + (LETTER[promoT] || 'Ф');
    return s + (m.ep ? ' е.p.' : '') + suffix;
  }

  function doMove(m, promoT) {
    var before = S.pos, mover = before.turn;
    var r = E.applyMove(before, m, promoT);
    var np = r.pos, legal = E.legalMoves(np), chk = E.inCheck(np, np.turn);
    var suffix = '';
    if (!legal.length) suffix = chk ? '#' : ''; else if (chk) suffix = '+';
    S.hist.push({ pos: before, move: m, san: notation(before, m, promoT, suffix), captured: r.captured, mover: mover, promoT: promoT });
    S.pos = np; S.sel = -1; S.targets = [];
    var key = E.posKey(np); S.keys[key] = (S.keys[key] || 0) + 1;
    // достижения
    if (m.castle) NY.achieve('castle'); if (m.promo) NY.achieve('promo'); if (m.ep) NY.achieve('enpass');
    // звук
    NY.audio.sfx(chk && legal.length ? 'check' : r.captured ? 'capture' : 'move');
    // итог
    var d = NY.data().chess;
    if (!legal.length) {
      if (chk) { S.over = { kind: 'mate', winner: mover }; if (mover === 'w') d.whiteWins++; else d.blackWins++; NY.achieve('mate'); }
      else { S.over = { kind: 'stalemate' }; d.draws++; }
    } else if (E.insufficient(np)) { S.over = { kind: 'material' }; d.draws++; }
    else if (np.half >= 100) { S.over = { kind: 'fifty' }; d.draws++; }
    else if (S.keys[key] >= 3) { S.over = { kind: 'rep' }; d.draws++; }
    if (S.over) { d.games++; NY.save(); NY.achieve('chess1'); if (S.over.kind === 'mate') setTimeout(function () { NY.audio.sfx('win'); }, 250); NY.emit('records'); }
    if (S.auto && !S.over) S.flipped = np.turn === 'b';
    render(true);
  }

  function undo() {
    if (!S.hist.length || S.pending) return;
    var last = S.hist.pop(), key = E.posKey(S.pos);
    S.keys[key] = Math.max(0, (S.keys[key] || 1) - 1);
    if (S.over) {
      var d = NY.data().chess; // откат результата в статистике
      d.games = Math.max(0, d.games - 1);
      if (S.over.kind === 'mate') { if (S.over.winner === 'w') d.whiteWins = Math.max(0, d.whiteWins - 1); else d.blackWins = Math.max(0, d.blackWins - 1); }
      else d.draws = Math.max(0, d.draws - 1);
      NY.save(); NY.emit('records'); S.over = null;
    }
    S.pos = last.pos; S.sel = -1; S.targets = [];
    if (S.auto) S.flipped = S.pos.turn === 'b';
    NY.audio.sfx('back'); render();
  }

  function render() {
    var cells = NY.$$('.cell', root), pos = S.pos, last = S.hist.length ? S.hist[S.hist.length - 1].move : null;
    var chk = E.inCheck(pos, pos.turn), kingSq = chk ? E.findKing(pos, pos.turn) : -1;
    for (var vi = 0; vi < 64; vi++) {
      var vr = (vi / 8) | 0, vc = vi % 8;
      var sq = S.flipped ? (7 - vr) * 8 + (7 - vc) : vi;
      var r = (sq / 8) | 0, c = sq % 8, cell = cells[vi], p = pos.b[sq];
      cell.dataset.i = sq;
      var cls = 'cell ' + ((r + c) % 2 ? 'dk' : 'lt');
      if (sq === S.sel) cls += ' sel';
      if (last && (sq === last.from || sq === last.to)) cls += ' last';
      if (sq === kingSq) cls += ' chk';
      var tg = S.targets.filter(function (m) { return m.to === sq; })[0];
      if (tg) cls += tg.cap ? ' tgt-cap' : ' tgt';
      cell.className = cls;
      var html = p ? piece(p.t, p.c) : '';
      if (vc === 0) html += '<i class="rk">' + (8 - r) + '</i>';
      if (vr === 7) html += '<i class="fl">' + 'abcdefgh'[c] + '</i>';
      if (cell.__h !== html) { cell.innerHTML = html; cell.__h = html; }
      cell.setAttribute('aria-label', E.sqName(sq) + (p ? ', ' + (p.c === 'w' ? 'белый ' : 'чёрный ') + NAMES[p.t] : ', пусто'));
      cell.disabled = !!S.over;
    }
    // статус
    var side = pos.turn === 'w' ? 'белых' : 'чёрных', turn = NY.$('#ch-turn', root), st = NY.$('#ch-status', root);
    turn.className = 'ch-turn ' + pos.turn;
    turn.innerHTML = '<span class="dot"></span>Ход ' + side;
    var msg = '';
    if (S.over) {
      var k = S.over.kind;
      msg = k === 'mate' ? 'Мат! Победили ' + (S.over.winner === 'w' ? 'белые' : 'чёрные') + '.' : k === 'stalemate' ? 'Пат — ничья.' : k === 'material' ? 'Ничья: недостаточно материала для мата.' : k === 'fifty' ? 'Ничья по правилу 50 ходов.' : 'Ничья: позиция повторилась трижды.';
    } else msg = chk ? 'Шах! ' + (pos.turn === 'w' ? 'Белому' : 'Чёрному') + ' королю нужна защита.' : 'Партия идёт.';
    st.textContent = msg; st.className = 'ch-status' + (chk || S.over ? ' alert' : '');
    // взятые фигуры
    var cw = [], cb = [];
    S.hist.forEach(function (h) { if (h.captured) (h.captured.c === 'b' ? cw : cb).push(h.captured.t); });
    var order = { q: 0, r: 1, b: 2, n: 3, p: 4 };
    function capHtml(arr, color) { return arr.sort(function (a, b) { return order[a] - order[b]; }).map(function (t) { return '<span class="mini">' + piece(t, color) + '</span>'; }).join(''); }
    NY.$('#ch-cap-b', root).innerHTML = capHtml(cw, 'b'); // белые взяли чёрные
    NY.$('#ch-cap-w', root).innerHTML = capHtml(cb, 'w');
    // список ходов
    var li = '';
    for (var i = 0; i < S.hist.length; i += 2) li += '<li><span>' + S.hist[i].san + '</span><span>' + (S.hist[i + 1] ? S.hist[i + 1].san : '') + '</span></li>';
    var list = NY.$('#ch-list', root); list.innerHTML = li; list.parentNode.scrollTop = list.parentNode.scrollHeight;
    NY.$('#ch-undo', root).disabled = !S.hist.length;
    // окно итога
    var endBox = NY.$('#ch-end', root);
    if (S.over) {
      NY.$('#ch-end-t', root).textContent = S.over.kind === 'mate' ? 'Победа ' + (S.over.winner === 'w' ? 'белых' : 'чёрных') : 'Ничья';
      NY.$('#ch-end-p', root).textContent = msg;
      setTimeout(function () { if (S && S.over) endBox.hidden = false; }, 700);
    } else endBox.hidden = true;
  }

  function destroy() {
    handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2]); }); handlers = [];
    if (root) root.innerHTML = '';
    S = null;
  }

  NY.games.chess = { title: 'Christmas Chess', mount: mount, destroy: destroy, piece: piece };
})();
