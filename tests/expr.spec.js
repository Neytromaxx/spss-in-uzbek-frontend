// tests/expr.spec.js — hisoblangan o'zgaruvchi oqimi (store mantiqi).
//
// Ifoda tilining o'zi backendda (`tests/test_expr.py`). Bu yerda
// frontendga xos narsalar: tekshiruv saqlamasligi, hisoblashdan keyin
// fayl qayta o'qilishi va `derived` maydonining saqlanishi.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/api", () => ({
  default: { put: vi.fn(), get: vi.fn(), post: vi.fn() },
}));

import api from "../src/api";
import editor from "../src/store/editor";

const { mutations, actions, state: stateFactory } = editor;

function holat() {
  const s = stateFactory();
  s.file = { id: "f1" };
  s.schema.variables = [
    { name: "b1", measure: "scale", missing: null, derived: null },
    { name: "b2", measure: "scale", missing: null, derived: null },
  ];
  return s;
}

beforeEach(() => vi.clearAllMocks());


describe("validateExpression", () => {
  it("saqlamasdan tekshiradi — faqat validate marshruti chaqiriladi", async () => {
    const s = holat();
    api.post.mockResolvedValue({ data: { ok: true } });

    await actions.validateExpression({ state: s }, {
      expression: "SUM(b1, b2)", name: "jami",
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    const [yol, yuk] = api.post.mock.calls[0];
    expect(yol).toBe("/files/f1/compute:validate");
    expect(yuk).toEqual({ expression: "SUM(b1, b2)", name: "jami", overwrite: false });
    // Sxema ham, qatorlar ham yuborilmagan
    expect(api.put).not.toHaveBeenCalled();
  });

  it("xatoni yuqoriga uzatadi", async () => {
    const s = holat();
    api.post.mockRejectedValue({ response: { status: 422, data: { detail: "topilmadi" } } });
    await expect(
      actions.validateExpression({ state: s }, { expression: "b21" })
    ).rejects.toBeTruthy();
  });
});


describe("computeVariable", () => {
  it("hisoblab, faylni QAYTA O'QIYDI", async () => {
    // 🔴 Backend yangi ustunni barcha qatorlarga yozdi va sxemaga
    // o'zgaruvchi qo'shdi. Mahalliy holatni qo'lda yamash ikkinchi
    // haqiqat manbai bo'lardi.
    const s = holat();
    const xulosa = { total: 3, computed: 2, missing: 1, reasons: { kirish_yoq_qiymat: 1 } };
    api.post.mockResolvedValue({ data: { variable: { name: "jami" }, summary: xulosa } });

    const dispatch = vi.fn();
    const javob = await actions.computeVariable(
      { state: s, dispatch },
      { name: "jami", expression: "SUM(b1, b2)" }
    );

    expect(api.post).toHaveBeenCalledWith("/files/f1/compute",
      { name: "jami", expression: "SUM(b1, b2)" });
    expect(dispatch).toHaveBeenCalledWith("open", "f1");
    expect(javob.summary).toEqual(xulosa);
  });

  it("fayl ochilmagan bo'lsa hech narsa qilmaydi", async () => {
    const s = stateFactory();
    const natija = await actions.computeVariable({ state: s, dispatch: vi.fn() }, {});
    expect(natija).toBeNull();
    expect(api.post).not.toHaveBeenCalled();
  });
});


describe("derived maydoni", () => {
  it("ADD_VARIABLE uni saqlaydi", () => {
    const s = holat();
    mutations.ADD_VARIABLE(s, {
      name: "jami",
      derived: { expression: "SUM(b1, b2)", computed_at: "2026-09-04T10:00:00Z" },
    });
    const v = s.schema.variables.at(-1);
    expect(v.derived.expression).toBe("SUM(b1, b2)");
  });

  it("🔴 saveSchema uni YUBORADI — aks holda ifoda yo'qoladi", async () => {
    // Sxema avtosaqlanadi. `derived` yuborilmasa, foydalanuvchi biror
    // yorliqni tahrirlashi bilan ifoda butunlay yo'qolardi va
    // hisoblangan ustunni qayta hisoblab bo'lmasdi.
    const s = holat();
    s.schema.variables.push({
      name: "jami",
      measure: "scale",
      missing: null,
      derived: { expression: "SUM(b1, b2)", computed_at: "2026-09-04T10:00:00Z" },
      _showValues: false,
      _showMissing: false,
    });
    api.put.mockResolvedValue({ data: { ok: true } });

    await actions.saveSchema({ state: s, commit: vi.fn() });

    const yuborilgan = api.put.mock.calls[0][1].variables;
    const jami = yuborilgan.find(v => v.name === "jami");
    expect(jami.derived.expression).toBe("SUM(b1, b2)");
    expect(jami).not.toHaveProperty("_showMissing");
  });
});
