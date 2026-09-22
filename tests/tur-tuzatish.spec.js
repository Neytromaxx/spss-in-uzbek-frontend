// tests/tur-tuzatish.spec.js — mos kelmagan o'zgaruvchi: sabab va tuzatish.
//
// ── NIMANI HIMOYA QILADI ──
//
// Ilgari tahlil paneli mos kelmaganini ro'yxatdan OLIB TASHLARDI.
// Foydalanuvchi bo'sh ro'yxatga qarardi va sababni topa olmasdi:
// sabab boshqa yorliqda, boshqa ekrandagi «measure» ustunida edi.
// Aynan shu joyda ko'pchilik tahlilgacha yetib bormasdi.
//
// 🔴 Eng xavfli xatti-harakat — MATNLI ustunga «raqamli qil»
// tugmasini ko'rsatish: turni o'zgartirish qiymatlarni songa
// aylantirmaydi, ya'ni tugma foydalanuvchini to'g'ri backend
// xatosiga olib borardi.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";

import {
  MAX_TOIFA,
  barchasiRaqammi,
  guruhKodigaOxshaydimi,
  raqamliRolmi,
  raqammi,
  tuzatildiXabari,
  tuzatish,
} from "../src/tur-tuzatish";
import { olchovNomi } from "../src/olchov";
import AnalysisPanel from "../src/components/analysis/AnalysisPanel.vue";

// ══════════════════════ raqamlilik ══════════════════════

describe("raqammi", () => {
  it.each(["1", "3.5", "-2", "0", 7, "  12  "])("«%s» son", q => {
    expect(raqammi(q)).toBe(true);
  });

  it("🔴 VERGULLI O'NLIK ham son", () => {
    // Backenddagi `csv_import._is_number` bilan bir xil qoida —
    // o'zbek/rus klaviaturasida vergul teriladi.
    expect(raqammi("3,5")).toBe(true);
  });

  it("🔴 BO'SH KATAK turga ta'sir qilmaydi", () => {
    // Aks holda bitta bo'sh katak butun ustunni «matnli» qilardi.
    expect(raqammi("")).toBe(true);
    expect(raqammi("   ")).toBe(true);
    expect(raqammi(null)).toBe(true);
    expect(raqammi(undefined)).toBe(true);
  });

  it.each(["Toshkent", "1a", "yo'q", "—"])("«%s» son emas", q => {
    expect(raqammi(q)).toBe(false);
  });
});

describe("barchasiRaqammi", () => {
  it("hammasi son", () => {
    expect(barchasiRaqammi([{ a: "1" }, { a: "2" }], "a")).toBe(true);
  });

  it("bittasi matn bo'lsa ham — yo'q", () => {
    expect(barchasiRaqammi([{ a: "1" }, { a: "Toshkent" }], "a")).toBe(false);
  });

  it("bo'sh kataklar aralash bo'lsa ham son", () => {
    expect(barchasiRaqammi([{ a: "1" }, { a: "" }, {}], "a")).toBe(true);
  });

  it("qator yo'q bo'lsa yiqilmaydi", () => {
    expect(barchasiRaqammi(null, "a")).toBe(true);
    expect(barchasiRaqammi([], "a")).toBe(true);
  });
});

describe("raqamliRolmi", () => {
  it("`scale` ruxsat etilgan rollar raqamli", () => {
    // Ular qiymatni songa aylantiradi (`dtype=float`).
    expect(raqamliRolmi("ttest_ind", "dependent")).toBe(true);
    expect(raqamliRolmi("mannwhitney", "dependent")).toBe(true);
    expect(raqamliRolmi("regression_linear", "predictors")).toBe(true);
  });

  it("kategorik rollar raqamli emas", () => {
    // `crosstab` qiymatni matn sifatida guruhlaydi.
    expect(raqamliRolmi("crosstab", "variables")).toBe(false);
    expect(raqamliRolmi("ttest_ind", "group")).toBe(false);
  });

  it("cheklovsiz rol raqamli emas", () => {
    expect(raqamliRolmi("auto", "variables")).toBe(false);
  });
});

// ══════════════════════ tuzatish taklifi ══════════════════════

const RAQAMLI_QATORLAR = [{ guruh: "1" }, { guruh: "2" }, { guruh: "1" }];
const MATNLI_QATORLAR = [{ viloyat: "Toshkent" }, { viloyat: "Samarqand" }];

describe("tuzatish", () => {
  it("🔴 GURUHGA `scale` USTUN — tuzatish taklif qilinadi", () => {
    // Brifning asosiy holati: `1 = erkak, 2 = ayol` import
    // paytida `scale` bo'lib qolgan.
    const t = tuzatish(
      "anova_oneway", "group",
      { name: "guruh", measure: "scale" }, RAQAMLI_QATORLAR,
    );
    expect(t.sabab).toBe(`hozir «${olchovNomi("scale")}» turida`);
    expect(t.target).toBe("nominal");
    expect(t.tugma).toBe("Guruh kodi qilish");
  });

  it("🔴 MATNLI USTUNGA RAQAMLI TUR TAKLIF QILINMAYDI", () => {
    // Turni `scale` qilish qiymatlarni songa aylantirmaydi —
    // tugma foydalanuvchini to'g'ri backend xatosiga olib borardi.
    const t = tuzatish(
      "ttest_ind", "dependent",
      { name: "viloyat", measure: "nominal" }, MATNLI_QATORLAR,
    );
    expect(t.target).toBe(null);
    expect(t.tugma).toBe("");
    expect(t.sabab).toContain("matnli qiymatlar bor");
  });

  it("o'lchovga o'xshagan nominal ustun `scale` ga o'tkaziladi", () => {
    // Takrorlanmaydigan, ko'p xil qiymat — bu ball, guruh kodi
    // emas, ya'ni nominal deb belgilangani xato.
    const olchovQatorlari = Array.from({ length: 12 }, (_, i) => ({ ball: String(10 + i) }));
    const t = tuzatish(
      "ttest_ind", "dependent",
      { name: "ball", measure: "nominal" }, olchovQatorlari,
    );
    expect(t.target).toBe("scale");
    expect(t.tugma).toBe(`${olchovNomi("scale")} qilish`);
  });

  it("🔴 KATEGORIK ROLDA MATN TO'SQINLIK QILMAYDI", () => {
    // `crosstab` qiymatni matn sifatida guruhlaydi — matnli
    // ustun u yerda mutlaqo o'rinli.
    const t = tuzatish(
      "crosstab", "variables",
      { name: "viloyat", measure: "scale" },
      [...MATNLI_QATORLAR, { viloyat: "Toshkent" }],
    );
    expect(t.target).toBe("nominal");
  });

  it("o'lchovi aniqlanmagan ustun", () => {
    const t = tuzatish("crosstab", "variables", { name: "x" }, []);
    expect(t.sabab).toBe("o'lchov turi aniqlanmagan");
    expect(t.target).toBe("nominal");
  });

  it("yorliq bo'lsa u ko'rsatiladi", () => {
    const t = tuzatish(
      "crosstab", "variables",
      { name: "v1", label: "Viloyat", measure: "scale" }, [],
    );
    expect(t.nom).toBe("Viloyat");
  });

  it("cheklovsiz rolda tuzatish yo'q", () => {
    const t = tuzatish("auto", "variables", { name: "x", measure: "scale" }, []);
    expect(t.target).toBe(null);
  });
});

describe("🔴 ikki yo'nalish bitta signalga bog'langan", () => {
  // Ustun yo o'lchovga, yo guruh kodiga o'xshaydi — ikkalasiga
  // emas. Aks holda `1 = erkak, 2 = ayol` ustuniga «o'lchov
  // qilish» taklif qilinardi va uning o'rtachasi hisoblanardi.
  const KOD = Array.from({ length: 12 }, (_, i) => ({ x: String((i % 2) + 1) }));
  const OLCHOV = Array.from({ length: 12 }, (_, i) => ({ x: String(10 + i) }));

  it("guruh kodiga «o'lchov qilish» taklif qilinmaydi", () => {
    const t = tuzatish("ttest_ind", "dependent", { name: "x", measure: "nominal" }, KOD);
    expect(t.target).toBe(null);
    expect(t.sabab).toContain("guruh kodi");
  });

  it("o'lchovga «guruh qilish» taklif qilinmaydi", () => {
    const t = tuzatish("ttest_ind", "group", { name: "x", measure: "scale" }, OLCHOV);
    expect(t.target).toBe(null);
    expect(t.sabab).toContain("takrorlanmaydi");
  });

  it("to'g'ri yo'nalishda esa taklif qilinadi", () => {
    expect(tuzatish("ttest_ind", "group", { name: "x", measure: "scale" }, KOD).target)
      .toBe("nominal");
    expect(tuzatish("ttest_ind", "dependent", { name: "x", measure: "nominal" }, OLCHOV).target)
      .toBe("scale");
  });

  it("🔴 KICHIK TANLAMADA YOSH GURUH KODI EMAS", () => {
    // 8 qatorda 8 xil yosh (18–25): takror yo'q, ya'ni bu
    // o'lchov. Takrorlanish sharti bo'lmasa, unga «guruh kodi
    // qilish» taklif qilinardi.
    const yosh = [18, 19, 20, 21, 22, 23, 24, 25].map(v => ({ x: String(v) }));
    expect(guruhKodigaOxshaydimi(yosh, "x")).toBe(false);
  });

  it("bo'sh ustun guruh kodi emas", () => {
    expect(guruhKodigaOxshaydimi([], "x")).toBe(false);
    expect(guruhKodigaOxshaydimi([{ x: "" }, { x: null }], "x")).toBe(false);
  });

  it("🔴 CHEGARA — 10", () => {
    // Qiymat ramziy emas, AYNAN yozilgan: u 7 va 10 balli
    // Likert shkalalari hamda 2–5 ta guruh kodini qamrab
    // olish uchun tanlangan. O'zgartirilsa, sabab bilan
    // o'zgartirilsin — va backenddagi import qoidasi bilan
    // birga (ikki tilda yozilgan chegara).
    expect(MAX_TOIFA).toBe(10);
  });

  it("🔴 CHEGARA AYNAN MAX_TOIFA da", () => {
    // `>` va `>=` farqi: 10 xil qiymatli 10 balli shkala hamon
    // guruh kodi bo'lishi kerak.
    const roppaRosa = Array.from({ length: 20 }, (_, i) => ({ x: String(i % MAX_TOIFA) }));
    expect(new Set(roppaRosa.map(r => r.x)).size).toBe(MAX_TOIFA);
    expect(guruhKodigaOxshaydimi(roppaRosa, "x")).toBe(true);
  });

  it("chegaradan oshgan xil qiymatlar", () => {
    const kop = Array.from({ length: 30 }, (_, i) => ({ x: String(i % (MAX_TOIFA + 1)) }));
    expect(guruhKodigaOxshaydimi(kop, "x")).toBe(false);
  });
});

describe("tuzatildiXabari", () => {
  it("nima bo'lganini aytadi", () => {
    expect(tuzatildiXabari("guruh", "nominal"))
      .toBe(`«guruh» endi «${olchovNomi("nominal")}» turida.`);
  });
});

// ══════════════════════ AnalysisPanel ══════════════════════

const OZGARUVCHILAR = [
  { name: "ball", measure: "scale" },
  { name: "guruh", measure: "scale" },
  { name: "viloyat", measure: "nominal" },
];

// 🔴 QATORLAR HAQIQIY MA'LUMOTGA O'XSHASH BO'LISHI SHART.
//
// Ikki qatorli namunada HAR BIR ustunda 2 xil qiymat bo'ladi,
// ya'ni «kam toifa» tekshiruvi hech qachon ishlamaydi va test
// `ball` ni ham guruh kodi deb qabul qilaverardi.
const QATORLAR = Array.from({ length: 12 }, (_, i) => ({
  ball: String(10 + i), //     12 xil qiymat — guruh kodi emas
  guruh: String((i % 2) + 1), //  2 xil kod
  viloyat: ["Toshkent", "Samarqand", "Buxoro"][i % 3],
}));

function panel(method, { variables = OZGARUVCHILAR, rows = QATORLAR } = {}) {
  // 🔴 NUSXA OLINADI. `UPDATE_VARIABLE` obyektni JOYIDA
  // o'zgartiradi, ya'ni tuzatish testi umumiy namunani buzib,
  // keyingi testlar sababsiz yiqilardi.
  variables = variables.map(v => ({ ...v }));
  const commits = [];
  const saqlashlar = [];
  const store = createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({ schema: { variables }, rows, analyzing: false, file: { id: "f1" } }),
        mutations: {
          UPDATE_VARIABLE: (st, p) => {
            commits.push(p);
            st.schema.variables[p.index][p.key] = p.value;
          },
        },
        actions: {
          analyze: vi.fn(),
          saveSchema: () => { saqlashlar.push(1); },
        },
      },
    },
  });
  const w = mount(AnalysisPanel, { global: { plugins: [store] } });
  w.vm.method = method;
  return { w, commits, saqlashlar };
}

beforeEach(() => vi.clearAllMocks());

describe("AnalysisPanel — sabab ko'rinadi", () => {
  it("🔴 TANLOV MAYDONI OSTIDA SABAB CHIQADI", async () => {
    // Ilgari `guruh` shunchaki yo'q edi va foydalanuvchi bo'sh
    // ro'yxatga qarardi.
    const { w } = panel("anova_oneway");
    await w.vm.$nextTick();

    const nomos = w.find("[data-rol='group']");
    expect(nomos.exists()).toBe(true);
    expect(nomos.text()).toContain("Ro'yxatda yo'q");
    expect(nomos.text()).toContain("guruh");
    expect(nomos.text()).toContain(olchovNomi("scale"));
  });

  it("tuzatish tugmasi sabab yonida", async () => {
    const { w } = panel("anova_oneway");
    await w.vm.$nextTick();
    expect(w.find("[data-rol='group'] .tuzat").text()).toBe("Guruh kodi qilish");
  });

  it("hammasi mos bo'lsa izoh yo'q", async () => {
    // Bitta rolli tahlil: barcha ustunlar mos, ya'ni aytadigan
    // narsa yo'q.
    const { w } = panel("correlation", {
      variables: [
        { name: "ball", measure: "scale" },
        { name: "ball2", measure: "scale" },
      ],
    });
    await w.vm.$nextTick();
    expect(w.findAll(".nomos-izoh")).toHaveLength(0);
  });

  it("🔴 KO'P XIL QIYMATLI USTUNGA «guruh qil» TAKLIF QILINMAYDI", async () => {
    // 12 xil ballni guruh kodiga aylantirish 12 ta bir qatorli
    // «guruh» yasardi — ANOVA buni rad etadi, lekin foydalanuvchi
    // buni tugma bosgandan keyingina bilardi.
    const { w } = panel("anova_oneway");
    await w.vm.$nextTick();

    const matn = w.find("[data-rol='group']").text();
    expect(matn).toContain("ball");
    expect(matn).toContain("guruh kodi emas");

    const tugmalar = w.findAll("[data-rol='group'] .tuzat").map(b => b.text());
    expect(tugmalar).toEqual(["Guruh kodi qilish"]); // faqat `guruh` uchun
  });
});

describe("AnalysisPanel — dependent maydoni", () => {
  it("🔴 BOG'LIQ MAYDON OSTIDA HAM SABAB CHIQADI", async () => {
    // Ikkala tanlov maydonining izohi alohida chiziladi — biri
    // ishlab, ikkinchisi jim qolishi mumkin edi.
    const { w } = panel("anova_oneway");
    await w.vm.$nextTick();

    const dep = w.find("[data-rol='dependent']");
    expect(dep.exists()).toBe(true);
    expect(dep.text()).toContain("viloyat");
    expect(dep.text()).toContain("matnli qiymatlar bor");
  });

  it("🔴 TAKLIF QILINMAYDIGAN ELEMENTDA TUGMA YO'Q", async () => {
    // `viloyat` matnli: turni o'zgartirish qiymatlarni songa
    // aylantirmaydi, ya'ni tugma faqat backend xatosiga olib
    // borardi.
    const { w } = panel("anova_oneway");
    await w.vm.$nextTick();
    expect(w.findAll("[data-rol='dependent'] .tuzat")).toHaveLength(0);
  });

  it("tugmalar faqat taklif bor elementlarda", async () => {
    const { w } = panel("anova_oneway");
    await w.vm.$nextTick();
    // Guruh bo'limida ikkita mos kelmagan bor (`ball`, `guruh`),
    // lekin tugma faqat bittasida.
    expect(w.find("[data-rol='group']").text()).toContain("ball");
    expect(w.findAll("[data-rol='group'] .tuzat")).toHaveLength(1);
  });
});

describe("AnalysisPanel — belgilash katakchalari", () => {
  it("🔴 MOS KELMAGAN KO'RINADI, lekin O'CHIRILGAN", async () => {
    // Yashirilsa, foydalanuvchi o'zgaruvchisi qayoqqa ketganini
    // tushunmasdi.
    const { w } = panel("correlation");
    await w.vm.$nextTick();

    const qatorlar = w.findAll(".var-qator");
    expect(qatorlar).toHaveLength(OZGARUVCHILAR.length);

    const viloyat = qatorlar.find(q => q.attributes("data-nom") === "viloyat");
    expect(viloyat.find("input").attributes("disabled")).toBeDefined();
    expect(viloyat.find(".nomos-izoh").exists()).toBe(true);
  });

  it("mos kelgani o'chirilmaydi", async () => {
    const { w } = panel("correlation");
    await w.vm.$nextTick();
    const ball = w.findAll(".var-qator").find(q => q.attributes("data-nom") === "ball");
    expect(ball.find("input").attributes("disabled")).toBeUndefined();
    expect(ball.find(".nomos-izoh").exists()).toBe(false);
  });

  it("🔴 MATNLI USTUNDA TUGMA YO'Q, faqat sabab", async () => {
    const { w } = panel("correlation");
    await w.vm.$nextTick();
    const viloyat = w.findAll(".var-qator").find(q => q.attributes("data-nom") === "viloyat");
    expect(viloyat.find(".nomos-izoh").text()).toContain("matnli qiymatlar bor");
    expect(viloyat.find(".tuzat").exists()).toBe(false);
  });

  it("raqamli qiymatli nominal ustunda tugma bor", async () => {
    const { w } = panel("correlation", {
      variables: [{ name: "guruh", measure: "nominal" }],
      rows: [{ guruh: "1" }, { guruh: "2" }],
    });
    await w.vm.$nextTick();
    expect(w.find(".var-qator .tuzat").exists()).toBe(true);
  });
});

describe("AnalysisPanel — tuzatish", () => {
  it("🔴 BIR BOSISHDA TURNI O'ZGARTIRADI", async () => {
    const { w, commits } = panel("anova_oneway");
    await w.vm.$nextTick();

    await w.find("[data-rol='group'] .tuzat").trigger("click");
    await w.vm.$nextTick();

    expect(commits).toHaveLength(1);
    expect(commits[0]).toEqual({ index: 1, key: "measure", value: "nominal" });
  });

  it("🔴 SAQLASHNI O'ZI CHAQIRADI", async () => {
    // Avtosaqlash watcher'i `VariablesTab` ichida, u esa Tahlil
    // yorlig'ida unmount qilingan. Usiz o'zgarish serverga yetib
    // bormasdi: ekranda tuzatilgandek ko'rinardi, sahifa
    // yangilanganda qaytib kelardi.
    const { w, saqlashlar } = panel("anova_oneway");
    await w.vm.$nextTick();
    await w.find("[data-rol='group'] .tuzat").trigger("click");
    await w.vm.$nextTick();
    expect(saqlashlar).toHaveLength(1);
  });

  it("tuzatgandan keyin xabar chiqadi", async () => {
    const { w } = panel("anova_oneway");
    await w.vm.$nextTick();
    await w.find("[data-rol='group'] .tuzat").trigger("click");
    await w.vm.$nextTick();

    const xabar = w.find(".tuzatildi");
    expect(xabar.exists()).toBe(true);
    expect(xabar.text()).toContain("guruh");
    expect(xabar.text()).toContain(olchovNomi("nominal"));
  });

  it("🔴 BEKOR QILISH ESKI TURNI QAYTARADI", async () => {
    const { w, commits, saqlashlar } = panel("anova_oneway");
    await w.vm.$nextTick();
    await w.find("[data-rol='group'] .tuzat").trigger("click");
    await w.vm.$nextTick();

    await w.find(".tuzatildi .link").trigger("click");
    await w.vm.$nextTick();

    expect(commits).toHaveLength(2);
    expect(commits[1]).toEqual({ index: 1, key: "measure", value: "scale" });
    expect(saqlashlar).toHaveLength(2);
    expect(w.find(".tuzatildi").exists()).toBe(false);
  });

  it("tuzatilgan o'zgaruvchi ro'yxatga TUSHADI", async () => {
    const { w } = panel("anova_oneway");
    await w.vm.$nextTick();
    await w.find("[data-rol='group'] .tuzat").trigger("click");
    await w.vm.$nextTick();

    const nomlar = w.findAll("select")[2].findAll("option").map(o => o.text());
    expect(nomlar).toContain("guruh");
    // `ball` hamon ro'yxatda yo'q (12 xil qiymat), lekin `guruh`
    // endi izohlar orasida ko'rinmaydi.
    expect(w.find("[data-rol='group']").text()).not.toMatch(/\bguruh\b —/);
  });

  it("metod almashsa xabar tozalanadi", async () => {
    const { w } = panel("anova_oneway");
    await w.vm.$nextTick();
    await w.find("[data-rol='group'] .tuzat").trigger("click");
    await w.vm.$nextTick();

    w.vm.method = "correlation";
    await w.vm.$nextTick();
    expect(w.find(".tuzatildi").exists()).toBe(false);
  });
});
