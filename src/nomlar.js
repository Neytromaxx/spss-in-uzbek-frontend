// src/nomlar.js — o'zgaruvchi nomlariga qo'yilgan cheklovlar.
//
// 🔴 ZAHIRALANGAN SO'ZLAR backenddagi `expr/tokenizer.py` dagi
// `ZAHIRA_SOZLAR` + `TO` bilan AYNAN bir xil bo'lishi kerak.
// Ro'yxat qisqa ataylab: `EQ`/`NE`/`GT` mnemonikalari amalga
// oshirilmagan va funksiya nomlari ham zahiralanmagan (`sum` nomli
// ustun `SUM(sum, b1)` da ham ishlaydi).
//
// Nomni O'ZGARTIRISH imkoniyati yo'q: ustun nomi qatorlardagi kalit,
// hosila ustunlardagi `derived.source` va saqlangan ifodalar bilan
// bog'langan. Uni bitta joydan o'zgartirish boshqalarini jimgina
// buzardi — bu alohida vazifa.

export const ZAHIRA_SOZLAR = ["AND", "OR", "NOT", "TO"];

/** Nom zahiralanganmi (katta-kichik harf farqsiz). */
export function zahiralanganmi(nom) {
  return ZAHIRA_SOZLAR.includes(String(nom ?? "").trim().toUpperCase());
}

/** Foydalanuvchiga ko'rsatiladigan izoh. */
export function zahiraIzohi(nom) {
  if (!zahiralanganmi(nom)) return "";
  return (
    `«${nom}» — zahiralangan so'z (${ZAHIRA_SOZLAR.join(", ")}). ` +
    "Bu ustunni filtr shartida ishlatib bo'lmaydi."
  );
}
