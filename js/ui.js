/* Pul Oqimi — interfeys: yon panel, modallar, jurnal, effektlar */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});
  var U = PO.util;
  var E = PO.engine;

  var $ = function (s) { return document.querySelector(s); };
  var dispatch = null; // main.js oʻrnatadi
  var viewIdx = 0;     // yon panelda koʻrsatilayotgan oʻyinchi

  function setDispatch(fn) { dispatch = fn; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ═══════════ YON PANEL — moliyaviy hisobot ═══════════ */

  function renderSidebar(st) {
    var wrap = $('#sidebar');
    var active = st.players[st.turn];
    if (viewIdx >= st.players.length) viewIdx = 0;
    var p = st.players[viewIdx];
    var passive = E.calc.passive(p);
    var expenses = E.calc.expenses(p);
    var cf = E.calc.cashflow(p);
    var isTurnOwner = viewIdx === st.turn && !st.over;

    var tabs = '';
    if (st.players.length > 1) {
      tabs = '<div class="ptabs">' + st.players.map(function (q) {
        return '<button class="ptab' + (q.i === viewIdx ? ' on' : '') + (q.i === st.turn ? ' turn' : '') +
          (q.bankrupt ? ' out' : '') + '" data-view="' + q.i + '" style="--pc:' + q.color + '">' +
          E.profById(q.profId).emoji + ' ' + esc(q.name) + '</button>';
      }).join('') + '</div>';
    }

    var html = tabs +
      '<div class="pcard" style="--pc:' + p.color + '">' +
      '<div class="pcard-head"><span class="pavatar">' + E.profById(p.profId).emoji + '</span>' +
      '<div><div class="pname">' + esc(p.name) + (p.i === st.turn ? ' <span class="turn-dot" title="Navbat shu oʻyinchida"></span>' : '') + '</div>' +
      '<div class="pprof">' + esc(E.profById(p.profId).nom) + (p.kids ? ' · 👶×' + p.kids : '') +
      (p.board === 'fast' ? ' · 🚀 Tezkor yoʻl' : '') + (p.bankrupt ? ' · 💥 bankrot' : '') + '</div></div></div>' +
      '<div class="cashrow"><span>Naqd pul</span><b id="cashNum" class="' + (p.cash < 0 ? 'neg' : '') + '">' + U.fmt(p.cash) + '</b></div>' +
      '</div>';

    if (p.board === 'rat') {
      var prog = expenses > 0 ? Math.min(100, Math.round((passive / expenses) * 100)) : 0;
      html += '<div class="meter-block"><div class="meter-top"><span>🏁 Poygadan chiqish</span><b>' + prog + '%</b></div>' +
        '<div class="meter"><div class="meter-fill" style="width:' + prog + '%"></div></div>' +
        '<div class="meter-sub">Passiv daromad <b>' + U.fmtShortSum(passive) + '</b> / Xarajat <b>' + U.fmtShortSum(expenses) + '</b></div></div>';
    } else {
      var need = PO.C.FT_WIN_CF;
      var prog2 = Math.min(100, Math.round((p.ftExtra / need) * 100));
      var dream = E.dreamById(p.dreamId);
      html += '<div class="meter-block ft"><div class="meter-top"><span>🚀 Tezkor yoʻl</span><b>' + prog2 + '%</b></div>' +
        '<div class="meter"><div class="meter-fill" style="width:' + prog2 + '%"></div></div>' +
        '<div class="meter-sub">Yangi oqim <b>' + U.fmtShortSum(p.ftExtra) + '</b> / Maqsad <b>' + U.fmtShortSum(need) + '</b></div>' +
        '<div class="meter-sub">Orzu: ' + dream.emoji + ' ' + esc(dream.nom) + ' — <b>' + U.fmtShortSum(dream.cost) + '</b></div>' +
        '<div class="meter-sub">Pul oqimi kuni: <b>+' + U.fmtShortSum(E.calc.ftPayday(p)) + '</b></div></div>';
    }

    /* Daromadlar */
    var incRows = '<div class="frow"><span>Maosh</span><b>' + U.fmt(p.salary) + '</b></div>';
    p.assets.forEach(function (a) {
      var acf = a.kind === 'stock' ? a.qty * (PO.DATA.stocks[a.ticker].div || 0) : (a.cf || 0);
      if (acf > 0) incRows += '<div class="frow sub"><span>' + (a.emoji || '') + ' ' + esc(shortNom(a)) + '</span><b>+' + U.fmtShort(acf) + '</b></div>';
    });
    incRows += '<div class="frow total"><span>Passiv daromad</span><b>' + U.fmt(passive) + '</b></div>';

    /* Xarajatlar */
    var expRows = '';
    for (var k in p.expenses) {
      if (p.expenses[k] > 0) expRows += '<div class="frow"><span>' + PO.DATA.expenseLabels[k] + '</span><b>' + U.fmtShort(p.expenses[k]) + '</b></div>';
    }
    if (p.kids > 0) expRows += '<div class="frow"><span>Farzandlar (' + p.kids + ')</span><b>' + U.fmtShort(p.kids * p.perChild) + '</b></div>';
    p.liabilities.forEach(function (l) {
      expRows += '<div class="frow"><span>' + esc(l.nom) + ' toʻlovi</span><b>' + U.fmtShort(l.payment) + '</b></div>';
    });
    if (p.bankLoan > 0) expRows += '<div class="frow"><span>Bank krediti foizi</span><b>' + U.fmtShort(Math.round(p.bankLoan * PO.C.LOAN_RATE)) + '</b></div>';
    expRows += '<div class="frow total"><span>Jami xarajat</span><b>' + U.fmt(expenses) + '</b></div>';

    html += '<details open class="fin"><summary>💰 Daromadlar</summary>' + incRows + '</details>' +
      '<details class="fin"><summary>🧾 Xarajatlar</summary>' + expRows + '</details>' +
      '<div class="cfrow ' + (cf >= 0 ? 'pos' : 'neg') + '"><span>PUL OQIMI (oyiga)</span><b>' + U.fmtSigned(cf) + '</b></div>';

    /* Aktivlar */
    var aRows = '';
    if (p.assets.length === 0) aRows = '<div class="empty">Hozircha aktiv yoʻq. Imkoniyat kataklarida bitimlar qidiring!</div>';
    p.assets.forEach(function (a, i) {
      aRows += '<div class="asset"><div class="asset-l"><span class="asset-nom"><span class="asset-idx">' + (i + 1) + '</span> ' + (a.emoji || '📦') + ' ' + esc(shortNom(a)) + '</span>' +
        '<span class="asset-info">' + assetInfo(a) + '</span></div>';
      if (a.kind === 'omonat' && isTurnOwner) {
        aRows += '<button class="mini" data-withdraw="' + i + '">Yechish</button>';
      }
      aRows += '</div>';
    });
    html += '<details open class="fin"><summary>🏠 Aktivlar (' + p.assets.length + ')</summary>' + aRows + '</details>';

    /* Qarzlar va bank */
    var lRows = '';
    p.liabilities.forEach(function (l, i) {
      lRows += '<div class="asset"><div class="asset-l"><span class="asset-nom">' + esc(l.nom) + '</span>' +
        '<span class="asset-info">Qoldiq: ' + U.fmtShortSum(l.balance) + ' · toʻlov ' + U.fmtShort(l.payment) + '/oy</span></div>' +
        (isTurnOwner ? '<button class="mini" data-payliab="' + i + '"' + (p.cash < l.balance ? ' disabled' : '') + '>Yopish</button>' : '') + '</div>';
    });
    lRows += '<div class="asset"><div class="asset-l"><span class="asset-nom">🏦 Bank krediti</span>' +
      '<span class="asset-info">Qoldiq: ' + U.fmtShortSum(p.bankLoan) + ' · foiz ' + U.fmtShort(Math.round(p.bankLoan * PO.C.LOAN_RATE)) + '/oy · limit ' + U.fmtShortSum(E.calc.maxLoan(p)) + '</span></div>' +
      (isTurnOwner ? '<button class="mini" data-bank="1">Bank</button>' : '') + '</div>';
    html += '<details ' + (p.liabilities.length || p.bankLoan ? 'open' : '') + ' class="fin"><summary>💳 Qarzlar</summary>' + lRows + '</details>';

    /* Maslahat */
    var tip = PO.DATA.tips[(st.round + st.turn) % PO.DATA.tips.length];
    html += '<div class="tip">💡 ' + tip + '</div>';

    wrap.innerHTML = html;

    wrap.querySelectorAll('[data-view]').forEach(function (b) {
      b.onclick = function () { viewIdx = +b.dataset.view; renderSidebar(st); };
    });
    wrap.querySelectorAll('[data-withdraw]').forEach(function (b) {
      b.onclick = function () { withdrawModal(st, +b.dataset.withdraw); };
    });
    wrap.querySelectorAll('[data-payliab]').forEach(function (b) {
      b.onclick = function () { dispatch({ type: 'repayLiability', idx: +b.dataset.payliab }); };
    });
    wrap.querySelectorAll('[data-bank]').forEach(function (b) {
      b.onclick = function () { bankModal(st); };
    });
  }

  function shortNom(a) {
    if (a.kind === 'stock') return a.ticker + ' aksiyalari';
    return a.nom.length > 34 ? a.nom.slice(0, 33) + '…' : a.nom;
  }

  function assetInfo(a) {
    if (a.kind === 'stock') {
      var d = PO.DATA.stocks[a.ticker];
      var s = U.groupNum(a.qty) + ' dona · oʻrt. ' + U.fmt(Math.round(a.costBasis / a.qty));
      if (d.div) s += ' · div +' + U.fmtShort(a.qty * d.div) + '/oy';
      return s;
    }
    if (a.kind === 'omonat') return a.lots + ' lot (' + U.fmtShortSum(a.lots * a.lotPrice) + ') · +' + U.fmtShort(a.cf) + '/oy';
    if (a.kind === 're') return 'Ipoteka: ' + U.fmtShortSum(a.mortgage) + ' · ijara +' + U.fmtShort(a.cf) + '/oy';
    if (a.kind === 'yer') return 'Olingan: ' + U.fmtShortSum(a.cost) + ' · daromadsiz (spekulyativ)';
    return (a.mortgage ? 'Kredit: ' + U.fmtShortSum(a.mortgage) + ' · ' : 'Qiymati: ' + U.fmtShortSum(a.full || a.cost) + ' · ') + '+' + U.fmtShort(a.cf) + '/oy';
  }

  /* ═══════════ JURNAL ═══════════ */

  function renderLog(st) {
    var box = $('#log');
    var out = '';
    var items = st.log.slice(-80).reverse();
    items.forEach(function (l) {
      out += '<div class="log-line ' + l.c + '">' + l.m + '</div>';
    });
    box.innerHTML = out;
  }

  /* ═══════════ MODAL TIZIMI ═══════════ */

  function showModal(opts) {
    var m = $('#modal');
    var actions = opts.actions || [];
    var btns = actions.map(function (a, i) {
      return '<button class="btn ' + (a.cls || 'btn-primary') + '" data-act="' + i + '"' + (a.disabled ? ' disabled' : '') + '>' + a.label + '</button>';
    }).join('');
    m.innerHTML = '<div class="modal-card ' + (opts.cls || '') + '">' +
      (opts.kicker ? '<div class="modal-kicker">' + opts.kicker + '</div>' : '') +
      '<div class="modal-emoji">' + (opts.emoji || '🃏') + '</div>' +
      '<h3 class="modal-title">' + opts.title + '</h3>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      '<div class="modal-actions">' + btns + '</div></div>';
    m.classList.add('open');
    actions.forEach(function (a, i) {
      m.querySelector('[data-act="' + i + '"]').onclick = function () {
        PO.sound.play('click');
        if (a.keep !== true) closeModal();
        if (a.fn) a.fn();
        else if (a.action) dispatch(a.action);
      };
    });
  }

  function closeModal() { $('#modal').classList.remove('open'); }

  function qtyControls(max, unitPrice, unitLabel, id) {
    return '<div class="qty-box" id="' + id + '">' +
      '<div class="qty-row"><button class="mini" data-q="0.25">25%</button><button class="mini" data-q="0.5">50%</button><button class="mini" data-q="1">Maks</button>' +
      '<input type="number" min="0" max="' + max + '" value="0" class="qty-in"></div>' +
      '<div class="qty-total">Jami: <b class="qty-sum">0 soʻm</b> <span class="qty-max">(maks. ' + U.groupNum(max) + ' ' + unitLabel + ')</span></div></div>';
  }

  function bindQty(id, unitPrice, onChange) {
    var box = $('#' + id);
    var input = box.querySelector('.qty-in');
    var sum = box.querySelector('.qty-sum');
    var max = +input.max;
    function upd() {
      var v = Math.max(0, Math.min(max, Math.floor(+input.value || 0)));
      if (String(v) !== input.value) input.value = v;
      sum.textContent = U.fmt(v * unitPrice);
      if (onChange) onChange(v);
    }
    box.querySelectorAll('[data-q]').forEach(function (b) {
      b.onclick = function () { input.value = Math.floor(max * (+b.dataset.q)); upd(); };
    });
    input.oninput = upd;
    upd();
    return function () { return Math.max(0, Math.min(max, Math.floor(+input.value || 0))); };
  }

  /* ═══════════ PENDING → MODAL ═══════════ */

  function renderPending(st) {
    var pd = st.pending;
    var p = st.players[st.turn];
    updateHub(st);
    if (!pd) return;

    switch (pd.t) {
      case 'turn':
      case 'endTurn':
        closeModal();
        break;

      case 'dealSize':
        showModal({
          kicker: 'Imkoniyat katagi', emoji: '💼', title: 'Qaysi bitimni koʻrasiz?',
          body: '<p class="muted">Kichik bitimlar arzon (aksiya, omonat, kichik biznes, kvartira). Katta bitimlar qimmat, lekin pul oqimi zoʻr (biznes, dom).</p>' +
            '<p>Naqd pulingiz: <b>' + U.fmt(p.cash) + '</b></p>',
          actions: [
            { label: '🐣 Kichik bitim', action: { type: 'dealSize', size: 'small' } },
            { label: '🐘 Katta bitim', cls: 'btn-gold', action: { type: 'dealSize', size: 'big' } },
          ],
        });
        break;

      case 'deal': {
        var card = E.cardById(pd.cardId);
        PO.sound.play('card');
        dealModal(st, p, card, pd.deck);
        break;
      }

      case 'stock':
      case 'marketStock':
        PO.sound.play('card');
        stockModal(st, pd);
        break;

      case 'omonat': {
        var oc = E.cardById(pd.cardId);
        var maxLots = Math.floor(p.cash / oc.lotPrice);
        PO.sound.play('card');
        showModal({
          kicker: 'Kichik bitim', emoji: oc.emoji, title: oc.nom,
          body: '<p>' + esc(oc.desc) + '</p><div class="facts">' +
            '<div class="frow"><span>1 lot narxi</span><b>' + U.fmt(oc.lotPrice) + '</b></div>' +
            '<div class="frow"><span>1 lot daromadi</span><b>+' + U.fmt(oc.lotCf) + '/oy</b></div>' +
            '<div class="frow"><span>Naqd pulingiz</span><b>' + U.fmt(p.cash) + '</b></div></div>' +
            qtyControls(maxLots, oc.lotPrice, 'lot', 'qty-om'),
          actions: [
            { label: 'Oʻtkazib yuborish', cls: 'btn-ghost', action: { type: 'buyOmonat', lots: 0 } },
            { label: '💰 Qoʻyish', keep: true, fn: function () { var g = getQty['qty-om'](); closeModal(); dispatch({ type: 'buyOmonat', lots: g }); } },
          ],
        });
        getQty['qty-om'] = bindQty('qty-om', oc.lotPrice);
        break;
      }

      case 'market': {
        var mc = E.cardById(pd.cardId);
        PO.sound.play('card');
        showModal({
          kicker: 'Bozor', emoji: mc.emoji || '🏪', title: mc.nom,
          body: '<p>' + esc(mc.desc) + '</p>',
          actions: [{ label: 'Davom etish', action: { type: 'ack' } }],
        });
        break;
      }

      case 'marketOffer': {
        var moc = E.cardById(pd.cardId);
        var off = pd.offers[pd.cur];
        var owner = st.players[off.p];
        var asset = owner.assets[off.assetIdx];
        var gain = off.price - (asset.mortgage || 0);
        var paid = asset.down != null ? asset.down : asset.cost || asset.full;
        showModal({
          kicker: 'Bozor taklifi · ' + esc(owner.name), emoji: moc.emoji || '🏪', title: moc.nom,
          body: '<p>' + esc(moc.desc) + '</p><div class="facts">' +
            '<div class="frow"><span>Aktiv</span><b>' + (asset.emoji || '') + ' ' + esc(asset.nom) + '</b></div>' +
            '<div class="frow"><span>Taklif narxi</span><b>' + U.fmt(off.price) + '</b></div>' +
            (asset.mortgage ? '<div class="frow"><span>Bank krediti yopiladi</span><b>−' + U.fmt(asset.mortgage) + '</b></div>' : '') +
            '<div class="frow total"><span>Qoʻlga tegadi</span><b>+' + U.fmt(gain) + '</b></div>' +
            '<div class="frow"><span>Siz sarflagan edingiz</span><b>' + U.fmt(paid) + '</b></div>' +
            (asset.cf ? '<div class="frow"><span>Yoʻqotiladigan oqim</span><b>−' + U.fmtShort(asset.cf) + '/oy</b></div>' : '') +
            '</div>',
          actions: [
            { label: 'Yoʻq, qoldiraman', cls: 'btn-ghost', action: { type: 'skip' } },
            { label: '💱 Sotish', cls: 'btn-gold', action: { type: 'acceptOffer' } },
          ],
        });
        break;
      }

      case 'doodad': {
        var dc = E.cardById(pd.cardId);
        PO.sound.play('card');
        showModal({
          kicker: 'Kutilmagan xarajat', emoji: dc.emoji, title: dc.nom, cls: 'modal-bad',
          body: '<p>' + esc(dc.desc) + '</p>' +
            (pd.cost > 0 ? '<div class="bigcost">−' + U.fmt(pd.cost) + '</div>' : '<div class="bigcost free">Bepul qutuldingiz! 🎉</div>'),
          actions: [{ label: 'Hayot-da…', action: { type: 'ack' } }],
        });
        break;
      }

      case 'charity':
        showModal({
          kicker: 'Ehson katagi', emoji: '🤲', title: 'Ehson qilasizmi?',
          body: '<p>Daromadingizning 10 foizini xayriyaga berسangiz, keyingi <b>3 navbatda</b> 1 yoki 2 shoshqol tanlab tashlaysiz — tezroq yurasiz!</p>' +
            '<div class="bigcost">−' + U.fmt(pd.cost) + '</div>',
          actions: [
            { label: 'Yoʻq', cls: 'btn-ghost', action: { type: 'charityNo' } },
            { label: '🤲 Ehson qilish', cls: 'btn-gold', action: { type: 'charityYes' }, disabled: p.cash < pd.cost },
          ],
        });
        break;

      case 'baby':
        showModal({
          kicker: 'Oilaviy voqea', emoji: '👶', title: 'Oilada quvonch!',
          body: '<p>' + (p.kids <= PO.C.MAX_KIDS && p.kids > 0 ? 'Farzandingiz tugʻildi — tabriklaymiz! Endi oylik xarajat <b>+' + U.fmt(p.perChild) + '</b> ga oshdi. (Farzandlar: ' + p.kids + ')' : 'Oila aʼzolaringiz salomat!') + '</p>',
          actions: [{ label: 'Rahmat!', action: { type: 'ack' } }],
        });
        break;

      case 'downsize':
        showModal({
          kicker: 'Yomon xabar', emoji: '📉', title: 'Ishdan boʻshatildingiz…', cls: 'modal-bad',
          body: '<p>Bir oylik turmush xarajati toʻlanadi va <b>2 navbat</b> ishsiz oʻtirasiz. Banklar kredit taʼtili berdi — kredit toʻlovlari bu oyga kechiktirildi.</p>' +
            '<div class="bigcost">−' + U.fmt(pd.cost) + '</div>' +
            '<p class="muted">Passiv daromad boʻlganida ish yoʻqotish bunchalik qoʻrqinchli boʻlmasdi…</p>',
          actions: [{ label: 'Chidaymiz', action: { type: 'ack' } }],
        });
        break;

      case 'event': {
        var evcard = E.cardById(pd.cardId);
        PO.sound.play('card');
        showModal({
          kicker: 'Voqea', emoji: evcard.emoji, title: evcard.nom,
          body: '<p>' + esc(evcard.desc) + '</p>',
          actions: [{ label: 'Davom etish', action: { type: 'ack' } }],
        });
        break;
      }

      case 'gamble':
        PO.sound.play('card');
        showModal({
          kicker: 'Tavakkalli taklif', emoji: '🎯', title: 'Tavakkal qilasizmi?',
          body: '<p>Doʻstingiz yangi loyihaga taklif qilyapti: mablagʻ tiksangiz, 50% ehtimol bilan ikki barobar boʻlib qaytadi, aks holda yoʻqotasiz.</p>' +
            '<div class="facts">' +
            '<div class="frow"><span>Tikiladigan summa</span><b>' + U.fmt(pd.stake) + '</b></div>' +
            '<div class="frow"><span>Yutsangiz</span><b class="good">+' + U.fmt(pd.stake) + '</b></div>' +
            '<div class="frow"><span>Yutqazsangiz</span><b class="neg">−' + U.fmt(pd.stake) + '</b></div></div>' +
            '<p class="muted">Voz kechish ham aqlli qaror — xavfsiz aktivlar barqaror boyitadi.</p>',
          actions: [
            { label: 'Yoʻq, xavfsiz oʻynayman', cls: 'btn-ghost', action: { type: 'gambleNo' } },
            { label: '🎯 Tavakkal qilaman', cls: 'btn-warn', action: { type: 'gambleYes' }, disabled: pd.stake <= 0 || p.cash < pd.stake },
          ],
        });
        break;

      case 'auction': {
        var acard = E.cardById(pd.cardId);
        var bidder = st.players[pd.order[pd.activeIdx]];
        var nextBid = pd.highBid + pd.step;
        var highBidderName = pd.highBidder >= 0 ? st.players[pd.highBidder].name : '(hali yoʻq)';
        PO.sound.play('card');
        showModal({
          kicker: 'Auksion', emoji: acard.emoji, title: acard.nom, cls: 'modal-ft',
          body: '<p>' + esc(acard.desc) + '</p><div class="facts">' +
            '<div class="frow"><span>Boshlangʻich narx</span><b>' + U.fmt(pd.base) + '</b></div>' +
            '<div class="frow"><span>Pul oqimi</span><b class="good">+' + U.fmt(acard.cf) + '/oy</b></div></div>' +
            '<div class="auction-box" style="--pc:' + bidder.color + '"><div class="auction-bid">' + U.fmt(pd.highBid) + '</div>' +
            '<div class="auction-bidder">Yetakchi taklif: ' + esc(highBidderName) + '</div>' +
            '<div class="auction-turn">Navbat: <b>' + esc(bidder.name) + '</b></div></div>',
          actions: [
            { label: 'Voz kechish', cls: 'btn-ghost', action: { type: 'auctionPass' } },
            { label: '🔨 Taklif: ' + U.fmtShort(nextBid), cls: 'btn-gold', action: { type: 'auctionBid' }, disabled: bidder.cash < nextBid },
          ],
        });
        break;
      }

      case 'ftDeal': {
        var fc = E.cardById(pd.cardId);
        PO.sound.play('card');
        showModal({
          kicker: 'Tezkor yoʻl · yirik bitim', emoji: fc.emoji, title: fc.nom, cls: 'modal-ft',
          body: '<p>' + esc(fc.desc) + '</p><div class="facts">' +
            '<div class="frow"><span>Narxi</span><b>' + U.fmt(fc.cost) + '</b></div>' +
            '<div class="frow"><span>Pul oqimi</span><b>+' + U.fmtShortSum(fc.cf) + '/oy</b></div>' +
            '<div class="frow"><span>Naqd pulingiz</span><b>' + U.fmt(p.cash) + '</b></div></div>',
          actions: [
            { label: 'Oʻtkazib yuborish', cls: 'btn-ghost', action: { type: 'skip' } },
            { label: '🚀 Sotib olish', cls: 'btn-gold', action: { type: 'buyFtDeal' }, disabled: p.cash < fc.cost },
          ],
        });
        break;
      }

      case 'ftDream': {
        var dream = E.dreamById(p.dreamId);
        showModal({
          kicker: 'Orzu katagi', emoji: dream.emoji, title: dream.nom, cls: 'modal-ft',
          body: '<p>' + esc(dream.desc) + '</p><div class="facts">' +
            '<div class="frow"><span>Narxi</span><b>' + U.fmt(dream.cost) + '</b></div>' +
            '<div class="frow"><span>Naqd pulingiz</span><b>' + U.fmt(p.cash) + '</b></div></div>' +
            (pd.canBuy ? '<p class="good">Yetarli mablagʻ bor — orzuni USHLANG!</p>' : '<p class="muted">Hali mablagʻ yetarli emas. Yirik bizneslar oling!</p>'),
          actions: [
            { label: 'Hozircha emas', cls: 'btn-ghost', action: { type: 'skip' } },
            { label: '⭐ ORZUNI AMALGA OSHIRISH', cls: 'btn-gold', action: { type: 'buyDream' }, disabled: !pd.canBuy },
          ],
        });
        break;
      }

      case 'ftTax':
      case 'ftLawsuit':
        showModal({
          kicker: 'Tezkor yoʻl xatari', emoji: pd.t === 'ftTax' ? '🧾' : '⚖️',
          title: pd.t === 'ftTax' ? 'Soliq tekshiruvi' : 'Sud jarayoni', cls: 'modal-bad',
          body: '<div class="bigcost">−' + U.fmt(pd.cost) + '</div><p class="muted">Katta pul — katta masʼuliyat. Hisob-kitob toza boʻlsin!</p>',
          actions: [{ label: 'Davom etish', action: { type: 'ack' } }],
        });
        break;

      case 'insolvent':
        insolventModal(st, pd);
        break;

      case 'gameOver':
        gameOverOverlay(st);
        break;
    }
  }

  /* — bitim modali — */
  function dealModal(st, p, card, deck) {
    var need = E.calc.dealNeed(card);
    var roi = need > 0 && card.cf ? ((card.cf / need) * 100).toFixed(1).replace('.', ',') : null;
    var rows = '';
    if (card.down != null) {
      // bank moliyalashtiruvi bilan: kvartira (ipoteka) yoki yirik biznes (kredit)
      rows = '<div class="frow"><span>Toʻliq narxi</span><b>' + U.fmt(card.full) + '</b></div>' +
        '<div class="frow"><span>' + (card.t === 're' ? 'Ipoteka (bank toʻlaydi)' : 'Bank krediti (biznesga)') + '</span><b>' + U.fmt(card.mortgage) + '</b></div>' +
        '<div class="frow total"><span>Boshlangʻich toʻlov</span><b>' + U.fmt(card.down) + '</b></div>' +
        '<div class="frow"><span>Pul oqimi (sof)</span><b class="good">+' + U.fmt(card.cf) + '/oy</b></div>';
    } else if (card.t === 'yer') {
      rows = '<div class="frow total"><span>Narxi</span><b>' + U.fmt(card.cost) + '</b></div>' +
        '<div class="frow"><span>Pul oqimi</span><b>0 (spekulyativ aktiv)</b></div>';
    } else {
      rows = '<div class="frow total"><span>Narxi</span><b>' + U.fmt(card.cost) + '</b></div>' +
        '<div class="frow"><span>Pul oqimi</span><b class="good">+' + U.fmt(card.cf) + '/oy</b></div>';
    }
    if (roi) rows += '<div class="frow"><span>Rentabellik (boshl. toʻlovga)</span><b>' + roi + '% oyiga</b></div>';
    rows += '<div class="frow"><span>Naqd pulingiz</span><b>' + U.fmt(p.cash) + '</b></div>';

    var gap = need - p.cash;
    var canLoan = gap > 0 && Math.ceil(gap / PO.C.LOAN_STEP) * PO.C.LOAN_STEP <= E.calc.maxLoan(p);
    var actions = [{ label: 'Oʻtkazib yuborish', cls: 'btn-ghost', action: { type: 'skip' } }];
    if (p.cash >= need) {
      actions.push({ label: '✅ Sotib olish', cls: 'btn-gold', action: { type: 'buyDeal' } });
    } else if (canLoan) {
      var loanAmt = Math.ceil(gap / PO.C.LOAN_STEP) * PO.C.LOAN_STEP;
      actions.push({
        label: '🏦 Kredit bilan olish (+' + U.fmtShort(loanAmt) + ')', cls: 'btn-warn',
        fn: function () { dispatch({ type: 'takeLoan', amount: loanAmt }); dispatch({ type: 'buyDeal' }); },
      });
    } else {
      actions.push({ label: '✅ Sotib olish', cls: 'btn-gold', disabled: true });
    }
    var kicker = deck === 'big' ? 'Katta bitim' : deck === 'auction' ? 'Auksion (raqobatchisiz)' : 'Kichik bitim';
    showModal({
      kicker: kicker, emoji: card.emoji, title: card.nom,
      body: '<p>' + esc(card.desc) + '</p><div class="facts">' + rows + '</div>' +
        (gap > 0 && !canLoan ? '<p class="muted">Mablagʻ yetarli emas, kredit limiti ham yetmaydi.</p>' : ''),
      actions: actions,
    });
  }

  /* — aksiya modali — */
  var getQty = {};
  function stockModal(st, pd) {
    var d = PO.DATA.stocks[pd.ticker];
    var priceBar = stockBar(d, pd.price);
    var head = '<p>' + esc(d.desc) + '</p>' + priceBar +
      '<div class="facts"><div class="frow"><span>Karta narxi</span><b>' + U.fmt(pd.price) + ' / dona</b></div>' +
      (d.div ? '<div class="frow"><span>Dividend</span><b>+' + U.fmt(d.div) + ' oyiga / dona</b></div>' : '<div class="frow"><span>Dividend</span><b>yoʻq — narx oʻsishiga oʻynaladi</b></div>') + '</div>';

    if (pd.cur === -1) {
      var p = st.players[st.turn];
      var maxQ = Math.floor(p.cash / pd.price);
      var card = pd.cardId ? E.cardById(pd.cardId) : null;
      showModal({
        kicker: (pd.t === 'stock' ? 'Kichik bitim · aksiya' : 'Bozor · aksiya') + ' — ' + esc(p.name), emoji: d.emoji,
        title: d.nom + ' (' + pd.ticker + ')',
        body: (card && card.hint ? '<p class="hint">💬 ' + esc(card.hint) + '</p>' : '') + head +
          '<p class="muted">Nechta olasiz? Naqd: <b>' + U.fmt(p.cash) + '</b></p>' + qtyControls(maxQ, pd.price, 'dona', 'qty-st'),
        actions: [
          { label: 'Olmayman', cls: 'btn-ghost', action: { type: 'skip' } },
          { label: '📈 Olish', keep: true, fn: function () { var q = getQty['qty-st'](); closeModal(); dispatch(q > 0 ? { type: 'buyStock', qty: q } : { type: 'skip' }); } },
        ],
      });
      getQty['qty-st'] = bindQty('qty-st', pd.price);
    } else {
      var seller = st.players[pd.queue[pd.cur]];
      var h = null;
      seller.assets.forEach(function (a) { if (a.kind === 'stock' && a.ticker === pd.ticker) h = a; });
      if (!h) { dispatch({ type: 'skip' }); return; }
      var avg = Math.round(h.costBasis / h.qty);
      showModal({
        kicker: 'Sotish imkoniyati — ' + esc(seller.name), emoji: d.emoji,
        title: d.nom + ' (' + pd.ticker + ')',
        body: head + '<div class="facts">' +
          '<div class="frow"><span>Sizda bor</span><b>' + U.groupNum(h.qty) + ' dona</b></div>' +
          '<div class="frow"><span>Oʻrtacha olingan narx</span><b>' + U.fmt(avg) + '</b></div>' +
          '<div class="frow total"><span>Hammasini sotsangiz</span><b>+' + U.fmt(h.qty * pd.price) + '</b></div></div>' +
          qtyControls(h.qty, pd.price, 'dona', 'qty-ss'),
        actions: [
          { label: 'Sotmayman', cls: 'btn-ghost', action: { type: 'skip' } },
          { label: '📉 Sotish', keep: true, fn: function () { var q = getQty['qty-ss'](); closeModal(); if (q > 0) { dispatch({ type: 'sellStock', qty: q, p: seller.i }); } dispatch({ type: 'skip' }); } },
        ],
      });
      getQty['qty-ss'] = bindQty('qty-ss', pd.price);
    }
  }

  function stockBar(d, price) {
    var pct = Math.max(0, Math.min(100, Math.round(((price - d.min) / (d.max - d.min)) * 100)));
    return '<div class="stockbar"><div class="stockbar-track"><div class="stockbar-marker" style="left:' + pct + '%"></div></div>' +
      '<div class="stockbar-lbls"><span>' + U.fmtShort(d.min) + '</span><span>oddiy: ' + U.fmtShort(d.base) + '</span><span>' + U.fmtShort(d.max) + '</span></div></div>';
  }

  /* — omonat yechish — */
  function withdrawModal(st, assetIdx) {
    var p = st.players[st.turn];
    var a = p.assets[assetIdx];
    if (!a || a.kind !== 'omonat') return;
    showModal({
      kicker: 'Bank', emoji: '🏧', title: 'Omonatni yechish',
      body: '<p>' + esc(a.nom) + ': <b>' + a.lots + ' lot</b> (' + U.fmt(a.lots * a.lotPrice) + ')</p>' + qtyControls(a.lots, a.lotPrice, 'lot', 'qty-w'),
      actions: [
        { label: 'Bekor', cls: 'btn-ghost', fn: function () {} },
        { label: 'Yechish', keep: true, fn: function () { var q = getQty['qty-w'](); closeModal(); if (q > 0) dispatch({ type: 'withdrawOmonat', assetIdx: assetIdx, lots: q }); } },
      ],
    });
    getQty['qty-w'] = bindQty('qty-w', a.lotPrice);
  }

  /* — bank modali — */
  function bankModal(st) {
    var p = st.players[st.turn];
    var maxL = E.calc.maxLoan(p);
    showModal({
      kicker: 'Bank xizmatlari', emoji: '🏦', title: 'Kredit olish / qaytarish',
      body: '<div class="facts">' +
        '<div class="frow"><span>Joriy kredit</span><b>' + U.fmt(p.bankLoan) + '</b></div>' +
        '<div class="frow"><span>Oylik foiz toʻlovi</span><b>' + U.fmt(Math.round(p.bankLoan * PO.C.LOAN_RATE)) + ' (' + Math.round(PO.C.LOAN_RATE * 100) + '%/oy)</b></div>' +
        '<div class="frow"><span>Kredit limiti (qoʻshimcha)</span><b>' + U.fmt(maxL) + '</b></div>' +
        '<div class="frow"><span>Naqd pul</span><b>' + U.fmt(p.cash) + '</b></div></div>' +
        '<p class="muted">Summani million soʻmlarda kiriting (masalan, 25 = 25 mln).</p>' +
        '<div class="qty-row"><input type="number" min="0" step="1" value="0" class="qty-in" id="bank-amt"><span class="muted">mln soʻm</span></div>',
      actions: [
        { label: 'Yopish', cls: 'btn-ghost', fn: function () {} },
        { label: '↩ Qaytarish', cls: 'btn-warn', keep: true, fn: function () { var v = bankVal(); if (v > 0) { closeModal(); dispatch({ type: 'repayLoan', amount: v }); } } },
        { label: '💸 Olish', keep: true, fn: function () { var v = bankVal(); if (v > 0 && v <= maxL) { closeModal(); dispatch({ type: 'takeLoan', amount: v }); } } },
      ],
    });
    function bankVal() { return Math.floor(+($('#bank-amt').value) || 0) * 1000000; }
  }

  /* — toʻlovga layoqatsizlik — */
  function insolventModal(st, pd) {
    var p = st.players[st.turn];
    var need = -p.cash;
    var loanAmt = Math.ceil(need / PO.C.LOAN_STEP) * PO.C.LOAN_STEP;
    var canLoan = loanAmt <= E.calc.maxLoan(p);
    var assetRows = p.assets.map(function (a, i) {
      var v = E.calc.emergencyValue(a);
      return '<button class="option" data-sell="' + i + '"><span>' + (a.emoji || '📦') + ' ' + esc(shortNom(a)) + '</span><b>+' + U.fmtShortSum(v) + '</b></button>';
    }).join('');
    showModal({
      kicker: 'Diqqat!', emoji: '🆘', title: 'Pul yetmayapti', cls: 'modal-bad',
      body: '<p>Hisobingiz: <b class="neg">' + U.fmt(p.cash) + '</b>. Qarzni yopish uchun:</p>' +
        (canLoan ? '<button class="option" id="ins-loan"><span>🏦 Bankdan kredit olish</span><b>+' + U.fmtShortSum(loanAmt) + '</b></button>' : '<p class="muted">Bank kredit limiti yetarli emas.</p>') +
        (assetRows ? '<p class="muted">Yoki aktivni favqulodda (chegirmali) sotish:</p>' + assetRows : '') +
        '<button class="option danger" id="ins-bankrupt"><span>💥 Bankrotlikni eʼlon qilish</span><b>oʻyin tugaydi</b></button>',
      actions: [],
    });
    if (canLoan) $('#ins-loan').onclick = function () { closeModal(); dispatch({ type: 'insolventLoan' }); };
    document.querySelectorAll('[data-sell]').forEach(function (b) {
      b.onclick = function () { closeModal(); dispatch({ type: 'insolventSell', assetIdx: +b.dataset.sell }); };
    });
    var armed = false;
    $('#ins-bankrupt').onclick = function () {
      if (!armed) { armed = true; this.querySelector('span').textContent = '💥 Rostdan ham? Yana bosing'; return; }
      closeModal(); dispatch({ type: 'declareBankrupt' });
    };
  }

  /* ═══════════ MARKAZ (hub) ═══════════ */

  function updateHub(st) {
    var hub = $('#hub');
    var p = st.players[st.turn];
    var pd = st.pending || {};
    if (st.over) {
      hub.innerHTML = '<div class="hub-title">Oʻyin tugadi</div>';
      return;
    }
    var html = '<div class="hub-round">' + st.round + '-davra</div>' +
      '<div class="hub-player" style="--pc:' + p.color + '">' + E.profById(p.profId).emoji + ' ' + esc(p.name) + '</div>' +
      '<div class="hub-dice" id="diceBox"><span class="die" id="die1">🎲</span><span class="die hidden" id="die2">🎲</span></div>';

    if (pd.t === 'turn') {
      if (pd.canDice2) {
        html += '<div class="dice-choice"><span>🤲 Ehson kuchi (' + pd.charityLeft + ' navbat):</span>' +
          '<button class="mini seg on" data-dice="1">1 dona</button><button class="mini seg" data-dice="2">2 dona</button></div>';
      }
      html += '<button class="btn btn-gold hub-btn" id="rollBtn">🎲 Tashlash</button>';
    } else if (pd.t === 'endTurn') {
      html += '<button class="btn btn-primary hub-btn" id="endBtn">Navbatni yakunlash ➤</button>';
    } else {
      html += '<div class="hub-wait">…</div>';
    }
    hub.innerHTML = html;

    var dice = 1;
    hub.querySelectorAll('[data-dice]').forEach(function (b) {
      b.onclick = function () {
        dice = +b.dataset.dice;
        hub.querySelectorAll('[data-dice]').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      };
    });
    var rollBtn = $('#rollBtn');
    if (rollBtn) rollBtn.onclick = function () { rollBtn.disabled = true; dispatch({ type: 'roll', dice: dice }); };
    var endBtn = $('#endBtn');
    if (endBtn) endBtn.onclick = function () { endBtn.disabled = true; dispatch({ type: 'endTurn' }); };
  }

  var DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  function showDice(values) {
    return new Promise(function (resolve) {
      var d1 = $('#die1'), d2 = $('#die2');
      if (!d1) { resolve(); return; }
      PO.sound.play('dice');
      d2.classList.toggle('hidden', values.length < 2);
      var t = 0;
      var iv = setInterval(function () {
        t += 70;
        d1.textContent = DIE_FACES[Math.floor(Math.random() * 6)];
        if (values[1]) d2.textContent = DIE_FACES[Math.floor(Math.random() * 6)];
        if (t >= 620) {
          clearInterval(iv);
          d1.textContent = DIE_FACES[values[0] - 1];
          if (values[1]) d2.textContent = DIE_FACES[values[1] - 1];
          d1.classList.add('die-pop'); d2.classList.add('die-pop');
          setTimeout(function () { d1.classList.remove('die-pop'); d2.classList.remove('die-pop'); resolve(); }, 420);
        }
      }, 70);
    });
  }

  /* ═══════════ EFFEKTLAR ═══════════ */

  function cashToast(delta, label) {
    var t = document.createElement('div');
    t.className = 'cash-toast ' + (delta >= 0 ? 'up' : 'down');
    t.textContent = (delta >= 0 ? '+' : '−') + U.fmtShort(Math.abs(delta)) + ' soʻm' + (label ? ' · ' + label : '');
    document.body.appendChild(t);
    PO.sound.play(delta >= 0 ? 'cashUp' : 'cashDown');
    setTimeout(function () { t.remove(); }, 2100);
  }

  function achToast(id) {
    var a = PO.DATA.achievements[id];
    if (!a) return;
    var t = document.createElement('div');
    t.className = 'ach-toast';
    t.innerHTML = '<span class="ach-emoji">' + a.emoji + '</span><div><div class="ach-kicker">Yutuq qoʻlga kiritildi</div>' +
      '<div class="ach-nom">' + esc(a.nom) + '</div><div class="ach-desc">' + esc(a.desc) + '</div></div>';
    document.body.appendChild(t);
    PO.sound.play('achievement');
    setTimeout(function () { t.remove(); }, 4100);
  }

  function turnBanner(p) {
    return new Promise(function (resolve) {
      var b = $('#turnBanner');
      b.innerHTML = '<div class="banner-inner" style="--pc:' + p.color + '">' +
        '<div class="banner-emoji">' + E.profById(p.profId).emoji + '</div>' +
        '<div class="banner-name">' + esc(p.name) + '</div><div class="banner-sub">Navbat sizda!</div>' +
        '<button class="btn btn-gold">Boshlash</button></div>';
      b.classList.add('open');
      b.querySelector('button').onclick = function () { b.classList.remove('open'); resolve(); };
    });
  }

  function confetti() {
    var cv = document.createElement('canvas');
    cv.className = 'confetti';
    cv.width = innerWidth; cv.height = innerHeight;
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var colors = ['#0d9488', '#d97706', '#f43f5e', '#8b5cf6', '#e8b93c', '#38bdf8'];
    var parts = [];
    for (var i = 0; i < 170; i++) {
      parts.push({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5, w: 6 + Math.random() * 7, h: 10 + Math.random() * 8, c: colors[i % colors.length], vy: 2 + Math.random() * 3.5, vx: -1.4 + Math.random() * 2.8, r: Math.random() * Math.PI, vr: -0.12 + Math.random() * 0.24 });
    }
    var t0 = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(function (q) {
        q.x += q.vx; q.y += q.vy; q.r += q.vr;
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r);
        ctx.fillStyle = q.c; ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
        ctx.restore();
      });
      if (now - t0 < 4200) requestAnimationFrame(frame);
      else cv.remove();
    })(t0);
  }

  /* ═══════════ Oʻyin yakuni ═══════════ */

  function gameOverOverlay(st) {
    var o = $('#overlay');
    var html;
    if (st.over.type === 'win') {
      var w = st.players[st.over.winner];
      var dream = E.dreamById(w.dreamId);
      html = '<div class="over-card win"><div class="over-emoji">🏆</div>' +
        '<h2>' + esc(w.name) + ' — GʻOLIB!</h2>' +
        '<p>' + (st.over.how === 'dream' ? 'Orzu roʻyobga chiqdi: ' + dream.emoji + ' «' + esc(dream.nom) + '»' : 'Tezkor yoʻlda +' + U.fmtShortSum(w.ftExtra) + '/oy yangi pul oqimi yaratildi!') + '</p>' +
        '<div class="facts">' +
        '<div class="frow"><span>Oʻynalgan davr</span><b>' + w.months + ' oy</b></div>' +
        '<div class="frow"><span>Poygadan chiqish</span><b>' + (w.stats.escMonth || '—') + '-oyda</b></div>' +
        '<div class="frow"><span>Tuzilgan bitimlar</span><b>' + w.stats.deals + ' ta</b></div>' +
        '<div class="frow"><span>Ehsonga berilgan</span><b>' + U.fmtShortSum(w.stats.charity) + '</b></div></div>' +
        '<p class="muted">Asosiy saboq: aktivlar sizga ishladi — maosh emas, PUL OQIMI boyitadi.</p>' +
        '<div class="modal-actions"><button class="btn btn-ghost" id="homeBtn">Bosh sahifa</button>' +
        '<button class="btn btn-gold" id="againBtn">Yana oʻynash</button></div></div>';
    } else {
      html = '<div class="over-card"><div class="over-emoji">📚</div>' +
        '<h2>Oʻyin tugadi</h2><p>Bu safar omad kulib boqmadi — lekin saboq qoldi: xarajat va qarzlar nazoratdan chiqsa, eng katta maosh ham qutqarmaydi. Yana urinib koʻring!</p>' +
        '<div class="modal-actions"><button class="btn btn-ghost" id="homeBtn">Bosh sahifa</button>' +
        '<button class="btn btn-gold" id="againBtn">Yana oʻynash</button></div></div>';
    }
    o.innerHTML = html;
    o.classList.add('open');
    if (st.over.type === 'win') confetti();
    $('#homeBtn').onclick = function () { location.hash = ''; location.reload(); };
    $('#againBtn').onclick = function () { PO.main.restartSameConfig(); };
  }

  function initMuteButtons() {
    var btns = [document.getElementById('btnMuteHome'), document.getElementById('btnMuteGame')].filter(Boolean);
    function refresh() {
      var m = PO.sound.isMuted();
      btns.forEach(function (b) {
        b.textContent = m ? '🔇' : '🔊';
        b.classList.toggle('is-muted', m);
      });
    }
    btns.forEach(function (b) {
      b.onclick = function () { PO.sound.toggleMute(); refresh(); };
    });
    refresh();
  }

  PO.ui = {
    setDispatch: setDispatch,
    renderSidebar: renderSidebar,
    renderLog: renderLog,
    renderPending: renderPending,
    showDice: showDice,
    cashToast: cashToast,
    achToast: achToast,
    turnBanner: turnBanner,
    confetti: confetti,
    closeModal: closeModal,
    initMuteButtons: initMuteButtons,
    setView: function (i) { viewIdx = i; },
    esc: esc,
  };
})();
