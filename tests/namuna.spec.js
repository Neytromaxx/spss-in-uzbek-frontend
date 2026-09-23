// tests/namuna.spec.js — birinchi kirish: namuna va banner.
//
// ── NIMANI HIMOYA QILADI ──
//
// Faylsiz foydalanuvchi ilova nima qila olishini ko'ra olmaydi.
// Ikkita karta va bitta banner — butun «birinchi kirish»
// tajribasi shu. Ular jimgina yo'qolsa, yangi foydalanuvchi
// yana bo'sh ekranga qaraydi.
//
// 🔴 Banner INTERAKTIV SAYOHAT EMAS: bitta tavsiya, yopiladi va
// qayta chiqmaydi.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";

vi.mock("../src/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const push = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ query: {} }),
}));

import api from "../src/api";
import files from "../src/store/files";
import FilesPage from "../src/pages/FilesPage.vue";
import NamunaBanner from "../src/components/NamunaBanner.vue";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ══════════════════════ do'kon amali ══════════════════════

describe("files/namuna", () => {
  it("🔴 BACKENDGA SO'ROV YUBORADI, CSV import qilmaydi", async () => {
    // Namuna qiymat yorliqlari, yo'q qiymat kodlari va to'g'ri
    // turlar bilan kelishi kerak — CSV bularni tashimaydi.
    api.post.mockResolvedValue({ data: { id: "f9", title: "Namuna" } });
    const commit = vi.fn();

    const natija = await files.actions.namuna({ commit });

    expect(api.post).toHaveBeenCalledWith("/files/namuna");
    expect(commit).toHaveBeenCalledWith("ADD_FILE", { id: "f9", title: "Namuna" });
    expect(natija.id).toBe("f9");
  });
});

// ══════════════════════ bo'sh holat ══════════════════════

const amallar = [];

function sahifa(ruyxat = []) {
  amallar.length = 0;
  const store = createStore({
    modules: {
      files: {
        namespaced: true,
        state: () => ({ list: ruyxat }),
        actions: {
          load: vi.fn(),
          namuna: () => { amallar.push("namuna"); return Promise.resolve({ id: "f9" }); },
          sources: vi.fn(),
        },
        mutations: { ADD_FILE: () => {} },
      },
      auth: {
        namespaced: true,
        state: () => ({ user: null }),
        getters: {
          isAuthenticated: () => false,
          displayName: () => "",
          isLibrarian: () => false,
        },
        mutations: { SET_LOGIN_VISIBLE: () => {} },
        actions: { logout: vi.fn() },
      },
    },
  });
  return mount(FilesPage, {
    global: { plugins: [store], stubs: { DatasetImportModal: true } },
  });
}

describe("FilesPage — birinchi kirish", () => {
  it("🔴 FAYL YO'Q BO'LSA IKKITA KARTA CHIQADI", () => {
    const w = sahifa();
    expect(w.findAll(".karta")).toHaveLength(2);
    expect(w.text()).toContain("Namuna bilan sinab");
    expect(w.text()).toContain("O‘z faylimni yuklash");
  });

  it("fayl bor bo'lsa kartalar yo'q", () => {
    const w = sahifa([{ id: "f1", title: "Tadqiqot" }]);
    expect(w.findAll(".karta")).toHaveLength(0);
  });

  it("🔴 NAMUNA «O'QUV MA'LUMOT» DEB TANISHTIRILADI", () => {
    // Haqiqiy tadqiqotdek qabul qilinmasin.
    expect(sahifa().find(".karta.namuna").text()).toContain("o‘quv ma’lumot");
  });

  it("🔴 NAMUNA AMALI CHAQIRILADI va fayl ochiladi", async () => {
    // Fayl backendda yasalishi shart: yorliqlar va yo'q qiymat
    // kodlari faqat shu yo'l bilan keladi.
    const w = sahifa();
    await w.find(".karta.namuna").trigger("click");
    await Promise.resolve();
    expect(amallar).toEqual(["namuna"]);
    expect(push).toHaveBeenCalledWith("/files/f9?namuna=1");
  });

  it("🔴 URL DA BELGI QOLADI — banner shundan biladi", async () => {
    // Fayl nomi bilan aniqlash mo'rt bo'lardi: foydalanuvchi uni
    // o'zgartirishi mumkin.
    const w = sahifa();
    await w.find(".karta.namuna").trigger("click");
    await Promise.resolve();
    expect(push.mock.calls[0][0]).toContain("namuna=1");
  });

  it("«o'z faylim» kartasi nom kiritish maydonini ochadi", async () => {
    const w = sahifa();
    expect(w.find(".create-box input").exists()).toBe(false);
    await w.findAll(".karta")[1].trigger("click");
    expect(w.find(".create-box input").exists()).toBe(true);
  });
});

// ══════════════════════ banner ══════════════════════

function banner(fileId = "f9") {
  return mount(NamunaBanner, { props: { fileId } });
}

describe("NamunaBanner", () => {
  it("🔴 O'QUV MA'LUMOT EKANI AYTILADI", () => {
    expect(banner().text()).toContain("haqiqiy tadqiqot emas");
  });

  it("bitta aniq tavsiya beradi", () => {
    // Interaktiv sayohat emas: ikkita joy — `b3` va `jins`.
    const t = banner().text();
    expect(t).toContain("b3");
    expect(t).toContain("99");
    expect(t).toContain("jins");
    expect(t).toContain("t-test");
  });

  it("yopiladi", async () => {
    const w = banner();
    await w.find(".yop").trigger("click");
    expect(w.find(".namuna-banner").exists()).toBe(false);
  });

  it("🔴 YOPILGANDAN KEYIN QAYTA CHIQMAYDI", async () => {
    // Bitta faylni qayta-qayta ochganda banner qayta chiqsa, u
    // yordam emas, xalaqit bo'lardi.
    const w = banner("f9");
    await w.find(".yop").trigger("click");
    expect(banner("f9").find(".namuna-banner").exists()).toBe(false);
  });

  it("boshqa fayl uchun baribir chiqadi", async () => {
    const w = banner("f9");
    await w.find(".yop").trigger("click");
    expect(banner("f10").find(".namuna-banner").exists()).toBe(true);
  });

  it("`localStorage` ishlamasa ham chiziladi", () => {
    const asl = localStorage.getItem;
    localStorage.getItem = () => { throw new Error("yopiq"); };
    try {
      expect(banner().find(".namuna-banner").exists()).toBe(true);
    } finally {
      localStorage.getItem = asl;
    }
  });
});
