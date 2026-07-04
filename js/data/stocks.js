/* Pul Oqimi — "Toshkent" respublika fond birjasida (uzse.uz) savdoga chiqarilgan
   haqiqiy oʻzbek kompaniyalari aksiyalari.
   Narxlar 2025-yil holatiga TAXMINIY moʻljal (oʻyin ichida tebranadi) — soʻmda, 1 dona aksiya uchun.
   Yangilash uchun: uzse.uz saytидаги joriy kotirovkalarni shu yerga kiriting.
   div — 1 dona aksiya boʻyicha OYLIK dividend moʻljali (yillik dividendning 1/12 qismi). */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});
  PO.DATA = PO.DATA || {};

  PO.DATA.stocksAsOf = '2025-yil (taxminiy moʻljal)';

  PO.DATA.stocks = {
    SQBN: {
      ticker: 'SQBN',
      nom: '«Sanoat qurilish bank» (SQB)',
      emoji: '🏦',
      sector: 'Bank',
      base: 9,
      min: 3,
      max: 22,
      div: 0,
      desc: 'Yirik davlat banki aksiyalari — birjadagi eng arzon va eng "xalqchil" qogʻozlardan biri.',
    },
    HMKB: {
      ticker: 'HMKB',
      nom: '«Hamkorbank»',
      emoji: '🤝',
      sector: 'Bank',
      base: 24,
      min: 9,
      max: 60,
      div: 0,
      desc: 'Andijonda tugʻilgan xususiy bank — chakana va kichik biznes krediti boʻyicha yetakchilardan.',
    },
    KVTS: {
      ticker: 'KVTS',
      nom: '«Kvarts» shisha zavodi',
      emoji: '🫙',
      sector: 'Sanoat',
      base: 3900,
      min: 2200,
      max: 7000,
      div: 30,
      desc: 'Qoʻqondagi yirik shisha ishlab chiqaruvchi. Barqaror dividend toʻlab keladi.',
    },
    QZSM: {
      ticker: 'QZSM',
      nom: '«Qizilqumsement»',
      emoji: '🏗️',
      sector: 'Qurilish materiallari',
      base: 3100,
      min: 1700,
      max: 6200,
      div: 45,
      desc: 'Navoiydagi sement giganti — qurilish bumi davrida talab yuqori, dividendlari mashhur.',
    },
    UZMK: {
      ticker: 'UZMK',
      nom: '«Oʻzmetkombinat»',
      emoji: '⚙️',
      sector: 'Metallurgiya',
      base: 10500,
      min: 6000,
      max: 18000,
      div: 95,
      desc: 'Bekoboddagi metallurgiya kombinati — mamlakat poʻlatining asosiy ishlab chiqaruvchisi.',
    },
    URTS: {
      ticker: 'URTS',
      nom: '«OʻzRTXB» (UzEx birjasi)',
      emoji: '📈',
      sector: 'Moliya',
      base: 19000,
      min: 11000,
      max: 33000,
      div: 260,
      desc: 'Respublika tovar-xomashyo birjasi — birjaning oʻzi ham birjada savdolanadi! Yuqori dividend.',
    },
  };
})();
