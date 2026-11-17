/* Шахматный движок: полные правила (рокировка, взятие на проходе, превращение, шах/мат/пат, ничьи). */
(function (root) {
  'use strict';
  // Поле: индекс = r*8 + c ; r=0 — 8-я горизонталь (верх), c=0 — вертикаль a.
  var N_DIRS = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  var K_DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  var B_DIRS = [[-1,-1],[-1,1],[1,-1],[1,1]];
  var R_DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

  function P(t, c) { return { t: t, c: c }; }

  function startPosition() {
    var b = new Array(64).fill(null);
    var back = ['r','n','b','q','k','b','n','r'];
    for (var c = 0; c < 8; c++) {
      b[c] = P(back[c], 'b'); b[8 + c] = P('p', 'b');
      b[48 + c] = P('p', 'w'); b[56 + c] = P(back[c], 'w');
    }
    return { b: b, turn: 'w', castle: { wK: true, wQ: true, bK: true, bQ: true }, ep: -1, half: 0, full: 1 };
  }

  function clone(pos) {
    return { b: pos.b.slice(), turn: pos.turn,
      castle: { wK: pos.castle.wK, wQ: pos.castle.wQ, bK: pos.castle.bK, bQ: pos.castle.bQ },
      ep: pos.ep, half: pos.half, full: pos.full };
  }

  function other(c) { return c === 'w' ? 'b' : 'w'; }

  function isAttacked(pos, sq, by) {
    var b = pos.b, r = (sq / 8) | 0, c = sq % 8, i, rr, cc, p, d;
    var pr = by === 'w' ? r + 1 : r - 1;
    if (pr >= 0 && pr < 8) {
      for (i = -1; i <= 1; i += 2) {
        cc = c + i;
        if (cc >= 0 && cc < 8) { p = b[pr * 8 + cc]; if (p && p.c === by && p.t === 'p') return true; }
      }
    }
    for (i = 0; i < 8; i++) {
      d = N_DIRS[i]; rr = r + d[0]; cc = c + d[1];
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { p = b[rr * 8 + cc]; if (p && p.c === by && p.t === 'n') return true; }
      d = K_DIRS[i]; rr = r + d[0]; cc = c + d[1];
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { p = b[rr * 8 + cc]; if (p && p.c === by && p.t === 'k') return true; }
    }
    for (i = 0; i < 4; i++) {
      d = B_DIRS[i]; rr = r + d[0]; cc = c + d[1];
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        p = b[rr * 8 + cc];
        if (p) { if (p.c === by && (p.t === 'b' || p.t === 'q')) return true; break; }
        rr += d[0]; cc += d[1];
      }
      d = R_DIRS[i]; rr = r + d[0]; cc = c + d[1];
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        p = b[rr * 8 + cc];
        if (p) { if (p.c === by && (p.t === 'r' || p.t === 'q')) return true; break; }
        rr += d[0]; cc += d[1];
      }
    }
    return false;
  }

  function findKing(pos, color) {
    for (var i = 0; i < 64; i++) { var p = pos.b[i]; if (p && p.t === 'k' && p.c === color) return i; }
    return -1;
  }

  function inCheck(pos, color) {
    var k = findKing(pos, color);
    return k >= 0 && isAttacked(pos, k, other(color));
  }

  function pseudoMoves(pos) {
    var b = pos.b, me = pos.turn, moves = [], from, p, r, c, i, d, rr, cc, to, t;
    function add(f, to, extra) {
      var m = { from: f, to: to, piece: b[f].t };
      if (extra) for (var k in extra) m[k] = extra[k];
      moves.push(m);
    }
    for (from = 0; from < 64; from++) {
      p = b[from];
      if (!p || p.c !== me) continue;
      r = (from / 8) | 0; c = from % 8;
      if (p.t === 'p') {
        var dir = me === 'w' ? -1 : 1, startR = me === 'w' ? 6 : 1, lastR = me === 'w' ? 0 : 7;
        rr = r + dir;
        if (rr >= 0 && rr < 8 && !b[rr * 8 + c]) {
          to = rr * 8 + c;
          if (rr === lastR) add(from, to, { promo: true }); else add(from, to);
          if (r === startR && !b[(r + 2 * dir) * 8 + c]) add(from, (r + 2 * dir) * 8 + c, { dbl: true });
        }
        for (i = -1; i <= 1; i += 2) {
          cc = c + i;
          if (cc < 0 || cc > 7 || rr < 0 || rr > 7) continue;
          to = rr * 8 + cc; t = b[to];
          if (t && t.c !== me) { if (rr === lastR) add(from, to, { cap: true, promo: true }); else add(from, to, { cap: true }); }
          else if (!t && to === pos.ep) add(from, to, { cap: true, ep: true });
        }
      } else if (p.t === 'n' || p.t === 'k') {
        var dirs = p.t === 'n' ? N_DIRS : K_DIRS;
        for (i = 0; i < 8; i++) {
          d = dirs[i]; rr = r + d[0]; cc = c + d[1];
          if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
          to = rr * 8 + cc; t = b[to];
          if (!t) add(from, to); else if (t.c !== me) add(from, to, { cap: true });
        }
        if (p.t === 'k') {
          var hr = me === 'w' ? 7 : 0, opp = other(me);
          if (from === hr * 8 + 4 && !isAttacked(pos, from, opp)) {
            if (pos.castle[me + 'K'] && !b[hr * 8 + 5] && !b[hr * 8 + 6] && b[hr * 8 + 7] && b[hr * 8 + 7].t === 'r' && b[hr * 8 + 7].c === me &&
                !isAttacked(pos, hr * 8 + 5, opp) && !isAttacked(pos, hr * 8 + 6, opp)) add(from, hr * 8 + 6, { castle: 'K' });
            if (pos.castle[me + 'Q'] && !b[hr * 8 + 3] && !b[hr * 8 + 2] && !b[hr * 8 + 1] && b[hr * 8] && b[hr * 8].t === 'r' && b[hr * 8].c === me &&
                !isAttacked(pos, hr * 8 + 3, opp) && !isAttacked(pos, hr * 8 + 2, opp)) add(from, hr * 8 + 2, { castle: 'Q' });
          }
        }
      } else {
        var sd = p.t === 'b' ? B_DIRS : p.t === 'r' ? R_DIRS : B_DIRS.concat(R_DIRS);
        for (i = 0; i < sd.length; i++) {
          d = sd[i]; rr = r + d[0]; cc = c + d[1];
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
            to = rr * 8 + cc; t = b[to];
            if (!t) add(from, to);
            else { if (t.c !== me) add(from, to, { cap: true }); break; }
            rr += d[0]; cc += d[1];
          }
        }
      }
    }
    return moves;
  }

  function applyMove(pos, m, promoType) {
    var n = clone(pos), b = n.b, me = pos.turn, p = b[m.from];
    var captured = b[m.to];
    b[m.to] = p; b[m.from] = null;
    if (m.ep) { var capSq = m.to + (me === 'w' ? 8 : -8); captured = b[capSq]; b[capSq] = null; }
    if (m.promo) b[m.to] = P(promoType || 'q', me);
    if (m.castle) {
      var hr = me === 'w' ? 7 : 0;
      if (m.castle === 'K') { b[hr * 8 + 5] = b[hr * 8 + 7]; b[hr * 8 + 7] = null; }
      else { b[hr * 8 + 3] = b[hr * 8]; b[hr * 8] = null; }
    }
    if (p.t === 'k') { n.castle[me + 'K'] = false; n.castle[me + 'Q'] = false; }
    var touch = [m.from, m.to];
    for (var i = 0; i < 2; i++) {
      if (touch[i] === 63) n.castle.wK = false;
      if (touch[i] === 56) n.castle.wQ = false;
      if (touch[i] === 7) n.castle.bK = false;
      if (touch[i] === 0) n.castle.bQ = false;
    }
    n.ep = m.dbl ? (m.from + m.to) / 2 : -1;
    n.half = (p.t === 'p' || captured) ? 0 : pos.half + 1;
    if (me === 'b') n.full = pos.full + 1;
    n.turn = other(me);
    return { pos: n, captured: captured };
  }

  function legalMoves(pos) {
    var ps = pseudoMoves(pos), out = [], me = pos.turn;
    for (var i = 0; i < ps.length; i++) {
      var r = applyMove(pos, ps[i], 'q');
      if (!inCheck(r.pos, me)) out.push(ps[i]);
    }
    return out;
  }

  function insufficient(pos) {
    var minors = [], i, p;
    for (i = 0; i < 64; i++) {
      p = pos.b[i];
      if (!p || p.t === 'k') continue;
      if (p.t === 'p' || p.t === 'r' || p.t === 'q') return false;
      minors.push({ t: p.t, c: p.c, sq: i });
    }
    if (minors.length <= 1) return true;
    var allB = minors.every(function (m) { return m.t === 'b'; });
    if (allB) {
      var col = (((minors[0].sq / 8) | 0) + minors[0].sq % 8) % 2;
      return minors.every(function (m) { return (((m.sq / 8) | 0) + m.sq % 8) % 2 === col; });
    }
    return false;
  }

  function epCapturable(pos) {
    var ps = pseudoMoves(pos);
    for (var i = 0; i < ps.length; i++) if (ps[i].ep && !inCheck(applyMove(pos, ps[i], 'q').pos, pos.turn)) return true;
    return false;
  }

  function posKey(pos) {
    var s = '', i, p;
    for (i = 0; i < 64; i++) { p = pos.b[i]; s += p ? (p.c === 'w' ? p.t.toUpperCase() : p.t) : '.'; }
    return s + pos.turn + (pos.castle.wK ? 'K' : '') + (pos.castle.wQ ? 'Q' : '') + (pos.castle.bK ? 'k' : '') + (pos.castle.bQ ? 'q' : '') +
      (pos.ep >= 0 && epCapturable(pos) ? pos.ep : '-');
  }

  function sqName(sq) { return 'abcdefgh'[sq % 8] + (8 - ((sq / 8) | 0)); }

  function perft(pos, depth) {
    if (depth === 0) return 1;
    var ms = legalMoves(pos), n = 0;
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].promo) {
        var types = ['q','r','b','n'];
        for (var j = 0; j < 4; j++) n += perft(applyMove(pos, ms[i], types[j]).pos, depth - 1);
      } else n += perft(applyMove(pos, ms[i]).pos, depth - 1);
    }
    return n;
  }

  function fromFEN(fen) {
    var parts = fen.split(' '), b = new Array(64).fill(null), r = 0, c = 0;
    parts[0].split('').forEach(function (ch) {
      if (ch === '/') { r++; c = 0; }
      else if (/\d/.test(ch)) c += +ch;
      else { b[r * 8 + c] = P(ch.toLowerCase(), ch === ch.toLowerCase() ? 'b' : 'w'); c++; }
    });
    var cs = parts[2] || '-';
    var ep = parts[3] && parts[3] !== '-' ? (8 - +parts[3][1]) * 8 + 'abcdefgh'.indexOf(parts[3][0]) : -1;
    return { b: b, turn: parts[1] || 'w', castle: { wK: cs.indexOf('K') >= 0, wQ: cs.indexOf('Q') >= 0, bK: cs.indexOf('k') >= 0, bQ: cs.indexOf('q') >= 0 },
      ep: ep, half: +parts[4] || 0, full: +parts[5] || 1 };
  }

  var API = { startPosition: startPosition, legalMoves: legalMoves, applyMove: applyMove, inCheck: inCheck, isAttacked: isAttacked,
    insufficient: insufficient, posKey: posKey, sqName: sqName, perft: perft, fromFEN: fromFEN, findKing: findKing, other: other };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ChessEngine = API;
})(typeof window !== 'undefined' ? window : this);
