// src/olchov.js — o'lchov darajasi (measure) nomlari.
//
// ── NIMA UCHUN ALOHIDA FAYL ──
//
// Bu nomlar ilgari UCHTA joyda, UCH XIL yozilgan edi:
//
//   VariablesTab / ComputeModal   Scale    Nominal   Ordinal
//   AnalysisPanel                 raqamli  nominal   tartibli
//   ImportPreview                 Raqamli  Matn      Tartibli
//
// Uchinchisi nomuvofiq emas, XATO ham edi: nominal shkala «matn»
// degani emas — u tartibsiz TOIFA. Matn ko'rinishida saqlangan
// shkala ham bo'ladi, raqam bilan kodlangan nominal ham.
//
// O'lchov darajasi bezak emas: `AnalysisPanel` metod ro'yxatini,
// `DataTab` esa katak muharririni aynan shunga qarab tanlaydi.
// Foydalanuvchi uni bir ekranda «Matn», ikkinchisida «Nominal» deb
// ko'rsa, ikki xil narsa deb o'ylaydi.

// `nominal` — o'zbek statistika adabiyotidagi shakl («nominal
// shkala»), shuning uchun tarjima qilinmadi. `scale` esa SPSS'da
// interval/nisbat shkalasini bildiradi — «Miqdoriy» aniqroq,
// chunki «Shkala» uchala darajaga ham tegishli so'z.
export const OLCHOV_NOMI = {
  scale: "Miqdoriy",
  ordinal: "Tartibli",
  nominal: "Nominal",
};

// Tanlov ro'yxatlari uchun — tartib MA'NOLI: kuchli shkaladan
// kuchsizga (SPSS'dagi kabi).
export const OLCHOVLAR = [
  { key: "scale", nomi: OLCHOV_NOMI.scale },
  { key: "ordinal", nomi: OLCHOV_NOMI.ordinal },
  { key: "nominal", nomi: OLCHOV_NOMI.nominal },
];

/** Ko'rsatish uchun nom. Noma'lum daraja o'z kaliti bilan chiqadi —
 *  backend yangi daraja qo'shsa, ekranda bo'sh joy qolmasin. */
export function olchovNomi(m) {
  return OLCHOV_NOMI[m] || m || "";
}
