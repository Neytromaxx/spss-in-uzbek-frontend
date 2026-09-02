// tests/missing-values.spec.js — yo'q qiymatlar store mantiqi.
//
// 🔴 NIMA UCHUN BU FAYL BOR
//
// Yo'q qiymat ta'rifi ikki tomonda tekshiriladi: backend (`schemas.py`)
// to'siq, frontend esa limitni KO'RSATADI. Ikkala qoida bir xil bo'lishi
// shart — aks holda foydalanuvchi 4-kodni kiritib, 1.5 soniyadan keyin
// tushunarsiz 422 olardi.
//
// Ikkinchi qism — `saveSchema`. Sxema AVTOSAQLANADI, ya'ni foydalanuvchi
// tugma bosmaydi va javobni ko'radigan joyi yo'q. Xato holati
// yo'qolsa, u «saqlandi» deb o'ylab tahlilga o'tadi va `99` lar yana
// o'rtachaga qo'shiladi — endigina tuzatilgan xato jimgina qaytadi.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/api", () => ({
  default: { put: vi.fn(), get: vi.fn(), post: vi.fn() },
}));

import api from "../src/api";
import editor from "../src/store/editor";

const { mutations, actions, state: stateFactory } = editor;

function holat(ozgaruvchilar = []) {
  const s = stateFactory();
  s.schema.variables = ozgaruvchilar;
  s.file = { id: "f1" };
  return s;
}

function ozgaruvchi(missing = null) {
  return { name: "ball", label: "", measure: "scale", values: null, missing,
           _showValues: false, _showMissing: false };
}

beforeEach(() => {
  vi.clearAllMocks();
});


describe("kod limitlari (SPSS cheklovi)", () => {
  it("oraliqsiz 3 tagacha kod qo'shiladi", () => {
    const s = holat([ozgaruvchi()]);
    for (let i = 0; i < 5; i++) mutations.ADD_MISSING_CODE(s, 0);
    expect(s.schema.variables[0].missing.discrete).toHaveLength(3);
  });

  it("oraliq bo'lsa faqat 1 ta kod qo'shiladi", () => {
    const s = holat([ozgaruvchi({ discrete: [], range: { low: 90, high: null } })]);
    for (let i = 0; i < 5; i++) mutations.ADD_MISSING_CODE(s, 0);
    expect(s.schema.variables[0].missing.discrete).toHaveLength(1);
  });

  it("oraliq qo'shilganda kodlar 1 taga qisqaradi", () => {
    const s = holat([ozgaruvchi({ discrete: ["99", "999", "-1"], range: null })]);
    mutations.SET_MISSING_RANGE(s, { index: 0, low: 90, high: "" });
    expect(s.schema.variables[0].missing.discrete).toEqual(["99"]);
  });
});


describe("oraliq qoidasi", () => {
  it("ikkala chegara bo'sh bo'lsa oraliq null bo'ladi", () => {
    const s = holat([ozgaruvchi({ discrete: [], range: { low: 90, high: 100 } })]);
    mutations.SET_MISSING_RANGE(s, { index: 0, low: "", high: "" });
    expect(s.schema.variables[0].missing.range).toBeNull();
  });

  it("bitta chegara berilsa ikkinchisi null qoladi (cheksizlik)", () => {
    const s = holat([ozgaruvchi()]);
    mutations.SET_MISSING_RANGE(s, { index: 0, low: 90, high: "" });
    expect(s.schema.variables[0].missing.range).toEqual({ low: 90, high: null });
  });

  it("chegaralar songa aylantiriladi", () => {
    const s = holat([ozgaruvchi()]);
    mutations.SET_MISSING_RANGE(s, { index: 0, low: "90", high: "100" });
    expect(s.schema.variables[0].missing.range).toEqual({ low: 90, high: 100 });
  });
});


describe("tahrirlagich va tozalash", () => {
  it("tahrirlagich ochilganda bo'sh ta'rif yasaladi", () => {
    const s = holat([ozgaruvchi()]);
    mutations.TOGGLE_MISSING_EDITOR(s, 0);
    expect(s.schema.variables[0]._showMissing).toBe(true);
    expect(s.schema.variables[0].missing).toEqual({ discrete: [], range: null });
  });

  it("CLEAR_MISSING ta'rifni butunlay o'chiradi", () => {
    const s = holat([ozgaruvchi({ discrete: ["99"], range: null })]);
    mutations.CLEAR_MISSING(s, 0);
    expect(s.schema.variables[0].missing).toBeNull();
  });

  it("har bir mutatsiya saved bayrog'ini tushiradi", () => {
    const s = holat([ozgaruvchi({ discrete: ["99"], range: null })]);
    for (const [nom, yuk] of [
      ["ADD_MISSING_CODE", 0],
      ["UPDATE_MISSING_CODE", { index: 0, codeIndex: 0, value: "5" }],
      ["REMOVE_MISSING_CODE", { index: 0, codeIndex: 0 }],
      ["SET_MISSING_RANGE", { index: 0, low: 1, high: 2 }],
      ["CLEAR_MISSING", 0],
    ]) {
      s.saved = true;
      mutations[nom](s, yuk);
      expect(s.saved, nom).toBe(false);
    }
  });
});


describe("saveSchema tozalashi", () => {
  async function saqla(ozgaruvchilar) {
    const s = holat(ozgaruvchilar);
    const commit = vi.fn((tur, qiymat) => {
      if (mutations[tur]) mutations[tur](s, qiymat);
    });
    api.put.mockResolvedValue({ data: { ok: true } });
    await actions.saveSchema({ state: s, commit });
    return { yuborilgan: api.put.mock.calls[0][1].variables, s, commit };
  }

  it("_showValues va _showMissing yuborilmaydi", async () => {
    const { yuborilgan } = await saqla([ozgaruvchi({ discrete: ["99"], range: null })]);
    expect(yuborilgan[0]).not.toHaveProperty("_showValues");
    expect(yuborilgan[0]).not.toHaveProperty("_showMissing");
  });

  it("bo'sh va faqat probeldan iborat kodlar tozalanadi", async () => {
    const { yuborilgan } = await saqla([
      ozgaruvchi({ discrete: ["99", "", "  ", "999"], range: null }),
    ]);
    expect(yuborilgan[0].missing.discrete).toEqual(["99", "999"]);
  });

  it("bo'sh ta'rif null bo'lib yuboriladi", async () => {
    const { yuborilgan } = await saqla([ozgaruvchi({ discrete: ["", "  "], range: null })]);
    expect(yuborilgan[0].missing).toBeNull();
  });

  it("muvaffaqiyatda xato tozalanadi va saved true bo'ladi", async () => {
    const { s } = await saqla([ozgaruvchi()]);
    expect(s.schemaError).toBeNull();
    expect(s.saved).toBe(true);
    expect(s.saving).toBe(false);
  });
});


describe("saveSchema xato holati", () => {
  it("422 da xato ko'rinadigan bo'ladi va saving tushadi", async () => {
    const s = holat([ozgaruvchi({ discrete: ["1", "2", "3", "4"], range: null })]);
    // Haqiqiy oqim: avval tahrir (`saved` tushadi), so'ng avtosaqlash.
    s.saved = false;
    const commit = vi.fn((tur, qiymat) => {
      if (mutations[tur]) mutations[tur](s, qiymat);
    });
    api.put.mockRejectedValue({
      response: { status: 422, data: { detail: [{ msg: "Eng ko'pi 3 ta alohida kod" }] } },
    });

    await expect(actions.saveSchema({ state: s, commit })).rejects.toBeTruthy();

    // 🔴 Uchala shart ham muhim:
    expect(s.schemaError).toBeTruthy();          // xato ko'rinadi
    expect(s.schemaError).toContain("3 ta");     // sababi bilan
    expect(s.saving).toBe(false);                // interfeys muzlab qolmaydi
    // 🔴 `saved` `true` bo'lib qolsa, interfeys «saqlandi» deb ko'rsatardi
    // va foydalanuvchi buzuq ta'rif bilan tahlilga o'tardi.
    expect(s.saved).toBe(false);
  });
});
