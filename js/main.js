/* Pul Oqimi — asosiy oqim: ekranlar, oʻyin sozlash, harakatlar navbati, saqlash */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});
  var U = PO.util;
  var E = PO.engine;
  var $ = function (s) { return document.querySelector(s); };
  var SAVE_KEY = 'puloqimi_save_v1';

  var G = { state: null, config: null, prevTurn: -1, busy: false, queue: [] };

  /* ————— Ekranlar ————— */
  function show(id) {
    ['scr-home', 'scr-setup', 'scr-game'].forEach(function (s) {
      document.getElementById(s).classList.toggle('active', s === id);
    });
    window.scrollTo(0, 0);
  }

  /* ————— Bosh sahifa ————— */
  function initHome() {
    var resumeBtn = $('#btnResume');
    var hasSave = !!localStorage.getItem(SAVE_KEY);
    resumeBtn.classList.toggle('hidden', !hasSave);
    $('#btnNew').onclick = function () { renderSetup(); show('scr-setup'); };
    resumeBtn.onclick = resumeGame;
    $('#btnRules').onclick = showHelp;
    $('#btnRulesGame').onclick = showHelp;
  }

  /* ————— Oʻyin sozlash ————— */
  var setup = { count: 1, players: [] };

  function renderSetup() {
    setup.count = setup.count || 1;
    while (setup.players.length < 4) setup.players.push({ name: '', profId: null, dreamId: null });

    var box = $('#setupBody');
    var html = '<div class="setup-count"><span>Oʻyinchilar soni:</span>' +
      [1, 2, 3, 4].map(function (n) {
        return '<button class="chip' + (setup.count === n ? ' on' : '') + '" data-count="' + n + '">' + n + '</button>';
      }).join('') + '<span class="muted">(bitta qurilmada navbat bilan)</span></div>';

    for (var i = 0; i < setup.count; i++) html += playerSetupHtml(i);
    box.innerHTML = html;

    box.querySelectorAll('[data-count]').forEach(function (b) {
      b.onclick = function () { setup.count = +b.dataset.count; renderSetup(); };
    });
    box.querySelectorAll('.pl-name').forEach(function (inp) {
      inp.oninput = function () { setup.players[+inp.dataset.p].name = inp.value; refreshStart(); };
    });
    box.querySelectorAll('[data-prof]').forEach(function (c) {
      c.onclick = function () {
        setup.players[+c.dataset.p].profId = c.dataset.prof;
        renderSetup();
      };
    });
    box.querySelectorAll('[data-dream]').forEach(function (c) {
      c.onclick = function () {
        setup.players[+c.dataset.p].dreamId = c.dataset.dream;
        renderSetup();
      };
    });
    box.querySelectorAll('[data-rand]').forEach(function (b) {
      b.onclick = function () {
        var i = +b.dataset.rand;
        setup.players[i].profId = PO.DATA.professions[Math.floor(Math.random() * PO.DATA.professions.length)].id;
        setup.players[i].dreamId = PO.DATA.dreams[Math.floor(Math.random() * PO.DATA.dreams.length)].id;
        renderSetup();
      };
    });
    $('#btnStart').onclick = startGame;
    refreshStart();
  }

  function playerSetupHtml(i) {
    var pl = setup.players[i];
    var profCards = PO.DATA.professions.map(function (pr) {
      var cf = pr.salary - (function () { var s = 0; for (var k in pr.expenses) s += pr.expenses[k]; pr.liabilities.forEach(function (l) { s += l.payment; }); return s; })();
      return '<button class="prof-card' + (pl.profId === pr.id ? ' on' : '') + '" data-p="' + i + '" data-prof="' + pr.id + '" title="' + PO.ui.esc(pr.tagline) + '">' +
        '<span class="prof-emoji">' + pr.emoji + '</span><span class="prof-nom">' + pr.nom + '</span>' +
        '<span class="prof-sal">maosh ' + U.fmtShort(pr.salary) + '</span>' +
        '<span class="prof-cf">oqim +' + U.fmtShort(cf) + '/oy</span></button>';
    }).join('');
    var dreamCards = PO.DATA.dreams.map(function (d) {
      return '<button class="dream-card' + (pl.dreamId === d.id ? ' on' : '') + '" data-p="' + i + '" data-dream="' + d.id + '" title="' + PO.ui.esc(d.desc) + '">' +
        '<span>' + d.emoji + '</span><span class="dream-nom">' + d.nom + '</span><span class="dream-cost">' + U.fmtShort(d.cost) + '</span></button>';
    }).join('');
    var selProf = pl.profId ? E.profById(pl.profId) : null;
    return '<section class="setup-player"><div class="setup-player-head">' +
      '<h3>' + (i + 1) + '-oʻyinchi</h3>' +
      '<input class="pl-name" data-p="' + i + '" maxlength="16" placeholder="Ismingiz…" value="' + PO.ui.esc(pl.name) + '">' +
      '<button class="mini" data-rand="' + i + '">🎲 Tasodifiy</button></div>' +
      (selProf ? '<p class="prof-tagline">' + selProf.emoji + ' ' + PO.ui.esc(selProf.tagline) + '</p>' : '<p class="prof-tagline muted">Kasb tanlang — har birining maoshi, xarajati va qiyinligi har xil.</p>') +
      '<div class="prof-grid">' + profCards + '</div>' +
      '<h4>⭐ Orzuingizni tanlang <span class="muted">(Tezkor yoʻlda shuni sotib olsangiz — gʻalaba!)</span></h4>' +
      '<div class="dream-grid">' + dreamCards + '</div></section>';
  }

  function refreshStart() {
    var ok = true;
    for (var i = 0; i < setup.count; i++) {
      if (!setup.players[i].profId || !setup.players[i].dreamId) ok = false;
    }
    $('#btnStart').disabled = !ok;
    $('#btnStart').textContent = ok ? '▶ Oʻyinni boshlash' : 'Kasb va orzu tanlang…';
  }

  function startGame() {
    var players = [];
    for (var i = 0; i < setup.count; i++) {
      var pl = setup.players[i];
      players.push({ name: pl.name.trim() || (i + 1) + '-oʻyinchi', profId: pl.profId, dreamId: pl.dreamId });
    }
    G.config = { players: players };
    G.state = E.newGame({ players: players });
    beginGameScreen();
  }

  function restartSameConfig() {
    $('#overlay').classList.remove('open');
    G.state = E.newGame({ players: G.config.players });
    beginGameScreen();
  }

  function beginGameScreen() {
    show('scr-game');
    PO.board.render($('#board'));
    PO.board.placeTokens(G.state);
    PO.ui.setView(G.state.turn);
    G.prevTurn = G.state.turn;
    PO.ui.renderSidebar(G.state);
    PO.ui.renderLog(G.state);
    PO.ui.renderPending(G.state);
    save();
  }

  /* ————— Saqlash / davom ettirish ————— */
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ state: G.state, config: G.config }));
    } catch (e) { /* xotira toʻlgan boʻlishi mumkin — jim oʻtamiz */ }
  }

  function resumeGame() {
    try {
      var data = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!data || !data.state || data.state.over) throw new Error('eski saqlash');
      G.state = data.state;
      G.config = data.config;
      beginGameScreen();
    } catch (e) {
      localStorage.removeItem(SAVE_KEY);
      alert('Saqlangan oʻyin topilmadi yoki eskirgan.');
      initHome();
    }
  }

  /* ————— Harakatlar navbati va animatsiyalar ————— */
  function dispatch(action) {
    G.queue.push(action);
    if (!G.busy) drain();
  }

  function drain() {
    if (G.queue.length === 0) { G.busy = false; return; }
    G.busy = true;
    var action = G.queue.shift();
    var st = G.state;
    try {
      E.act(st, action);
    } catch (err) {
      console.error(err);
      PO.ui.cashToast(0, err.message);
      G.busy = false;
      PO.ui.renderPending(st);
      return;
    }
    processEvents(st.events.slice()).then(function () {
      PO.board.placeTokens(st);
      PO.ui.renderSidebar(st);
      PO.ui.renderLog(st);
      save();
      var next = function () {
        PO.ui.renderPending(st);
        G.busy = false;
        drain();
      };
      // koʻp oʻyinchi: navbat almashganda banner
      if (!st.over && st.players.length > 1 && st.turn !== G.prevTurn && st.pending && st.pending.t === 'turn') {
        G.prevTurn = st.turn;
        PO.ui.setView(st.turn);
        PO.ui.renderSidebar(st);
        PO.ui.turnBanner(st.players[st.turn]).then(next);
      } else {
        G.prevTurn = st.turn;
        next();
      }
    });
  }

  function processEvents(events) {
    var chain = Promise.resolve();
    events.forEach(function (e) {
      chain = chain.then(function () {
        switch (e.e) {
          case 'dice':
            return PO.ui.showDice(e.v);
          case 'move':
            return PO.board.moveToken(G.state, e.p, e.from, e.steps, e.board, Math.max(110, 340 - e.steps * 22));
          case 'payday':
            PO.ui.cashToast(e.amount, 'maosh kuni');
            return wait(260);
          case 'escape':
            PO.sound.play('escape');
            PO.ui.confetti();
            return wait(500);
          case 'ftEnter':
            return PO.board.jumpToFast(G.state, e.p);
          case 'bankrupt':
            PO.board.placeTokens(G.state);
            return wait(300);
          case 'win':
            PO.sound.play('win');
            return wait(300);
          case 'achievement':
            PO.ui.achToast(e.id);
            return wait(150);
          default:
            return null;
        }
      });
    });
    return chain;
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ————— Qoidalar oynasi ————— */
  function showHelp() {
    var gl = PO.DATA.glossary.map(function (g) {
      return '<div class="frow gloss"><span><b>' + g[0] + '</b></span><span>' + g[1] + '</span></div>';
    }).join('');
    var body = '<div class="rules">' +
      '<p><b>Maqsad:</b> «Sichqonlar poygasi»dan chiqish — buning uchun <b>passiv daromadingiz</b> (aktivlardan keladigan pul) <b>xarajatlaringizdan oshishi</b> kerak. Soʻng Tezkor yoʻlda orzuingizni sotib oling yoki oyiga +600 mln soʻm yangi pul oqimi yarating — GʻALABA!</p>' +
      '<p><b>Navbat:</b> shoshqol tashlaysiz → katakka tushasiz:</p>' +
      '<ul>' +
      '<li>💼 <b>Imkoniyat</b> — kichik yoki katta bitim kartasi: aksiya, omonat, kvartira, biznes…</li>' +
      '<li>🏪 <b>Bozor</b> — aktivlaringizga xaridor chiqadi yoki narxlar oʻzgaradi.</li>' +
      '<li>🛍️ <b>Xarajat</b> — kutilmagan hayotiy xarajat (toʻy, telefon, taʼmir…).</li>' +
      '<li>💵 <b>Maosh kuni</b> — undan oʻtganingizda pul oqimingiz qoʻshiladi.</li>' +
      '<li>🤲 <b>Ehson</b> — daromadning 10% ini bersangiz, 3 navbat 1–2 shoshqol tanlaysiz.</li>' +
      '<li>👶 <b>Farzand</b> — oila kattalashadi, xarajat +.</li>' +
      '<li>📉 <b>Ishdan boʻshatish</b> — bir oylik xarajat + 2 navbat dam.</li>' +
      '<li>📰 <b>Voqea</b> — kutilmagan yangilik: yutuq, zarar yoki bank yengilligi.</li>' +
      '<li>⏩ <b>Tanish-bilish</b> — 2–4 xona oldinga bepul sakraysiz.</li>' +
      '<li>🎯 <b>Tavakkalli taklif</b> — xohlasangiz, mablagʻ tikib ikki barobar yutish (yoki yoʻqotish) imkoniyati. Ixtiyoriy!</li>' +
      '<li>🔨 <b>Auksion</b> — jozibali bitim uchun boshqa oʻyinchilar bilan ochiq savdolashasiz.</li>' +
      '</ul>' +
      '<p><b>Yutuqlar:</b> portfelingiz oʻsishi, poygadan chiqish, tavakkal va auksion gʻalabalari kabi bosqichlar uchun maxsus nishonlar olasiz — ekranning pastki oʻng burchagida chiqadi.</p>' +
      '<p><b>Bank:</b> istalgan payt (oʻz navbatingizda) 1 mln karraligida kredit olasiz — oyiga ' + Math.round(PO.C.LOAN_RATE * 100) + '% foiz toʻlaysiz. Aksiyalarni karta chiqqanda sotib olasiz/sotasiz; omonatni istalgan payt yechasiz.</p>' +
      '<p><b>Eslab qoling:</b> Aktiv — choʻntakka pul olib keladi. Passiv — choʻntakdan olib ketadi. Boylar aktiv yigʻadi!</p>' +
      '<h4>Lugʻat</h4>' + gl +
      '<p class="muted">Oʻyin Robert Kiyosakining mashhur «CASHFLOW» oʻyini gʻoyalaridan ilhomlangan mustaqil taʼlimiy loyiha. Raqamlar 2025–2026-yillardagi Oʻzbekiston bozori moʻljallariga asoslangan (stat.uz, uzse.uz), soddalashtirilgan va taʼlim maqsadida keltirilgan.</p>' +
      '</div>';
    var m = $('#modal');
    m.innerHTML = '<div class="modal-card modal-wide"><div class="modal-emoji">📖</div><h3 class="modal-title">Qanday oʻynaladi?</h3>' +
      '<div class="modal-body">' + body + '</div>' +
      '<div class="modal-actions"><button class="btn btn-primary" id="helpClose">Tushunarli!</button></div></div>';
    m.classList.add('open');
    $('#helpClose').onclick = function () { m.classList.remove('open'); };
  }

  /* ————— Ishga tushirish ————— */
  document.addEventListener('DOMContentLoaded', function () {
    PO.ui.setDispatch(dispatch);
    PO.ui.initMuteButtons();
    initHome();
    show('scr-home');
  });

  PO.main = { restartSameConfig: restartSameConfig, dispatch: dispatch };
})();
