// tests/tayyorlik.spec.js — tahlilga tayyorlik tekshiruvi.
//
// ── NIMANI HIMOYA QILADI ──
//
// 🔴 ENG MUHIMI — `kod_ehtimoli` sharti backenddagi import
// qoidasi bilan BIR XIL bo'lishi. Ular ajralib ketsa, yangi
// importda `ordinal` bo'lgan ustun eski faylda «muammo» deb
// ko'rsatilardi (yoki aksincha) va foydalanuvchi ikki xil
// javobni bir vaqtda ko'rardi.
//
// Shuning uchun pastdagi «import qoidasi bilan moslik» bo'limi
// backenddagi `tests/test_csv_import_measure.py` bilan AYNAN bir
// xil holatlarni yuradi. Biri o'zgarsa, ikkinchisi ham
// o'zgartirilsin.
//
// Ikkinchi xavf — ogohlantirishlar ko'payib, e'tiborsiz
// qoldirila boshlashi. Shu sababli qoidalar atigi to'rtta va
// `kod_ehtimoli` ni rad etish mumkin.

import { describe, expect, it } from "vitest";

import { KODLAR, tekshir } from "../src/tayyorlik";
import { MAX_TOIFA } from "../src/tur-tuzatish";
import { olchovNomi } from "../src/olchov";

/** Bitta ustunli sxema + qatorlar. */
function bitta(v, qiymatlar) {
  const rows = qiymatlar.map(q => ({ x: q }));
  return tekshir([{ name: "x", ...v }], rows);
}

function kodlar(muammolar) {
  return muammolar.map(m => m.kod);
}

// ══════════════════════ bosh_ustun ══════════════════════

describe("bosh_ustun", () => {
  it("butunlay bo'sh ustun", () => {
    const m = bitta({ measure: "scale" }, ["", "  ", null]);
    expect(kodlar(m)).toEqual([KODLAR.BOSH_USTUN]);
    expect(m[0].matn).toContain("butunlay bo'sh");
  });

  it("🔴 BO'SH USTUNDA BOSHQA OGOHLANTIRISH CHIQMAYDI", () => {
    // Qiymat yo'q bo'lsa turi haqida aytadigan narsa yo'q —
    // uchta ogohlantirish bitta ustun uchun shovqin bo'lardi.
    const m = bitta({ measure: "nominal", values: null }, ["", ""]);
    expect(kodlar(m)).toEqual([KODLAR.BOSH_USTUN]);
  });

  it("qatorlar umuman bo'lmasa ham ishlaydi", () => {
    expect(kodlar(tekshir([{ name: "x", measure: "scale" }], [])))
      .toEqual([KODLAR.BOSH_USTUN]);
  });

  it("tuzatish taklif qilinmaydi", () => {
    expect(bitta({ measure: "scale" }, [""])[0].tuzatish).toBe(null);
  });
});

// ══════════════════════ matn_scale_da ══════════════════════

describe("matn_scale_da", () => {
  it("`scale` ustunda matnli qiymat", () => {
    const m = bitta({ measure: "scale" }, ["1", "Toshkent", "3"]);
    expect(kodlar(m)).toEqual([KODLAR.MATN_SCALE_DA]);
    expect(m[0].matn).toContain("matnli qiymatlar bor");
  });

  it("🔴 TUZATISH TAKLIF QILINMAYDI", () => {
    // Turni o'zgartirish qiymatlarni songa aylantirmaydi.
    expect(bitta({ measure: "scale" }, ["a", "b"])[0].tuzatish).toBe(null);
  });

  it("`nominal` ustunda matn muammo emas", () => {
    expect(bitta({ measure: "nominal", values: { a: "A" } },
                 ["a", "b", "a"])).toEqual([]);
  });
});

// ══════════════════════ kod_ehtimoli ══════════════════════

describe("kod_ehtimoli", () => {
  it("🔴 GURUH KODI `scale` DEB BELGILANGAN", () => {
    const m = bitta({ measure: "scale" }, ["1", "2", "1", "2"]);
    expect(kodlar(m)).toEqual([KODLAR.KOD_EHTIMOLI]);
    expect(m[0].matn).toContain("2 xil qiymat");
    expect(m[0].matn).toContain(olchovNomi("scale"));
    expect(m[0].matn).toContain("guruh kodi emasmi");
  });

  it("tuzatish `ordinal` taklif qiladi", () => {
    const m = bitta({ measure: "scale" }, ["1", "2", "1", "2"]);
    expect(m[0].tuzatish).toEqual({
      turi: "measure", qiymat: "ordinal",
      matn: `${olchovNomi("ordinal")} qilish`,
    });
  });

  it("🔴 RAD ETILGAN OGOHLANTIRISH QAYTA CHIQMAYDI", () => {
    // Aks holda haqiqatan 5 xil qiymatli ball ustuni har safar
    // «muammo» bo'lib turardi va foydalanuvchi BARCHA
    // ogohlantirishlarni e'tiborsiz qoldirishni o'rganardi.
    const m = bitta({ measure: "scale", ogohlantirish_rad: true },
                    ["1", "2", "1", "2"]);
    expect(m).toEqual([]);
  });

  it("rad etish boshqa qoidalarni susaytirmaydi", () => {
    // Rad etish FAQAT `kod_ehtimoli` ga tegishli.
    const m = bitta({ measure: "scale", ogohlantirish_rad: true },
                    ["1", "matn", "1"]);
    expect(kodlar(m)).toEqual([KODLAR.MATN_SCALE_DA]);
  });

  it("`ordinal` ustun uchun chiqmaydi", () => {
    expect(bitta({ measure: "ordinal", values: { 1: "a", 2: "b" } },
                 ["1", "2", "1"])).toEqual([]);
  });
});

// ══════════════════════ yorliq_yoq ══════════════════════

describe("yorliq_yoq", () => {
  it.each(["nominal", "ordinal"])("%s ustunda yorliq yo'q", measure => {
    const m = bitta({ measure }, ["1", "2", "1", "2"]);
    expect(kodlar(m)).toEqual([KODLAR.YORLIQ_YOQ]);
    expect(m[0].matn).toContain("qiymat yorliqlari yo'q");
  });

  it("yorliq bor bo'lsa muammo yo'q", () => {
    expect(bitta({ measure: "nominal", values: { 1: "erkak", 2: "ayol" } },
                 ["1", "2", "1"])).toEqual([]);
  });

  it("bo'sh `values` obyekti ham yorliqsiz", () => {
    expect(kodlar(bitta({ measure: "nominal", values: {} }, ["1", "2", "1"])))
      .toEqual([KODLAR.YORLIQ_YOQ]);
  });

  it("🔴 KO'P XIL QIYMATLI USTUNGA YORLIQ SO'RALMAYDI", () => {
    // 60 ta `id` qiymatiga yorliq yozish ma'nosiz ish — va
    // namunaning o'zi «muammoli» bo'lib chiqardi.
    const idlar = Array.from({ length: 60 }, (_, i) => String(i + 1));
    expect(bitta({ measure: "nominal" }, idlar)).toEqual([]);
  });

  it("tuzatish tahrirlagichni ochadi", () => {
    const m = bitta({ measure: "nominal" }, ["1", "2", "1"]);
    expect(m[0].tuzatish.turi).toBe("yorliq");
  });
});

// ══════════════════════ umumiy ══════════════════════

describe("umumiy", () => {
  it("muammosiz sxemada bo'sh ro'yxat", () => {
    const variables = [
      { name: "yosh", measure: "scale" },
      { name: "jins", measure: "nominal", values: { 1: "erkak", 2: "ayol" } },
    ];
    const rows = [
      { yosh: "18", jins: "1" },
      { yosh: "25", jins: "2" },
      { yosh: "31", jins: "1" },
      { yosh: "44", jins: "2" },
    ];
    expect(tekshir(variables, rows)).toEqual([]);
  });

  it("har bir ustun uchun ko'pi bilan bitta muammo", () => {
    const variables = [
      { name: "a", measure: "scale" },
      { name: "b", measure: "nominal" },
    ];
    const rows = [{ a: "1", b: "1" }, { a: "2", b: "2" }, { a: "1", b: "1" }];
    const m = tekshir(variables, rows);
    expect(m.map(x => x.variable)).toEqual(["a", "b"]);
  });

  it("yorliq ko'rsatishda `label` ustun nomidan ustun", () => {
    const m = tekshir(
      [{ name: "v1", label: "Jinsi", measure: "nominal" }],
      [{ v1: "1" }, { v1: "2" }, { v1: "1" }],
    );
    expect(m[0].matn).toContain("Jinsi");
  });

  it("nomsiz o'zgaruvchi o'tkazib yuboriladi", () => {
    expect(tekshir([{ measure: "scale" }, null], [])).toEqual([]);
  });

  it("bo'sh kirishda yiqilmaydi", () => {
    expect(tekshir(null, null)).toEqual([]);
    expect(tekshir([], [])).toEqual([]);
  });
});

// ══════════════════════ import qoidasi bilan moslik ══════════════════════
//
// 🔴 QABUL MEZONI: `kod_ehtimoli` sharti 09 dagi import qoidasi
// bilan bir xil. Quyidagi holatlar backenddagi
// `tests/test_csv_import_measure.py` dan AYNAN ko'chirilgan.

describe("🔴 import qoidasi bilan bir xil javob", () => {
  function ordinalmi(qiymatlar) {
    // `scale` deb belgilangan ustun uchun `kod_ehtimoli` chiqsa —
    // demak tekshiruv uni toifa deb biladi, ya'ni import ham uni
    // `ordinal` qilgan bo'lardi.
    return kodlar(bitta({ measure: "scale" }, qiymatlar.map(String)))
      .includes(KODLAR.KOD_EHTIMOLI);
  }

  it("`1, 2, 1, 2` — toifa", () => {
    expect(ordinalmi([1, 2, 1, 2])).toBe(true);
  });

  it("Likert `1..5` takror bilan — toifa", () => {
    expect(ordinalmi([1, 2, 3, 4, 5, 3, 2, 1])).toBe(true);
  });

  it("🔴 8 xil takrorsiz butun — TOIFA EMAS", () => {
    // Kichik tanlamadagi yosh (18–25). Usiz uning o'rtachasi
    // hisoblanmay qolardi.
    expect(ordinalmi([18, 19, 20, 21, 22, 23, 24, 25])).toBe(false);
  });

  it("chegaradan oshgan xil qiymat — toifa emas", () => {
    const kop = [...Array(MAX_TOIFA + 1).keys()].flatMap(i => [i, i]);
    expect(new Set(kop).size).toBe(MAX_TOIFA + 1);
    expect(ordinalmi(kop)).toBe(false);
  });

  it("chegaraning o'zi — hamon toifa", () => {
    const roppa = [...Array(MAX_TOIFA).keys()].flatMap(i => [i, i]);
    expect(new Set(roppa).size).toBe(MAX_TOIFA);
    expect(ordinalmi(roppa)).toBe(true);
  });

  it("🔴 KASRLI QIYMAT — TOIFA EMAS", () => {
    // `3.5` butun emas, ya'ni import uni `scale` qiladi.
    expect(ordinalmi([3.5, 2.0, 3.5, 2.0])).toBe(false);
  });

  it("nuqtali butun — toifa", () => {
    expect(ordinalmi(["1.0", "2.0", "1.0", "2.0"])).toBe(true);
  });

  it("vergulli butun — toifa", () => {
    expect(ordinalmi(["3,0", "4,0", "3,0", "4,0"])).toBe(true);
  });

  it("vergulli kasr — toifa emas", () => {
    expect(ordinalmi(["3,5", "4,5", "3,5", "4,5"])).toBe(false);
  });

  it("`1` va `1.0` — bitta qiymat", () => {
    expect(ordinalmi(["1", "1.0", "2", "2.0"])).toBe(true);
  });

  it("bitta qiymat takrorlangan — toifa", () => {
    expect(ordinalmi([5, 5, 5])).toBe(true);
  });

  it("🔴 XABARDAGI SON BO'SH KATAKLARNI SANAMAYDI", () => {
    // «atigi 3 xil qiymat» deyilsa-yu, ulardan biri bo'sh katak
    // bo'lsa, foydalanuvchi ma'lumotini qayta sanab chiqib,
    // ogohlantirishga ishonchini yo'qotadi.
    const m = bitta({ measure: "scale" }, ["1", "", "2", "", "1"]);
    expect(m[0].matn).toContain("2 xil qiymat");
    expect(m[0].matn).not.toContain("3 xil qiymat");
  });

  it("bo'sh kataklar sanoqqa kirmaydi", () => {
    expect(kodlar(bitta({ measure: "scale" }, ["1", "", "2", "  ", "1"])))
      .toEqual([KODLAR.KOD_EHTIMOLI]);
  });

  it("bo'sh katak takror sanog'iga ham kirmaydi", () => {
    // 3 xil qiymat, 3 ta to'lgan katak — takror yo'q.
    expect(kodlar(bitta({ measure: "scale" }, ["1", "", "2", "", "3"])))
      .toEqual([]);
  });
});
