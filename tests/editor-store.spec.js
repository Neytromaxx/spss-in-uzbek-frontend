// tests/editor-store.spec.js — `editor` store'ning natija bilan ishlashi.
//
// 🔴 NIMA UCHUN BU FAYL BOR
//
// `SET_RESULT` backend javobini frontend holatiga o'giradi. U jimgina
// maydon tashlab yuborsa, hech narsa yiqilmaydi — shunchaki ekranda
// bir narsa KO'RINMAY qoladi. Aynan shunday bo'lgan edi: `title` va
// `meta` tashlanardi, natijada har bir tahlil "Tahlil natijasi" deb
// nomlanardi va statistik ogohlantirishlar foydalanuvchiga yetmasdi.
//
// Shuning uchun bu testlar maydonlarni BITTALAB tekshiradi.

import { describe, it, expect } from "vitest";
import editor from "../src/store/editor";

const { mutations, state: stateFactory } = editor;

// Backend `/analyze/files/{id}` dan qaytaradigan haqiqiy shakl.
function javob(qismlar = {}) {
  return {
    type: "crosstab",
    params: { variables: ["a", "b"] },
    result: {
      analysis: "crosstab",
      title: "Kesishma jadvali va xi-kvadrat testi",
      variables: ["a", "b"],
      tables: [{ id: "ct", title: "Kesishma jadvali", columns: [], rows: [], notes: [] }],
      charts: [
        { id: "bar_crosstab", kind: "bar", title: "a × b",
          categories: ["Ha", "Yo'q"], counts: [5, 3] },
      ],
      meta: {
        methods_shown: [],
        alpha: 0.05,
        warnings: ["Kutilgan chastotasi 5 dan kichik kataklar: 4 ta (100%)."],
        assumptions: ["2×2 jadval uchun Fisher aniq testi tavsiya etiladi."],
      },
      ...qismlar,
    },
  };
}

describe("SET_RESULT", () => {
  it("sarlavhani saqlaydi", () => {
    // Ilgari tashlanardi -> ResultsTab doim "Tahlil natijasi" ko'rsatardi.
    const s = stateFactory();
    mutations.SET_RESULT(s, javob());
    expect(s.result.title).toBe("Kesishma jadvali va xi-kvadrat testi");
  });

  it("meta.warnings va meta.assumptions ni saqlaydi", () => {
    // Ilgari tashlanardi -> statistik ogohlantirish ko'rinmasdi.
    const s = stateFactory();
    mutations.SET_RESULT(s, javob());
    expect(s.result.meta.warnings).toHaveLength(1);
    expect(s.result.meta.warnings[0]).toContain("Kutilgan chastotasi");
    expect(s.result.meta.assumptions).toHaveLength(1);
  });

  it("type va params ni saqlaydi (eksport shularga tayanadi)", () => {
    const s = stateFactory();
    mutations.SET_RESULT(s, javob());
    expect(s.result.type).toBe("crosstab");
    expect(s.result.params).toEqual({ variables: ["a", "b"] });
  });

  it("grafiklarni saqlaydi", () => {
    // Grafiklar `tables` bilan bir xil yo'ldan keladi; biri tushib
    // qolsa ikkinchisi ham tushib qolgan bo'lishi mumkin.
    const s = stateFactory();
    mutations.SET_RESULT(s, javob());
    expect(s.result.charts).toHaveLength(1);
    expect(s.result.charts[0].kind).toBe("bar");
  });

  it("jadvallarni saqlaydi", () => {
    const s = stateFactory();
    mutations.SET_RESULT(s, javob());
    expect(s.result.tables).toHaveLength(1);
    expect(s.result.tables[0].id).toBe("ct");
  });

  it("legacy_columns bo'lsa ustunli ko'rinishni undan oladi", () => {
    const s = stateFactory();
    mutations.SET_RESULT(s, javob({ legacy_columns: { columns: { age: { analysis: "descriptive" } } } }));
    expect(s.result.columns.age.analysis).toBe("descriptive");
  });

  it("bo'sh yoki chala javobda yiqilmaydi", () => {
    const s = stateFactory();
    mutations.SET_RESULT(s, {});
    expect(s.result.tables).toEqual([]);
    expect(s.result.charts).toEqual([]);
    expect(s.result.columns).toEqual({});
    expect(s.result.title).toBeNull();
    expect(s.result.meta).toBeNull();
  });
});

describe("natija holatining shakli", () => {
  // Boshlang'ich holat, RESET va SET_RESULT bir xil kalitlarni bersin —
  // aks holda komponentlar ba'zan `undefined` bilan ishlashga majbur.
  const kutilgan = ["type", "params", "title", "meta", "columns", "tables", "charts"];

  it("boshlang'ich holatda hamma kalit bor", () => {
    expect(Object.keys(stateFactory().result).sort()).toEqual([...kutilgan].sort());
  });

  it("RESET dan keyin ham hamma kalit bor", () => {
    const s = stateFactory();
    mutations.SET_RESULT(s, javob());
    mutations.RESET(s);
    expect(Object.keys(s.result).sort()).toEqual([...kutilgan].sort());
    expect(s.result.title).toBeNull();
  });

  it("SET_RESULT dan keyin ham hamma kalit bor", () => {
    const s = stateFactory();
    mutations.SET_RESULT(s, javob());
    expect(Object.keys(s.result).sort()).toEqual([...kutilgan].sort());
  });
});
