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

import { KODLAR, RAD_ETILADIGAN, radEtiladimi, tekshir } from "../src/tayyorlik";
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


// ══════════════════════ ro'yxat interfeysi ══════════════════════
//
// Sof funksiya to'g'ri ishlashi yetarli emas: ro'yxat ekranda
// ko'rinmasa yoki tuzatish tugmasi sxemaga tegmasa, foydalanuvchi
// uchun hech narsa o'zgarmaydi.

import { mount } from "@vue/test-utils";
import { vi } from "vitest";
import { createStore } from "vuex";

import TayyorlikRoyxati from "../src/components/TayyorlikRoyxati.vue";
import VariablesTab from "../src/components/VariablesTab.vue";

function royxat(muammolar) {
  return mount(TayyorlikRoyxati, { props: { muammolar } });
}

describe("🔴 rad etish siyosati bitta joyda", () => {
  it("faqat `kod_ehtimoli` rad etiladi", () => {
    expect(RAD_ETILADIGAN).toEqual([KODLAR.KOD_EHTIMOLI]);
    expect(radEtiladimi(KODLAR.KOD_EHTIMOLI)).toBe(true);
  });

  it.each([KODLAR.BOSH_USTUN, KODLAR.MATN_SCALE_DA, KODLAR.YORLIQ_YOQ])(
    "«%s» rad etilmaydi", kod => {
      // Bular ma'lumotning o'zi haqidagi FAKT — rad etish
      // muammoni yashirish tugmasi bo'lardi.
      expect(radEtiladimi(kod)).toBe(false);
    },
  );
});

describe("TayyorlikRoyxati", () => {
  it("muammo yo'q bo'lsa umuman chizilmaydi", () => {
    expect(royxat([]).find(".tayyorlik").exists()).toBe(false);
  });

  it("har bir muammo bitta qator", () => {
    const w = royxat([
      { variable: "a", kod: KODLAR.BOSH_USTUN, matn: "a bo'sh", tuzatish: null },
      { variable: "b", kod: KODLAR.MATN_SCALE_DA, matn: "b matnli", tuzatish: null },
    ]);
    expect(w.findAll("li")).toHaveLength(2);
    expect(w.text()).toContain("2 ta e");
  });

  it("tuzatish tugmasi faqat tuzatish bo'lsa", () => {
    const w = royxat([
      { variable: "a", kod: KODLAR.BOSH_USTUN, matn: "x", tuzatish: null },
      { variable: "b", kod: KODLAR.YORLIQ_YOQ, matn: "y",
        tuzatish: { turi: "yorliq", matn: "Yorliqlarni kiritish" } },
    ]);
    expect(w.findAll(".tuzat")).toHaveLength(1);
    expect(w.find(".tuzat").text()).toBe("Yorliqlarni kiritish");
  });

  it("🔴 RAD ETISH FAQAT `kod_ehtimoli` UCHUN", () => {
    // Qolgan uchtasi ma'lumotning o'zi haqidagi FAKT: bo'sh
    // ustun bo'sh, matnli qiymat matnli. Ularni «rad etish»
    // muammoni yashirish tugmasi bo'lardi.
    const w = royxat([
      { variable: "a", kod: KODLAR.KOD_EHTIMOLI, matn: "x",
        tuzatish: { turi: "measure", qiymat: "ordinal", matn: "T" } },
      { variable: "b", kod: KODLAR.MATN_SCALE_DA, matn: "y", tuzatish: null },
      { variable: "c", kod: KODLAR.BOSH_USTUN, matn: "z", tuzatish: null },
      { variable: "d", kod: KODLAR.YORLIQ_YOQ, matn: "w",
        tuzatish: { turi: "yorliq", matn: "Y" } },
    ]);
    expect(w.findAll(".rad")).toHaveLength(1);
    expect(w.find("[data-kod='kod_ehtimoli'] .rad").exists()).toBe(true);
  });

  it("tugmalar hodisa chiqaradi", async () => {
    const m = { variable: "a", kod: KODLAR.KOD_EHTIMOLI, matn: "x",
                tuzatish: { turi: "measure", qiymat: "ordinal", matn: "T" } };
    const w = royxat([m]);
    await w.find(".tuzat").trigger("click");
    await w.find(".rad").trigger("click");
    expect(w.emitted("tuzat")[0]).toEqual([expect.objectContaining({ variable: "a" })]);
    expect(w.emitted("rad")[0]).toEqual([expect.objectContaining({ variable: "a" })]);
  });

  it("🔴 TO'SMASLIGI AYTILADI", () => {
    const w = royxat([{ variable: "a", kod: KODLAR.BOSH_USTUN, matn: "x", tuzatish: null }]);
    expect(w.find(".izoh").text()).toContain("to‘smaydi");
  });
});

// ── VariablesTab bilan birga ──

function tahrir(variables, rows) {
  // 🔴 NUSXA OLINADI. `UPDATE_VARIABLE` obyektni JOYIDA
  // o'zgartiradi, ya'ni tuzatish testi umumiy namunani buzib,
  // keyingi testlar sababsiz yiqilardi.
  variables = variables.map(v => ({ ...v }));
  const commits = [];
  const store = createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({ schema: { variables }, rows, schemaError: null,
                        file: { id: "f1" }, analyzing: false }),
        mutations: {
          UPDATE_VARIABLE: (st, p) => {
            commits.push(p);
            st.schema.variables[p.index][p.key] = p.value;
          },
          TOGGLE_VALUES_EDITOR: (st, i) => {
            commits.push({ index: i, key: "_showValues" });
            st.schema.variables[i]._showValues = true;
          },
          SET_SAVED: () => {},
        },
        actions: { saveSchema: vi.fn() },
      },
      sozlamalar: { namespaced: true, state: () => ({ nomPrefiksi: "ozg" }) },
    },
  });
  const w = mount(VariablesTab, {
    global: { plugins: [store], stubs: { ComputeModal: true, RecodeModal: true } },
  });
  return { w, commits, store };
}

describe("VariablesTab — tayyorlik ro'yxati", () => {
  const KOD_USTUN = [{ name: "guruh", measure: "scale", values: null }];
  const KOD_QATOR = [{ guruh: "1" }, { guruh: "2" }, { guruh: "1" }];

  it("muammo ro'yxati tepada ko'rinadi", () => {
    const { w } = tahrir(KOD_USTUN, KOD_QATOR);
    expect(w.find("[data-kod='kod_ehtimoli']").exists()).toBe(true);
  });

  it("🔴 TUZATISH SXEMANI O'ZGARTIRADI", () => {
    const { w, commits } = tahrir(KOD_USTUN, KOD_QATOR);
    w.find(".tuzat").trigger("click");
    expect(commits[0]).toEqual({ index: 0, key: "measure", value: "ordinal" });
  });

  it("tuzatgandan keyin muammo yo'qoladi", async () => {
    const { w } = tahrir(KOD_USTUN, KOD_QATOR);
    await w.find(".tuzat").trigger("click");
    expect(w.find("[data-kod='kod_ehtimoli']").exists()).toBe(false);
  });

  it("🔴 RAD ETISH SXEMADA SAQLANADI", () => {
    // `localStorage` da emas: bu ma'lumot haqidagi qaror, ya'ni
    // faylga tegishli — boshqa qurilmada ham amal qilsin.
    const { w, commits } = tahrir(KOD_USTUN, KOD_QATOR);
    w.find(".rad").trigger("click");
    expect(commits[0]).toEqual({ index: 0, key: "ogohlantirish_rad", value: true });
  });

  it("rad etilgandan keyin ogohlantirish qaytmaydi", async () => {
    const { w } = tahrir(KOD_USTUN, KOD_QATOR);
    await w.find(".rad").trigger("click");
    expect(w.find("[data-kod='kod_ehtimoli']").exists()).toBe(false);
  });

  it("yorliq tuzatishi tahrirlagichni ochadi", async () => {
    const { w, commits } = tahrir(
      [{ name: "jins", measure: "nominal", values: null }],
      [{ jins: "1" }, { jins: "2" }, { jins: "1" }],
    );
    await w.find("[data-kod='yorliq_yoq'] .tuzat").trigger("click");
    expect(commits[0]).toEqual({ index: 0, key: "_showValues" });
  });

  it("🔴 TUZATISH TO'G'RI USTUNGA TEGADI", () => {
    // Indeks nom bo'yicha topiladi. Ro'yxatdagi tartib sxemadagi
    // tartib bilan bir xil bo'lmasligi mumkin: birinchi
    // o'zgaruvchi muammosiz bo'lsa, ro'yxatdagi birinchi element
    // ikkinchi ustunga tegishli bo'ladi.
    const { w, commits } = tahrir(
      [
        { name: "yosh", measure: "scale", values: null },
        { name: "guruh", measure: "scale", values: null },
      ],
      [
        { yosh: "18", guruh: "1" },
        { yosh: "25", guruh: "2" },
        { yosh: "31", guruh: "1" },
        { yosh: "44", guruh: "2" },
      ],
    );
    expect(w.findAll("li")).toHaveLength(1);
    w.find(".tuzat").trigger("click");
    expect(commits[0].index).toBe(1);
  });

  it("rad etish ham to'g'ri ustunga tegadi", () => {
    const { w, commits } = tahrir(
      [
        { name: "yosh", measure: "scale", values: null },
        { name: "guruh", measure: "scale", values: null },
      ],
      [
        { yosh: "18", guruh: "1" },
        { yosh: "25", guruh: "2" },
        { yosh: "31", guruh: "1" },
        { yosh: "44", guruh: "2" },
      ],
    );
    w.find(".rad").trigger("click");
    expect(commits[0]).toEqual({ index: 1, key: "ogohlantirish_rad", value: true });
  });

  it("muammosiz sxemada ro'yxat yo'q", () => {
    const { w } = tahrir(
      [{ name: "yosh", measure: "scale", values: null }],
      [{ yosh: "18" }, { yosh: "25" }, { yosh: "31" }, { yosh: "44" }],
    );
    expect(w.find(".tayyorlik").exists()).toBe(false);
  });
});
