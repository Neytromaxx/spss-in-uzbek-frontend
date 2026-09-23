// src/qadamlar.js — foydalanuvchi qaysi qadamda turibdi?
//
// ── NIMA UCHUN KERAK ──
//
// To'rtta ish (ma'lumot, o'zgaruvchilar, tahlil, natija) teng
// ko'rinardi: ular orasida tartib ham, holat ham yo'q edi.
// Birinchi marta kirgan odam O'zgaruvchilar yorlig'ini
// o'tkazib yuborib to'g'ridan-to'g'ri Tahlilga o'tardi — va
// 09-vazifadagi «bu ustun ro'yxatda yo'q» izohlariga urilardi.
//
// ── 🔴 TO'RT QADAM, UCH YORLIQ ──
//
// «Tahlil» va «Natija» bitta yorliqda (`results`): birinchisi —
// metod tanlash paneli, ikkinchisi — natijalar ro'yxati. Ular
// alohida qadam sifatida ko'rsatiladi, chunki foydalanuvchi
// uchun bu ikki xil ish: «nimani hisoblayman?» va «nima chiqdi?».
//
// ── SOF MODUL ──
//
// Holatlar Vue'dan emas, oddiy ma'lumotdan hisoblanadi — shuning
// uchun alohida sinaladi.

export const TAYYOR = "tayyor";
export const ETIBOR = "etibor";
export const HALI_EMAS = "hali_emas";

export const BELGILAR = {
  [TAYYOR]: "✓",
  [ETIBOR]: "⚠",
  [HALI_EMAS]: "○",
};

export const QADAMLAR = [
  { key: "data", raqam: 1, nom: "Ma'lumot", tab: "data" },
  { key: "variables", raqam: 2, nom: "O‘zgaruvchilar", tab: "variables" },
  { key: "analysis", raqam: 3, nom: "Tahlil", tab: "results" },
  { key: "results", raqam: 4, nom: "Natija", tab: "results" },
];

function dataHolati(rows) {
  return (rows?.length || 0) > 0 ? TAYYOR : HALI_EMAS;
}

function variablesHolati(variables, muammolar) {
  // Brifda «O'zgaruvchilar» uchun «hali emas» ustuni bo'sh, lekin
  // o'zgaruvchisi YO'Q fayl «tayyor» bo'la olmaydi: muammolar
  // ro'yxati bo'sh bo'lgani uchun u yolg'ondan ✓ ko'rsatardi.
  if (!(variables?.length || 0)) return HALI_EMAS;
  return (muammolar?.length || 0) > 0 ? ETIBOR : TAYYOR;
}

function analysisHolati(natijalar) {
  return (natijalar?.length || 0) > 0 ? TAYYOR : HALI_EMAS;
}

function resultsHolati(natijalar) {
  if (!(natijalar?.length || 0)) return HALI_EMAS;
  // Eskirgan natija — 08-vazifadagi `stale` bayrog'i: u boshqa
  // tanlamadan chiqqan va hujjatga tushsa raqamlar mos kelmaydi.
  return natijalar.some(n => n?.stale) ? ETIBOR : TAYYOR;
}

/** Har bir qadamning holati.
 *
 * Kirish — ilovaning xom holati: qatorlar, o'zgaruvchilar,
 * tayyorlik muammolari (`tayyorlik.tekshir`) va natijalar
 * ro'yxati (08-vazifa).
 */
export function qadamHolatlari({ rows, variables, muammolar, natijalar } = {}) {
  const holatlar = {
    data: dataHolati(rows),
    variables: variablesHolati(variables, muammolar),
    analysis: analysisHolati(natijalar),
    results: resultsHolati(natijalar),
  };
  return QADAMLAR.map(q => ({ ...q, holat: holatlar[q.key] }));
}

/** Joriy yorliqdagi «keyingi qadam» tugmasi.
 *
 * `null` — tugma yo'q. Tahlil yorlig'ida u ataylab yo'q: natija
 * chiqqach ro'yxat o'zi to'ldiriladi (08-vazifa), ya'ni
 * bosadigan joy qolmaydi.
 */
export function keyingiQadam(activeTab) {
  if (activeTab === "data") {
    return { tab: "variables", matn: "Keyingi: o‘zgaruvchilarni tekshirish →" };
  }
  if (activeTab === "variables") {
    return { tab: "results", matn: "Keyingi: tahlil tanlash →" };
  }
  return null;
}

/** «2 ta muammo bor — baribir davom etish» izohi.
 *
 * 🔴 TAYYORLIK TEKSHIRUVI HECH NARSANI TO'SMAYDI. Tugma baribir
 * ishlaydi; bu matn faqat nima o'tkazib yuborilayotganini
 * aytadi.
 */
export function davomIzohi(muammolar) {
  const n = muammolar?.length || 0;
  return n ? `${n} ta muammo bor — baribir davom etish` : "";
}
