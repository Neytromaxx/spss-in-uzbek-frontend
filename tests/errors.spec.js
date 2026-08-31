// tests/errors.spec.js — `api/errors.js` xato matnini normallashtirishi.
//
// Bu funksiya 2-bandda qo'shildi: backendda xato javobining UCH XIL
// shakli bor va frontend faqat bittasini to'g'ri o'qirdi.

import { describe, it, expect } from "vitest";
import { xatoMatni } from "../src/api/errors";

describe("xatoMatni", () => {
  it("HTTPException satrini o'zini qaytaradi", () => {
    const e = { response: { data: { detail: "Fayl topilmadi" } } };
    expect(xatoMatni(e, "zaxira")).toBe("Fayl topilmadi");
  });

  it("FastAPI validatsiya MASSIVINI o'qiladigan matnga aylantiradi", () => {
    // 🔴 Aynan shu holat "[object Object]" bo'lib chizilardi.
    const e = {
      response: {
        data: {
          detail: [
            { loc: ["body", "type"], msg: "Input should be 'auto'", type: "literal_error" },
          ],
        },
      },
    };
    const matn = xatoMatni(e, "zaxira");
    expect(matn).toContain("type");
    expect(matn).toContain("Input should be");
    expect(matn).not.toContain("object Object");
  });

  it("bir nechta validatsiya xatosini birlashtiradi", () => {
    const e = {
      response: {
        data: {
          detail: [
            { loc: ["body", "a"], msg: "birinchi" },
            { loc: ["body", "b"], msg: "ikkinchi" },
          ],
        },
      },
    };
    expect(xatoMatni(e, "zaxira")).toBe("a: birinchi; b: ikkinchi");
  });

  it("RFC 9457 (catalog/ingest/survey) `title` ni oladi", () => {
    const e = { response: { data: { title: "Ruxsat yo'q", status: 403 } } };
    expect(xatoMatni(e, "zaxira")).toBe("Ruxsat yo'q");
  });

  it("javob umuman bo'lmasa zaxira matn + sabab beradi", () => {
    const e = { message: "Network Error" };
    const matn = xatoMatni(e, "Tahlilda xatolik");
    expect(matn).toContain("Tahlilda xatolik");
    expect(matn).toContain("Network Error");
  });

  it("bo'sh yoki notanish shaklda zaxira matnni beradi", () => {
    expect(xatoMatni({}, "zaxira")).toBe("zaxira");
    expect(xatoMatni({ response: { data: {} } }, "zaxira")).toBe("zaxira");
    expect(xatoMatni({ response: { data: { detail: [] } } }, "zaxira")).toBe("zaxira");
  });
});
