// tests/tahlil-rollari.spec.js — tahlil rollari jadvali.
//
// ── NIMANI HIMOYA QILADI ──
//
// Jadval backend `require_measure` dan chetga chiqsa, ikki xil
// xato chiqadi va ikkalasi ham JIMGINA:
//
//   qattiqroq  → foydalanuvchi TO'G'RI tahlilni qila olmaydi va
//                sababini hech qayerda ko'rmaydi (o'zgaruvchi
//                shunchaki ro'yxatda yo'q);
//   yumshoqroq → «Hisoblash» dan keyin backend xatosi.
//
// Birinchisi aynan shu vazifa tuzatayotgan nuqson edi: Likert
// bandi (`ordinal`) Mann-Uitni ro'yxatida ko'rinmasdi, holbuki
// noparametrik test aynan uning uchun mo'ljallangan.

import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";

import {
  ROLLAR,
  TAHLILLAR,
  ajrat,
  mosmi,
  rolTalabi,
  rolTurlari,
} from "../src/tahlil-rollari";
import { OLCHOV_NOMI } from "../src/olchov";
import AnalysisPanel from "../src/components/analysis/AnalysisPanel.vue";

// ══════════════════════ backend bilan moslik ══════════════════════
//
// Quyidagi kutilgan qiymatlar `grep -rn "require_measure" app/`
// natijasidan olingan. Backendda qoida o'zgarsa, shu ro'yxat ham
// o'zgarsin — aks holda test emas, taxmin bo'lib qoladi.

const KUTILGAN = {
  // tahlil, rol, ruxsat, manba
  reliability: { items: ["scale", "ordinal"] }, //          reliability.py:35
  correlation: { variables: ["scale", "ordinal"] }, //      correlation.py:68
  partial_correlation: { variables: ["scale"], control: ["scale"] }, // partial.py:41
  normality: { variables: ["scale"] }, //                   normality.py:88
  ttest_ind: { dependent: ["scale"] }, //                   ttest.py:38
  ttest_paired: { variables: ["scale"] }, //                ttest.py:175
  anova_oneway: { dependent: ["scale"] }, //                anova.py:226
  mannwhitney: { dependent: ["scale", "ordinal"] }, //      nonparametric.py:55
  wilcoxon: { variables: ["scale", "ordinal"] }, //         nonparametric.py:160
  kruskal: { dependent: ["scale", "ordinal"] }, //          nonparametric.py:252
  friedman: { variables: ["scale", "ordinal"] }, //         nonparametric.py:311
  crosstab: { variables: ["nominal", "ordinal"] }, //       categorical.py:62
  chi_gof: { variables: ["nominal", "ordinal"] }, //        categorical.py:179
  fisher: { variables: ["nominal", "ordinal"] }, //         categorical.py:231
  regression_linear: { dependent: ["scale"], predictors: ["scale"] }, // regression.py:42,44
};

describe("ROLLAR — backend `require_measure` bilan moslik", () => {
  for (const [tahlil, rollar] of Object.entries(KUTILGAN)) {
    for (const [rol, ruxsat] of Object.entries(rollar)) {
      it(`${tahlil}.${rol} → ${ruxsat.join(", ")}`, () => {
        expect(rolTurlari(tahlil, rol)).toEqual(ruxsat);
      });
    }
  }
});

describe("🔴 noparametrik testlar `ordinal` ni QABUL QILADI", () => {
  // Bu vazifaning asosiy sababi. Likert bandi — noparametrik test
  // aynan uning uchun mo'ljallangan — ilgari ro'yxatda yo'q edi.
  it.each(["mannwhitney", "kruskal"])("%s", tahlil => {
    expect(mosmi(tahlil, "dependent", "ordinal")).toBe(true);
    expect(mosmi(tahlil, "dependent", "scale")).toBe(true);
  });

  it("parametrik testlar esa QABUL QILMAYDI", () => {
    // t-test intervalli shkala talab qiladi — bu cheklov
    // statistik jihatdan to'g'ri, yumshatilmasin.
    expect(mosmi("ttest_ind", "dependent", "ordinal")).toBe(false);
    expect(mosmi("anova_oneway", "dependent", "ordinal")).toBe(false);
    expect(mosmi("ttest_paired", "variables", "ordinal")).toBe(false);
  });

  it("`nominal` hech bir raqamli tahlilga kirmaydi", () => {
    for (const tahlil of ["mannwhitney", "kruskal", "ttest_ind", "anova_oneway"]) {
      expect(mosmi(tahlil, "dependent", "nominal")).toBe(false);
    }
  });
});

describe("kategorik tahlillar", () => {
  it("`scale` qabul qilinmaydi", () => {
    for (const tahlil of ["crosstab", "chi_gof", "fisher"]) {
      expect(mosmi(tahlil, "variables", "scale")).toBe(false);
      expect(mosmi(tahlil, "variables", "nominal")).toBe(true);
      expect(mosmi(tahlil, "variables", "ordinal")).toBe(true);
    }
  });
});

describe("katalog izchilligi", () => {
  it("🔴 har bir tahlil IKKALA ro'yxatda ham bor", () => {
    // Ilgari `METHODS` komponent ichida edi va qoidalar bilan mos
    // kelishini hech narsa tekshirmasdi.
    expect(Object.keys(ROLLAR).sort()).toEqual(TAHLILLAR.map(t => t.key).sort());
  });

  it("`auto` o'zgaruvchi olmaydi", () => {
    expect(ROLLAR.auto).toEqual({});
  });

  it("har bir ruxsat ro'yxati haqiqiy o'lchov turlaridan", () => {
    const turlar = Object.keys(OLCHOV_NOMI);
    for (const rollar of Object.values(ROLLAR)) {
      for (const ruxsat of Object.values(rollar)) {
        expect(ruxsat.length).toBeGreaterThan(0);
        for (const t of ruxsat) expect(turlar).toContain(t);
      }
    }
  });
});

describe("cheklovsiz rol", () => {
  it("noma'lum rol hamma turni qabul qiladi", () => {
    // «Bilmayman» emas — backend tekshirmaydigan rol degani.
    expect(rolTurlari("ttest_ind", "yoq_rol")).toBe(null);
    expect(mosmi("ttest_ind", "yoq_rol", "nominal")).toBe(true);
    expect(rolTalabi("ttest_ind", "yoq_rol")).toBe("");
  });

  it("noma'lum tahlil ham to'smaydi", () => {
    expect(mosmi("yangi_tahlil", "dependent", "nominal")).toBe(true);
  });
});

// ══════════════════════ ajrat ══════════════════════

const OZGARUVCHILAR = [
  { name: "ball", measure: "scale" },
  { name: "likert", measure: "ordinal" },
  { name: "jins", measure: "nominal" },
];

describe("ajrat", () => {
  it("mos va mos kelmaganlarni ajratadi", () => {
    const { mos, nomos } = ajrat(OZGARUVCHILAR, "mannwhitney", "dependent");
    expect(mos.map(v => v.name)).toEqual(["ball", "likert"]);
    expect(nomos.map(v => v.name)).toEqual(["jins"]);
  });

  it("tartib saqlanadi", () => {
    const { mos } = ajrat([...OZGARUVCHILAR].reverse(), "mannwhitney", "dependent");
    expect(mos.map(v => v.name)).toEqual(["likert", "ball"]);
  });

  it("cheklovsiz rolda hammasi mos", () => {
    const { mos, nomos } = ajrat(OZGARUVCHILAR, "auto", "variables");
    expect(mos).toHaveLength(3);
    expect(nomos).toHaveLength(0);
  });

  it("bo'sh ro'yxatda yiqilmaydi", () => {
    expect(ajrat(null, "ttest_ind", "dependent")).toEqual({ mos: [], nomos: [] });
  });
});

describe("rolTalabi", () => {
  it("oddiy tilda aytadi", () => {
    expect(rolTalabi("mannwhitney", "dependent"))
      .toBe(`${OLCHOV_NOMI.scale} yoki ${OLCHOV_NOMI.ordinal}`);
    expect(rolTalabi("ttest_ind", "dependent")).toBe(OLCHOV_NOMI.scale);
  });
});

// ══════════════════════ AnalysisPanel ══════════════════════

function panel(method, variables = OZGARUVCHILAR) {
  const store = createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({ schema: { variables }, analyzing: false, file: { id: "f1" } }),
        actions: { analyze: () => {} },
      },
    },
  });
  const w = mount(AnalysisPanel, { global: { plugins: [store] } });
  w.vm.method = method;
  return w;
}

describe("AnalysisPanel — ro'yxatlar jadvaldan hosil bo'ladi", () => {
  it("🔴 MANN-UITNI'DA LIKERT BANDI TANLANADI", async () => {
    const w = panel("mannwhitney");
    await w.vm.$nextTick();
    const nomlar = w.findAll("select")[1].findAll("option").map(o => o.text());
    expect(nomlar).toContain("likert");
    expect(nomlar).toContain("ball");
    expect(nomlar).not.toContain("jins");
  });

  it("t-testda Likert bandi yo'q", async () => {
    const w = panel("ttest_ind");
    await w.vm.$nextTick();
    const nomlar = w.findAll("select")[1].findAll("option").map(o => o.text());
    expect(nomlar).toContain("ball");
    expect(nomlar).not.toContain("likert");
  });

  it("guruhlovchi ro'yxatida `scale` yo'q", async () => {
    const w = panel("anova_oneway");
    await w.vm.$nextTick();
    const nomlar = w.findAll("select")[2].findAll("option").map(o => o.text());
    expect(nomlar).toContain("jins");
    expect(nomlar).toContain("likert");
    expect(nomlar).not.toContain("ball");
  });

  it("🔴 O'LCHOVI YO'Q USTUN RO'YXATGA TUSHMAYDI", async () => {
    // «`scale` emas» degan tekshiruv uchala tur uchun `CAT` bilan
    // bir xil natija beradi, lekin o'lchovi aniqlanmagan ustunda
    // ajralib ketadi: u guruhlovchi bo'la olmaydi, chunki uning
    // toifa ekani ma'lum emas. Mutatsiya sinovi shuni ko'rsatdi.
    const w = panel("anova_oneway", [...OZGARUVCHILAR, { name: "noma_lum" }]);
    await w.vm.$nextTick();
    const nomlar = w.findAll("select")[2].findAll("option").map(o => o.text());
    expect(nomlar).not.toContain("noma_lum");
  });

  it("maydon yorlig'i talabni aytadi", async () => {
    const w = panel("mannwhitney");
    await w.vm.$nextTick();
    expect(w.text()).toContain(rolTalabi("mannwhitney", "dependent"));
  });

  it("tahlil ro'yxati katalogdan chiziladi", () => {
    const w = panel("auto");
    const nomlar = w.findAll("select")[0].findAll("option").map(o => o.text());
    expect(nomlar).toEqual(TAHLILLAR.map(t => t.label));
  });
});
