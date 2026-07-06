/* Pul Oqimi — balans va mustahkamlik simulyatsiyasi (Node).
   Ishga tushirish: node test/sim.js [oʻyinlar soni]
   Oddiy "bot" strategiya bilan minglab oʻyin oʻynab, oʻyin balansi va xatolarni tekshiradi. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
['js/util.js', 'js/data/professions.js', 'js/data/stocks.js', 'js/data/cards.js', 'js/data/tips.js', 'js/data/events.js', 'js/engine.js']
  .forEach((f) => vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }));

const PO = globalThis.PO;
const E = PO.engine;

/* ——— Bot strategiyasi ——— */
function botAction(st) {
  const pd = st.pending;
  const p = st.players[st.turn];
  const calc = E.calc;

  switch (pd.t) {
    case 'turn': {
      // qarz boshqaruvi — yurishdan oldin
      const exp0 = calc.expenses(p);
      for (let i = 0; i < p.liabilities.length; i++) {
        if (p.cash >= p.liabilities[i].balance + exp0 * 2) return { type: 'repayLiability', idx: i };
      }
      if (p.bankLoan > 0 && p.cash > p.bankLoan + exp0 * 3) {
        const r = Math.floor(Math.min(p.bankLoan, p.cash - exp0 * 3) / 1e6) * 1e6;
        if (r > 0) return { type: 'repayLoan', amount: r };
      }
      return { type: 'roll', dice: pd.canDice2 ? 2 : 1 };
    }

    case 'dealSize':
      return { type: 'dealSize', size: p.cash >= 70e6 ? 'big' : 'small' };

    case 'deal': {
      const card = E.cardById(pd.cardId);
      const need = calc.dealNeed(card);
      if (card.t === 'yer') {
        return p.cash >= card.cost * 2 ? { type: 'buyDeal' } : { type: 'skip' };
      }
      const roi = card.cf / need;
      const buffer = calc.expenses(p); // 1 oylik xarajat zaxirada qolsin
      if (p.cash - need >= buffer && roi >= 0.025) return { type: 'buyDeal' };
      // kuchli bitim boʻlsa kredit bilan olamiz
      if (roi >= 0.05 && p.cash < need) {
        const gap = Math.ceil((need - p.cash) / 1e6) * 1e6;
        if (gap <= calc.maxLoan(p)) return { type: 'takeLoan', amount: gap };
      }
      return { type: 'skip' };
    }

    case 'stock':
    case 'marketStock': {
      const stk = PO.DATA.stocks[pd.ticker];
      if (pd.cur === -1) {
        if (pd.price <= stk.base * 0.75) {
          const qty = Math.floor((p.cash * 0.6) / pd.price);
          if (qty > 0) return { type: 'buyStock', qty };
        }
        return { type: 'skip' };
      }
      const seller = st.players[pd.queue[pd.cur]];
      const h = seller.assets.find((a) => a.kind === 'stock' && a.ticker === pd.ticker);
      if (h) {
        const avg = h.costBasis / h.qty;
        if (pd.price >= avg * 1.5 || pd.price >= stk.base * 1.4) return { type: 'sellStock', qty: h.qty, p: seller.i };
      }
      return { type: 'skip' };
    }

    case 'omonat': {
      const card = E.cardById(pd.cardId);
      const lots = p.cash > 30e6 ? Math.floor((p.cash * 0.3) / card.lotPrice) : 0;
      return { type: 'buyOmonat', lots };
    }

    case 'market':
      return { type: 'ack' };

    case 'marketOffer': {
      const off = pd.offers[pd.cur];
      const q = st.players[off.p];
      const a = q.assets[off.assetIdx];
      if (!a) return { type: 'skip' };
      const equityPaid = a.down != null ? a.down : a.cost || a.full;
      let sell = false;
      if (a.kind === 'yer') sell = off.price > a.cost * 1.3;
      else sell = off.price - (a.mortgage || 0) > equityPaid * 2;
      return sell ? { type: 'acceptOffer' } : { type: 'skip' };
    }

    case 'doodad':
    case 'baby':
    case 'downsize':
    case 'ftTax':
    case 'ftLawsuit':
    case 'event':
      return { type: 'ack' };

    case 'charity':
      return p.cash >= pd.cost * 3 ? { type: 'charityYes' } : { type: 'charityNo' };

    case 'gamble': {
      const buffer = calc.expenses(p);
      if (pd.stake > 0 && p.cash - pd.stake >= buffer * 2.5) return { type: 'gambleYes' };
      return { type: 'gambleNo' };
    }

    case 'auction': {
      const bidder = st.players[pd.order[pd.activeIdx]];
      const card = E.cardById(pd.cardId);
      const nextPrice = pd.highBid + pd.step;
      const roi = card.cf / nextPrice;
      const buffer = calc.expenses(bidder);
      if (bidder.cash - nextPrice >= buffer && roi >= 0.02) return { type: 'auctionBid' };
      return { type: 'auctionPass' };
    }

    case 'ftDeal': {
      const card = E.cardById(pd.cardId);
      return p.cash >= card.cost ? { type: 'buyFtDeal' } : { type: 'skip' };
    }

    case 'ftDream':
      return pd.canBuy ? { type: 'buyDream' } : { type: 'skip' };

    case 'insolvent': {
      const om = p.assets.findIndex((a) => a.kind === 'omonat');
      if (om >= 0) return { type: 'insolventSell', assetIdx: om };
      const need = Math.ceil(-p.cash / 1e6) * 1e6;
      if (E.calc.maxLoan(p) >= need) return { type: 'insolventLoan' };
      let best = -1, bestV = 0;
      p.assets.forEach((a, i) => {
        const v = E.calc.emergencyValue(a);
        if (v > bestV) { bestV = v; best = i; }
      });
      if (best >= 0) return { type: 'insolventSell', assetIdx: best };
      return { type: 'declareBankrupt' };
    }

    case 'endTurn': // eski holat — endi avtomatik yakunlanadi
      return { type: 'endTurn' };

    default:
      throw new Error('Bot uchun nomaʼlum pending: ' + pd.t);
  }
}

/* ——— Bitta oʻyin ——— */
function runGame(profIds, seed, maxActions = 20000) {
  const st = E.newGame({
    seed,
    players: profIds.map((id, i) => ({ name: 'Bot' + (i + 1), profId: id, dreamId: PO.DATA.dreams[i % PO.DATA.dreams.length].id })),
  });
  let acts = 0;
  while (!st.over && acts++ < maxActions) {
    E.act(st, botAction(st));
  }
  return { st, timeout: acts >= maxActions };
}

/* ——— Seriya ——— */
const N = parseInt(process.argv[2] || '300', 10);
const profs = PO.DATA.professions;
console.log(`Har kasb uchun ${N} ta yakka oʻyin…\n`);

const median = (arr) => {
  if (!arr.length) return '—';
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

let crash = 0;
const rows = [];
for (const prof of profs) {
  const escM = [], winM = [];
  let esc = 0, wins = 0, bankrupt = 0, timeouts = 0;
  for (let g = 0; g < N; g++) {
    let res;
    try {
      res = runGame([prof.id], (g * 2654435761 + prof.id.length * 97) >>> 0);
    } catch (e) {
      crash++;
      if (crash <= 5) console.error(`CRASH [${prof.id} #${g}]: ${e.message}\n${e.stack.split('\n')[1]}`);
      continue;
    }
    const p = res.st.players[0];
    if (p.escaped) { esc++; escM.push(p.stats.escMonth); }
    if (p.won) { wins++; winM.push(p.months); }
    if (p.bankrupt) bankrupt++;
    if (res.timeout) timeouts++;
  }
  rows.push({
    kasb: prof.id, maosh: (prof.salary / 1e6).toFixed(1) + 'M',
    chiqdi: `${Math.round((100 * esc) / N)}%`, 'chiqish(oy)': median(escM),
    yutdi: `${Math.round((100 * wins) / N)}%`, 'yutish(oy)': median(winM),
    bankrot: bankrupt, timeout: timeouts,
  });
}
console.table(rows);

// 3 kishilik aralash oʻyinlar — koʻp oʻyinchi rejimini tekshirish
let mpOk = 0, mpCrash = 0;
for (let g = 0; g < Math.max(30, N / 5); g++) {
  try {
    const ids = [profs[g % profs.length].id, profs[(g + 4) % profs.length].id, profs[(g + 9) % profs.length].id];
    const res = runGame(ids, (g * 40503 + 7) >>> 0, 60000);
    if (res.st.over) mpOk++;
  } catch (e) {
    mpCrash++;
    if (mpCrash <= 3) console.error('MP CRASH:', e.message, e.stack.split('\n')[1]);
  }
}
console.log(`\n3 kishilik oʻyinlar: ${mpOk} yakunlandi, ${mpCrash} xato.`);

// Determinizm: bir xil seed → bir xil natija
const a = runGame(['farrosh'], 12345), b = runGame(['farrosh'], 12345);
console.log('Determinizm:', JSON.stringify(a.st.players[0].stats) === JSON.stringify(b.st.players[0].stats) ? 'OK' : 'BUZILGAN!');

console.log(crash ? `\n❌ Jami CRASH: ${crash}` : '\n✅ Xatosiz yakunlandi.');
process.exit(crash ? 1 : 0);
