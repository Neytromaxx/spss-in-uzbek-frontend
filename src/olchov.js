// src/olchov.js — o'lchov darajasi (measure): nomi, atamasi, misoli.
//
// ── NIMA UCHUN ALOHIDA FAYL ──
//
// Bu nomlar ilgari BESHTA joyda, uch xil yozilgan edi:
//
//   VariablesTab / ComputeModal / RecodeModal   Scale    Nominal   Ordinal
//   AnalysisPanel                               raqamli  nominal   tartibli
//   ImportPreview                               Raqamli  Matn      Tartibli
//
// Uchinchisi nomuvofiq emas, XATO ham edi: nominal shkala «matn»
// degani emas — u tartibsiz TOIFA. Matn ko'rinishida saqlangan
// shkala ham bo'ladi, raqam bilan kodlangan nominal ham.
//
// O'lchov darajasi bezak emas: `AnalysisPanel` metod ro'yxatini,
// `DataTab` esa katak muharririni aynan shunga qarab tanlaydi.
// Foydalanuvchi uni bir ekranda «Matn», ikkinchisida «Nominal» deb
// ko'rsa, ikki xil narsa deb o'ylaydi.
//
// ── 🔴 NIMA UCHUN «NOMINAL» EMAS, «GURUH KODI» ──
//
// `Nominal / Ordinal / Scale` — statistika o'rganmagan odam uchun
// ma'nosiz so'zlar. Foydalanuvchi ularning qaysi biri o'z
// ustuniga tegishli ekanini bilmaydi, ya'ni tur tanlash bosqichi
// devorga aylanadi va tahlilgacha yetib bormaydi.
//
// Shuning uchun har bir darajada uchta maydon:
//
//   nom     — oddiy tilda, interfeysda ko'rinadigan asosiy nom
//   texnik  — SPSS atamasi, qavsda; biladiganlar adashmasin
//   misol   — bitta qarashda tanib olish uchun
//
// 🔴 BU FAYL KELAJAKDAGI YORDAM MATNLARINING BIRINCHI YIG'ILISH
// NUQTASI. Komponentlarga yangi atama nomini qotirmang.

export const OLCHOV = {
  // Tartib MA'NOLI: kuchli shkaladan kuchsizga (SPSS'dagi kabi).
  scale: {
    nom: "O'lchov / ball",
    texnik: "Scale",
    misol: "yosh, test balli",
  },
  ordinal: {
    nom: "Tartib / baho",
    texnik: "Ordinal",
    misol: "1–5 javob",
  },
  nominal: {
    nom: "Guruh kodi",
    texnik: "Nominal",
    misol: "1 = erkak, 2 = ayol",
  },
};

// Tanlov ro'yxatlari uchun.
export const OLCHOVLAR = Object.entries(OLCHOV).map(([key, v]) => ({ key, ...v }));

/** Oddiy tildagi nom. Noma'lum daraja o'z kaliti bilan chiqadi —
 *  backend yangi daraja qo'shsa, ekranda bo'sh joy qolmasin. */
export function olchovNomi(m) {
  return OLCHOV[m]?.nom || m || "";
}

/** Tanlov maydonlari uchun: `Guruh kodi (Nominal)`.
 *
 * Texnik atama qavsda QOLADI: SPSS bilan ishlagan foydalanuvchi
 * «Guruh kodi» nimaligini taxmin qilib o'tirmasin, boshqalar esa
 * qavsdagini e'tiborsiz qoldirsin. */
export function olchovYorligi(m) {
  const o = OLCHOV[m];
  return o ? `${o.nom} (${o.texnik})` : olchovNomi(m);
}

/** Misol — tanlangan turning ostida kulrang matnda. */
export function olchovMisoli(m) {
  return OLCHOV[m]?.misol || "";
}
