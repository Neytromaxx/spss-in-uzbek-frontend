// FAYLDAN O'QILGANINI KO'RSATISH — komponent testlari.
//
// ── 🔴 ENG MUHIM UCH TEST ──
//
// `nima yo'qolishi aytiladi` — import mavjud o'zgaruvchilar va
//     BARCHA qatorlarni almashtiradi. Bu jim qolsa, tasodifan
//     bosilgan tugma bir necha soatlik ishni o'chirib yuborardi.
//
// `ogohlantirishlar ko'rsatiladi` — backend "ok" qaytarishi mumkin,
//     lekin ichida jimgina o'zgarish bo'ladi (o'nlik vergul
//     o'girilgan, ustun matn deb belgilangan). Yashirsak,
//     foydalanuvchi ma'lumoti nega boshqacha ekanini bilmasdi.
//
// `bloklangan holatda yozib bo'lmaydi` — qatorlar chegaradan
//     oshgan bo'lsa, tasdiqlash tugmasi ochiq turmasligi kerak.

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ImportPreview from "./ImportPreview.vue";

function namuna(qoshimcha = {}) {
  return {
    variables: [
      { name: "yosh", label: "Yosh", measure: "scale" },
      { name: "shahar", label: "Shahar", measure: "nominal" },
    ],
    rowsTotal: 2,
    sample: [
      { rowIndex: 0, values: { yosh: "20", shahar: "Toshkent" } },
      { rowIndex: 1, values: { yosh: "21", shahar: "" } },
    ],
    warnings: [],
    currentRows: 0,
    ...qoshimcha,
  };
}

function ekan(preview = namuna(), props = {}) {
  return mount(ImportPreview, { props: { preview, ...props } });
}

describe("ImportPreview", () => {
  it("ustunlar, turlari va namuna qatorlar ko'rsatiladi", () => {
    const w = ekan();
    const matn = w.text();

    expect(matn).toContain("Yosh");
    expect(matn).toContain("Shahar");
    expect(matn).toContain("Raqamli");
    expect(matn).toContain("Matn");
    expect(matn).toContain("Toshkent");
  });

  it("🔴 nima yo'qolishi aytiladi", () => {
    const w = ekan(namuna({ currentRows: 137 }));

    expect(w.text()).toContain("137");
    expect(w.text()).toContain("o‘chiriladi");
  });

  it("bo'sh faylda ogohlantirish chiqmaydi", () => {
    // Yangi faylga import qilinayotgan bo'lsa, qo'rqitishning hojati yo'q
    expect(ekan(namuna({ currentRows: 0 })).text()).not.toContain("o‘chiriladi");
  });

  it("🔴 ogohlantirishlar ko'rsatiladi", () => {
    const w = ekan(
      namuna({
        warnings: [
          "2 ta qiymatda o'nlik vergul nuqtaga o'girildi",
          "Faqat «Ma'lumot» varag'i o'qildi.",
        ],
      }),
    );

    expect(w.text()).toContain("vergul");
    expect(w.text()).toContain("varag");
  });

  it("bo'sh katak chiziqcha bilan ko'rsatiladi", () => {
    // Bo'sh joy o'rniga chiziqcha: ustun tushib qolganmi yoki
    // qiymat yo'qmi — buni ko'rib turish kerak.
    //
    // 🔴 AYNAN KATAK TEKSHIRILADI: komponent sarlavhasida ham
    // chiziqcha bor va umumiy matn tekshiruvi sabotajni tutmasdi.
    const qatorlar = ekan().findAll("tbody tr");
    const ikkinchi = qatorlar[1].findAll("td").map((td) => td.text());

    expect(ikkinchi).toEqual(["21", "—"]);
  });

  it("qolgan qatorlar soni aytiladi", () => {
    const w = ekan(namuna({ rowsTotal: 500 }));
    expect(w.text()).toContain("498");
  });

  it("tasdiqlash va bekor qilish hodisa yuboradi", async () => {
    const w = ekan();

    await w.find(".ip-ok").trigger("click");
    await w.find(".ip-cancel").trigger("click");

    expect(w.emitted("confirm")).toHaveLength(1);
    expect(w.emitted("cancel")).toHaveLength(1);
  });

  it("🔴 bloklangan holatda yozib bo'lmaydi", () => {
    const w = ekan(namuna({ blocked: true, rowsTotal: 9000 }));

    expect(w.find(".ip-ok").attributes("disabled")).toBeDefined();
  });

  it("yozilayotganda tugmalar o'chadi", () => {
    const w = ekan(namuna(), { busy: true });

    expect(w.find(".ip-ok").attributes("disabled")).toBeDefined();
    expect(w.find(".ip-cancel").attributes("disabled")).toBeDefined();
  });

  it("bitta varaqli faylda tanlov ko'rsatilmaydi", () => {
    const w = ekan(namuna({ sheets: ["Ma'lumot"] }));
    expect(w.find("select").exists()).toBe(false);
  });

  it("bir nechta varaq bo'lsa tanlash mumkin", async () => {
    const w = ekan(namuna({ sheets: ["Ma'lumot", "Izohlar"] }));

    expect(w.findAll("option")).toHaveLength(2);
    await w.find("select").setValue("Izohlar");
    expect(w.emitted("sheet")[0]).toEqual(["Izohlar"]);
  });
});
