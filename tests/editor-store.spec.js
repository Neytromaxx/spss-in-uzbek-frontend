// tests/editor-store.spec.js — `editor` store'ning natija bilan ishlashi.
//
// 🔴 NIMA UCHUN BU FAYL BOR
//
// `ADD_RESULT` backend javobini frontend holatiga o'giradi. U jimgina
// maydon tashlab yuborsa, hech narsa yiqilmaydi — shunchaki ekranda
// bir narsa KO'RINMAY qoladi. Aynan shunday bo'lgan edi: `title` va
// `meta` tashlanardi, natijada har bir tahlil "Tahlil natijasi" deb
// nomlanardi va statistik ogohlantirishlar foydalanuvchiga yetmasdi.
//
// Shuning uchun bu testlar maydonlarni BITTALAB tekshiradi.
//
// 08-vazifada `result` (birlik) `results: []` ga almashdi, lekin
// AYNAN shu xavf qoldi — o'girish kodi o'sha kod. Testlar ham
// shuning uchun saqlanib qoldi, faqat ro'yxatning birinchi
// elementiga qaraydi.
//
// Ro'yxatning o'zi (dubl, eskirganlik, tartib) —
// `tests/results-list.spec.js` da.

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

// Ro'yxatning birinchi (eng yangi) elementi.
function n(s) {
  return s.results[0];
}

describe("ADD_RESULT — javobni o'girish", () => {
  it("sarlavhani saqlaydi", () => {
    // Ilgari tashlanardi -> ResultsTab doim "Tahlil natijasi" ko'rsatardi.
    const s = stateFactory();
    mutations.ADD_RESULT(s, javob());
    expect(n(s).title).toBe("Kesishma jadvali va xi-kvadrat testi");
  });

  it("meta.warnings va meta.assumptions ni saqlaydi", () => {
    // Ilgari tashlanardi -> statistik ogohlantirish ko'rinmasdi.
    const s = stateFactory();
    mutations.ADD_RESULT(s, javob());
    expect(n(s).meta.warnings).toHaveLength(1);
    expect(n(s).meta.warnings[0]).toContain("Kutilgan chastotasi");
    expect(n(s).meta.assumptions).toHaveLength(1);
  });

  it("type va params ni saqlaydi (eksport shularga tayanadi)", () => {
    const s = stateFactory();
    mutations.ADD_RESULT(s, javob());
    expect(n(s).type).toBe("crosstab");
    expect(n(s).params).toEqual({ variables: ["a", "b"] });
  });

  it("grafiklarni saqlaydi", () => {
    // Grafiklar `tables` bilan bir xil yo'ldan keladi; biri tushib
    // qolsa ikkinchisi ham tushib qolgan bo'lishi mumkin.
    const s = stateFactory();
    mutations.ADD_RESULT(s, javob());
    expect(n(s).charts).toHaveLength(1);
    expect(n(s).charts[0].kind).toBe("bar");
  });

  it("jadvallarni saqlaydi", () => {
    const s = stateFactory();
    mutations.ADD_RESULT(s, javob());
    expect(n(s).tables).toHaveLength(1);
    expect(n(s).tables[0].id).toBe("ct");
  });

  it("legacy_columns bo'lsa ustunli ko'rinishni undan oladi", () => {
    const s = stateFactory();
    mutations.ADD_RESULT(s, javob({ legacy_columns: { columns: { age: { analysis: "descriptive" } } } }));
    expect(n(s).columns.age.analysis).toBe("descriptive");
  });

  it("bo'sh yoki chala javobda yiqilmaydi", () => {
    const s = stateFactory();
    mutations.ADD_RESULT(s, {});
    expect(n(s).tables).toEqual([]);
    expect(n(s).charts).toEqual([]);
    expect(n(s).columns).toEqual({});
    expect(n(s).title).toBeNull();
    expect(n(s).meta).toBeNull();
  });
});

describe("element shakli", () => {
  // Har bir element bir xil kalitlarni bersin — aks holda
  // komponentlar ba'zan `undefined` bilan ishlashga majbur.
  const kutilgan = [
    "id", "type", "params", "title", "meta", "columns", "tables", "charts",
    "rows_hash", "created_at", "saved", "saved_id", "stale", "selected",
  ];

  it("to'liq javobda hamma kalit bor", () => {
    const s = stateFactory();
    mutations.ADD_RESULT(s, javob());
    expect(Object.keys(n(s)).sort()).toEqual([...kutilgan].sort());
  });

  it("chala javobda ham hamma kalit bor", () => {
    const s = stateFactory();
    mutations.ADD_RESULT(s, {});
    expect(Object.keys(n(s)).sort()).toEqual([...kutilgan].sort());
  });

  it("RESET ro'yxatni bo'shatadi", () => {
    const s = stateFactory();
    mutations.ADD_RESULT(s, javob());
    mutations.RESET(s);
    expect(s.results).toEqual([]);
    expect(s.activeId).toBeNull();
  });
});
