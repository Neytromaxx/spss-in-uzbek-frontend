// tests/filter.spec.js — Select Cases oqimi (frontend tomoni).
//
// Shart tilining o'zi backendda (`tests/test_condition.py`), filtrning
// tahlilga qo'llanishi `tests/test_filter_engine.py` da. Bu yerda
// frontendga xos narsalar: banner, chizilgan qatorlar, o'chirish/yoqish
// mantiqi va zahiralangan nom belgisi.

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "vuex";

vi.mock("../src/api", () => ({
  default: { put: vi.fn(), get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import api from "../src/api";
import DataTab from "../src/components/DataTab.vue";
import FilterModal from "../src/components/FilterModal.vue";
import editor from "../src/store/editor";
import { ZAHIRA_SOZLAR, zahiraIzohi, zahiralanganmi } from "../src/nomlar";

const { actions, mutations, state: stateFactory } = editor;

beforeEach(() => vi.clearAllMocks());

function holat() {
  const s = stateFactory();
  s.file = { id: "f1" };
  s.schema.variables = [
    { name: "yosh", measure: "scale" },
    { name: "jins", measure: "nominal" },
  ];
  return s;
}

// ── store: `open` filtrni ham o'qiydi ──

describe("open — filtr holati", () => {
  it("filtrsiz faylda bayroqlar bo'sh qoladi", () => {
    const s = holat();
    mutations.SET_FILTER(s, { filter: null, rowSelected: [] });
    expect(s.filter).toBe(null);
    expect(s.rowSelected).toEqual([]);
  });

  it("🔴 qator bayroqlari SERVERDAN keladi, frontend hisoblamaydi", async () => {
    // Frontend shartni qayta hisoblasa, jadvalda chizilgan qatorlar
    // tahlilga kirganlaridan farq qilib qolishi mumkin edi va buni
    // hech kim sezmasdi.
    const commit = vi.fn();
    api.get.mockResolvedValue({
      data: {
        file: { id: "f1" },
        schema: { variables: [] },
        filter: { expression: "jins = 2", enabled: true },
        rows: [
          { values: { jins: 2 }, selected: true },
          { values: { jins: 1 }, selected: false },
        ],
      },
    });

    await actions.open({ commit }, "f1");

    const chaqiruv = commit.mock.calls.find(c => c[0] === "SET_FILTER");
    expect(chaqiruv[1].filter.expression).toBe("jins = 2");
    expect(chaqiruv[1].rowSelected).toEqual([true, false]);
  });

  it("`selected` kelmasa bayroqlar bo'sh qoladi", async () => {
    const commit = vi.fn();
    api.get.mockResolvedValue({
      data: {
        file: { id: "f1" },
        schema: { variables: [] },
        filter: null,
        rows: [{ values: {} }, { values: {} }],
      },
    });
    await actions.open({ commit }, "f1");
    const chaqiruv = commit.mock.calls.find(c => c[0] === "SET_FILTER");
    expect(chaqiruv[1].filter).toBe(null);
    expect(chaqiruv[1].rowSelected).toEqual([]);
  });
});

// ── store: amallar ──

describe("previewFilter", () => {
  it("saqlamasdan sanaydi", async () => {
    const s = holat();
    api.post.mockResolvedValue({ data: { total: 4, selected: 3 } });

    const javob = await actions.previewFilter({ state: s }, {
      expression: "jins = 2",
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith("/files/f1/filter:preview", {
      expression: "jins = 2",
    });
    expect(javob.selected).toBe(3);
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe("saveFilter", () => {
  it("saqlagach faylni qayta o'qiydi", async () => {
    const s = holat();
    const dispatch = vi.fn();
    api.put.mockResolvedValue({ data: { filter: {} } });

    await actions.saveFilter({ state: s, dispatch }, { expression: "jins = 2" });

    expect(api.put).toHaveBeenCalledWith("/files/f1/filter", {
      expression: "jins = 2",
      enabled: true,
    });
    expect(dispatch).toHaveBeenCalledWith("open", "f1");
  });
});

describe("toggleFilter", () => {
  it("🔴 o'chirish SHARTNI YO'QOTMAYDI — faqat `enabled` almashadi", async () => {
    // Foydalanuvchi filtrni vaqtincha o'chirib, keyin qayta yoqishi
    // odatiy. Shart matnini qayta terishga majburlash ma'nosiz ish.
    const s = holat();
    s.filter = { expression: "jins = 2", enabled: true };
    const dispatch = vi.fn();

    await actions.toggleFilter({ state: s, dispatch });

    expect(dispatch).toHaveBeenCalledWith("saveFilter", {
      expression: "jins = 2",
      enabled: false,
    });
  });

  it("o'chirilgan filtrni qayta yoqadi", async () => {
    const s = holat();
    s.filter = { expression: "jins = 2", enabled: false };
    const dispatch = vi.fn();
    await actions.toggleFilter({ state: s, dispatch });
    expect(dispatch.mock.calls[0][1].enabled).toBe(true);
  });

  it("filtr yo'q bo'lsa hech narsa qilmaydi", async () => {
    const s = holat();
    const dispatch = vi.fn();
    await actions.toggleFilter({ state: s, dispatch });
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("deleteFilter", () => {
  it("butunlay olib tashlaydi va faylni qayta o'qiydi", async () => {
    const s = holat();
    const dispatch = vi.fn();
    api.delete.mockResolvedValue({ data: { ok: true } });

    await actions.deleteFilter({ state: s, dispatch });

    expect(api.delete).toHaveBeenCalledWith("/files/f1/filter");
    expect(dispatch).toHaveBeenCalledWith("open", "f1");
  });
});

// ── DataTab: banner va chizilgan qatorlar ──

function dokon({ filter = null, rowSelected = [] } = {}) {
  return createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({
          schema: {
            variables: [
              { name: "yosh", measure: "scale" },
              { name: "jins", measure: "nominal" },
            ],
          },
          rows: [
            { yosh: 30, jins: "2" },
            { yosh: 20, jins: "1" },
            { yosh: 40, jins: "2" },
          ],
          file: { id: "f1" },
          filter,
          rowSelected,
        }),
        actions: { parseImport: vi.fn(), applyImport: vi.fn(), toggleFilter: vi.fn() },
        mutations: { SET_ROWS: () => {} },
      },
    },
  });
}

function jadval(cfg) {
  return mount(DataTab, { global: { plugins: [dokon(cfg)] } });
}

describe("DataTab — banner", () => {
  it("filtrsiz banner yo'q", () => {
    const w = jadval();
    expect(w.find(".filtr-banner").exists()).toBe(false);
  });

  it("🔴 yoqilgan filtrda banner DOIM ko'rinadi", () => {
    // Eng katta xavf — foydalanuvchi filtr yoqilganini unutadi va
    // qism tanlama natijasini butun tanlama deb hisobotga kiritadi.
    const w = jadval({
      filter: { expression: "jins = 2", enabled: true },
      rowSelected: [true, false, true],
    });
    const banner = w.find(".filtr-banner");
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain("Filtr yoqilgan");
    expect(banner.text()).toContain("3 dan");
    expect(banner.text()).toContain("2 qator");
    expect(banner.text()).toContain("jins = 2");
  });

  it("o'chirilgan filtrda ham banner qoladi", () => {
    const w = jadval({
      filter: { expression: "jins = 2", enabled: false },
      rowSelected: [],
    });
    const banner = w.find(".filtr-banner");
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain("Filtr o");
    expect(banner.classes()).toContain("ochiq");
  });
});

describe("DataTab — chiqarilgan qatorlar", () => {
  it("🔴 ko'rinib turadi, lekin chizilgan holda", () => {
    // Yashirish ma'lumot yo'qolgandek taassurot berardi.
    const w = jadval({
      filter: { expression: "jins = 2", enabled: true },
      rowSelected: [true, false, true],
    });
    const qatorlar = w.findAll("tbody tr");
    expect(qatorlar).toHaveLength(3);
    expect(qatorlar[0].classes()).not.toContain("filtrdan-chiqqan");
    expect(qatorlar[1].classes()).toContain("filtrdan-chiqqan");
    expect(qatorlar[2].classes()).not.toContain("filtrdan-chiqqan");
  });

  it("filtr o'chirilgan bo'lsa hech bir qator chizilmaydi", () => {
    const w = jadval({
      filter: { expression: "jins = 2", enabled: false },
      rowSelected: [],
    });
    const qatorlar = w.findAll("tbody tr");
    expect(qatorlar.every(q => !q.classes().includes("filtrdan-chiqqan"))).toBe(true);
  });
});

// ── FilterModal ──

function oyna(cfg) {
  return mount(FilterModal, {
    props: { open: true },
    global: { plugins: [dokon(cfg)] },
  });
}

describe("FilterModal", () => {
  it("mavjud shart maydonga yuklanadi", async () => {
    const w = oyna({ filter: { expression: "jins = 2", enabled: true } });
    await w.setProps({ open: false });
    await w.setProps({ open: true });
    expect(w.vm.shart).toBe("jins = 2");
  });

  it("amal tugmalari bo'sh joy bilan qo'shiladi", () => {
    // Telefonda `>=` ni terish qiyin — tugma bilan qo'yiladi.
    const w = oyna();
    w.vm.shart = "yosh";
    w.vm.qoshish(">=");
    expect(w.vm.shart).toBe("yosh >=");
    w.vm.qoshish("25");
    expect(w.vm.shart).toBe("yosh >= 25");
  });

  it("filtr yo'q bo'lsa «olib tashlash» tugmasi ko'rinmaydi", () => {
    const w = oyna();
    expect(w.find(".link.ochir").exists()).toBe(false);
  });

  it("filtr bor bo'lsa «olib tashlash» tugmasi chiqadi", () => {
    const w = oyna({ filter: { expression: "jins = 2", enabled: true } });
    expect(w.find(".link.ochir").exists()).toBe(true);
  });
});

// ── zahiralangan nomlar ──

describe("zahiralangan nomlar", () => {
  it("🔴 FAQAT to'rttasi zahiralangan", () => {
    expect(ZAHIRA_SOZLAR).toEqual(["AND", "OR", "NOT", "TO"]);
  });

  it.each(["and", "OR", "Not", "to"])("«%s» zahiralangan", nom => {
    expect(zahiralanganmi(nom)).toBe(true);
  });

  it.each(["sum", "mean", "eq", "gt", "yosh", "value"])(
    "«%s» zahiralanmagan",
    nom => {
      // Funksiya nomlari va amalga oshirilmagan mnemonikalar oddiy
      // ustun nomi bo'la oladi — backend bilan bir xil qoida.
      expect(zahiralanganmi(nom)).toBe(false);
    },
  );

  it("izoh sababni aytadi", () => {
    expect(zahiraIzohi("and")).toContain("zahiralangan so'z");
    expect(zahiraIzohi("yosh")).toBe("");
  });
});
