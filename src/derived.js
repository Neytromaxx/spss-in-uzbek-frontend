// src/derived.js — hosila ustunlar haqidagi yagona o'quvchi.
//
// Ikki xil hosila bor va ular sxemada bitta maydonda yashaydi:
//
//   { kind: "compute", expression: "SUM(b1 TO b20)" }
//   { kind: "recode",  source: "yosh", rules: [...] }
//
// 🔴 `kind` ESKI USTUNLARDA YO'Q. 04-vazifada yozilgan ustunlarda bu
// maydon umuman yozilmagan va backend uni "compute" deb o'qiydi
// (`DerivedInfo` izohiga qarang). Frontend ham AYNAN shunday o'qishi
// kerak, aks holda eski ustun jadvalda «noma'lum» bo'lib chiqardi.
//
// Nima uchun alohida fayl: bir xil matnni `VariablesTab` ham,
// `DataTab` ham ko'rsatadi. Ikki nusxa yozilsa, biri `kind` ni
// hisobga olib, ikkinchisi olmay qolardi — bu allaqachon bir marta
// sodir bo'lgan edi (`'Ifoda: ' + v.derived.expression` qayta
// kodlangan ustunda «Ifoda: undefined» berardi).

export const COMPUTE = "compute";
export const RECODE = "recode";

/** Ustun hosilami (ikkala turdan biri). */
export function hosilami(v) {
  return !!v?.derived;
}

/** Hosila turi; `kind` bo'lmasa — eski ustun, ya'ni "compute". */
export function hosilaTuri(v) {
  if (!v?.derived) return null;
  return v.derived.kind || COMPUTE;
}

/**
 * Jadval sarlavhasidagi belgi.
 *
 * `ƒ` — hisoblangan (ifoda), `⇄` — qayta kodlangan (xarita).
 * Ikkalasi bitta belgi bo'lsa, foydalanuvchi ustunni ochmasdan
 * qaysi turdaligini bilolmasdi.
 */
export function hosilaBelgisi(v) {
  const tur = hosilaTuri(v);
  if (tur === RECODE) return "⇄";
  if (tur === COMPUTE) return "ƒ";
  return "";
}

/** Belgining tepasida chiqadigan izoh (`title`). */
export function hosilaIzohi(v) {
  const tur = hosilaTuri(v);
  if (tur === RECODE) {
    const manba = v.derived.source || "?";
    const soni = (v.derived.rules || []).length;
    return `Qayta kodlangan: ${manba} (${soni} ta qoida)`;
  }
  if (tur === COMPUTE) {
    // Eski ustunda `expression` doim bor; yangi `DerivedInfo` uni
    // `kind="compute"` uchun majburiy qiladi. Baribir himoya qo'yamiz:
    // buzuq sxema butun jadvalni «undefined» bilan to'ldirmasin.
    return `Ifoda: ${v.derived.expression || "(noma'lum)"}`;
  }
  return "";
}
