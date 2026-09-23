// tests/qadamlar.spec.js — qadamlar chizig'i va «keyingi qadam».
//
// ── NIMANI HIMOYA QILADI ──
//
// Chiziq jimgina yolg'on gapirishi mumkin: ✓ ko'rsatib turib,
// aslida muammo bo'lishi. Bu ogohlantirishdan ham yomon —
// foydalanuvchi tekshirilgan deb o'ylab o'tib ketadi.
//
// 🔴 Ikkinchi xavf — tugmaning TO'SIB QO'YISHI. Tayyorlik
// tekshiruvi faqat ogohlantirishi kerak: qoidalar muqarrar
// ravishda ba'zan adashadi va to'sish odamni ishidan
// to'xtatib qo'yardi.

import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";

import {
  BELGILAR,
  ETIBOR,
  HALI_EMAS,
  QADAMLAR,
  TAYYOR,
  davomIzohi,
  keyingiQadam,
  qadamHolatlari,
} from "../src/qadamlar";
import EditorPage from "../src/pages/EditorPage.vue";

function holat(kirish) {
  return Object.fromEntries(
    qadamHolatlari(kirish).map(q => [q.key, q.holat]),
  );
}

const TOLIQ = {
  rows: [{ a: "1" }],
  variables: [{ name: "a", measure: "scale" }],
  muammolar: [],
  natijalar: [{ id: "n1", stale: false }],
};

// ══════════════════════ qadam holatlari ══════════════════════

describe("qadamHolatlari", () => {
  it("to'liq tayyor fayl", () => {
    expect(holat(TOLIQ)).toEqual({
      data: TAYYOR, variables: TAYYOR, analysis: TAYYOR, results: TAYYOR,
    });
  });

  it("bo'sh fayl — hammasi hali emas", () => {
    expect(holat({})).toEqual({
      data: HALI_EMAS, variables: HALI_EMAS,
      analysis: HALI_EMAS, results: HALI_EMAS,
    });
  });

  it("qator yo'q — Ma'lumot hali emas", () => {
    expect(holat({ ...TOLIQ, rows: [] }).data).toBe(HALI_EMAS);
  });

  it("🔴 TAYYORLIK MUAMMOSI — O'zgaruvchilar e'tibor talab qiladi", () => {
    expect(holat({ ...TOLIQ, muammolar: [{ kod: "x" }] }).variables).toBe(ETIBOR);
  });

  it("🔴 O'ZGARUVCHISIZ FAYL ✓ KO'RSATMAYDI", () => {
    // Muammolar ro'yxati bo'sh bo'lgani uchun u yolg'ondan
    // «tayyor» bo'lib chiqardi. Brifda bu holat yozilmagan.
    expect(holat({ ...TOLIQ, variables: [] }).variables).toBe(HALI_EMAS);
  });

  it("natija yo'q — Tahlil va Natija hali emas", () => {
    const h = holat({ ...TOLIQ, natijalar: [] });
    expect(h.analysis).toBe(HALI_EMAS);
    expect(h.results).toBe(HALI_EMAS);
  });

  it("🔴 ESKIRGAN NATIJA — Natija e'tibor talab qiladi", () => {
    // 08-vazifadagi `stale`: natija boshqa tanlamadan chiqqan.
    const h = holat({ ...TOLIQ, natijalar: [{ stale: true }] });
    expect(h.analysis).toBe(TAYYOR); // tahlil baribir bajarilgan
    expect(h.results).toBe(ETIBOR);
  });

  it("bittasi eskirgan bo'lsa ham e'tibor", () => {
    expect(holat({ ...TOLIQ, natijalar: [{ stale: false }, { stale: true }] })
      .results).toBe(ETIBOR);
  });

  it("to'rtala qadam ham qaytadi, tartibi saqlanadi", () => {
    expect(qadamHolatlari(TOLIQ).map(q => q.key))
      .toEqual(QADAMLAR.map(q => q.key));
  });

  it("har bir qadamda raqam, nom va yorliq bor", () => {
    for (const q of qadamHolatlari(TOLIQ)) {
      expect(q.raqam).toBeGreaterThan(0);
      expect(q.nom).toBeTruthy();
      expect(["data", "variables", "results"]).toContain(q.tab);
    }
  });

  it("kirishsiz chaqirilsa ham yiqilmaydi", () => {
    expect(() => qadamHolatlari()).not.toThrow();
  });
});

describe("BELGILAR", () => {
  it("uchala holat uchun ham belgi bor", () => {
    for (const h of [TAYYOR, ETIBOR, HALI_EMAS]) {
      expect(BELGILAR[h]).toBeTruthy();
    }
  });

  it("belgilar bir-biridan farq qiladi", () => {
    expect(new Set(Object.values(BELGILAR)).size).toBe(3);
  });
});

// ══════════════════════ keyingi qadam ══════════════════════

describe("keyingiQadam", () => {
  it("Ma'lumotdan — o'zgaruvchilarga", () => {
    expect(keyingiQadam("data")).toEqual({
      tab: "variables", matn: "Keyingi: o‘zgaruvchilarni tekshirish →",
    });
  });

  it("O'zgaruvchilardan — tahlilga", () => {
    expect(keyingiQadam("variables").tab).toBe("results");
  });

  it("Tahlil yorlig'ida tugma yo'q", () => {
    // Natija chiqqach ro'yxat o'zi to'ldiriladi (08-vazifa).
    expect(keyingiQadam("results")).toBe(null);
  });
});

describe("davomIzohi", () => {
  it("muammo bo'lsa sonini aytadi", () => {
    expect(davomIzohi([1, 2])).toBe("2 ta muammo bor — baribir davom etish");
  });

  it("muammo yo'q bo'lsa izoh ham yo'q", () => {
    expect(davomIzohi([])).toBe("");
    expect(davomIzohi(null)).toBe("");
  });
});

// ══════════════════════ EditorPage ══════════════════════

function dokon({ tab = "data", variables = [], rows = [], results = [] } = {}) {
  return createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({
          activeTab: tab,
          schema: { variables },
          rows,
          results,
          activeId: null,
          resultsOrder: "yangi",
          file: { id: "f1", title: "Sinov" },
          saving: false,
          saved: true,
          analyzing: false,
          schemaError: null,
          filter: null,
          rowSelected: [],
        }),
        mutations: { SET_TAB: (s, t) => { s.activeTab = t; } },
        actions: { saveRows: vi.fn(), saveSchema: vi.fn(), analyze: vi.fn() },
      },
      auth: {
        namespaced: true,
        state: () => ({ user: null }),
        getters: { isAuthenticated: () => false, displayName: () => "" },
        mutations: { SET_LOGIN_VISIBLE: () => {} },
      },
    },
  });
}

function sahifa(cfg) {
  return mount(EditorPage, {
    global: {
      plugins: [dokon(cfg)],
      stubs: {
        TopBar: true, VariablesTab: true, DataTab: true, ResultsTab: true,
      },
    },
  });
}

const BITTA_USTUN = [{ name: "a", measure: "scale" }];

describe("EditorPage — qadamlar chizig'i", () => {
  it("to'rtala qadam chiziladi", () => {
    const w = sahifa();
    expect(w.findAll(".qadam")).toHaveLength(4);
  });

  it("qadamda raqam va nom ko'rinadi", () => {
    const w = sahifa();
    const birinchi = w.find(".qadam");
    expect(birinchi.find(".raqam").text()).toBe("1");
    expect(birinchi.find(".qadam-nom").text()).toBe("Ma'lumot");
  });

  it("🔴 HOLAT SINFI CHIZIQDA KO'RINADI", () => {
    const w = sahifa({
      variables: BITTA_USTUN,
      rows: [{ a: "1" }, { a: "2" }, { a: "1" }],
    });
    // `a` — `scale`, 2 xil takrorlanuvchi qiymat → kod_ehtimoli
    expect(w.find("[data-qadam='data']").classes()).toContain("tayyor");
    expect(w.find("[data-qadam='variables']").classes()).toContain("etibor");
    expect(w.find("[data-qadam='analysis']").classes()).toContain("hali_emas");
  });

  it("joriy qadam belgilanadi", () => {
    const w = sahifa({ tab: "data" });
    expect(w.find("[data-qadam='data']").classes()).toContain("joriy");
    expect(w.find("[data-qadam='variables']").classes()).not.toContain("joriy");
  });

  it("🔴 BITTA YORLIQDAGI IKKI QADAMDAN OXIRGISI JORIY", () => {
    // `Tahlil` va `Natija` bitta yorliqda: foydalanuvchi natija
    // ro'yxatini ko'rayotgan bo'lsa, tahlilni allaqachon tanlagan.
    const w = sahifa({ tab: "results" });
    expect(w.find("[data-qadam='results']").classes()).toContain("joriy");
    expect(w.find("[data-qadam='analysis']").classes()).not.toContain("joriy");
  });

  it("qadamni bosish yorliqni almashtiradi", async () => {
    const w = sahifa({ tab: "data" });
    await w.find("[data-qadam='variables']").trigger("click");
    expect(w.vm.$store.state.editor.activeTab).toBe("variables");
  });

  it("chiziq yorliqlarning o'rnini bosmaydi", () => {
    // Ikkalasi ham qoladi — chiziq yo'nalish, yorliqlar
    // navigatsiya.
    const w = sahifa();
    expect(w.findAll(".qadam").length).toBe(4);
    expect(w.findAll(".tabs .tab").length).toBe(3);
  });

  it("yorliqlar tartibi chiziq bilan bir xil", () => {
    // Ikki qator qarama-qarshi tartibda bo'lsa, foydalanuvchi
    // qaysi biriga ishonishni bilmasdi.
    const w = sahifa();
    const yorliqlar = w.findAll(".tabs .tab").map(t => t.text());
    expect(yorliqlar[0]).toContain("Ma");
    expect(yorliqlar[1]).toContain("zgaruvchilar");
    expect(yorliqlar[2]).toContain("Tahlil");
  });
});

describe("EditorPage — keyingi qadam tugmasi", () => {
  it("Ma'lumot yorlig'ida tugma bor", () => {
    const w = sahifa({ tab: "data" });
    expect(w.find(".keyingi").text()).toContain("o‘zgaruvchilarni tekshirish");
  });

  it("bosilganda o'zgaruvchilarga o'tadi", async () => {
    const w = sahifa({ tab: "data" });
    await w.find(".keyingi").trigger("click");
    expect(w.vm.$store.state.editor.activeTab).toBe("variables");
  });

  it("Tahlil yorlig'ida tugma yo'q", () => {
    expect(sahifa({ tab: "results" }).find(".keyingi").exists()).toBe(false);
  });

  it("🔴 MUAMMO BO'LSA HAM TUGMA ISHLAYDI", async () => {
    // Tayyorlik tekshiruvi hech narsani TO'SMAYDI.
    const w = sahifa({
      tab: "variables",
      variables: BITTA_USTUN,
      rows: [{ a: "1" }, { a: "2" }, { a: "1" }],
    });
    const tugma = w.find(".keyingi");
    expect(tugma.attributes("disabled")).toBeUndefined();

    await tugma.trigger("click");
    expect(w.vm.$store.state.editor.activeTab).toBe("results");
  });

  it("muammo soni tugma yonida aytiladi", () => {
    const w = sahifa({
      tab: "variables",
      variables: BITTA_USTUN,
      rows: [{ a: "1" }, { a: "2" }, { a: "1" }],
    });
    expect(w.find(".qadam-izoh").text()).toBe("1 ta muammo bor — baribir davom etish");
  });

  it("muammosiz holatda izoh yo'q", () => {
    const w = sahifa({
      tab: "variables",
      variables: BITTA_USTUN,
      rows: [{ a: "1" }, { a: "2" }, { a: "3" }, { a: "4" }],
    });
    expect(w.find(".qadam-izoh").exists()).toBe(false);
  });

  it("izoh faqat O'zgaruvchilar yorlig'ida", () => {
    const w = sahifa({
      tab: "data",
      variables: BITTA_USTUN,
      rows: [{ a: "1" }, { a: "2" }, { a: "1" }],
    });
    expect(w.find(".qadam-izoh").exists()).toBe(false);
  });
});
