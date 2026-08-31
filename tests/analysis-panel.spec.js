// tests/analysis-panel.spec.js — panel backendga NIMA yuborishi.
//
// 🔴 NIMA UCHUN BU FAYL BOR
//
// Panel `type` va `params` ni yig'ib `editor/analyze` ga uzatadi. Backend
// esa har bir metod uchun ANIQ parametr nomlarini kutadi
// (`app/modules/statistics/<metod>.py` dagi `params.get(...)`).
//
// Bu nomlar mos kelmasa, hech narsa yiqilmaydi: so'rov 200 qaytaradi,
// lekin metod bo'sh yoki noto'g'ri natija beradi. Shuning uchun testlar
// aynan YUBORILGAN payload ni tekshiradi.
//
// Metodlar ro'yxati backenddagi `engine.ANALYSES` bilan bir xil bo'lishi
// kerak. Buni bitta repodan tekshirib bo'lmaydi, shuning uchun bu yerda
// ro'yxat qotirilgan: u o'zgarsa, test o'zgarishni KO'RSATADI.

import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import AnalysisPanel from "../src/components/analysis/AnalysisPanel.vue";

// Backend `engine.ANALYSES` registri (16 ta metod).
const BACKEND_METODLARI = [
  "auto",
  "reliability",
  "correlation",
  "partial_correlation",
  "normality",
  "ttest_ind",
  "ttest_paired",
  "anova_oneway",
  "mannwhitney",
  "wilcoxon",
  "kruskal",
  "friedman",
  "crosstab",
  "chi_gof",
  "fisher",
  "regression_linear",
];

const OZGARUVCHILAR = [
  { name: "x1", label: "X bir", measure: "scale" },
  { name: "x2", label: "X ikki", measure: "scale" },
  { name: "x3", label: "X uch", measure: "scale" },
  { name: "g2", label: "Guruh", measure: "nominal" },
  { name: "k2", label: "Kategoriya", measure: "nominal" },
];

function panelYasa() {
  const dispatch = vi.fn().mockResolvedValue(undefined);
  const store = {
    state: { editor: { schema: { variables: OZGARUVCHILAR }, analyzing: false } },
    dispatch,
  };
  const wrapper = mount(AnalysisPanel, {
    global: { provide: { store }, mocks: { $store: store } },
  });
  return { wrapper, dispatch };
}

// `useStore()` provide/inject orqali ishlaydi — vuex kaliti `store`.
vi.mock("vuex", async () => {
  const { inject } = await import("vue");
  return { useStore: () => inject("store") };
});

async function ishgaTushir(wrapper, metod, tanlov) {
  const vm = wrapper.vm;
  vm.method = metod;
  await wrapper.vm.$nextTick();
  Object.assign(vm, tanlov);
  await wrapper.vm.$nextTick();
  await vm.run();
}

describe("panel metodlar ro'yxati", () => {
  it("backend registridagi 16 metodning hammasini taklif qiladi", () => {
    const { wrapper } = panelYasa();
    const kalitlar = wrapper.findAll("select.method-select option").map((o) => o.element.value);
    expect(kalitlar.sort()).toEqual([...BACKEND_METODLARI].sort());
  });
});

describe("yuborilgan payload backend kutgan nomlarga mos", () => {
  const holatlar = [
    ["reliability", { selected: ["x1", "x2", "x3"] }, { items: ["x1", "x2", "x3"] }],
    ["correlation", { selected: ["x1", "x2"], corrMethod: "spearman" },
      { variables: ["x1", "x2"], method: "spearman" }],
    ["partial_correlation", { selected: ["x1", "x2", "x3"], controls: ["x3"] },
      { variables: ["x1", "x2"], control: ["x3"] }],
    ["normality", { selected: ["x1"], normMethod: "ks" }, { variables: ["x1"], method: "ks" }],
    ["ttest_ind", { dependent: "x1", groupVar: "g2" }, { dependent: "x1", group: "g2" }],
    ["ttest_paired", { selected: ["x1", "x2"] }, { variables: ["x1", "x2"] }],
    ["anova_oneway", { dependent: "x1", groupVar: "g2" }, { dependent: "x1", group: "g2" }],
    ["mannwhitney", { dependent: "x1", groupVar: "g2" }, { dependent: "x1", group: "g2" }],
    ["wilcoxon", { selected: ["x1", "x2"] }, { variables: ["x1", "x2"] }],
    ["kruskal", { dependent: "x1", groupVar: "g2" }, { dependent: "x1", group: "g2" }],
    ["friedman", { selected: ["x1", "x2", "x3"] }, { variables: ["x1", "x2", "x3"] }],
    ["crosstab", { selected: ["g2", "k2"] }, { variables: ["g2", "k2"] }],
    ["chi_gof", { selected: ["g2"] }, { variables: ["g2"] }],
    ["fisher", { selected: ["g2", "k2"] }, { variables: ["g2", "k2"] }],
    ["regression_linear", { dependent: "x1", selected: ["x2", "x3"] },
      { dependent: "x1", predictors: ["x2", "x3"] }],
  ];

  it.each(holatlar)("%s", async (metod, tanlov, kutilganParams) => {
    const { wrapper, dispatch } = panelYasa();
    await ishgaTushir(wrapper, metod, tanlov);

    expect(dispatch).toHaveBeenCalledTimes(1);
    const [nom, yuk] = dispatch.mock.calls[0];
    expect(nom).toBe("editor/analyze");
    expect(yuk.type).toBe(metod);
    expect(yuk.params).toEqual(kutilganParams);
  });

  it("auto hech qanday parametr talab qilmaydi", async () => {
    const { wrapper, dispatch } = panelYasa();
    await ishgaTushir(wrapper, "auto", {});
    expect(dispatch.mock.calls[0][1]).toEqual({ type: "auto", params: {} });
  });
});

describe("validatsiya so'rovni to'xtatadi", () => {
  const notogri = [
    ["reliability", { selected: ["x1"] }, /Kamida 2/],
    ["correlation", { selected: ["x1"] }, /Kamida 2/],
    ["normality", { selected: [] }, /Kamida 1/],
    ["ttest_paired", { selected: ["x1"] }, /Aynan 2/],
    ["friedman", { selected: ["x1", "x2"] }, /Kamida 3/],
    ["crosstab", { selected: ["g2"] }, /Aynan 2/],
    ["chi_gof", { selected: ["g2", "k2"] }, /Aynan 1/],
    ["ttest_ind", { dependent: "", groupVar: "" }, /Bog'liq va guruhlovchi/],
    ["regression_linear", { dependent: "x1", selected: [] }, /Kamida 1 ta mustaqil/],
  ];

  it.each(notogri)("%s — xato bo'lsa dispatch chaqirilmaydi", async (metod, tanlov, naqsh) => {
    const { wrapper, dispatch } = panelYasa();
    await ishgaTushir(wrapper, metod, tanlov);
    expect(dispatch).not.toHaveBeenCalled();
    expect(wrapper.vm.error).toMatch(naqsh);
  });
});

describe("metod almashtirilganda", () => {
  it("oldingi tanlovlar tozalanadi", async () => {
    const { wrapper } = panelYasa();
    const vm = wrapper.vm;
    vm.method = "correlation";
    await wrapper.vm.$nextTick();
    vm.selected = ["x1", "x2"];
    vm.dependent = "x1";
    await wrapper.vm.$nextTick();

    vm.method = "regression_linear";
    await wrapper.vm.$nextTick();

    // Aks holda korrelyatsiya uchun tanlangan o'zgaruvchilar regressiyaga
    // "predictor" bo'lib o'tib ketardi.
    expect(vm.selected).toEqual([]);
    expect(vm.dependent).toBe("");
  });
});
