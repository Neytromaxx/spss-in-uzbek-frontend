// MA'LUMOTLAR JADVALI — kataklar qanday chiziladi.
//
// ══════════════════════════════════════════════════════════════════
// 🔴 BRAUZERDA TOPILGAN NUQSON
// ══════════════════════════════════════════════════════════════════
//
// Nominal ustun HAR DOIM `<select>` bo'lib chizilardi va u faqat
// oldindan belgilangan qiymat yorliqlarini ko'rsatardi. Fayldan
// o'qilgan matn ustunlarida (ism, shahar, sana) yorliq bo'lmaydi —
// natijada ro'yxatda faqat bo'sh variant qolardi va MA'LUMOT
// KO'RINMASDI.
//
// Baza to'g'ri, API to'g'ri, jadval esa bo'sh — foydalanuvchi
// import ishlamadi deb o'ylardi. Testlar buni tutmadi, chunki ular
// faqat ko'rish oynasini tekshirardi.

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createStore } from "vuex";

import DataTab from "./DataTab.vue";

function dokon(variables, rows) {
  return createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({ schema: { variables }, rows, file: { id: "f1" } }),
        actions: { parseImport: () => null, applyImport: () => null },
        mutations: { SET_ROWS: () => {} },
      },
    },
  });
}

function ekan(variables, rows) {
  return mount(DataTab, { global: { plugins: [dokon(variables, rows)] } });
}

describe("DataTab kataklari", () => {
  it("🔴 yorliqsiz matn ustuni matn maydoni bilan ko'rsatiladi", () => {
    const w = ekan(
      [{ name: "shahar", label: "Shahar", measure: "nominal" }],
      [{ shahar: "Toshkent" }],
    );

    const katak = w.find("tbody td:nth-child(2)");
    expect(katak.find("select").exists()).toBe(false);
    expect(katak.find('input[type="text"]').element.value).toBe("Toshkent");
  });

  it("qiymat yorliqlari bo'lsa ro'yxat ko'rsatiladi", () => {
    const w = ekan(
      [
        {
          name: "jins",
          label: "Jins",
          measure: "nominal",
          values: { 1: "erkak", 2: "ayol" },
        },
      ],
      [{ jins: "1" }],
    );

    const katak = w.find("tbody td:nth-child(2)");
    expect(katak.find("select").exists()).toBe(true);
    expect(katak.find("select").element.value).toBe("1");
  });

  it("raqamli ustun raqam maydoni bilan ko'rsatiladi", () => {
    const w = ekan(
      [{ name: "yosh", label: "Yosh", measure: "scale" }],
      [{ yosh: "20" }],
    );

    const katak = w.find("tbody td:nth-child(2)");
    expect(katak.find('input[type="number"]').element.value).toBe("20");
  });

  it("fayl tanlash maydoni Excel'ni ham qabul qiladi", () => {
    const w = ekan([{ name: "a", measure: "scale" }], [{ a: "1" }]);

    const kirish = w.find('input[type="file"]');
    expect(kirish.attributes("accept")).toContain(".xlsx");
    expect(kirish.attributes("accept")).toContain(".csv");
  });
});
