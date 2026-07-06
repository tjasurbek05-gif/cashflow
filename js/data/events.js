/* Pul Oqimi — dramatik voqealar, auksion bitimlari va yutuqlar.
   kind: 'cashSelf' (joriy oʻyinchiga naqd), 'cashAll' (hamma faol oʻyinchiga naqd),
         'bizBoost'/'bizHit' (tasodifiy aktiv pul oqimini oʻzgartiradi, aktiv boʻlmasa
         'fallback' qiymati naqd sifatida qoʻllanadi), 'loanRelief' (bank krediti kamayadi,
         kredit boʻlmasa 'fallback' naqd sifatida qoʻllanadi). */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});
  PO.DATA = PO.DATA || {};

  PO.DATA.events = [
    { id: 'ev_meros', nom: 'Meros', emoji: '🎁', kind: 'cashSelf', amount: 8000000, desc: 'Uzoq qarindoshingizdan kutilmagan meros yetib keldi!' },
    { id: 'ev_ogri', nom: 'Hamyon oʻgʻirlandi', emoji: '🕵️', kind: 'cashSelf', amount: -2000000, desc: 'Bozorda choʻntak qoqib ketishdi. Ehtiyot boʻling!' },
    { id: 'ev_lotereya', nom: 'Milliy lotereya', emoji: '🎟️', kind: 'cashSelf', amount: 6000000, desc: 'Chipta yutdi! Kichik, lekin yoqimli sovgʻa.' },
    { id: 'ev_gastarbaiter', nom: 'Chet eldan pul oʻtkazma', emoji: '✈️', kind: 'cashSelf', amount: 5000000, desc: 'Rossiyada ishlayotgan aka-ukangiz pul joʻnatdi.' },
    { id: 'ev_shifo', nom: 'Kutilmagan davolanish', emoji: '🏥', kind: 'cashSelf', amount: -2500000, desc: 'Sogʻliq muhim — shifokorga xarajat qildingiz.' },
    { id: 'ev_soliq_qaytim', nom: 'Soliq qaytimi', emoji: '🧾', kind: 'cashSelf', amount: 2500000, desc: 'Ortiqcha toʻlangan soliq davlat tomonidan qaytarildi.' },
    { id: 'ev_toy_sovga', nom: 'Toʻydan sovgʻa', emoji: '💝', kind: 'cashSelf', amount: 3500000, desc: 'Qarindoshlaringiz toʻyingizga saxiylik bilan sovgʻa berishdi.' },
    { id: 'ev_viral', nom: 'Ijtimoiy tarmoqda mashhur boʻldi', emoji: '📲', kind: 'bizBoost', amount: 350000, fallback: 3000000, desc: 'Bir mijoz biznesingiz haqida video tushirdi — tarmoqda "portlab" ketdi! Mijozlar oqimi oshdi.' },
    { id: 'ev_yol', nom: 'Yangi yoʻl qurildi', emoji: '🛣️', kind: 'bizBoost', amount: 300000, fallback: 2500000, desc: 'Mavze yonidan yangi yoʻl oʻtdi — mijozlar oqimi koʻpaydi.' },
    { id: 'ev_raqobat', nom: 'Qoʻshni raqobatchi ochildi', emoji: '🏪', kind: 'bizHit', amount: -180000, fallback: -1300000, desc: 'Yonginangizda oʻxshash biznes ochildi — mijozlar boʻlinmoqda.' },
    { id: 'ev_tamir', nom: 'Taʼmirlash zarurati', emoji: '🔧', kind: 'bizHit', amount: -150000, fallback: -1200000, desc: 'Aktivlaringizdan birida taʼmirlash ishlari kerak boʻldi.' },
    { id: 'ev_bank_yengillik', nom: 'Bank yengilligi', emoji: '🏦', kind: 'loanRelief', amount: 12000000, fallback: 2000000, desc: 'Bank sodiq mijozlar uchun aksiya eʼlon qildi — kredit qoldigʻingiz kamaydi.' },
    { id: 'ev_subsidiya', nom: 'Tadbirkorlikni qoʻllab-quvvatlash', emoji: '🏛️', kind: 'cashAll', amount: 1500000, desc: 'Davlat kichik biznesga subsidiya eʼlon qildi — hammaga baravar!' },
    { id: 'ev_narx_oshdi', nom: 'Kommunal narxlar oshdi', emoji: '📈', kind: 'cashAll', amount: -600000, desc: 'Respublika boʻylab kommunal toʻlovlar qimmatlashdi. Hammaga taʼsir qildi.' },
  ];

  // Tezkor yoʻl — kattaroq miqyosdagi voqealar
  PO.DATA.ftEvents = [
    { id: 'fev_meros', nom: 'Katta meros', emoji: '🎁', kind: 'cashSelf', amount: 80000000, desc: 'Oilaviy biznesdan katta ulush meros qoldi!' },
    { id: 'fev_firibgar', nom: 'Firibgarlik qurboni', emoji: '🕵️', kind: 'cashSelf', amount: -25000000, desc: 'Ishonchsiz sherik bilan bitim sizga qimmatga tushdi.' },
    { id: 'fev_investor', nom: 'Xorijiy investor qiziqdi', emoji: '🌍', kind: 'bizBoost', amount: 4000000, fallback: 35000000, desc: 'Xorijiy fond biznesingizga qiziqish bildirdi — qiymati oshdi.' },
    { id: 'fev_boykot', nom: 'Ijtimoiy tarmoqda tanqid', emoji: '📉', kind: 'bizHit', amount: -2000000, fallback: -16000000, desc: 'Blogger sharhi obroʻga putur yetkazdi — daromad pasaydi.' },
    { id: 'fev_bank_yengillik', nom: 'Yirik mijozlar dasturi', emoji: '🏦', kind: 'loanRelief', amount: 90000000, fallback: 20000000, desc: 'Bank VIP mijozlarga kredit chegirmasi berdi.' },
    { id: 'fev_grant', nom: 'Davlat granti', emoji: '🏛️', kind: 'cashAll', amount: 15000000, desc: 'Yirik biznes vakillariga rivojlanish granti ajratildi — hammaga!' },
    { id: 'fev_inflyatsiya', nom: 'Inflyatsiya sakrashi', emoji: '📈', kind: 'cashAll', amount: -6000000, desc: 'Narxlar keskin oshdi — bu barcha yirik oʻyinchilarga taʼsir qildi.' },
  ];

  // Auksion — alohida, cheklangan miqdordagi jozibali bitimlar (faqat naqd, kreditsiz)
  PO.DATA.auctionPool = [
    { id: 'auc_kafe', nom: 'Hashamatli kafe (markazda)', emoji: '☕', cost: 90000000, cf: 3800000, t: 'biz', tags: ['auksion'], desc: 'Markazdagi mashhur kafe — koʻplab tadbirkorlar koʻz olaytiradi.' },
    { id: 'auc_avtoservis', nom: 'Avtoservis (toʻliq jihozlangan)', emoji: '🔧', cost: 70000000, cf: 3200000, t: 'biz', tags: ['auksion'], desc: 'Zamonaviy diagnostika uskunalari bilan avtoservis.' },
    { id: 'auc_savdo_pavilon', nom: 'Savdo pavilyoni (bozorda)', emoji: '🏬', cost: 55000000, cf: 2600000, t: 'biz', tags: ['auksion'], desc: 'Eng gavjum bozorlardan birida joylashgan pavilyon.' },
    { id: 'auc_fitnes_zal', nom: 'Fitnes-zal (toʻliq jihozlangan)', emoji: '🏋️', cost: 85000000, cf: 3600000, t: 'biz', tags: ['auksion'], desc: 'Zamonaviy trenajyorlar bilan mashhur fitnes-zal.' },
    { id: 'auc_kvartira_markaz', nom: 'Markazdagi 3 xonali kvartira', emoji: '🏙️', cost: 480000000, cf: 4200000, t: 'biz', tags: ['auksion'], desc: 'Shahar markazida qulay joylashuvli kvartira — talab doim yuqori.' },
    { id: 'auc_diyxona', nom: 'Zamonaviy dorixona', emoji: '💊', cost: 65000000, cf: 3000000, t: 'biz', tags: ['auksion'], desc: 'Doimiy mijozli, litsenziyasi tayyor dorixona.' },
    { id: 'auc_yuk_mashina', nom: 'Yuk mashinasi (ichki logistika)', emoji: '🚚', cost: 60000000, cf: 2800000, t: 'biz', tags: ['auksion'], desc: 'Shahar ichi yetkazib berish uchun tayyor yuk mashinasi.' },
    { id: 'auc_bogcha', nom: 'Xususiy bolalar bogʻchasi', emoji: '🧸', cost: 95000000, cf: 4000000, t: 'biz', tags: ['auksion'], desc: 'Litsenziyalangan, toʻliq bandlikdagi xususiy bogʻcha.' },
  ];

  // Yutuqlar — shart tekshiruvi engine.js da (bu yerda faqat matn/koʻrinish)
  PO.DATA.achievements = {
    firstDeal: { nom: 'Birinchi qadam', emoji: '🌱', desc: 'Birinchi aktivingizni sotib oldingiz.' },
    portfolio5: { nom: 'Portfel egasi', emoji: '📂', desc: '5 ta aktivga ega boʻldingiz.' },
    portfolio10: { nom: 'Aktivlar ustasi', emoji: '🏆', desc: '10 ta aktivga ega boʻldingiz.' },
    escaped: { nom: 'Erkin nafas', emoji: '🕊️', desc: 'Sichqonlar poygasidan chiqdingiz!' },
    millionaire: { nom: 'Millioner', emoji: '💎', desc: 'Sof boyligingiz 1 milliard soʻmdan oshdi.' },
    riskTaker: { nom: 'Tavakkalchi', emoji: '🎯', desc: 'Tavakkalli taklifda yutib chiqdingiz.' },
    auctionWinner: { nom: 'Auksion gʻolibi', emoji: '🔨', desc: 'Auksionda bitimni yutib oldingiz.' },
    generous: { nom: 'Saxovatli', emoji: '🤲', desc: '3 marta ehsonga qoʻl choʻzdingiz.' },
    survivor: { nom: 'Chidamli', emoji: '💪', desc: 'Ishdan boʻshatilgandan keyin ham bankrot boʻlmadingiz.' },
    champion: { nom: 'Gʻolib', emoji: '👑', desc: 'Oʻyinni yutib chiqdingiz!' },
  };
})();
