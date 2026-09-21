// src/sozlamalar.js — foydalanuvchi sozlamalari (sof mantiq).
//
// Hozircha bitta sozlama: YANGI o'zgaruvchi nomining prefiksi.
//
// ── NIMA UCHUN PREFIKS SOZLANADI ──
//
// Ilgari u kodda `var_` deb qotib turardi — ingliz tilidagi
// yagona qoldiq, foydalanuvchi esa ekranda `var_1` ko'rardi va
// uni hisobotga ko'chirardi.
//
// 🔴 PREFIKSDA APOSTROF BO'LMAYDI.
//
// Nom filtr va Compute ifodalarida TOKEN bo'lib tahlil qilinadi
// (`expr/tokenizer.py`: `[harf|_][harf|raqam|_]*`). Oddiy apostrof
// (`'`) harf emas, ya'ni `o'zg_1 > 5` sharti «kutilmagan belgi»
// xatosini berardi. Tipografik `ʻ` (U+02BB) texnik jihatdan
// o'tadi, lekin klaviaturada oddiy `'` teriladi va nom topilmay
// qolardi — ya'ni xato faqat FILTR yozilganda, ustun yasalganidan
// ancha keyin chiqardi.
//
// Shuning uchun prefiks ASCII: `ozg`. Ko'rinadigan matnlar —
// sarlavhalar, yorliqlar, tugmalar — to'liq o'zbekcha.

import { zahiralanganmi } from "./nomlar";

export const SUKUT_PREFIKS = "ozg";
export const MAX_PREFIKS = 24;

const KALIT = "mtt.sozlamalar.nomPrefiksi";

// Backenddagi `_nom_boshimi` / `_nom_ichimi` bilan bir xil qoida,
// faqat ASCII bilan cheklangan (yuqoridagi izohga qarang).
const PREFIKS_QOLIPI = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Prefiks yaroqlimi? Yaroqsiz bo'lsa — sababi, yaroqli bo'lsa — `""`. */
export function prefiksXatosi(prefiks) {
  const p = String(prefiks ?? "").trim();
  if (!p) return "Prefiks bo'sh bo'lmasin.";
  if (p.length > MAX_PREFIKS) return `Prefiks ${MAX_PREFIKS} belgidan oshmasin.`;
  if (!PREFIKS_QOLIPI.test(p)) {
    return (
      "Faqat lotin harflari, raqam va pastki chiziq; birinchi belgi " +
      "raqam bo'lmasin. Apostrof (') ishlatib bo'lmaydi — nom filtr " +
      "shartlarida ishlamay qoladi."
    );
  }
  // `and_1` yaroqli, lekin `and` ning o'zi emas: prefiks raqamsiz
  // ham nom bo'lib qolishi mumkin emas, chunki biz doim `_N`
  // qo'shamiz. Shunday bo'lsa-da, zahiralangan so'zni prefiks
  // qilish chalkashtiradi.
  if (zahiralanganmi(p)) {
    return `«${p}» — zahiralangan so'z, prefiks sifatida ishlatilmaydi.`;
  }
  return "";
}

export function prefiksniOqi() {
  try {
    const p = localStorage.getItem(KALIT);
    return p && !prefiksXatosi(p) ? p : SUKUT_PREFIKS;
  } catch {
    // Shaxsiy rejimda `localStorage` istisno tashlashi mumkin.
    return SUKUT_PREFIKS;
  }
}

export function prefiksniYoz(prefiks) {
  try {
    localStorage.setItem(KALIT, prefiks);
  } catch {
    // Saqlanmasa ham joriy sessiyada ishlayveradi.
  }
}

/** Ro'yxatda BAND BO'LMAGAN birinchi nom.
 *
 * 🔴 `uzunlik + 1` YETMAYDI. Ikkita ustun qo'shib, birinchisini
 * o'chirib, yana qo'shsangiz `ozg_2` ikkinchi marta yasalardi va
 * backend uni rad etardi (yoki mavjudini bosib ketardi). Bu xato
 * `var_` davridan qolgan edi.
 */
export function yangiNom(mavjudNomlar, prefiks = SUKUT_PREFIKS) {
  const band = new Set((mavjudNomlar || []).map(n => String(n).toLowerCase()));
  let i = 1;
  while (band.has(`${prefiks}_${i}`.toLowerCase())) i += 1;
  return `${prefiks}_${i}`;
}
