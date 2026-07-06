/* Pul Oqimi — oʻyin taxtasi (SVG) va fishkalar animatsiyasi */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});

  var SIZE = 1000;
  var CX = SIZE / 2, CY = SIZE / 2;
  var R_FAST = 418;   // tashqi doira — Tezkor yoʻl
  var R_RAT = 268;    // ichki doira — Sichqonlar poygasi
  var CELL_FAST = 64, CELL_RAT = 58;

  var SPACE_META = {
    deal:     { emoji: '💼', nom: 'Imkoniyat', cls: 'sp-deal' },
    market:   { emoji: '🏪', nom: 'Bozor', cls: 'sp-market' },
    doodad:   { emoji: '🛍️', nom: 'Xarajat', cls: 'sp-doodad' },
    payday:   { emoji: '💵', nom: 'Maosh kuni', cls: 'sp-payday' },
    charity:  { emoji: '🤲', nom: 'Ehson', cls: 'sp-charity' },
    baby:     { emoji: '👶', nom: 'Farzand', cls: 'sp-baby' },
    downsize: { emoji: '📉', nom: 'Ishdan boʻshatish', cls: 'sp-downsize' },
    ftPayday: { emoji: '💰', nom: 'Pul oqimi kuni', cls: 'sp-payday' },
    ftDeal:   { emoji: '🏭', nom: 'Yirik biznes', cls: 'sp-deal' },
    ftDream:  { emoji: '⭐', nom: 'Orzu', cls: 'sp-dream' },
    ftTax:    { emoji: '🧾', nom: 'Soliq tekshiruvi', cls: 'sp-downsize' },
    ftLawsuit:{ emoji: '⚖️', nom: 'Sud jarayoni', cls: 'sp-downsize' },
    event:    { emoji: '📰', nom: 'Voqea', cls: 'sp-event' },
    ftEvent:  { emoji: '📰', nom: 'Katta voqea', cls: 'sp-event' },
    shortcut: { emoji: '⏩', nom: 'Tanish-bilish', cls: 'sp-shortcut' },
    gamble:   { emoji: '🎯', nom: 'Tavakkalli taklif', cls: 'sp-gamble' },
    auction:  { emoji: '🔨', nom: 'Auksion', cls: 'sp-auction' },
    ftAuction:{ emoji: '🔨', nom: 'Auksion', cls: 'sp-auction' },
  };

  function polar(r, idx, total) {
    var ang = (-90 + (360 / total) * idx) * (Math.PI / 180);
    return { x: CX + r * Math.cos(ang), y: CY + r * Math.sin(ang) };
  }

  function el(tag, attrs, parent) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  var svg, tokenLayer, cellEls = { rat: [], fast: [] };

  function render(container) {
    container.innerHTML = '';
    svg = el('svg', { viewBox: '0 0 ' + SIZE + ' ' + SIZE, class: 'board-svg', role: 'img', 'aria-label': 'Oʻyin taxtasi' });
    container.appendChild(svg);

    // bezak halqalar
    el('circle', { cx: CX, cy: CY, r: R_FAST + 44, class: 'ring-outer' }, svg);
    el('circle', { cx: CX, cy: CY, r: (R_FAST + R_RAT) / 2, class: 'ring-mid' }, svg);
    el('circle', { cx: CX, cy: CY, r: R_RAT - 44, class: 'ring-inner' }, svg);

    drawRing('fast', PO.BOARDS.fast, R_FAST, CELL_FAST);
    drawRing('rat', PO.BOARDS.rat, R_RAT, CELL_RAT);

    // doira nomlari (aylana boʻylab)
    var defs = el('defs', {}, svg);
    el('path', { id: 'lblFast', d: arcPath(R_FAST + 58), fill: 'none' }, defs);
    el('path', { id: 'lblRat', d: arcPath(R_RAT + 50), fill: 'none' }, defs);
    var t1 = el('text', { class: 'ring-label' }, svg);
    var tp1 = el('textPath', { href: '#lblFast', startOffset: '50%', 'text-anchor': 'middle' }, t1);
    tp1.textContent = '· TEZKOR YOʻL ·';
    var t2 = el('text', { class: 'ring-label ring-label-rat' }, svg);
    var tp2 = el('textPath', { href: '#lblRat', startOffset: '50%', 'text-anchor': 'middle' }, t2);
    tp2.textContent = '· SICHQONLAR POYGASI ·';

    tokenLayer = el('g', { class: 'tokens' }, svg);
  }

  function arcPath(r) {
    // yuqoridan boshlanadigan toʻliq aylana (matn uchun)
    return 'M ' + (CX - r) + ' ' + CY + ' a ' + r + ' ' + r + ' 0 1 1 ' + (2 * r) + ' 0 a ' + r + ' ' + r + ' 0 1 1 ' + (-2 * r) + ' 0';
  }

  function drawRing(name, layout, radius, cell) {
    cellEls[name] = [];
    for (var i = 0; i < layout.length; i++) {
      var meta = SPACE_META[layout[i]];
      var pos = polar(radius, i, layout.length);
      var g = el('g', { class: 'cell ' + meta.cls, transform: 'translate(' + pos.x + ',' + pos.y + ')' }, svg);
      el('rect', { x: -cell / 2, y: -cell / 2, width: cell, height: cell, rx: 14 }, g);
      var em = el('text', { class: 'cell-emoji', y: 2 }, g);
      em.textContent = meta.emoji;
      var title = el('title', {}, g);
      title.textContent = meta.nom + ' (' + (i + 1) + ')';
      cellEls[name].push(g);
    }
  }

  function tokenPos(board, pos, playerIdx, playerCount) {
    var r = board === 'rat' ? R_RAT : R_FAST;
    var total = 24;
    var c = polar(r, pos, total);
    var offs = playerCount > 1
      ? [[-13, -13], [13, -13], [-13, 13], [13, 13]]
      : [[0, 0]];
    var o = offs[playerIdx % offs.length] || [0, 0];
    return { x: c.x + o[0], y: c.y + o[1] };
  }

  function placeTokens(state) {
    tokenLayer.innerHTML = '';
    state.players.forEach(function (p) {
      if (p.bankrupt) return;
      var g = el('g', { class: 'token', id: 'token-' + p.i }, tokenLayer);
      el('circle', { r: 17, fill: p.color, class: 'token-c' }, g);
      var t = el('text', { y: 1, class: 'token-emoji' }, g);
      t.textContent = PO.engine.profById(p.profId).emoji;
      var pos = tokenPos(p.board, p.pos, p.i, state.players.length);
      g.setAttribute('transform', 'translate(' + pos.x + ',' + pos.y + ')');
    });
    highlight(state);
  }

  function highlight(state) {
    ['rat', 'fast'].forEach(function (b) {
      cellEls[b].forEach(function (c) { c.classList.remove('cell-active'); });
    });
    var p = state.players[state.turn];
    if (p && !p.bankrupt) {
      var c = cellEls[p.board][p.pos];
      if (c) c.classList.add('cell-active');
    }
  }

  // Fishkani katakma-katak yurgizish; Promise qaytaradi
  function moveToken(state, pIdx, fromPos, steps, board, stepMs) {
    return new Promise(function (resolve) {
      var g = svg.querySelector('#token-' + pIdx);
      if (!g) { resolve(); return; }
      var p = state.players[pIdx];
      var i = 0;
      g.classList.add('token-moving');
      function step() {
        i++;
        var pos = (fromPos + i) % 24;
        var xy = tokenPos(board, pos, pIdx, state.players.length);
        g.style.transition = 'transform ' + stepMs + 'ms cubic-bezier(.3,1.4,.5,1)';
        g.setAttribute('transform', 'translate(' + xy.x + ',' + xy.y + ')');
        var cellType = (board === 'rat' ? PO.BOARDS.rat : PO.BOARDS.fast)[pos];
        if (cellType === 'payday' || cellType === 'ftPayday') {
          var c = cellEls[board][pos];
          c.classList.add('cell-flash');
          setTimeout(function () { c.classList.remove('cell-flash'); }, 700);
        }
        if (i >= steps) {
          setTimeout(function () { g.classList.remove('token-moving'); highlight(state); resolve(); }, stepMs);
        } else {
          setTimeout(step, stepMs);
        }
      }
      step();
    });
  }

  // Tezkor yoʻlga oʻtish: fishkani tashqi doiraga "sakratish"
  function jumpToFast(state, pIdx) {
    return new Promise(function (resolve) {
      var g = svg.querySelector('#token-' + pIdx);
      if (!g) { resolve(); return; }
      var xy = tokenPos('fast', 0, pIdx, state.players.length);
      g.style.transition = 'transform 900ms cubic-bezier(.2,1.6,.4,1)';
      g.setAttribute('transform', 'translate(' + xy.x + ',' + xy.y + ')');
      setTimeout(function () { highlight(state); resolve(); }, 950);
    });
  }

  PO.board = {
    render: render,
    placeTokens: placeTokens,
    moveToken: moveToken,
    jumpToFast: jumpToFast,
    highlight: highlight,
    SPACE_META: SPACE_META,
  };
})();
