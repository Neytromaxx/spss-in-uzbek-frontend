// src/tayyorlik.js — ma'lumot tahlilga tayyormi?
//
// ── NIMA UCHUN KERAK ──
//
// 09-vazifa yangi importda turlarni to'g'ri aniqlaydigan qildi,
// lekin faqat YANGI importda. Allaqachon yuklangan fayllarda
// guruh kodlari hamon `scale` bo'lib turibdi va foydalanuvchi
// buni faqat tahlil paytida — ro'yxatda o'z ustunini topa
// olmaganda — sezadi.
//
// Bu tekshiruv muammolarni tahlilga o'tishdan OLDIN ko'rsatadi.
//
// ── 🔴 HECH NARSANI TO'SMAYDI ──
//
// U faqat ogohlantiradi. Foydalanuvchi e'tiborsiz qoldirib
// tahlilga o'ta olishi SHART: aks holda noto'g'ri qoida (ular
// muqarrar) odamni ishidan to'xtatib qo'yardi.
//
// ── ⚠️ QOIDALAR NUSXALANMAYDI ──
//
// Shartlar `tur-tuzatish.js` dan olinadi, u o'z navbatida
// backenddagi `csv_import` qoidasiga havola qiladi. Uchinchi
// nusxa yozilsa, yangi importda `ordinal` bo'lgan ustun eski
// faylda «muammo» deb ko'rsatilardi — yoki aksincha.

import { olchovNomi } from "./olchov";
import {
  barchasiRaqammi,
  kamToifali,
  ordinalgaOxshaydimi,
  qiymatSoni,
} from "./tur-tuzatish";

export const KODLAR = {
  BOSH_USTUN: "bosh_ustun",
  MATN_SCALE_DA: "matn_scale_da",
  KOD_EHTIMOLI: "kod_ehtimoli",
  YORLIQ_YOQ: "yorliq_yoq",
};

/** Ustunda nechta xil qiymat bor (ko'rsatish uchun). */
function xilSoni(rows, nom) {
  const xillar = new Set();
  for (const r of rows || []) {
    const q = r?.[nom];
    if (q === null || q === undefined) continue;
    const s = String(q).trim();
    if (s) xillar.add(s);
  }
  return xillar.size;
}

function yorliqBormi(v) {
  return !!v?.values && Object.keys(v.values).length > 0;
}

/** Sxema va qatorlardan muammolar ro'yxati.
 *
 * Har bir muammo: `{ variable, kod, matn, tuzatish }`.
 * `tuzatish` — `null` yoki `{ turi, matn }`.
 *
 * Sof funksiya: Vue'ga bog'liq emas, alohida sinaladi.
 */
export function tekshir(variables, rows) {
  const muammolar = [];

  for (const v of variables || []) {
    const nom = v?.name;
    if (!nom) continue;
    const korsatiladigan = v.label || nom;

    // Bo'sh ustunda turi haqida aytadigan hech narsa yo'q, ya'ni
    // bitta ogohlantirish yetarli.
    //
    // ⚠️ `continue` HOZIRCHA HIMOYA CHORASI, ishlaydigan shox
    // emas: qolgan uchala qoida ham ma'lumot talab qiladi
    // (`barchasiRaqammi` bo'sh ustunda rost, `kamToifali` va
    // `ordinalgaOxshaydimi` yolg'on), ya'ni ular baribir
    // ishlamasdi. Mutatsiya sinovi buni tasdiqladi — `continue`
    // ni olib tashlaganda birorta test qizil bo'lmadi.
    //
    // Shunga qaramay qoldirildi: ma'lumot talab qilmaydigan
    // yangi qoida qo'shilsa, u bo'sh ustunga ham yopishib
    // qolardi va buni hech narsa ushlamasdi.
    if (qiymatSoni(rows, nom) === 0) {
      muammolar.push({
        variable: nom,
        kod: KODLAR.BOSH_USTUN,
        matn: `${korsatiladigan} — ustun butunlay bo'sh.`,
        tuzatish: null,
      });
      continue;
    }

    if (v.measure === "scale") {
      if (!barchasiRaqammi(rows, nom)) {
        muammolar.push({
          variable: nom,
          kod: KODLAR.MATN_SCALE_DA,
          matn: `${korsatiladigan} — matnli qiymatlar bor, raqamli `
            + "tahlilga yaroqsiz.",
          // Tuzatish taklif qilinmaydi: turni o'zgartirish
          // qiymatlarni songa aylantirmaydi.
          tuzatish: null,
        });
      } else if (!v.ogohlantirish_rad && ordinalgaOxshaydimi(rows, nom)) {
        muammolar.push({
          variable: nom,
          kod: KODLAR.KOD_EHTIMOLI,
          matn: `${korsatiladigan} — atigi ${xilSoni(rows, nom)} xil qiymat, `
            + `lekin «${olchovNomi("scale")}» deb belgilangan. `
            + "Bu guruh kodi emasmi?",
          tuzatish: { turi: "measure", qiymat: "ordinal",
                      matn: `${olchovNomi("ordinal")} qilish` },
        });
      }
      continue;
    }

    // 🔴 YORLIQ FAQAT HAQIQATAN KAM KODLI USTUNDA SO'RALADI.
    //
    // Brifda bu shart yo'q edi, lekin usiz 60 ta `id` qiymatiga
    // yorliq talab qilinardi — ma'nosiz ish, va namunaning o'zi
    // «muammoli» bo'lib chiqardi.
    if (["nominal", "ordinal"].includes(v.measure)
        && !yorliqBormi(v) && kamToifali(rows, nom)) {
      muammolar.push({
        variable: nom,
        kod: KODLAR.YORLIQ_YOQ,
        matn: `${korsatiladigan} — qiymat yorliqlari yo'q. `
          + "Natijada «1», «2» ko'rinadi.",
        tuzatish: { turi: "yorliq", matn: "Yorliqlarni kiritish" },
      });
    }
  }

  return muammolar;
}
