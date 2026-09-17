// tests/recode.spec.js — qayta kodlash oqimi (frontend tomoni).
//
// Qoidalar mantiqining o'zi backendda (`tests/test_recode.py`). Bu
// yerda frontendga xos narsalar: qoida tartibini o'zgartirish, xom
// maydonlarni yuklamaga aylantirish, ko'rib chiqish saqlamasligi va
// hosila ustunning ikki turini ajratish.

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "vuex";

vi.mock("../src/api", () => ({
  default: { put: vi.fn(), get: vi.fn(), post: vi.fn() },
}));

import api from "../src/api";
import RecodeModal from "../src/components/RecodeModal.vue";
import { COMPUTE, RECODE, hosilaBelgisi, hosilaIzohi, hosilaTuri, hosilami }
  from "../src/derived";
import editor from "../src/store/editor";

const { actions, state: stateFactory } = editor;

beforeEach(() => vi.clearAllMocks());

// ── store amallari ──

function holat() {
  const s = stateFactory();
  s.file = { id: "f1" };
  s.schema.variables = [
    { name: "yosh", measure: "scale", missing: null, derived: null },
  ];
  return s;
}

const QOIDALAR = [
  { match: { type: "range", low: null, high: 25 }, target_kind: "value", target: "1" },
];

describe("previewRecode", () => {
  it("saqlamasdan sanaydi — faqat preview marshruti chaqiriladi", async () => {
    const s = holat();
    api.post.mockResolvedValue({ data: { summary: { total: 3 }, warnings: [] } });

    const javob = await actions.previewRecode({ state: s }, {
      source: "yosh", rules: QOIDALAR, name: "yosh_guruh",
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith("/files/f1/recode:preview", {
      source: "yosh",
      rules: QOIDALAR,
      name: "yosh_guruh",
      overwrite: false,
    });
    expect(javob.summary.total).toBe(3);
  });

  it("nomsiz ham chaqiriladi — nom `null` bo'lib ketadi", async () => {
    const s = holat();
    api.post.mockResolvedValue({ data: {} });
    await actions.previewRecode({ state: s }, { source: "yosh", rules: QOIDALAR });
    expect(api.post.mock.calls[0][1].name).toBe(null);
  });
});

describe("recodeVariable", () => {
  it("🔴 saqlagach faylni QAYTA O'QIYDI", async () => {
    // Backend yangi ustunni barcha qatorlarga yozdi va sxemaga
    // o'zgaruvchi qo'shdi. Mahalliy holatni qo'lda yamash ikkinchi
    // haqiqat manbai bo'lardi va vaqt o'tib ajralib ketardi.
    const s = holat();
    const dispatch = vi.fn();
    api.post.mockResolvedValue({ data: { variable: { name: "yosh_guruh" } } });

    await actions.recodeVariable({ state: s, dispatch }, {
      source: "yosh", name: "yosh_guruh", rules: QOIDALAR,
    });

    expect(api.post).toHaveBeenCalledWith("/files/f1/recode", {
      source: "yosh", name: "yosh_guruh", rules: QOIDALAR,
    });
    expect(dispatch).toHaveBeenCalledWith("open", "f1");
  });
});

// ── hosila ustunning ikki turi ──

describe("derived — ikki xil hosila", () => {
  it("🔴 `kind` bo'lmagan eski ustun «compute» deb o'qiladi", () => {
    // 04-vazifada yozilgan ustunlarda `kind` maydoni umuman yo'q.
    // Backend ham aynan shunday o'qiydi; ikki tomon ajralib ketmasin.
    const v = { name: "jami", derived: { expression: "SUM(b1, b2)" } };
    expect(hosilaTuri(v)).toBe(COMPUTE);
    expect(hosilaBelgisi(v)).toBe("ƒ");
    expect(hosilaIzohi(v)).toBe("Ifoda: SUM(b1, b2)");
  });

  it("qayta kodlangan ustun alohida belgi va izoh oladi", () => {
    const v = {
      name: "yosh_guruh",
      derived: { kind: "recode", source: "yosh", rules: [1, 2, 3] },
    };
    expect(hosilaTuri(v)).toBe(RECODE);
    expect(hosilaBelgisi(v)).toBe("⇄");
    expect(hosilaIzohi(v)).toBe("Qayta kodlangan: yosh (3 ta qoida)");
  });

  it("🔴 qayta kodlangan ustunda «Ifoda: undefined» chiqmaydi", () => {
    // Ilgari ikkala jadval ham `'Ifoda: ' + v.derived.expression`
    // yozardi; recode ustunida `expression` yo'q.
    const v = { name: "yosh_guruh", derived: { kind: "recode", source: "yosh", rules: [] } };
    expect(hosilaIzohi(v)).not.toContain("undefined");
  });

  it("hosila bo'lmagan ustun belgisiz", () => {
    expect(hosilami({ name: "yosh" })).toBe(false);
    expect(hosilami({ name: "yosh", derived: null })).toBe(false);
    expect(hosilaBelgisi({ name: "yosh" })).toBe("");
  });
});

// ── oyna: qoidalar tartibi va yuklama ──

function dokon(rows = [], variables = [{ name: "yosh", measure: "scale" }]) {
  return createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({ schema: { variables }, rows, file: { id: "f1" } }),
        actions: { previewRecode: vi.fn(), recodeVariable: vi.fn() },
      },
    },
  });
}

function oyna(rows, variables) {
  return mount(RecodeModal, {
    props: { open: true },
    global: { plugins: [dokon(rows, variables)] },
  });
}

describe("RecodeModal — qoidalar tartibi", () => {
  it("🔴 tartibni o'zgartirish MA'NONI o'zgartiradi, shuning uchun u boshqariladi", () => {
    const w = oyna();
    const vm = w.vm;
    vm.qoidalar = [
      { type: "value", values: "1", low: "", high: "", target_kind: "value", target: "10" },
      { type: "value", values: "2", low: "", high: "", target_kind: "value", target: "20" },
      { type: "value", values: "3", low: "", high: "", target_kind: "value", target: "30" },
    ];

    vm.pastga(0);
    expect(vm.qoidalar.map(q => q.values)).toEqual(["2", "1", "3"]);

    vm.yuqoriga(2);
    expect(vm.qoidalar.map(q => q.values)).toEqual(["2", "3", "1"]);
  });

  it("chekkadagi qoida chegaradan chiqmaydi", () => {
    const w = oyna();
    const vm = w.vm;
    vm.qoidalar = [
      { type: "value", values: "1", low: "", high: "", target_kind: "value", target: "1" },
      { type: "value", values: "2", low: "", high: "", target_kind: "value", target: "2" },
    ];

    vm.yuqoriga(0);
    expect(vm.qoidalar.map(q => q.values)).toEqual(["1", "2"]);

    vm.pastga(1);
    expect(vm.qoidalar.map(q => q.values)).toEqual(["1", "2"]);
  });

  it("oxirgi qoida o'chirilsa bo'sh qoida qoladi", () => {
    // Qoidasiz ro'yxat foydalanuvchini boshi berk ko'chaga olib
    // borardi: «+ Qoida» tugmasidan boshqa hech narsa ko'rinmasdi.
    const w = oyna();
    const vm = w.vm;
    expect(vm.qoidalar).toHaveLength(1);
    vm.ochirQoida(0);
    expect(vm.qoidalar).toHaveLength(1);
    expect(vm.qoidalar[0].type).toBe("value");
  });
});

describe("RecodeModal — yuklama", () => {
  it("bo'sh chegara `null` bo'ladi, `\"\"` emas", () => {
    // `low: ""` backendda songa aylanmaydi va «chegara son emas»
    // xatosini berardi, holbuki foydalanuvchi «cheksiz» demoqchi edi.
    const w = oyna();
    const vm = w.vm;
    vm.qoidalar = [
      { type: "range", values: "", low: "", high: "25", target_kind: "value", target: "1" },
    ];
    expect(vm.yuklama).toEqual([
      { match: { type: "range", low: null, high: "25" }, target_kind: "value", target: "1" },
    ]);
  });

  it("qiymatlar ro'yxati vergul bo'yicha ajratiladi va bo'shlari tashlanadi", () => {
    const w = oyna();
    const vm = w.vm;
    vm.qoidalar = [
      { type: "values", values: " 1 , 2 ,, 3 ", low: "", high: "",
        target_kind: "value", target: "1" },
    ];
    expect(vm.yuklama[0].match.values).toEqual(["1", "2", "3"]);
  });

  it("`sysmis` va `copy` natijalarida `target` yuborilmaydi", () => {
    const w = oyna();
    const vm = w.vm;
    vm.qoidalar = [
      { type: "missing", values: "", low: "", high: "", target_kind: "sysmis", target: "99" },
      { type: "else", values: "", low: "", high: "", target_kind: "copy", target: "" },
    ];
    expect(vm.yuklama[0]).toEqual({ match: { type: "missing" }, target_kind: "sysmis" });
    expect(vm.yuklama[1]).toEqual({ match: { type: "else" }, target_kind: "copy" });
  });

  it("yorliqlar lug'atga aylanadi, bo'sh kod tashlanadi", () => {
    const w = oyna();
    const vm = w.vm;
    vm.yorliqlar = [
      { kod: "1", matn: "25 gacha" },
      { kod: " ", matn: "e'tiborsiz" },
      { kod: "2", matn: "26-40" },
    ];
    expect(vm.yorliqYuklamasi).toEqual({ 1: "25 gacha", 2: "26-40" });
  });

  it("yorliq kiritilmasa `null` yuboriladi", () => {
    const w = oyna();
    expect(w.vm.yorliqYuklamasi).toBe(null);
  });
});

describe("RecodeModal — manba qiymatlari", () => {
  it("chastotalar mavjud qatorlardan hisoblanadi (yangi so'rov yo'q)", () => {
    // Foydalanuvchi qaysi kodlar borligini ko'rmasdan qoida yoza
    // olmaydi. Barcha qatorlar allaqachon store'da.
    const w = oyna([
      { yosh: 18 }, { yosh: 25 }, { yosh: 18 }, { yosh: null }, { yosh: "  " },
    ]);
    w.vm.manba = "yosh";
    expect(w.vm.chastotalar).toEqual([
      { qiymat: "18", soni: 2 },
      { qiymat: "25", soni: 1 },
      { qiymat: "(bo'sh)", soni: 2 },
    ]);
    expect(api.post).not.toHaveBeenCalled();
  });

  it("sonli kodlar son tartibida chiqadi, matn emas", () => {
    // Alifbo tartibida `10` `9` dan oldin kelardi.
    const w = oyna([{ k: 9 }, { k: 10 }, { k: 2 }]);
    w.vm.manba = "k";
    expect(w.vm.chastotalar.map(c => c.qiymat)).toEqual(["2", "9", "10"]);
  });
});
