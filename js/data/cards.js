/* Pul Oqimi — karta toʻplamlari. Barcha narxlar soʻmda, pul oqimi (cf) — oyiga.
   Narxlar 2025–2026-yillardagi bozor moʻljallariga yaqinlashtirilgan va oʻyin balansi uchun yaxlitlangan. */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});
  PO.DATA = PO.DATA || {};
  var M = 1000000; // mln soʻm

  /* ============ KICHIK BITIMLAR ============ */
  PO.DATA.small = [
    // —— Aksiyalar (narx har kartada har xil — bozor tebranishi) ——
    { id: 's_sqbn_low', t: 'stock', ticker: 'SQBN', price: 4, hint: 'Bank sektori vaqtincha modadan qoldi — narx tarixiy minimumga yaqin.' },
    { id: 's_sqbn_mid', t: 'stock', ticker: 'SQBN', price: 9, hint: 'Narx oʻrtacha darajada turibdi.' },
    { id: 's_sqbn_high', t: 'stock', ticker: 'SQBN', price: 16, hint: 'Bankning rekord foydasi eʼlon qilindi — narx koʻtarilgan. Sotish payti emasmi?' },
    { id: 's_hmkb_low', t: 'stock', ticker: 'HMKB', price: 12, hint: 'Bozorda vahima — yaxshi qogʻoz arzonlashdi.' },
    { id: 's_hmkb_mid', t: 'stock', ticker: 'HMKB', price: 25, hint: 'Odatdagi narx atrofida savdolanmoqda.' },
    { id: 's_hmkb_high', t: 'stock', ticker: 'HMKB', price: 48, hint: 'Xorijiy investor ulush olmoqchi degan mish-mish — narx uchib ketdi.' },
    { id: 's_kvts', t: 'stock', ticker: 'KVTS', price: 2400, hint: 'Eksport shartnomasi kechikdi — narx pastladi, dividend esa joyида.' },
    { id: 's_qzsm', t: 'stock', ticker: 'QZSM', price: 1900, hint: 'Mavsumiy sokinlik: qurilish qishda sekinlashadi. Bilganlar shunda oladi.' },
    { id: 's_uzmk', t: 'stock', ticker: 'UZMK', price: 6500, hint: 'Jahon metall narxlari tushdi — aksiya ham arzonladi.' },
    { id: 's_urts', t: 'stock', ticker: 'URTS', price: 12500, hint: 'Birja aksiyasi chegirmada — dividendi odatda yuqori boʻladi.' },

    // —— Omonat va obligatsiya ——
    {
      id: 's_omonat', t: 'omonat', nom: 'Bank omonati (yillik ~21%)', emoji: '🏦',
      lotPrice: 5 * M, lotCf: 87500,
      desc: 'Milliy valyutadagi muddatli omonat. Har 5 mln soʻm oyiga ~87 500 soʻm foiz keltiradi. Istalgan payt yechib olish mumkin.',
    },
    {
      id: 's_obligatsiya', t: 'omonat', nom: 'Davlat obligatsiyasi (yillik ~17%)', emoji: '📜',
      lotPrice: 5 * M, lotCf: 71000,
      desc: 'Moliya vazirligi obligatsiyalari — eng ishonchli qogʻoz. Har 5 mln soʻm oyiga ~71 000 soʻm keltiradi.',
    },

    // —— Koʻchmas mulk (kichik) ——
    {
      id: 's_chilonzor1', t: 're', nom: 'Chilonzorda 1 xonali kvartira', emoji: '🏢',
      full: 420 * M, mortgage: 378 * M, down: 42 * M, cf: 1700000, tags: ['kvartira', '1xona'],
      desc: 'Metro yaqinidagi eski, lekin pishiq uy. Ijarachi tayyor — pul oqimi darhol boshlanadi.',
    },
    {
      id: 's_sergeli1', t: 're', nom: 'Sergelida yangi 1 xonali («Yoshlar ipotekasi»)', emoji: '🏢',
      full: 360 * M, mortgage: 342 * M, down: 18 * M, cf: 900000, tags: ['kvartira', '1xona'],
      desc: 'Imtiyozli ipoteka dasturi: boshlangʻich toʻlov atigi 5%! Kredit katta — pul oqimi kamroq, lekin start juda arzon.',
    },
    {
      id: 's_yunusobod2', t: 're', nom: 'Yunusobodda 2 xonali kvartira', emoji: '🏢',
      full: 560 * M, mortgage: 504 * M, down: 56 * M, cf: 2100000, tags: ['kvartira', '2xona'],
      desc: 'Yaxshi remontli, oilaviy ijarachilar bilan. Barqaror daromad manbai.',
    },
    {
      id: 's_olmazor1', t: 're', nom: 'Olmazorda 1 xonali (taʼmirtalab)', emoji: '🔨',
      full: 330 * M, mortgage: 300 * M, down: 30 * M, cf: 1050000, tags: ['kvartira', '1xona'],
      desc: 'Taʼmiri eskirgan — shuning uchun arzon. Ijaraga baribir olishadi: talabalar shahri yaqin.',
    },
    {
      id: 's_qoqon2', t: 're', nom: 'Qoʻqonda 2 xonali kvartira', emoji: '🏘️',
      full: 230 * M, mortgage: 207 * M, down: 23 * M, cf: 1000000, tags: ['kvartira', '2xona'],
      desc: 'Viloyatda narxlar Toshkentdan ancha past, ijara esa unchalik farq qilmaydi — rentabellik zoʻr.',
    },
    {
      id: 's_andijon1', t: 're', nom: 'Andijonda 1 xonali («Yoshlar ipotekasi»)', emoji: '🏘️',
      full: 200 * M, mortgage: 190 * M, down: 10 * M, cf: 650000, tags: ['kvartira', '1xona'],
      desc: 'Imtiyozli dastur: boshlangʻich toʻlov 5%. Zich shaharda ijara talabi doim baland.',
    },
    {
      id: 's_samarqand_hovli', t: 're', nom: 'Samarqandda hovli (turistik mavze)', emoji: '🏡',
      full: 320 * M, mortgage: 272 * M, down: 48 * M, cf: 2000000, tags: ['hovli'],
      desc: 'Registonga 15 daqiqa. Mehmon uyi qilib turistlarga berilsa, daromadi kvartiradan baland.',
    },
    {
      id: 's_yakkasaroy_studiya', t: 're', nom: 'Yakkasaroyda studiya (kunlik ijara)', emoji: '🛋️',
      full: 350 * M, mortgage: 315 * M, down: 35 * M, cf: 1650000, tags: ['kvartira', '1xona'],
      desc: 'Markazga yaqin studiya — kunlik ijaraga qoʻyilsa oylikdan koʻproq chiqadi.',
    },
    {
      id: 's_dala_hovli', t: 're', nom: 'Toshkent viloyatida dala hovli', emoji: '🌳',
      full: 160 * M, mortgage: 128 * M, down: 32 * M, cf: 600000, tags: ['hovli'],
      desc: 'Yozda dam olishga ijaraga beriladi. Daromadi mavsumiy, lekin narxi oshib boradi.',
    },
    {
      id: 's_tomorqa', t: 'yer', nom: 'Sirdaryoda 6 sotix tomorqa yer', emoji: '🟫',
      cost: 48 * M, cf: 0, tags: ['yer'],
      desc: 'Hozircha boʻsh yer — daromad keltirmaydi. Lekin yangi yoʻl loyihasi tasdiqlansa, narxi ikki-uch barobar oshadi.',
    },

    // —— Kichik biznes ——
    {
      id: 's_somsa', t: 'biz', nom: 'Somsa tandiri (bozor yonida)', emoji: '🥟',
      cost: 16 * M, cf: 1450000, tags: ['kbiznes'],
      desc: 'Ishlab turgan nuqta, doimiy mijozlari bor. Usta oshpaz joyida qoladi — sizga sof foyda.',
    },
    {
      id: 's_aksessuar', t: 'biz', nom: 'Telefon aksessuarlari doʻkoni (50% ulush)', emoji: '📱',
      cost: 26 * M, cf: 1800000, tags: ['kbiznes'],
      desc: 'Savdo markazidagi kichik doʻkonning yarim ulushi. Sherigingiz oʻzi ishlaydi, foyda teng boʻlinadi.',
    },
    {
      id: 's_taksi_avto', t: 're', nom: 'Yengil avto — taksiga ijaraga', emoji: '🚕',
      full: 160 * M, mortgage: 120 * M, down: 40 * M, cf: 1850000, tags: ['kbiznes'],
      desc: 'Avtokreditga olingan mashina taksi haydovchisiga kunlik ijaraga beriladi. Kredit toʻlovidan ortgani — sizniki.',
    },
    {
      id: 's_onlayn_dokon', t: 'biz', nom: 'Onlayn-doʻkon (marketpleysda)', emoji: '🛒',
      cost: 14 * M, cf: 1050000, tags: ['kbiznes'],
      desc: 'Mahalliy marketpleysda ishlab turgan doʻkon: tovar zaxirasi va reytingi bilan birga sotiladi.',
    },
    {
      id: 's_terminal', t: 'biz', nom: 'Toʻlov terminallari (2 dona)', emoji: '🏧',
      cost: 9 * M, cf: 550000, tags: ['kbiznes'],
      desc: 'Gavjum joylarga oʻrnatilgan terminallar. Kichik, lekin barqaror komissiya daromadi.',
    },
    {
      id: 's_kiryuvish', t: 'biz', nom: 'Kir yuvish xizmati (uskunalar)', emoji: '🧺',
      cost: 19 * M, cf: 1100000, tags: ['kbiznes'],
      desc: 'Sanoat kir yuvish mashinalari mehmonxonalarga xizmat koʻrsatadi.',
    },
    {
      id: 's_asal', t: 'biz', nom: 'Asalarichilik (50 quti ari)', emoji: '🐝',
      cost: 22 * M, cf: 900000, tags: ['kbiznes'],
      desc: 'Togʻ etagidagi asalari qutilari. Asal va gul changi sotuvidan oʻrtacha oylik daromad.',
    },
    {
      id: 's_foto', t: 'biz', nom: 'Foto-video uskunalar (ijaraga berish)', emoji: '📸',
      cost: 12 * M, cf: 650000, tags: ['kbiznes'],
      desc: 'Kamera va yoritgichlar toʻplami toʻy-marosim operatorlariga ijaraga beriladi.',
    },
    {
      id: 's_skuter', t: 'biz', nom: 'Elektroskuterlar (2 ta, ijaraga)', emoji: '🛴',
      cost: 6 * M, cf: 450000, tags: ['kbiznes'],
      desc: 'Park yonида ikkita skuter soatbay ijaraga beriladi. Kichik start — barqaror choychaqa.',
    },
    {
      id: 's_popkorn', t: 'biz', nom: 'Popkorn aparati (kinoteatr oldida)', emoji: '🍿',
      cost: 3 * M, cf: 320000, tags: ['kbiznes'],
      desc: 'Eng kichik biznes — lekin u ham har oy pul olib keladi. Boshlash uchun ideal!',
    },
    {
      id: 's_instagram', nom: 'Instagram-doʻkon (tayyor sahifa)', t: 'biz', emoji: '🛍️',
      cost: 4500000, cf: 400000, tags: ['kbiznes'],
      desc: '40 ming obunachili tayyor onlayn-doʻkon sahifasi — yetkazib berish yoʻlga qoʻyilgan.',
    },
  ];

  /* ============ KATTA BITIMLAR ============ */
  PO.DATA.big = [
    {
      id: 'b_dom8', t: 're', nom: '8 xonadonli dom (Sergeli)', emoji: '🏬',
      full: 1600 * M, mortgage: 1440 * M, down: 160 * M, cf: 7500000, tags: ['dom'],
      desc: 'Butun boshli kichik dom: 8 ta kvartira, 8 ta ijarachi. Koʻchmas mulk portfelining "ogʻir artilleriyasi".',
    },
    {
      id: 'b_minimarket', t: 'biz', nom: 'Mini-market (mahallada)', emoji: '🏪',
      full: 520 * M, mortgage: 416 * M, down: 104 * M, cf: 6500000, tags: ['biznes'],
      desc: 'Mahallaning doimiy mijozli doʻkoni. Sotuvchilar va taʼminot yoʻlga qoʻyilgan.',
    },
    {
      id: 'b_choyxona', t: 'biz', nom: 'Choyxona (shahar markazida)', emoji: '🫖',
      full: 400 * M, mortgage: 320 * M, down: 80 * M, cf: 5400000, tags: ['biznes'],
      desc: 'Osh va shashlik doim oʻtadi! Jamoasi shakllangan, oshpazi mashhur.',
    },
    {
      id: 'b_avtoyuvish', t: 'biz', nom: 'Avtoyuvish (6 postli)', emoji: '🚿',
      full: 340 * M, mortgage: 272 * M, down: 68 * M, cf: 4500000, tags: ['biznes'],
      desc: 'Katta yoʻl boʻyidagi avtoyuvish shoxobchasi — mashina koʻpaygan sari mijoz ham koʻpayadi.',
    },
    {
      id: 'b_nonvoyxona', t: 'biz', nom: 'Nonvoyxona (3 tandirli)', emoji: '🍞',
      full: 300 * M, mortgage: 240 * M, down: 60 * M, cf: 4300000, tags: ['biznes'],
      desc: 'Issiq non hech qachon sotilmay qolmaydi. Uchta tandir, oʻn nafar usta.',
    },
    {
      id: 'b_issiqxona', t: 'biz', nom: 'Issiqxona (1 gektar)', emoji: '🍅',
      full: 460 * M, mortgage: 368 * M, down: 92 * M, cf: 6300000, tags: ['biznes'],
      desc: 'Zamonaviy issiqxona: pomidor va bodring qishda ham eksportga ketadi.',
    },
    {
      id: 'b_mehmonuyi', t: 'biz', nom: 'Mehmon uyi (Buxoro eski shahri)', emoji: '🏨',
      full: 700 * M, mortgage: 560 * M, down: 140 * M, cf: 7900000, tags: ['biznes'],
      desc: 'Labi Hovuz yaqinidagi 10 xonali mehmon uyi. Turizm oqimi yildan-yilga oshmoqda.',
    },
    {
      id: 'b_bolalar_markazi', t: 'biz', nom: 'Bolalar oʻyin markazi', emoji: '🎠',
      full: 380 * M, mortgage: 304 * M, down: 76 * M, cf: 4900000, tags: ['biznes'],
      desc: 'Savdo markazi ichidagi attraksionlar maydonchasi. Dam olish kunlari navbat boʻladi.',
    },
    {
      id: 'b_salon', t: 'biz', nom: 'Goʻzallik saloni', emoji: '💇',
      full: 260 * M, mortgage: 208 * M, down: 52 * M, cf: 3400000, tags: ['biznes'],
      desc: 'Obod mavzedagi salon: ustalar ijarada oʻtiradi, siz esa foizini olasiz.',
    },
    {
      id: 'b_stomatologiya', t: 'biz', nom: 'Stomatologiya klinikasi (ulush)', emoji: '🦷',
      full: 500 * M, mortgage: 400 * M, down: 100 * M, cf: 6600000, tags: ['biznes'],
      desc: 'Ishlab turgan xususiy klinikaning 40% ulushi. Tibbiyot — inqirozni bilmaydigan soha.',
    },
    {
      id: 'b_fura', t: 'biz', nom: 'Fura (xalqaro logistika)', emoji: '🚛',
      full: 820 * M, mortgage: 656 * M, down: 164 * M, cf: 9800000, tags: ['biznes'],
      desc: 'Yevropa–Osiyo yoʻnalishida qatnaydigan yuk mashinasi. Haydovchi va buyurtmalar tayyor.',
    },
    {
      id: 'b_quyosh', t: 'biz', nom: 'Quyosh panellari (200 kVt)', emoji: '☀️',
      full: 620 * M, mortgage: 496 * M, down: 124 * M, cf: 6800000, tags: ['biznes'],
      desc: 'Zavod tomiga oʻrnatilgan stansiya — elektr energiyasi "yashil tarif" boʻyicha sotiladi.',
    },
    {
      id: 'b_taksopark', t: 'biz', nom: 'Taksopark (10 ta avto)', emoji: '🚖',
      full: 900 * M, mortgage: 720 * M, down: 180 * M, cf: 10300000, tags: ['biznes'],
      desc: 'Oʻnta mashina onlayn-taksida ishlaydi. Dispetcher va mexanik shtatda.',
    },
    {
      id: 'b_ofis', t: 're', nom: 'Ofis qavati (IT Park yonida)', emoji: '🏢',
      full: 1200 * M, mortgage: 960 * M, down: 240 * M, cf: 11900000, tags: ['dom'],
      desc: 'IT kompaniyalarga ijaraga berilgan butun qavat. Uzoq muddatli shartnomalar bilan.',
    },
    {
      id: 'b_sovuqxona', t: 'biz', nom: 'Sovuqxona ombori (meva eksporti)', emoji: '🧊',
      full: 560 * M, mortgage: 448 * M, down: 112 * M, cf: 6400000, tags: ['biznes'],
      desc: 'Fermerlar hosilini saqlaydigan zamonaviy ombor. Mavsumda narx ikki baravar.',
    },
    {
      id: 'b_toyxona', t: 'biz', nom: 'Toʻyxona (400 oʻrinli)', emoji: '🎊',
      full: 1000 * M, mortgage: 800 * M, down: 200 * M, cf: 11000000, tags: ['biznes'],
      desc: 'Oʻzbekistonda toʻy hech qachon toʻxtamaydi. Grafik ikki oy oldinga band!',
    },
    {
      id: 'b_qurilish_texnika', t: 'biz', nom: 'Qurilish texnikasi parki (ijaraga)', emoji: '🚜',
      full: 750 * M, mortgage: 600 * M, down: 150 * M, cf: 8600000, tags: ['biznes'],
      desc: 'Ekskavator, kran va betonqorgichlar quruvchilarga soatbay ijaraga beriladi.',
    },
    {
      id: 'b_shvey', t: 'biz', nom: 'Tikuvchilik sexi (20 mashina)', emoji: '🧵',
      full: 350 * M, mortgage: 280 * M, down: 70 * M, cf: 4600000, tags: ['biznes'],
      desc: 'Trikotaj buyumlar tikib eksportga joʻnatadigan kichik sex. Buyurtmalar bir yilga yetadi.',
    },
  ];

  /* ============ BOZOR ============ */
  PO.DATA.market = [
    {
      id: 'm_metro1', t: 'offerRE', tag: '1xona', price: 500 * M, emoji: '🚇',
      nom: 'Yangi metro bekati ochildi!',
      desc: 'Atrofdagi uylar qimmatlashdi. Xaridor har bir 1 xonali kvartirani 500 mln soʻmga olishga tayyor.',
    },
    {
      id: 'm_1xona_talab', t: 'offerRE', tag: '1xona', price: 560 * M, emoji: '📈',
      nom: '1 xonalilarga talab portladi',
      desc: 'Yosh oilalar kredit dasturi ishga tushdi. Xaridor 1 xonali kvartirangizni 560 mln soʻmga soʻramoqda.',
    },
    {
      id: 'm_2xona', t: 'offerRE', tag: '2xona', price: 700 * M, emoji: '🏢',
      nom: '2 xonalilar bozori qizidi',
      desc: 'Xaridor har bir 2 xonali kvartira uchun 700 mln soʻm taklif qilmoqda.',
    },
    {
      id: 'm_hovli_turizm', t: 'offerRE', tag: 'hovli', price: 480 * M, emoji: '🧳',
      nom: 'Turizm bumi!',
      desc: 'Mehmonxona tarmogʻi hovlilarni butik-hotel qilish uchun izlamoqda: har bir hovliga 480 mln soʻm.',
    },
    {
      id: 'm_yer_yol', t: 'offerRE', tag: 'yer', price: 130 * M, emoji: '🛣️',
      nom: 'Yangi avtomagistral loyihasi tasdiqlandi',
      desc: 'Yoʻl aynan siz bilgan hududdan oʻtadi. Quruvchilar yer uchastkangizga 130 mln soʻm bermoqda.',
    },
    {
      id: 'm_yer_kichik', t: 'offerRE', tag: 'yer', price: 95 * M, emoji: '🏗️',
      nom: 'Qoʻshni uchastkaga zavod qurilyapti',
      desc: 'Ishchilar shaharchasi uchun yer kerak: uchastkangizga 95 mln soʻm taklif.',
    },
    {
      id: 'm_dom', t: 'offerRE', tag: 'dom', price: 2100 * M, emoji: '🏦',
      nom: 'Investitsiya fondi dom qidirmoqda',
      desc: 'Pensiya fondi ijara biznesiga kirmoqda: har bir domga 2,1 mlrd soʻm taklif qilinadi.',
    },
    {
      id: 'm_franshiza', t: 'offerBiz', tag: 'kbiznes', mult: 1.6, emoji: '🤝',
      nom: 'Franshiza tarmogʻi kengaymoqda',
      desc: 'Yirik tarmoq kichik bizneslarni sotib olmoqda: har bir kichik biznes uchun bahosining 160% ini toʻlaydi.',
    },
    {
      id: 'm_fond', t: 'offerBiz', tag: 'biznes', mult: 1.5, emoji: '💼',
      nom: 'Xususiy investitsiya fondi keldi',
      desc: 'Fond ishlab turgan bizneslarni toʻliq narxining 150% iga sotib olmoqda. Katta chiqish imkoniyati!',
    },
    {
      id: 'm_fond_past', t: 'offerBiz', tag: 'biznes', mult: 1.2, emoji: '📉',
      nom: 'Biznes broker taklifi',
      desc: 'Broker bizneslarni tez sotib oladi, lekin atigi 120% narxda. Shoshilish kerakmi — oʻzingiz hal qiling.',
    },
    { id: 'm_sqbn', t: 'stockPrice', ticker: 'SQBN', price: 18, emoji: '🚀', nom: 'SQBN aksiyalari koʻtarildi', desc: 'Bank xususiylashtirish roʻyxatiga kiritildi — aksiya 18 soʻmga koʻtarildi. Sotish yoki olish mumkin.' },
    { id: 'm_hmkb', t: 'stockPrice', ticker: 'HMKB', price: 52, emoji: '🚀', nom: 'HMKB rekord narxda', desc: 'Hamkorbank dividendlarini ikki baravar oshirdi — narx 52 soʻmga chiqdi.' },
    { id: 'm_qzsm', t: 'stockPrice', ticker: 'QZSM', price: 5900, emoji: '🏗️', nom: 'Qurilish bumi — sement tanqis!', desc: 'Qizilqumsement aksiyasi 5 900 soʻmga koʻtarildi. Sotish yoki olish mumkin.' },
    { id: 'm_uzmk', t: 'stockPrice', ticker: 'UZMK', price: 17000, emoji: '⚙️', nom: 'Metall narxlari oshdi', desc: 'Oʻzmetkombinat aksiyasi 17 000 soʻmga yetdi.' },
    {
      id: 'm_rent_up', t: 'rentUp', tag: 'kvartira', delta: 300000, emoji: '📈',
      nom: 'Ijara narxlari oshdi',
      desc: 'Shaharga ishchi kuchi oqimi kuchaydi. Barcha kvartiralaringiz ijarasi oyiga +300 000 soʻmga oshadi.',
    },
    {
      id: 'm_rent_down', t: 'rentDown', tag: 'kvartira', delta: -250000, emoji: '📉',
      nom: 'Yangi massivlar topshirildi',
      desc: 'Bozorda taklif koʻpaydi — barcha kvartiralaringiz ijarasi oyiga 250 000 soʻmga kamayadi.',
    },
    {
      id: 'm_kbiznes_xaridor', t: 'offerBiz', tag: 'kbiznes', mult: 1.3, emoji: '🛍️',
      nom: 'Yosh tadbirkorlar biznes izlamoqda',
      desc: 'Tayyor kichik biznesga xaridorlar bor: bahosining 130% iga sotishingiz mumkin.',
    },
  ];

  /* ============ XARAJATLAR (dooodad) ============
     pct — oylik maoshga nisbatan ulush: turmush darajasi daromadga qarab oʻsadi
     ("lifestyle inflation" saboqlari). perKid — har bir farzand uchun alohida. */
  PO.DATA.doodad = [
    { id: 'd_toyona', nom: 'Qarindoshning toʻyi — toʻyona', emoji: '💌', pct: 0.15, desc: 'Amakivachchangiz uylanyapti. Toʻyona va sarpo-suruq — bormaslikning iloji yoʻq!' },
    { id: 'd_osh', nom: 'Osh berish (mahalla)', emoji: '🍚', pct: 0.45, desc: 'Navbat sizga keldi: ertalabki oshga qozon osildi. Mahalla — mahalla-da.' },
    { id: 'd_beshik', nom: 'Beshik toʻy', emoji: '👶', pct: 0.25, perKid: true, desc: 'Chaqaloqqa beshik toʻy qilyapsiz. Farzandingiz boʻlmasa — bu xarajatdan qutuldingiz!' },
    { id: 'd_telefon', nom: 'Yangi smartfon', emoji: '📱', pct: 0.35, desc: 'Doʻstlaringizda bor — sizda yoʻq. Nafs qoʻymadi, oldingiz.' },
    { id: 'd_tv', nom: 'Katta televizor', emoji: '📺', pct: 0.25, desc: 'Chegirma!!! degan yozuvni koʻrib qololmadingiz.' },
    { id: 'd_muzlatgich', nom: 'Muzlatgich buzildi', emoji: '🧊', pct: 0.2, desc: 'Eskisini tuzatib boʻlmaydi — yangisini olishga toʻgʻri keladi.' },
    { id: 'd_avto_remont', nom: 'Mashina taʼmiri', emoji: '🔧', pct: 0.18, desc: 'Motor chiroq yondi. Usta: "Hammasini almashtiramiz, aka" dedi.' },
    { id: 'd_mehmon', nom: 'Mehmon kutish', emoji: '🍽️', pct: 0.08, desc: 'Uzoqdan qarindoshlar keldi — dasturxon toʻkin boʻlishi shart.' },
    { id: 'd_maktab', nom: 'Maktab bozori (1-sentabr)', emoji: '🎒', pct: 0.12, perKid: true, desc: 'Har bir farzandga forma, daftar-kitob, poyabzal… Sentabr — ota-onalar "bayrami".' },
    { id: 'd_navroz', nom: 'Navroʻz dasturxoni', emoji: '🌱', pct: 0.06, desc: 'Sumalak, koʻk somsa, yangi kiyim — bayram barcha xarajati bilan keldi.' },
    { id: 'd_qish', nom: 'Qishki kiyimlar', emoji: '🧥', pct: 0.12, desc: 'Qish keldi — palto va etik yangilanadi.' },
    { id: 'd_tugilgan_kun', nom: 'Tugʻilgan kun (restoranda)', emoji: '🎂', pct: 0.14, desc: 'Yubiley baribir bir marta boʻladi deb restoranda nishonladingiz.' },
    { id: 'd_chorvoq', nom: 'Chorvoqda dam olish', emoji: '🏔️', pct: 0.18, desc: 'Issiq yozda oila bilan togʻ havosi — arzon emas, lekin arziydi.' },
    { id: 'd_issiqkol', nom: 'Issiqkoʻl safari', emoji: '🏖️', pct: 0.28, desc: 'Qoʻshnilar borgan — biz nima, kam joyimiz bormi?' },
    { id: 'd_divan', nom: 'Yangi mebel', emoji: '🛋️', pct: 0.15, desc: 'Mehmonxonaga yangi divan olmasak boʻlmaydi, dedi turmush oʻrtogʻingiz.' },
    { id: 'd_konditsioner', nom: 'Konditsioner', emoji: '❄️', pct: 0.22, desc: 'Iyulda +42° boʻldi. Bu endi hashamat emas — zarurat.' },
    { id: 'd_sovga', nom: 'Bayram sovgʻalari', emoji: '🎁', pct: 0.09, desc: 'Yaqinlaringizga sovgʻa-salom. Koʻngil — koʻngildan suv ichadi.' },
    { id: 'd_ekran', nom: 'Telefon ekrani sindi', emoji: '📵', pct: 0.08, desc: 'Bir soniya — va ekran oʻrgimchak toʻriga aylandi.' },
    { id: 'd_tish', nom: 'Tish davolash', emoji: '🦷', pct: 0.15, desc: 'Kechiktirgan sari qimmatlashib boraverardi — endi rosa toʻlaysiz.' },
    { id: 'd_fitnes', nom: 'Fitnes (yillik obuna)', emoji: '🏋️', pct: 0.12, desc: 'Yanvardan boshlayman!.. Obuna olindi, borish esa — koʻrib boʻlar.' },
    { id: 'd_dubay', nom: 'Dubayga taʼtil', emoji: '✈️', pct: 0.4, desc: 'Instagramdagi rasmlar uchun eng qimmat fon. Yarim yillik jamgʻarma — bir haftada.' },
    { id: 'd_sarpo', nom: 'Qudalarga sarpo', emoji: '🎀', pct: 0.25, desc: 'Quda tomon "odat shunaqa" dedi. Sandiq toʻla sarpo joʻnatildi.' },
  ];

  /* ============ TEZKOR YOʻL BITIMLARI ============ */
  PO.DATA.fast = [
    { id: 'f_restoran', nom: 'Restoranlar tarmogʻi (5 ta)', emoji: '🍽️', cost: 2500 * M, cf: 120 * M, desc: 'Toshkentning gavjum nuqtalaridagi beshta milliy restoran.' },
    { id: 'f_klaster', nom: 'Paxta-toʻqimachilik klasteri (ulush)', emoji: '🧶', cost: 4000 * M, cf: 200 * M, desc: 'Paxtadan tayyor mahsulotgacha — eksportga ishlaydigan toʻliq zanjir.' },
    { id: 'f_logistika', nom: 'Logistika kompaniyasi (20 fura)', emoji: '🚛', cost: 3000 * M, cf: 150 * M, desc: 'Xitoy–Yevropa tranzit yoʻlagidagi ishonchli tashuvchi.' },
    { id: 'f_mehmonxona', nom: 'Mehmonxona (Samarqand, 60 xona)', emoji: '🏨', cost: 5000 * M, cf: 250 * M, desc: 'Registon yaqinidagi toʻrt yulduzli mehmonxona. Bandlik — 85%.' },
    { id: 'f_it', nom: 'IT-autsorsing kompaniyasi', emoji: '💻', cost: 2000 * M, cf: 110 * M, desc: 'Yuzta dasturchi xorijiy buyurtmalar bilan ishlaydi. Valyutadagi daromad.' },
    { id: 'f_sement', nom: 'Sement zavodi (ulush)', emoji: '🏭', cost: 6000 * M, cf: 300 * M, desc: 'Qurilish materiallari bozorining eng yirik oʻyinchilaridan birida ulush.' },
    { id: 'f_qurilish', nom: 'Turar-joy majmuasi qurilishi', emoji: '🏗️', cost: 4500 * M, cf: 220 * M, desc: 'Yangi massivda 300 kvartiralik majmua quryapsiz — sotuvlar allaqachon boshlangan.' },
    { id: 'f_eksport', nom: 'Meva-sabzavot eksporti (konsorsium)', emoji: '🍇', cost: 3500 * M, cf: 170 * M, desc: 'Oʻzbek gilosi va uzumi butun mintaqaga shu kanal orqali ketadi.' },
    { id: 'f_klinika', nom: 'Xususiy klinika', emoji: '🏥', cost: 2800 * M, cf: 140 * M, desc: 'Zamonaviy diagnostika markazi — navbatlar bir hafta oldinga yozilgan.' },
    { id: 'f_universitet', nom: 'Xususiy universitet (franshiza)', emoji: '🎓', cost: 3200 * M, cf: 150 * M, desc: 'Xalqaro universitetning Toshkent kampusi. Taʼlim — kelajak sanoati.' },
    { id: 'f_quyosh', nom: 'Quyosh elektr stansiyasi (10 MVt)', emoji: '☀️', cost: 7000 * M, cf: 350 * M, desc: 'Qizilqumdagi quyosh maydoni davlatga 25 yillik shartnoma bilan energiya sotadi.' },
    { id: 'f_savdo_markaz', nom: 'Savdo markazi (Toshkent)', emoji: '🏬', cost: 8000 * M, cf: 400 * M, desc: 'Uch qavatli savdo markazi — yuzlab ijarachi, ming­lab xaridor.' },
    { id: 'f_shokolad', nom: 'Shokolad fabrikasi', emoji: '🍫', cost: 2200 * M, cf: 100 * M, desc: 'Mahalliy brend qoʻshni davlatlar doʻkonlariga chiqdi.' },
    { id: 'f_franshiza', nom: 'Milliy taomlar franshizasi (eksport)', emoji: '🥘', cost: 2600 * M, cf: 130 * M, desc: 'Osh va somsa brendi endi Dubay va Istanbulda ochilmoqda.' },
  ];

  /* ============ ORZULAR ============ */
  PO.DATA.dreams = [
    { id: 'dr_sayohat', nom: 'Jahon boʻylab oilaviy sayohat', emoji: '🌍', cost: 1500 * M, desc: 'Bir yil davomida oila bilan dunyoning 30 davlatini koʻrish.' },
    { id: 'dr_qasr', nom: 'Toshkent tepaliklarida qasr-hovli', emoji: '🏰', cost: 4000 * M, desc: 'Bogʻi, basseyni va choyxonasi bor orzudagi hovli.' },
    { id: 'dr_jamgarma', nom: 'Xususiy xayriya jamgʻarmasi', emoji: '🤲', cost: 2000 * M, desc: 'Yetim bolalar taʼlimini umrbod qoʻllab-quvvatlaydigan fond ochish.' },
    { id: 'dr_otaona', nom: 'Ota-onaga yangi uy', emoji: '🏡', cost: 1800 * M, desc: 'Ota-onangizga kalitini qoʻlga tutqazib: "Bu — sizniki" deyish.' },
    { id: 'dr_akademiya', nom: 'Futbol akademiyasi ochish', emoji: '⚽', cost: 3000 * M, desc: 'Mahalladagi bolalar uchun zamonaviy futbol akademiyasi.' },
    { id: 'dr_chorvoq', nom: 'Chorvoq boʻyida dam olish maskani', emoji: '🏞️', cost: 3500 * M, desc: 'Togʻ va suv boʻyidagi shaxsiy dam olish majmuasi.' },
    { id: 'dr_superkar', nom: 'Superkar kolleksiyasi', emoji: '🏎️', cost: 2500 * M, desc: 'Bolalikdagi plakatlardagi mashinalar endi garajingizda.' },
    { id: 'dr_maktab', nom: 'Oʻz nomingizdagi zamonaviy maktab', emoji: '🏫', cost: 2800 * M, desc: 'Kelajak avlodga eng katta meros — bilim maskani qurish.' },
  ];
})();
