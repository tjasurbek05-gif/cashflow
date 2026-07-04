/* Pul Oqimi — moliyaviy savodxonlik maslahatlari (oʻyin davomida koʻrsatiladi) */
(function () {
  'use strict';
  var PO = (globalThis.PO = globalThis.PO || {});
  PO.DATA = PO.DATA || {};

  PO.DATA.tips = [
    'Aktiv — choʻntagingizga pul OLIB KELADIGAN narsa. Passiv — choʻntagingizdan pul OLIB KETADIGAN narsa.',
    'Boylar avval aktiv sotib oladi. Kambagʻallar va oʻrta sinf esa avval xarajat qiladi.',
    '«Avval oʻzingizga toʻlang»: har oy daromadning kamida 10 foizini jamgʻaring — qolganiga yashang.',
    'Pul oqimi formulasi: (Maosh + Passiv daromad) − Xarajatlar. U musbat boʻlsa — boyiyapsiz.',
    'Sichqonlar poygasidan chiqish sharti: passiv daromad xarajatlardan OSHSIN. Maosh emas — passiv daromad!',
    'Murakkab foiz — dunyoning sakkizinchi moʻjizasi: foiz foizga foiz qoʻshib boradi. Erta boshlagan yutadi.',
    'Oʻzbekistonda bank omonatlari kafolatlangan — lekin inflyatsiyani ham unutmang: foiz undan yuqori boʻlsin.',
    'Diversifikatsiya: hamma tuxumni bitta savatga solmang — koʻchmas mulk, aksiya, omonat, biznes.',
    '«Tez boyitaman» degan har qanday taklif — katta ehtimol piramida. Halol daromad vaqt talab qiladi.',
    'Qarz ikki xil boʻladi: yaxshi qarz aktiv sotib oladi (u oʻzini oʻzi toʻlaydi), yomon qarz — xarajatlarni.',
    'Toʻy va marosimlarga qarz olib dabdaba qilish — moliyaviy jarlikka eng qisqa yoʻl. Imkon darajasida qiling.',
    'Aksiya sotib olsangiz — kompaniyaning bir boʻlagiga egalik qilasiz. Dividend — shu ulushingizning daromadi.',
    'Arzonga olib qimmatga sotish uchun bozor tushganda qoʻrqmang — aynan oʻsha payt imkoniyat boʻladi.',
    'Ijaraga berilgan kvartira — klassik aktiv: u har oy pul olib keladi va qiymati ham oshib boradi.',
    'Xarajat daftarini yuriting: pul qayerga ketayotganini bilmagan odam uni boshqara olmaydi.',
    'Favqulodda jamgʻarma: kamida 3–6 oylik xarajatingizcha pulni alohida saqlang — kredit kartaga suyanmang.',
    'Moliyaviy erkinlik — bu ishlamaslik emas. Bu ISHLAMASANGIZ ham daromad kelib turishi.',
    'Har bir katta boylik kichik bir qarordan boshlangan: bugun bitta aktiv — ertaga imperiya.',
    'Pulni yotqizib qoʻymang: inflyatsiya uni sekin "yeb qoʻyadi". Ishlating — aktivga aylantiring.',
    'Sugʻurta va hujjatlarni mensimaslik bitta kunda yillik jamgʻarmani yoʻq qilishi mumkin.',
  ];

  // Oʻyin lugʻati — "Qoidalar" oynasida koʻrsatiladi
  PO.DATA.glossary = [
    ['Aktiv', 'Sizga muntazam daromad keltiradigan mulk: ijaradagi kvartira, biznes ulushi, aksiya, omonat.'],
    ['Passiv (majburiyat)', 'Sizdan muntazam pul olib ketadigan narsa: kredit, ipoteka, nasiya toʻlovlari.'],
    ['Passiv daromad', 'Siz ishlamasangiz ham kelib turadigan daromad — aktivlaringiz "maoshi".'],
    ['Pul oqimi (Cashflow)', 'Oylik daromad (maosh + passiv daromad) minus barcha xarajatlar.'],
    ['Sichqonlar poygasi', 'Maosh → xarajat → yana maosh… degan aylanma. Undan faqat passiv daromad chiqaradi.'],
    ['Tezkor yoʻl', 'Passiv daromadi xarajatidan oshgan oʻyinchilar oʻtadigan katta doira — yirik bitimlar dunyosi.'],
    ['Dividend', 'Kompaniya foydasidan aksiyadorlarga toʻlanadigan ulush.'],
    ['Ipoteka', 'Koʻchmas mulk garovi ostidagi uzoq muddatli kredit.'],
    ['Diversifikatsiya', 'Mablagʻni har xil turdagi aktivlarga taqsimlash — xavfni kamaytirish usuli.'],
  ];
})();
