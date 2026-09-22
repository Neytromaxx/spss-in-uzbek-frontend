// src/tur-tuzatish.js — mos kelmagan o'zgaruvchi: sabab va tuzatish.
//
// ── NIMA UCHUN YASHIRMAYMIZ ──
//
// Ilgari tahlil paneli mos kelmagan o'zgaruvchini ro'yxatdan
// olib tashlardi. Foydalanuvchi bo'sh ro'yxatga qarardi va
// sababni topa olmasdi: sabab boshqa yorliqda, boshqa ekranda
// turgan «measure» ustunida edi. Aynan shu joyda ko'pchilik
// tahlilgacha yetib bormasdi.
//
// Endi mos kelmagani KO'RINADI, yonida nima uchun va — mumkin
// bo'lsa — bir bosishda tuzatish.
//
// ── 🔴 TUZATISH HAR DOIM TAKLIF QILINMAYDI ──
//
// Raqamli tahlilga o'tkazish faqat ustundagi barcha yaroqli
// qiymatlar son bo'lsagina taklif qilinadi. Aks holda tugma
// foydalanuvchini to'g'ri backend xatosiga olib borardi: turni
// `scale` qilish qiymatlarni songa aylantirmaydi.
//
// Matnli ustun uchun faqat sabab ko'rsatiladi.
//
// Teskari yo'nalishda ham shunday: 40 xil qiymatli `yosh`
// ustunini «Guruh kodi qilish» taklifi ma'nosiz — u guruh emas.
// Shuning uchun toifaga o'tkazish faqat ustunda KAM xil qiymat
// bo'lsagina taklif qilinadi.

import { olchovNomi } from "./olchov";
import { rolTurlari } from "./tahlil-rollari";

// Guruh kodi bo'la oladigan ustunda nechta xil qiymat bo'lishi
// mumkin.
//
// ⚠️ Bu chegara backenddagi import qoidasi bilan bir xil
// (`csv_import.MAX_TOIFA`): 7 va 10 balli Likert, 2–5 ta guruh
// kodi qamraladi. Ikki tilda yozilgan, shuning uchun biri
// o'zgarsa ikkinchisi ham o'zgarsin.
export const MAX_TOIFA = 10;

/** Ustundagi bo'sh bo'lmagan qiymatlar soni. */
export function qiymatSoni(rows, nom) {
  let soni = 0;
  for (const r of rows || []) {
    const q = r?.[nom];
    if (q === null || q === undefined) continue;
    if (String(q).trim()) soni += 1;
  }
  return soni;
}

/** Ustun guruh kodiga o'xshaydimi?
 *
 * Ikkita shart: xil qiymatlar KAM va kamida bittasi TAKRORLANADI.
 *
 * ⚠️ Bu — backenddagi import qoidasining
 * (`csv_import._olchov_turi`) aynan o'zi. Takrorlanish sharti kichik tanlamani
 * himoya qiladi: 8 qatorli faylda 8 xil yosh (18–25) takrorsiz,
 * ya'ni u guruh kodi emas, o'lchov. Usiz `yosh` ustuniga «guruh
 * kodi qilish» taklif qilinardi.
 */
export function guruhKodigaOxshaydimi(rows, nom) {
  const xillar = new Set();
  let soni = 0;
  for (const r of rows || []) {
    const q = r?.[nom];
    if (q === null || q === undefined) continue;
    const s = String(q).trim();
    if (!s) continue;
    soni += 1;
    xillar.add(s);
  }
  if (xillar.size > MAX_TOIFA) return false;
  // Bo'sh ustun uchun `0 < 0` — yolg'on, ya'ni alohida tekshiruv
  // kerak emas. (Mutatsiya sinovi uni o'lik kod deb ko'rsatdi.)
  return xillar.size < soni; // kamida bittasi takrorlangan
}

/** Rol raqamli hisob-kitobga beriladimi?
 *
 * `scale` ruxsat etilgan rollarning hammasi qiymatlarni songa
 * aylantiradi (`np.array(..., dtype=float)`), ya'ni ular uchun
 * ustun haqiqatan raqamli bo'lishi shart. Kategorik rollar
 * (`nominal`/`ordinal`) qiymatni matn sifatida guruhlaydi.
 */
export function raqamliRolmi(tahlil, rol) {
  return (rolTurlari(tahlil, rol) || []).includes("scale");
}

/** Bitta qiymat songa aylanadimi?
 *
 * Backenddagi `csv_import._is_number` bilan bir xil qoida: bo'sh
 * katak turga ta'sir qilmaydi, vergul o'nlik ajratgichi sifatida
 * qabul qilinadi (`3,5`).
 */
export function raqammi(qiymat) {
  if (qiymat === null || qiymat === undefined) return true;
  const s = String(qiymat).trim().replace(",", ".");
  if (!s) return true; // bo'sh — turga ta'sir qilmaydi
  return Number.isFinite(Number(s));
}

/** Ustundagi BARCHA yaroqli qiymatlar sonmi? */
export function barchasiRaqammi(rows, nom) {
  return (rows || []).every(r => raqammi(r?.[nom]));
}

/** Mos kelmagan o'zgaruvchi uchun sabab va (mumkin bo'lsa) tuzatish.
 *
 * Qaytaradi: `{ nom, sabab, target, tugma }`.
 * `target` — `null` bo'lsa tuzatish taklif qilinmaydi.
 *
 * `rows` — `DataTab` allaqachon yuklagan qatorlar. Qo'shimcha
 * so'rov yuborilmaydi: turni tekshirish uchun ma'lumot
 * ekranning o'zida turibdi.
 */
export function tuzatish(tahlil, rol, ozgaruvchi, rows) {
  const nom = ozgaruvchi?.label || ozgaruvchi?.name || "";
  const turlar = rolTurlari(tahlil, rol) || [];

  // Ruxsat etilganlarning BIRINCHISI taklif qilinadi. Ro'yxat
  // kuchli shkaladan kuchsizga tartiblangan, ya'ni bu «eng ko'p
  // ma'lumot saqlaydigan» variant. Foydalanuvchi keyin
  // O'zgaruvchilar yorlig'ida aniqlashtira oladi.
  const target = turlar[0] || null;

  // 🔴 MA'LUMOTSIZ USTUNNI TO'SMAYMIZ. Qiymat yo'q bo'lsa,
  // ustunning o'lchov yoki guruh kodi ekanini aytadigan hech
  // qanday dalil yo'q — bunday holda taklifni bermaslik
  // foydalanuvchiga hech narsa bermaydi, faqat to'sib qo'yadi.
  const malumotBor = qiymatSoni(rows, ozgaruvchi?.name) > 0;

  const hozirgi = ozgaruvchi?.measure;
  const hozirgiNomi = hozirgi ? olchovNomi(hozirgi) : "";
  const sababBoshi = hozirgiNomi
    ? `hozir «${hozirgiNomi}» turida`
    : "o'lchov turi aniqlanmagan";

  // 🔴 IKKALA YO'NALISHDA HAM TAKLIF TEKSHIRILADI.
  //
  // Tugma faqat NATIJA ISHLAYDIGAN holatda chiqsin. Aks holda u
  // foydalanuvchini ikki xil zararga olib boradi: raqamli
  // tahlilda — backend xatosiga, guruhlashda — 40 ta bir qatorli
  // «guruh»ga.
  if (raqamliRolmi(tahlil, rol)) {
    if (!barchasiRaqammi(rows, ozgaruvchi?.name)) {
      return {
        nom,
        sabab: "matnli qiymatlar bor, raqamli tahlilga yaroqsiz",
        target: null,
        tugma: "",
      };
    }
    // Guruh kodini «o'lchov» qilish taklifi ham xato bo'lardi:
    // `1 = erkak, 2 = ayol` ning o'rtachasi ma'nosiz. Ikkala
    // yo'nalish BITTA signalga bog'langan, ya'ni ustun yo
    // o'lchovga, yo guruh kodiga o'xshaydi — ikkalasiga emas.
    if (malumotBor && guruhKodigaOxshaydimi(rows, ozgaruvchi?.name)) {
      return {
        nom,
        sabab: "kam xil, takrorlanuvchi qiymatlar — bu guruh kodi",
        target: null,
        tugma: "",
      };
    }
  }

  if (!raqamliRolmi(tahlil, rol) && target && malumotBor
      && !guruhKodigaOxshaydimi(rows, ozgaruvchi?.name)) {
    return {
      nom,
      sabab: "qiymatlari takrorlanmaydi — guruh kodi emas",
      target: null,
      tugma: "",
    };
  }

  if (!target) return { nom, sabab: sababBoshi, target: null, tugma: "" };

  return {
    nom,
    sabab: sababBoshi,
    target,
    tugma: `${olchovNomi(target)} qilish`,
  };
}

/** Tuzatishdan keyingi xabar. */
export function tuzatildiXabari(ozgaruvchiNomi, target) {
  return `«${ozgaruvchiNomi}» endi «${olchovNomi(target)}» turida.`;
}
