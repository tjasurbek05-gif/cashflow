/* Pul Oqimi — sintez qilingan tovush effektlari (WebAudio, tashqi fayllarsiz).
   Ovoz uzatuvchi ulanish faqat foydalanuvchi birinchi bosishidan keyin ochiladi
   (brauzerlarning avto-ijro siyosati talabi). Ovozni oʻchirish holati saqlanadi. */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});
  var MUTE_KEY = 'puloqimi_muted';

  var ctx = null;
  var master = null;
  var muted = localStorage.getItem(MUTE_KEY) === '1';
  var noiseBuf = null;

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    var c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  function getNoise() {
    if (noiseBuf || !ctx) return noiseBuf;
    var len = Math.floor(ctx.sampleRate * 0.3);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function tone(t0, freq, dur, opts) {
    opts = opts || {};
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    var peak = opts.gain != null ? opts.gain : 0.22;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (opts.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noiseHit(t0, dur, filterFreq, gainPeak) {
    var src = ctx.createBufferSource();
    src.buffer = getNoise();
    var filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(filterFreq, t0);
    filt.frequency.exponentialRampToValueAtTime(Math.max(60, filterFreq * 0.5), t0 + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  var SFX = {
    click: function () {
      var t = ctx.currentTime;
      tone(t, 720, 0.05, { type: 'sine', gain: 0.14 });
    },
    dice: function () {
      var t = ctx.currentTime;
      noiseHit(t, 0.12, 1400, 0.18);
      noiseHit(t + 0.07, 0.1, 1000, 0.14);
    },
    cashUp: function () {
      var t = ctx.currentTime;
      tone(t, 523.25, 0.16, { type: 'triangle', gain: 0.22 });
      tone(t + 0.07, 784.0, 0.2, { type: 'triangle', gain: 0.22 });
    },
    cashDown: function () {
      var t = ctx.currentTime;
      tone(t, 392.0, 0.16, { type: 'sawtooth', gain: 0.16 });
      tone(t + 0.08, 277.18, 0.22, { type: 'sawtooth', gain: 0.16 });
    },
    card: function () {
      var t = ctx.currentTime;
      noiseHit(t, 0.18, 2200, 0.12);
    },
    achievement: function () {
      var t = ctx.currentTime;
      tone(t, 784.0, 0.14, { type: 'triangle', gain: 0.2 });
      tone(t + 0.09, 1046.5, 0.22, { type: 'triangle', gain: 0.24 });
    },
    escape: function () {
      var t = ctx.currentTime;
      [523.25, 659.25, 784.0, 1046.5].forEach(function (f, i) {
        tone(t + i * 0.09, f, 0.22, { type: 'triangle', gain: 0.22 });
      });
    },
    win: function () {
      var t = ctx.currentTime;
      [523.25, 659.25, 784.0, 1046.5].forEach(function (f, i) {
        tone(t + i * 0.1, f, 0.3, { type: 'triangle', gain: 0.24 });
      });
      tone(t + 0.5, 1046.5, 0.9, { type: 'sine', gain: 0.18 });
      tone(t + 0.5, 784.0, 0.9, { type: 'sine', gain: 0.14 });
      tone(t + 0.5, 1318.5, 0.9, { type: 'sine', gain: 0.12 });
    },
    error: function () {
      var t = ctx.currentTime;
      tone(t, 180, 0.18, { type: 'square', gain: 0.12 });
    },
  };

  function play(name) {
    if (muted) return;
    var c = ensureCtx();
    if (!c || c.state === 'suspended' || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* audio muhit ruxsat bermadi — jim oʻtamiz */ }
  }

  function isMuted() { return muted; }
  function setMuted(v) {
    muted = !!v;
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    if (master) master.gain.value = muted ? 0 : 0.55;
  }
  function toggleMute() { setMuted(!muted); return muted; }

  document.addEventListener('pointerdown', unlock, { once: true, passive: true });
  document.addEventListener('keydown', unlock, { once: true });

  PO.sound = { play: play, isMuted: isMuted, setMuted: setMuted, toggleMute: toggleMute };
})();
