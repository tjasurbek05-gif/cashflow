/* Pul Oqimi — oʻyin mexanikasi (sof mantiq, DOMga bogʻlanmagan).
   Holat (state) JSON sifatida toʻliq saqlanadi/tiklanadi. */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});
  var U = PO.util;

  /* ————— Doimiylar ————— */
  var C = {
    LOAN_RATE: 0.03,        // bank krediti: oyiga 3% foiz toʻlovi (~36% yillik)
    LOAN_STEP: 1000000,     // kredit 1 mln soʻm karraligida
    LOAN_CAP_SHARE: 0.5,    // kredit foizi (maosh+passiv)ning 50% idan oshmasin
    CHARITY_TURNS: 3,       // ehsondan keyin 3 navbat 1–2 dona shoshqol tanlash
    CHARITY_SHARE: 0.1,     // ehson: (maosh+passiv)ning 10% i
    DOWNSIZE_SKIP: 2,       // ishdan boʻshatilganda 2 navbat oʻtkazib yuboriladi
    MAX_KIDS: 3,
    FT_MULT: 100,           // tezkor yoʻlga oʻtishda: pul oqimi kuni = passiv × 100
    FT_WIN_CF: 600000000,   // gʻalaba: tezkor yoʻlda +600 mln/oy yangi pul oqimi
    FT_LAWSUIT: 300000000,  // sud jarayoni
    STOCK_EMERGENCY: 0.6,   // favqulodda sotishda aksiya bazaviy narxining 60% i
    RENT_FLOOR: 100000,     // ijara pasayganda minimal cf
    LOG_MAX: 250,
    SHORTCUT_MIN: 2, SHORTCUT_MAX: 4,       // "tanish-bilish": necha xona oldinga sakraladi
    GAMBLE_PCT: 0.08, GAMBLE_MIN: 500000, GAMBLE_MAX: 5000000, // tavakkalli taklif stavkasi
    AUCTION_STEP_PCT: 0.08,                 // auksionda har taklif necha foizga oshadi
    NETWORTH_MILLIONAIRE: 1000000000,       // "Millioner" yutugʻi uchun sof boylik
    BIZ_CF_FLOOR: 50000,                    // voqea taʼsiridan keyin ham cf shu qiymatdan past tushmaydi
  };

  // Sichqonlar poygasi doirasi — 24 katak (maosh kuni har 6 katakda, + voqea/yorliq/tavakkal/auksion)
  // Diqqat: 'shortcut' oʻyinchini 2-4 xona oldinga majburiy suradi — uning tushish
  // diapazoniga 'baby'/'downsize' kabi doimiy yoki ogʻir xarajatli kataklar tushmasin
  // (aks holda ular tasodifdan koʻra tez-tez "urib" ketaveradi — balans sinovida topilgan).
  var RAT = [
    'deal', 'market', 'event', 'doodad', 'deal', 'payday',
    'deal', 'charity', 'deal', 'market', 'shortcut', 'payday',
    'deal', 'deal', 'gamble', 'market', 'baby', 'payday',
    'deal', 'doodad', 'auction', 'downsize', 'deal', 'payday',
  ];

  // Tezkor yoʻl doirasi — 24 katak
  var FAST = [
    'ftPayday', 'ftDeal', 'ftDeal', 'ftDream', 'ftDeal', 'ftDeal',
    'ftEvent', 'ftDream', 'ftPayday', 'ftDeal', 'ftDeal', 'ftDream',
    'ftTax', 'ftDeal', 'ftDeal', 'ftDream', 'ftPayday', 'ftDeal',
    'ftAuction', 'ftDream', 'ftLawsuit', 'ftDeal', 'ftDeal', 'ftDream',
  ];

  var PLAYER_COLORS = ['#0d9488', '#d97706', '#f43f5e', '#8b5cf6']; // CVD-tekshiruvdan oʻtgan
  var PLAYER_TOKENS = ['🟢', '🟠', '🔴', '🟣'];

  /* ————— Yordamchilar ————— */

  function log(st, msg, cls) {
    st.log.push({ m: msg, c: cls || '', r: st.round });
    if (st.log.length > C.LOG_MAX) st.log.splice(0, st.log.length - C.LOG_MAX);
  }
  function ev(st, e) { st.events.push(e); }
  function P(st) { return st.players[st.turn]; }

  function cardById(id) {
    var pools = [
      PO.DATA.small, PO.DATA.big, PO.DATA.market, PO.DATA.doodad, PO.DATA.fast,
      PO.DATA.events, PO.DATA.ftEvents, PO.DATA.auctionPool,
    ];
    for (var k = 0; k < pools.length; k++) {
      for (var i = 0; i < pools[k].length; i++) if (pools[k][i].id === id) return pools[k][i];
    }
    return null;
  }
  function dreamById(id) {
    for (var i = 0; i < PO.DATA.dreams.length; i++) if (PO.DATA.dreams[i].id === id) return PO.DATA.dreams[i];
    return null;
  }
  function profById(id) {
    for (var i = 0; i < PO.DATA.professions.length; i++) if (PO.DATA.professions[i].id === id) return PO.DATA.professions[i];
    return null;
  }

  /* ————— Moliyaviy hisob-kitob ————— */

  function passiveIncome(p) {
    var s = 0;
    for (var i = 0; i < p.assets.length; i++) {
      var a = p.assets[i];
      if (a.kind === 'stock') s += a.qty * (PO.DATA.stocks[a.ticker].div || 0);
      else s += a.cf || 0;
    }
    return s;
  }

  function expensesTotal(p) {
    var s = 0;
    for (var k in p.expenses) s += p.expenses[k];
    s += p.kids * p.perChild;
    for (var i = 0; i < p.liabilities.length; i++) s += p.liabilities[i].payment;
    s += Math.round(p.bankLoan * C.LOAN_RATE);
    return s;
  }

  function cashflow(p) { return p.salary + passiveIncome(p) - expensesTotal(p); }

  // Kundalik xarajat narxi: turmush darajasi maoshga yarasha ("lifestyle inflation")
  function doodadCost(p, card) {
    var base = Math.round((p.salary * card.pct) / 50000) * 50000;
    return card.perKid ? base * p.kids : base;
  }
  function ftPaydayAmount(p) { return p.ftIncome + p.ftExtra; }

  function maxLoan(p) {
    var capPay = Math.floor((p.salary + passiveIncome(p)) * C.LOAN_CAP_SHARE);
    var curPay = Math.round(p.bankLoan * C.LOAN_RATE);
    var extraPay = capPay - curPay;
    if (extraPay <= 0) return 0;
    var amount = Math.floor(extraPay / C.LOAN_RATE);
    return Math.floor(amount / C.LOAN_STEP) * C.LOAN_STEP;
  }

  // Favqulodda sotuv qiymati (bankrotlikdan qochish uchun, chegirmali)
  function emergencyValue(a) {
    if (a.kind === 'omonat') return a.lots * a.lotPrice;
    if (a.kind === 'stock') return Math.floor(a.qty * PO.DATA.stocks[a.ticker].base * C.STOCK_EMERGENCY);
    if (a.kind === 're' || a.kind === 'biz') {
      return Math.max(Math.round(((a.full || a.cost) - (a.mortgage || 0)) * 0.5), 0);
    }
    return Math.round((a.cost || 0) * 0.5); // yer
  }

  // Sof boylik: naqd + barcha aktivlarning (kredit ayrilgan) taxminiy qiymati
  function netWorth(p) {
    var s = p.cash - p.bankLoan;
    for (var i = 0; i < p.liabilities.length; i++) s -= p.liabilities[i].balance;
    p.assets.forEach(function (a) {
      if (a.kind === 'stock') s += a.qty * PO.DATA.stocks[a.ticker].base;
      else if (a.kind === 'omonat') s += a.lots * a.lotPrice;
      else if (a.kind === 're' || a.kind === 'biz') s += (a.full || a.cost) - (a.mortgage || 0);
      else s += a.cost || 0;
    });
    return s;
  }

  function grantAch(st, p, id) {
    if (p.achievements[id]) return;
    p.achievements[id] = true;
    var a = PO.DATA.achievements[id];
    ev(st, { e: 'achievement', p: p.i, id: id });
    log(st, '🏅 Yutuq: ' + a.emoji + ' «' + a.nom + '» — ' + a.desc, 'good');
  }

  // Holatga qarab qoʻlga kiritilgan boʻlishi mumkin boʻlgan yutuqlarni tekshiradi (idempotent)
  function checkAchievements(st, p) {
    if (p.stats.deals >= 1) grantAch(st, p, 'firstDeal');
    if (p.assets.length >= 5) grantAch(st, p, 'portfolio5');
    if (p.assets.length >= 10) grantAch(st, p, 'portfolio10');
    if (p.escaped) grantAch(st, p, 'escaped');
    if (netWorth(p) >= C.NETWORTH_MILLIONAIRE) grantAch(st, p, 'millionaire');
    if (p.stats.charityCount >= 3) grantAch(st, p, 'generous');
    if (p.stats.wasDownsized && !p.bankrupt && p.skip === 0) grantAch(st, p, 'survivor');
  }

  function escapeCheck(st, p) {
    if (p.board !== 'rat' || p.escaped || p.bankrupt) return;
    if (passiveIncome(p) > expensesTotal(p)) {
      p.escaped = true;
      p.stats.escMonth = p.months;
      log(st, '🎉 ' + p.name + ' sichqonlar poygasidan chiqdi! Passiv daromadi xarajatlaridan oshdi. Keyingi navbatda Tezkor yoʻlga oʻtadi.', 'good');
      ev(st, { e: 'escape', p: p.i });
    }
  }

  /* ————— Kartalar toʻplami ————— */

  function buildDeck(st, name, arr) {
    st.decks[name] = U.shuffled(st, arr.map(function (c) { return c.id; }));
    st.deckPos[name] = 0;
  }

  function draw(st, name) {
    if (st.deckPos[name] >= st.decks[name].length) {
      st.decks[name] = U.shuffled(st, st.decks[name]);
      st.deckPos[name] = 0;
    }
    var id = st.decks[name][st.deckPos[name]++];
    return cardById(id);
  }

  /* ————— Oʻyin yaratish ————— */

  function newGame(cfg) {
    var seed = (cfg.seed == null ? Math.floor(Math.random() * 0xffffffff) : cfg.seed) >>> 0;
    var st = {
      v: 1,
      seed: seed,
      rngState: seed,
      players: [],
      turn: 0,
      round: 1,
      decks: {},
      deckPos: {},
      pending: null,
      over: null,
      log: [],
      events: [],
    };
    for (var i = 0; i < cfg.players.length; i++) {
      var pc = cfg.players[i];
      var prof = profById(pc.profId);
      var expenses = {};
      for (var k in prof.expenses) expenses[k] = prof.expenses[k];
      st.players.push({
        i: i,
        name: pc.name || 'Oʻyinchi ' + (i + 1),
        profId: prof.id,
        dreamId: pc.dreamId,
        color: PLAYER_COLORS[i],
        token: PLAYER_TOKENS[i],
        cash: prof.startCash,
        kids: 0,
        salary: prof.salary,
        expenses: expenses,
        perChild: prof.perChild,
        liabilities: prof.liabilities.map(function (l) {
          return { id: l.id, nom: l.nom, balance: l.balance, payment: l.payment };
        }),
        bankLoan: 0,
        assets: [],
        charity: 0,
        skip: 0,
        board: 'rat',
        pos: 0,
        escaped: false,
        ftIncome: 0,
        ftExtra: 0,
        won: false,
        bankrupt: false,
        months: 0,
        achievements: {},
        stats: { deals: 0, doodadSpent: 0, escMonth: 0, charity: 0, charityCount: 0, wasDownsized: false },
      });
    }
    buildDeck(st, 'small', PO.DATA.small);
    buildDeck(st, 'big', PO.DATA.big);
    buildDeck(st, 'market', PO.DATA.market);
    buildDeck(st, 'doodad', PO.DATA.doodad);
    buildDeck(st, 'fast', PO.DATA.fast);
    buildDeck(st, 'events', PO.DATA.events);
    buildDeck(st, 'ftEvents', PO.DATA.ftEvents);
    buildDeck(st, 'auction', PO.DATA.auctionPool);
    log(st, 'Oʻyin boshlandi! Omad, ' + st.players.map(function (p) { return p.name; }).join(', ') + '!');
    startTurn(st);
    return st;
  }

  /* ————— Navbat oqimi ————— */

  function startTurn(st) {
    if (st.over) return;
    var p = P(st);
    // Poygadan chiqqan oʻyinchi navbat boshida Tezkor yoʻlga koʻchadi
    if (p.escaped && p.board === 'rat') {
      p.board = 'fast';
      p.pos = 0;
      p.ftIncome = passiveIncome(p) * C.FT_MULT;
      log(st, '🚀 ' + p.name + ' TEZKOR YOʻLga oʻtdi! Endi «Pul oqimi kuni»da ' + U.fmtShortSum(ftPaydayAmount(p)) + ' oladi. Gʻalaba: orzuni sotib olish yoki +' + U.fmtShort(C.FT_WIN_CF) + ' soʻm/oy yangi pul oqimi.', 'good');
      ev(st, { e: 'ftEnter', p: p.i });
    }
    st.pending = { t: 'turn', p: p.i, canDice2: p.charity > 0, charityLeft: p.charity };
  }

  function nextPlayer(st) {
    if (st.over) return;
    var alive = st.players.filter(function (q) { return !q.bankrupt && !q.won; });
    if (alive.length === 0) { st.over = { type: 'allOut' }; st.pending = { t: 'gameOver' }; return; }
    for (var hop = 0; hop < st.players.length * 3; hop++) {
      st.turn = (st.turn + 1) % st.players.length;
      if (st.turn === 0) st.round++;
      var p = P(st);
      if (p.bankrupt || p.won) continue;
      if (p.skip > 0) {
        p.skip--;
        log(st, '⏭️ ' + p.name + ' navbatni oʻtkazib yubordi (' + (p.skip > 0 ? 'yana ' + p.skip + ' ta bor' : 'oxirgisi') + ').');
        continue;
      }
      startTurn(st);
      return;
    }
    st.over = { type: 'allOut' };
    st.pending = { t: 'gameOver' };
  }

  function finishMainPhase(st) {
    // Katak taʼsiri yakunlandi — qarzga botib qolmaganini tekshiramiz
    var p = P(st);
    checkAchievements(st, p);
    if (p.cash < 0) {
      st.pending = { t: 'insolvent', p: p.i, deficit: -p.cash };
      ev(st, { e: 'insolvent', p: p.i });
      log(st, '🆘 ' + p.name + ' toʻlovga qurbi yetmayapti: kassada ' + U.fmt(p.cash) + '. Kredit oling yoki aktiv soting!', 'bad');
    } else {
      // navbat avtomatik yakunlanadi — bank amallari keyingi navbat boshida ham ochiq
      nextPlayer(st);
    }
  }

  /* ————— Harakat (yurish) ————— */

  function doRoll(st, diceCount) {
    var p = P(st);
    if (p.charity > 0) p.charity--; else diceCount = 1;
    var d = [];
    for (var i = 0; i < diceCount; i++) d.push(U.randInt(st, 1, 6));
    var steps = d.reduce(function (a, b) { return a + b; }, 0);
    ev(st, { e: 'dice', v: d, p: p.i });
    log(st, '🎲 ' + p.name + ' ' + steps + ' tashladi.');
    moveBy(st, steps);
  }

  function moveBy(st, steps) {
    var p = P(st);
    var board = p.board === 'rat' ? RAT : FAST;
    var from = p.pos;
    var path = [];
    for (var s = 1; s <= steps; s++) {
      var idx = (from + s) % board.length;
      path.push(idx);
      var type = board[idx];
      if (type === 'payday') collectPayday(st, p);
      if (type === 'ftPayday') collectFtPayday(st, p);
    }
    p.pos = (from + steps) % board.length;
    ev(st, { e: 'move', p: p.i, from: from, steps: steps, to: p.pos, board: p.board });
    resolveSpace(st);
  }

  function collectPayday(st, p) {
    var cf = cashflow(p);
    p.cash += cf;
    p.months++;
    ev(st, { e: 'payday', p: p.i, amount: cf });
    log(st, '💵 Maosh kuni: ' + p.name + ' ' + U.fmtSigned(cf) + ' oldi (kassa: ' + U.fmtShortSum(p.cash) + ').', cf >= 0 ? 'good' : 'bad');
  }

  function collectFtPayday(st, p) {
    var amt = ftPaydayAmount(p);
    p.cash += amt;
    p.months++;
    ev(st, { e: 'payday', p: p.i, amount: amt });
    log(st, '💰 Pul oqimi kuni: ' + p.name + ' ' + U.fmtSigned(amt) + ' oldi.', 'good');
  }

  /* ————— Katak taʼsirlari ————— */

  function resolveSpace(st) {
    var p = P(st);
    var board = p.board === 'rat' ? RAT : FAST;
    var type = board[p.pos];

    switch (type) {
      case 'payday':
        finishMainPhase(st); // pul yurish paytida yigʻilgan
        break;

      case 'deal':
        st.pending = { t: 'dealSize', p: p.i };
        break;

      case 'market': {
        var mc = draw(st, 'market');
        ev(st, { e: 'card', deck: 'market', id: mc.id });
        log(st, '🏪 Bozor: ' + mc.nom);
        applyMarket(st, mc);
        break;
      }

      case 'doodad': {
        var dc = draw(st, 'doodad');
        ev(st, { e: 'card', deck: 'doodad', id: dc.id });
        var cost = doodadCost(p, dc);
        if (dc.perKid && p.kids === 0) {
          log(st, '🛍️ Xarajat: «' + dc.nom + '» — farzandingiz yoʻq, bu safar hamyon omon qoldi! 😄');
          st.pending = { t: 'doodad', p: p.i, cardId: dc.id, cost: 0 };
        } else {
          p.cash -= cost;
          p.stats.doodadSpent += cost;
          log(st, '🛍️ Xarajat: «' + dc.nom + '» — ' + U.fmt(cost) + ' toʻlandi.', 'bad');
          ev(st, { e: 'cash', p: p.i, delta: -cost });
          st.pending = { t: 'doodad', p: p.i, cardId: dc.id, cost: cost };
        }
        break;
      }

      case 'charity': {
        var cCost = Math.round((p.salary + passiveIncome(p)) * C.CHARITY_SHARE);
        st.pending = { t: 'charity', p: p.i, cost: cCost };
        break;
      }

      case 'baby': {
        if (p.kids < C.MAX_KIDS) {
          p.kids++;
          ev(st, { e: 'baby', p: p.i });
          log(st, '👶 Xonadonda quvonch — farzand tugʻildi! Oylik xarajat +' + U.fmt(p.perChild) + '. (Farzandlar: ' + p.kids + ')');
        } else {
          log(st, '👶 ' + p.name + 'ning oilasi katta boʻlib boʻlgan (3 farzand) — bu safar oʻzgarish yoʻq.');
        }
        st.pending = { t: 'baby', p: p.i };
        break;
      }

      case 'event': {
        var ecard = draw(st, 'events');
        ev(st, { e: 'card', deck: 'events', id: ecard.id });
        log(st, '📰 Voqea: ' + ecard.nom);
        applyEvent(st, p, ecard);
        st.pending = { t: 'event', p: p.i, cardId: ecard.id };
        break;
      }

      case 'shortcut': {
        var extra = U.randInt(st, C.SHORTCUT_MIN, C.SHORTCUT_MAX);
        log(st, '⏩ ' + p.name + 'ga tanish-bilish yordam berdi — ' + extra + ' xona oldinga sakradi!', 'good');
        ev(st, { e: 'shortcut', p: p.i, extra: extra });
        moveBy(st, extra); // ichki resolveSpace chaqiruvi yangi katak uchun pendingni oʻzi belgilaydi
        break;
      }

      case 'gamble': {
        var stake = Math.min(p.cash, U.clamp(Math.round((p.cash * C.GAMBLE_PCT) / 100000) * 100000, C.GAMBLE_MIN, C.GAMBLE_MAX));
        st.pending = { t: 'gamble', p: p.i, stake: stake };
        break;
      }

      case 'auction': {
        resolveAuctionSpace(st, p, 'auction');
        break;
      }

      case 'downsize': {
        // Bir oylik ASOSIY turmush xarajatlari toʻlanadi (banklar «kredit taʼtili» beradi)
        var exp = 0;
        for (var ek in p.expenses) exp += p.expenses[ek];
        exp += p.kids * p.perChild;
        p.cash -= exp;
        p.skip = C.DOWNSIZE_SKIP;
        p.stats.wasDownsized = true;
        ev(st, { e: 'downsize', p: p.i, cost: exp });
        log(st, '📉 Ishdan boʻshatildingiz! Bir oylik turmush xarajati (' + U.fmt(exp) + ') toʻlanadi va 2 navbat oʻtkaziladi. Banklar kredit taʼtili berdi.', 'bad');
        st.pending = { t: 'downsize', p: p.i, cost: exp };
        break;
      }

      /* —— Tezkor yoʻl —— */
      case 'ftPayday':
        finishMainPhase(st);
        break;

      case 'ftDeal': {
        var fc = draw(st, 'fast');
        ev(st, { e: 'card', deck: 'fast', id: fc.id });
        st.pending = { t: 'ftDeal', p: p.i, cardId: fc.id };
        break;
      }

      case 'ftDream': {
        var dream = dreamById(p.dreamId);
        st.pending = { t: 'ftDream', p: p.i, canBuy: p.cash >= dream.cost };
        break;
      }

      case 'ftTax': {
        var tax = Math.floor(p.cash / 2);
        p.cash -= tax;
        ev(st, { e: 'cash', p: p.i, delta: -tax });
        log(st, '🧾 Soliq tekshiruvi! Naqd pulning yarmi — ' + U.fmt(tax) + ' — toʻlandi.', 'bad');
        st.pending = { t: 'ftTax', p: p.i, cost: tax };
        break;
      }

      case 'ftLawsuit': {
        var pay = Math.min(C.FT_LAWSUIT, p.cash);
        p.cash -= pay;
        ev(st, { e: 'cash', p: p.i, delta: -pay });
        log(st, '⚖️ Sud jarayoni! ' + U.fmt(pay) + ' undirildi.', 'bad');
        st.pending = { t: 'ftLawsuit', p: p.i, cost: pay };
        break;
      }

      case 'ftEvent': {
        var fecard = draw(st, 'ftEvents');
        ev(st, { e: 'card', deck: 'ftEvents', id: fecard.id });
        log(st, '📰 Katta voqea: ' + fecard.nom);
        applyEvent(st, p, fecard);
        st.pending = { t: 'event', p: p.i, cardId: fecard.id };
        break;
      }

      case 'ftAuction': {
        resolveAuctionSpace(st, p, 'ftAuction');
        break;
      }
    }
  }

  /* ————— Voqealar ————— */

  function applyEvent(st, p, card) {
    if (card.kind === 'cashSelf') {
      p.cash += card.amount;
      ev(st, { e: 'cash', p: p.i, delta: card.amount });
      log(st, '📰 ' + card.nom + ': ' + U.fmtSigned(card.amount) + '.', card.amount >= 0 ? 'good' : 'bad');
    } else if (card.kind === 'cashAll') {
      st.players.forEach(function (q) {
        if (q.bankrupt || q.won) return;
        q.cash += card.amount;
        ev(st, { e: 'cash', p: q.i, delta: card.amount });
      });
      log(st, '📰 ' + card.nom + ': barcha oʻyinchilarga ' + U.fmtSigned(card.amount) + '.', card.amount >= 0 ? 'good' : 'bad');
    } else if (card.kind === 'bizBoost' || card.kind === 'bizHit') {
      var pool = p.assets.filter(function (a) { return (a.kind === 're' || a.kind === 'biz') && a.cf > 0; });
      if (pool.length) {
        var target = pool[U.randInt(st, 0, pool.length - 1)];
        target.cf = Math.max(C.BIZ_CF_FLOOR, target.cf + card.amount);
        log(st, '📰 ' + card.nom + ': «' + target.nom + '» pul oqimi ' + U.fmtSigned(card.amount) + '/oy oʻzgardi.', card.amount >= 0 ? 'good' : 'bad');
      } else {
        p.cash += card.fallback;
        ev(st, { e: 'cash', p: p.i, delta: card.fallback });
        log(st, '📰 ' + card.nom + ': mos aktiv yoʻq — oʻrniga ' + U.fmtSigned(card.fallback) + ' naqd.', card.fallback >= 0 ? 'good' : 'bad');
      }
    } else if (card.kind === 'loanRelief') {
      if (p.bankLoan > 0) {
        var relief = Math.min(card.amount, p.bankLoan);
        p.bankLoan -= relief;
        log(st, '📰 ' + card.nom + ': bank krediti ' + U.fmt(relief) + ' ga kamaydi.', 'good');
      } else {
        p.cash += card.fallback;
        ev(st, { e: 'cash', p: p.i, delta: card.fallback });
        log(st, '📰 ' + card.nom + ': kredit yoʻq — oʻrniga ' + U.fmtSigned(card.fallback) + ' naqd.', 'good');
      }
    }
    escapeCheck(st, p);
  }

  /* ————— Auksion ————— */

  function resolveAuctionSpace(st, p, deckName) {
    var acard = draw(st, 'auction');
    ev(st, { e: 'card', deck: 'auction', id: acard.id });
    var bidders = st.players.filter(function (q) { return !q.bankrupt && !q.won && q.board === p.board; }).map(function (q) { return q.i; });
    var startIdx = bidders.indexOf(p.i);
    var order = bidders.slice(startIdx).concat(bidders.slice(0, startIdx));
    if (order.length < 2) {
      log(st, '🔨 Auksion: raqobatchi yoʻq — «' + acard.nom + '» oddiy bitim sifatida taklif qilinmoqda.');
      st.pending = { t: 'deal', p: p.i, cardId: acard.id, deck: 'auction' };
    } else {
      var step = Math.max(C.LOAN_STEP, Math.round((acard.cost * C.AUCTION_STEP_PCT) / C.LOAN_STEP) * C.LOAN_STEP);
      st.pending = {
        t: 'auction', p: p.i, cardId: acard.id,
        base: acard.cost, highBid: acard.cost, highBidder: -1,
        order: order, activeIdx: 0, passed: {}, step: step,
      };
      log(st, '🔨 Auksion boshlandi: «' + acard.nom + '» — boshlangʻich narx ' + U.fmt(acard.cost) + '.');
    }
  }

  function advanceAuctionTurn(st, pd) {
    var remaining = pd.order.filter(function (i) { return !pd.passed[i]; });
    if (remaining.length === 0) { resolveAuction(st, pd, null); return; }
    if (remaining.length === 1 && remaining[0] === pd.highBidder) { resolveAuction(st, pd, remaining[0]); return; }
    var n = pd.order.length;
    for (var k = 1; k <= n; k++) {
      var idx = (pd.activeIdx + k) % n;
      if (!pd.passed[pd.order[idx]]) { pd.activeIdx = idx; return; }
    }
    resolveAuction(st, pd, remaining.length ? remaining[0] : null);
  }

  function resolveAuction(st, pd, winnerIdx) {
    var card = cardById(pd.cardId);
    if (winnerIdx != null && winnerIdx === pd.highBidder && pd.highBidder >= 0) {
      var w = st.players[winnerIdx];
      w.cash -= pd.highBid;
      w.assets.push({ kind: 'biz', cardId: card.id, nom: card.nom, emoji: card.emoji, cost: pd.highBid, full: pd.highBid, mortgage: 0, cf: card.cf, tags: ['auksion'] });
      w.stats.deals++;
      ev(st, { e: 'cash', p: w.i, delta: -pd.highBid });
      log(st, '🔨 Auksion yakunlandi! ' + w.name + ' «' + card.nom + '»ni ' + U.fmt(pd.highBid) + ' ga yutib oldi.', 'good');
      grantAch(st, w, 'auctionWinner');
      escapeCheck(st, w);
    } else {
      log(st, '🔨 Auksionda hech kim taklif bermadi — bitim bekor qilindi.');
    }
    finishMainPhase(st);
  }

  /* ————— Bozor kartalari ————— */

  function assetMatchesOffer(a, mc) {
    if (mc.t === 'offerRE') return a.tags && a.tags.indexOf(mc.tag) >= 0 && (a.kind === 're' || a.kind === 'yer');
    if (mc.t === 'offerBiz') return a.kind === 'biz' && a.tags && a.tags.indexOf(mc.tag) >= 0;
    return false;
  }

  function applyMarket(st, mc) {
    var p = P(st);

    if (mc.t === 'rentUp' || mc.t === 'rentDown') {
      var touched = 0;
      st.players.forEach(function (q) {
        if (q.bankrupt || q.board === 'fast') return;
        q.assets.forEach(function (a) {
          if (a.kind === 're' && a.tags.indexOf('kvartira') >= 0) {
            a.cf = Math.max(C.RENT_FLOOR, a.cf + mc.delta);
            touched++;
          }
        });
        escapeCheck(st, q);
      });
      log(st, touched ? 'Taʼsir koʻrgan kvartiralar: ' + touched + ' ta.' : 'Hech kimda kvartira yoʻq — taʼsir boʻlmadi.');
      st.pending = { t: 'market', p: p.i, cardId: mc.id, done: true };
      return;
    }

    if (mc.t === 'stockPrice') {
      var holders = [];
      st.players.forEach(function (q) {
        if (q.bankrupt || q.board === 'fast') return;
        if (q.assets.some(function (a) { return a.kind === 'stock' && a.ticker === mc.ticker; })) holders.push(q.i);
      });
      // cur=-1: faol oʻyinchining olish bosqichi; soʻng navbat bilan sotuvchilar
      st.pending = {
        t: 'marketStock', p: p.i, cardId: mc.id, ticker: mc.ticker, price: mc.price,
        queue: holders, cur: -1,
      };
      return;
    }

    // offerRE / offerBiz: mos aktivlarga sotish taklifi — barcha oʻyinchilar boʻyicha navbat
    var offers = [];
    st.players.forEach(function (q) {
      if (q.bankrupt || q.board === 'fast') return;
      q.assets.forEach(function (a, idx) {
        if (assetMatchesOffer(a, mc)) {
          var price = mc.t === 'offerRE' ? mc.price : Math.round((a.full || a.cost) * mc.mult);
          offers.push({ p: q.i, assetIdx: idx, price: price });
        }
      });
    });
    if (offers.length === 0) {
      log(st, 'Bu taklifga mos aktiv hech kimda yoʻq.');
      st.pending = { t: 'market', p: p.i, cardId: mc.id, done: true };
    } else {
      st.pending = { t: 'marketOffer', p: p.i, cardId: mc.id, offers: offers, cur: 0 };
    }
  }

  /* ————— Aktiv olish/sotish ————— */

  // Bitim uchun kerakli naqd: boshlangʻich toʻlov (down) boʻlsa — shu, aks holda toʻliq narx
  function dealNeed(card) {
    return card.down != null ? card.down : card.cost;
  }

  function buyDealAsset(st, p, card) {
    var need = dealNeed(card);
    if (p.cash < need) throw new Error('Mablagʻ yetarli emas');
    p.cash -= need;
    var a;
    if (card.t === 're') {
      a = { kind: 're', cardId: card.id, nom: card.nom, emoji: card.emoji, full: card.full, mortgage: card.mortgage, down: card.down, cf: card.cf, tags: card.tags.slice() };
    } else if (card.t === 'yer') {
      a = { kind: 'yer', cardId: card.id, nom: card.nom, emoji: card.emoji, cost: card.cost, cf: 0, tags: card.tags.slice() };
    } else {
      // katta bizneslarda ham bank krediti (mortgage) boʻlishi mumkin
      a = { kind: 'biz', cardId: card.id, nom: card.nom, emoji: card.emoji, cost: need, full: card.full || card.cost, mortgage: card.mortgage || 0, cf: card.cf, tags: card.tags.slice() };
    }
    p.assets.push(a);
    p.stats.deals++;
    ev(st, { e: 'cash', p: p.i, delta: -need });
    ev(st, { e: 'buy', p: p.i, nom: card.nom });
    log(st, '✅ ' + p.name + ' sotib oldi: ' + card.emoji + ' «' + card.nom + '»' + (a.cf ? ' — pul oqimi ' + U.fmtSigned(a.cf) + '/oy.' : '.'), 'good');
    escapeCheck(st, p);
  }

  function sellAsset(st, p, idx, price, why) {
    var a = p.assets[idx];
    var gain = price - (a.mortgage || 0); // sotuvda bank krediti/ipoteka yopiladi
    p.cash += gain;
    p.assets.splice(idx, 1);
    ev(st, { e: 'cash', p: p.i, delta: gain });
    log(st, '💱 ' + p.name + ' sotdi: ' + (a.emoji || '') + ' «' + a.nom + '» — qoʻlga ' + U.fmt(gain) + ' tushdi' + (why ? ' (' + why + ')' : '') + '.', 'good');
    escapeCheck(st, p);
  }

  /* ————— Amallar (harakatlar) ————— */

  function act(st, action) {
    st.events = [];
    if (st.over) return st;
    var pd = st.pending || {};
    var p = P(st);

    switch (action.type) {
      /* — bank amallari: oʻz navbatida istalgan payt — */
      case 'takeLoan': {
        var amt = Math.floor(action.amount / C.LOAN_STEP) * C.LOAN_STEP;
        if (amt <= 0) break;
        if (amt > maxLoan(p)) throw new Error('Bank bunchalik kredit bermaydi');
        p.bankLoan += amt;
        p.cash += amt;
        ev(st, { e: 'cash', p: p.i, delta: amt });
        log(st, '🏦 ' + p.name + ' bankdan ' + U.fmt(amt) + ' kredit oldi (oylik foizi: ' + U.fmt(Math.round(amt * C.LOAN_RATE)) + ').', 'warn');
        break;
      }
      case 'repayLoan': {
        var r = Math.min(Math.floor(action.amount / C.LOAN_STEP) * C.LOAN_STEP, p.bankLoan, p.cash);
        if (r <= 0) break;
        p.bankLoan -= r;
        p.cash -= r;
        ev(st, { e: 'cash', p: p.i, delta: -r });
        log(st, '🏦 ' + p.name + ' bank kreditidan ' + U.fmt(r) + ' qaytardi.', 'good');
        escapeCheck(st, p);
        break;
      }
      case 'repayLiability': {
        var li = p.liabilities[action.idx];
        if (!li || p.cash < li.balance) throw new Error('Mablagʻ yetarli emas');
        p.cash -= li.balance;
        ev(st, { e: 'cash', p: p.i, delta: -li.balance });
        log(st, '🎊 ' + p.name + ' «' + li.nom + '» qarzini toʻliq yopdi! Oylik xarajat −' + U.fmt(li.payment) + '.', 'good');
        p.liabilities.splice(action.idx, 1);
        escapeCheck(st, p);
        break;
      }
      case 'withdrawOmonat': {
        var ai = action.assetIdx;
        var asset = p.assets[ai];
        if (!asset || asset.kind !== 'omonat') throw new Error('Bu omonat emas');
        var lots = Math.min(action.lots || asset.lots, asset.lots);
        var back = lots * asset.lotPrice;
        asset.lots -= lots;
        asset.cf = asset.lots * asset.lotCf;
        if (asset.lots === 0) p.assets.splice(ai, 1);
        p.cash += back;
        ev(st, { e: 'cash', p: p.i, delta: back });
        log(st, '🏧 ' + p.name + ' omonatdan ' + U.fmt(back) + ' yechib oldi.');
        break;
      }

      /* — navbat boshlanishi — */
      case 'roll':
        if (pd.t !== 'turn') throw new Error('Hozir yurish mumkin emas');
        doRoll(st, action.dice === 2 ? 2 : 1);
        break;

      /* — bitim kartalari — */
      case 'dealSize': {
        if (pd.t !== 'dealSize') throw new Error('notoʻgʻri holat');
        var deck = action.size === 'big' ? 'big' : 'small';
        var card = draw(st, deck);
        ev(st, { e: 'card', deck: deck, id: card.id });
        if (card.t === 'stock') {
          var stk = PO.DATA.stocks[card.ticker];
          log(st, '📊 Imkoniyat: ' + stk.nom + ' aksiyasi — ' + U.fmt(card.price) + ' dona narxda.');
          var holders2 = [];
          st.players.forEach(function (q) {
            if (q.bankrupt || q.board === 'fast') return;
            if (q.assets.some(function (a) { return a.kind === 'stock' && a.ticker === card.ticker; })) holders2.push(q.i);
          });
          st.pending = { t: 'stock', p: p.i, cardId: card.id, ticker: card.ticker, price: card.price, queue: holders2, cur: -1 };
        } else if (card.t === 'omonat') {
          st.pending = { t: 'omonat', p: p.i, cardId: card.id };
        } else {
          log(st, '💼 Imkoniyat: «' + card.nom + '».');
          st.pending = { t: 'deal', p: p.i, cardId: card.id, deck: deck };
        }
        break;
      }

      case 'buyDeal': {
        if (pd.t !== 'deal') throw new Error('notoʻgʻri holat');
        buyDealAsset(st, p, cardById(pd.cardId));
        finishMainPhase(st);
        break;
      }

      case 'skip': {
        // universal "yoʻq / oʻtkazish": deal, stock buy, omonat, ftDeal, ftDream, market info…
        if (pd.t === 'stock' || pd.t === 'marketStock') {
          advanceStockQueue(st, pd);
        } else if (pd.t === 'marketOffer') {
          pd.cur++;
          if (pd.cur >= pd.offers.length) finishMainPhase(st);
        } else if (pd.t === 'insolvent') {
          throw new Error('Avval qarzni yeching');
        } else if (pd.t === 'auction') {
          throw new Error('Auksionda "Taklif" yoki "Voz kechish" ni tanlang');
        } else {
          finishMainPhase(st);
        }
        break;
      }

      case 'buyStock': {
        if (pd.t !== 'stock' && pd.t !== 'marketStock') throw new Error('notoʻgʻri holat');
        if (pd.cur !== -1) throw new Error('Olish bosqichi tugagan');
        var qty = Math.floor(action.qty);
        if (qty <= 0) break;
        var costS = qty * pd.price;
        if (costS > p.cash) throw new Error('Mablagʻ yetarli emas');
        p.cash -= costS;
        var ex = null;
        for (var i2 = 0; i2 < p.assets.length; i2++) {
          if (p.assets[i2].kind === 'stock' && p.assets[i2].ticker === pd.ticker) { ex = p.assets[i2]; break; }
        }
        var stData = PO.DATA.stocks[pd.ticker];
        if (ex) { ex.qty += qty; ex.costBasis += costS; }
        else p.assets.push({ kind: 'stock', ticker: pd.ticker, nom: stData.nom, emoji: stData.emoji, qty: qty, costBasis: costS, tags: ['aksiya'] });
        p.stats.deals++;
        ev(st, { e: 'cash', p: p.i, delta: -costS });
        log(st, '📈 ' + p.name + ' ' + U.groupNum(qty) + ' dona ' + pd.ticker + ' aksiyasini oldi (' + U.fmt(costS) + ').', 'good');
        escapeCheck(st, p);
        advanceStockQueue(st, pd);
        break;
      }

      case 'sellStock': {
        if (pd.t !== 'stock' && pd.t !== 'marketStock') throw new Error('notoʻgʻri holat');
        if (pd.cur < 0 || pd.cur >= pd.queue.length) throw new Error('Sotish bosqichi emas');
        if (action.p != null && action.p !== pd.queue[pd.cur]) throw new Error('Navbat boshqa oʻyinchida');
        var seller = st.players[pd.queue[pd.cur]];
        var sIdx = -1, sa = null;
        for (var i3 = 0; i3 < seller.assets.length; i3++) {
          var cand = seller.assets[i3];
          if (cand.kind === 'stock' && cand.ticker === pd.ticker) { sIdx = i3; sa = cand; break; }
        }
        if (!sa) throw new Error('Aksiya topilmadi');
        var sq = Math.min(Math.floor(action.qty || sa.qty), sa.qty);
        if (sq <= 0) break;
        var gain2 = sq * pd.price;
        sa.costBasis = Math.round(sa.costBasis * (1 - sq / sa.qty));
        sa.qty -= sq;
        if (sa.qty === 0) seller.assets.splice(sIdx, 1);
        seller.cash += gain2;
        ev(st, { e: 'cash', p: seller.i, delta: gain2 });
        log(st, '📉 ' + seller.name + ' ' + U.groupNum(sq) + ' dona ' + pd.ticker + ' aksiyasini ' + U.fmt(pd.price) + ' dan sotdi: +' + U.fmt(gain2) + '.', 'good');
        escapeCheck(st, seller);
        // navbatni oldinga surish chaqiruvchi tomonidan 'skip' bilan amalga oshadi
        break;
      }

      case 'buyOmonat': {
        if (pd.t !== 'omonat') throw new Error('notoʻgʻri holat');
        var card2 = cardById(pd.cardId);
        var lots2 = Math.floor(action.lots);
        if (lots2 <= 0) { finishMainPhase(st); break; }
        var cost2 = lots2 * card2.lotPrice;
        if (cost2 > p.cash) throw new Error('Mablagʻ yetarli emas');
        p.cash -= cost2;
        var exO = null;
        for (var i4 = 0; i4 < p.assets.length; i4++) {
          if (p.assets[i4].kind === 'omonat' && p.assets[i4].cardId === card2.id) { exO = p.assets[i4]; break; }
        }
        if (exO) { exO.lots += lots2; exO.cf = exO.lots * exO.lotCf; }
        else p.assets.push({ kind: 'omonat', cardId: card2.id, nom: card2.nom, emoji: card2.emoji, lots: lots2, lotPrice: card2.lotPrice, lotCf: card2.lotCf, cf: lots2 * card2.lotCf, tags: ['omonat'] });
        p.stats.deals++;
        ev(st, { e: 'cash', p: p.i, delta: -cost2 });
        log(st, '🏦 ' + p.name + ' ' + U.fmt(cost2) + ' miqdorda «' + card2.nom + '» qoʻydi — oyiga ' + U.fmtSigned(lots2 * card2.lotCf) + '.', 'good');
        escapeCheck(st, p);
        finishMainPhase(st);
        break;
      }

      /* — bozor taklifi — */
      case 'acceptOffer': {
        if (pd.t !== 'marketOffer') throw new Error('notoʻgʻri holat');
        var off = pd.offers[pd.cur];
        var op = st.players[off.p];
        sellAsset(st, op, off.assetIdx, off.price, 'bozor taklifi');
        // shu oʻyinchining keyingi indekslari siljidi — qolgan takliflarni tuzatamiz
        for (var j = pd.cur + 1; j < pd.offers.length; j++) {
          if (pd.offers[j].p === off.p && pd.offers[j].assetIdx > off.assetIdx) pd.offers[j].assetIdx--;
        }
        pd.cur++;
        if (pd.cur >= pd.offers.length) finishMainPhase(st);
        break;
      }

      /* — ehson — */
      case 'charityYes': {
        if (pd.t !== 'charity') throw new Error('notoʻgʻri holat');
        if (p.cash < pd.cost) throw new Error('Mablagʻ yetarli emas');
        p.cash -= pd.cost;
        p.charity = C.CHARITY_TURNS;
        p.stats.charity += pd.cost;
        p.stats.charityCount++;
        ev(st, { e: 'cash', p: p.i, delta: -pd.cost });
        log(st, '🤲 ' + p.name + ' ' + U.fmt(pd.cost) + ' ehson qildi. Keyingi 3 navbatda 1 yoki 2 shoshqol tanlab tashlaydi!', 'good');
        finishMainPhase(st);
        break;
      }
      case 'charityNo':
        if (pd.t !== 'charity') throw new Error('notoʻgʻri holat');
        log(st, p.name + ' bu safar ehsondan voz kechdi.');
        finishMainPhase(st);
        break;

      /* — Tezkor yoʻl — */
      case 'buyFtDeal': {
        if (pd.t !== 'ftDeal') throw new Error('notoʻgʻri holat');
        var fcard = cardById(pd.cardId);
        if (p.cash < fcard.cost) throw new Error('Mablagʻ yetarli emas');
        p.cash -= fcard.cost;
        p.ftExtra += fcard.cf;
        p.assets.push({ kind: 'biz', cardId: fcard.id, nom: fcard.nom, emoji: fcard.emoji, cost: fcard.cost, full: fcard.cost, cf: fcard.cf, tags: ['ftbiznes'] });
        p.stats.deals++;
        ev(st, { e: 'cash', p: p.i, delta: -fcard.cost });
        log(st, '🚀 ' + p.name + ' yirik biznes oldi: «' + fcard.nom + '» — pul oqimi ' + U.fmtSigned(fcard.cf) + '/oy. Jami yangi oqim: ' + U.fmtShortSum(p.ftExtra) + '/oy.', 'good');
        if (p.ftExtra >= C.FT_WIN_CF) return win(st, p, 'cashflow');
        finishMainPhase(st);
        break;
      }

      /* — tavakkalli taklif — */
      case 'gambleYes': {
        if (pd.t !== 'gamble') throw new Error('notoʻgʻri holat');
        if (pd.stake <= 0 || p.cash < pd.stake) throw new Error('Mablagʻ yetarli emas');
        var won = U.nextRand(st) < 0.5;
        if (won) {
          p.cash += pd.stake;
          ev(st, { e: 'cash', p: p.i, delta: pd.stake });
          log(st, '🎯 Tavakkal oʻzini oqladi! ' + p.name + ' +' + U.fmt(pd.stake) + ' yutdi.', 'good');
          grantAch(st, p, 'riskTaker');
        } else {
          p.cash -= pd.stake;
          ev(st, { e: 'cash', p: p.i, delta: -pd.stake });
          log(st, '🎯 Bu safar omad kulib boqmadi — ' + p.name + ' −' + U.fmt(pd.stake) + ' yoʻqotdi.', 'bad');
        }
        finishMainPhase(st);
        break;
      }
      case 'gambleNo':
        if (pd.t !== 'gamble') throw new Error('notoʻgʻri holat');
        log(st, p.name + ' tavakkal qilmaslikni afzal koʻrdi — bu ham aqlli qaror!');
        finishMainPhase(st);
        break;

      /* — auksion — */
      case 'auctionBid': {
        if (pd.t !== 'auction') throw new Error('notoʻgʻri holat');
        var bidder = st.players[pd.order[pd.activeIdx]];
        var newBid = pd.highBid + pd.step;
        if (bidder.cash < newBid) throw new Error('Mablagʻ yetarli emas');
        pd.highBid = newBid;
        pd.highBidder = bidder.i;
        log(st, '🔨 ' + bidder.name + ' taklif qildi: ' + U.fmt(newBid) + '.');
        advanceAuctionTurn(st, pd);
        break;
      }
      case 'auctionPass': {
        if (pd.t !== 'auction') throw new Error('notoʻgʻri holat');
        var passer = st.players[pd.order[pd.activeIdx]];
        pd.passed[passer.i] = true;
        log(st, '🔨 ' + passer.name + ' auksiondan chiqdi.');
        advanceAuctionTurn(st, pd);
        break;
      }

      case 'buyDream': {
        if (pd.t !== 'ftDream') throw new Error('notoʻgʻri holat');
        var dr = dreamById(p.dreamId);
        if (p.cash < dr.cost) throw new Error('Mablagʻ yetarli emas');
        p.cash -= dr.cost;
        ev(st, { e: 'cash', p: p.i, delta: -dr.cost });
        return win(st, p, 'dream');
      }

      /* — toʻlovga layoqatsizlik — */
      case 'insolventLoan': {
        if (pd.t !== 'insolvent') throw new Error('notoʻgʻri holat');
        var need = -p.cash;
        var amt2 = Math.ceil(need / C.LOAN_STEP) * C.LOAN_STEP;
        if (amt2 > maxLoan(p)) throw new Error('Bank bunchalik kredit bermaydi');
        p.bankLoan += amt2;
        p.cash += amt2;
        ev(st, { e: 'cash', p: p.i, delta: amt2 });
        log(st, '🏦 Majburiy kredit: ' + U.fmt(amt2) + ' olindi.', 'warn');
        if (p.cash >= 0) nextPlayer(st);
        break;
      }
      case 'insolventSell': {
        if (pd.t !== 'insolvent') throw new Error('notoʻgʻri holat');
        var ea = p.assets[action.assetIdx];
        if (!ea) throw new Error('Aktiv topilmadi');
        var val = emergencyValue(ea);
        if (ea.kind === 'stock') {
          log(st, '⚠️ Favqulodda sotuv: aksiyalar chegirma bilan ketdi.', 'warn');
          p.cash += val;
          p.assets.splice(action.assetIdx, 1);
          ev(st, { e: 'cash', p: p.i, delta: val });
        } else if (ea.kind === 'omonat') {
          p.cash += val;
          p.assets.splice(action.assetIdx, 1);
          ev(st, { e: 'cash', p: p.i, delta: val });
          log(st, '🏧 Omonat yopildi: +' + U.fmt(val) + '.');
        } else {
          log(st, '⚠️ Favqulodda sotuv: «' + ea.nom + '» yarim narxga ketdi (+' + U.fmt(val) + ').', 'warn');
          p.cash += val;
          p.assets.splice(action.assetIdx, 1);
          ev(st, { e: 'cash', p: p.i, delta: val });
        }
        escapeCheck(st, p);
        if (p.cash >= 0) nextPlayer(st);
        break;
      }
      case 'declareBankrupt': {
        if (pd.t !== 'insolvent') throw new Error('notoʻgʻri holat');
        p.bankrupt = true;
        ev(st, { e: 'bankrupt', p: p.i });
        log(st, '💥 ' + p.name + ' bankrot boʻldi. Moliyaviy saboq: xarajat va qarzlar daromaddan oshmasin!', 'bad');
        var alive2 = st.players.filter(function (q) { return !q.bankrupt && !q.won; });
        if (alive2.length === 0) { st.over = { type: 'allOut' }; st.pending = { t: 'gameOver' }; }
        else nextPlayer(st);
        break;
      }

      /* — navbat yakuni (eski mijozlar/saqlashlar uchun moslik) — */
      case 'endTurn':
        finishMainPhase(st);
        break;

      case 'ack': {
        // axborot oynasini yopish: doodad/baby/downsize/market/ftTax/ftLawsuit/event → endTurn bosqichi
        if (['doodad', 'baby', 'downsize', 'market', 'ftTax', 'ftLawsuit', 'event'].indexOf(pd.t) < 0) throw new Error('notoʻgʻri holat');
        finishMainPhase(st);
        break;
      }

      default:
        throw new Error('Nomaʼlum amal: ' + action.type);
    }
    return st;
  }

  function advanceStockQueue(st, pd) {
    pd.cur++;
    if (pd.cur >= pd.queue.length) finishMainPhase(st);
    // aks holda pending oʻzgarmaydi — navbatdagi sotuvchi pd.queue[pd.cur]
  }

  function win(st, p, how) {
    p.won = true;
    st.over = { type: 'win', winner: p.i, how: how };
    ev(st, { e: 'win', p: p.i, how: how });
    grantAch(st, p, 'champion');
    var dr = dreamById(p.dreamId);
    log(st, '🏆 ' + p.name + ' GʻOLIB! ' + (how === 'dream' ? 'Orzusi roʻyobga chiqdi: ' + dr.emoji + ' «' + dr.nom + '»!' : 'Tezkor yoʻlda +' + U.fmtShort(p.ftExtra) + ' soʻm/oy yangi pul oqimi yaratdi!'), 'good');
    st.pending = { t: 'gameOver' };
    return st;
  }

  PO.C = C;
  PO.BOARDS = { rat: RAT, fast: FAST };
  PO.engine = {
    newGame: newGame,
    act: act,
    calc: {
      passive: passiveIncome,
      expenses: expensesTotal,
      cashflow: cashflow,
      ftPayday: ftPaydayAmount,
      maxLoan: maxLoan,
      emergencyValue: emergencyValue,
      doodadCost: doodadCost,
      dealNeed: dealNeed,
      netWorth: netWorth,
    },
    cardById: cardById,
    dreamById: dreamById,
    profById: profById,
  };
})();
