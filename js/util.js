/* Pul Oqimi — umumiy yordamchi funksiyalar */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});

  var NBSP = ' '; // tor boʻshliq — raqam guruhlari orasida

  function groupNum(n) {
    n = Math.round(n);
    var neg = n < 0;
    var s = String(Math.abs(n));
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var fromEnd = s.length - i;
      out += s[i];
      if (fromEnd > 1 && (fromEnd - 1) % 3 === 0) out += NBSP;
    }
    return (neg ? '−' : '') + out;
  }

  // 12 500 000 soʻm
  function fmt(n) {
    return groupNum(n) + ' soʻm';
  }

  // Qisqa koʻrinish: 12,5 mln · 1,2 mlrd · 850 ming
  function fmtShort(n) {
    var neg = n < 0 ? '−' : '';
    var a = Math.abs(Math.round(n));
    function one(v) {
      var r = Math.round(v * 10) / 10;
      return r % 1 === 0 ? String(Math.round(r)) : String(r).replace('.', ',');
    }
    if (a >= 1e9) return neg + one(a / 1e9) + ' mlrd';
    if (a >= 1e6) return neg + one(a / 1e6) + ' mln';
    if (a >= 1e3) return neg + one(a / 1e3) + ' ming';
    return neg + String(a);
  }

  function fmtShortSum(n) {
    return fmtShort(n) + ' soʻm';
  }

  // Belgili pul: +1 300 000 soʻm / −500 000 soʻm
  function fmtSigned(n) {
    return (n >= 0 ? '+' : '') + fmt(n);
  }

  // ——— Deterministik RNG (mulberry32) ———
  function makeRng(seed) {
    var t = seed >>> 0;
    return function () {
      t = (t + 0x6d2b79f5) >>> 0;
      var r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Holatga bogʻlangan RNG: state.rngState dan foydalanadi (saqlash/tiklashga mos)
  function nextRand(state) {
    var t = (state.rngState + 0x6d2b79f5) >>> 0;
    state.rngState = t;
    var r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }

  function randInt(state, min, max) {
    return min + Math.floor(nextRand(state) * (max - min + 1));
  }

  function shuffled(state, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(nextRand(state) * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function sum(arr, f) {
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += f ? f(arr[i]) : arr[i];
    return s;
  }

  PO.util = {
    fmt: fmt,
    fmtShort: fmtShort,
    fmtShortSum: fmtShortSum,
    fmtSigned: fmtSigned,
    groupNum: groupNum,
    makeRng: makeRng,
    nextRand: nextRand,
    randInt: randInt,
    shuffled: shuffled,
    clamp: clamp,
    sum: sum,
  };
})();
