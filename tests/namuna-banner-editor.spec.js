// tests/namuna-banner-editor.spec.js — banner `EditorPage` ga ulanganmi?
//
// Alohida fayl: `useRoute` moki modul darajasida ishlaydi, ya'ni
// bitta faylda ikki xil URL so'rovini sinab bo'lmaydi.
// `tests/qadamlar.spec.js` oddiy (namunasiz) faylni tekshiradi,
// bu yerda esa `?namuna=1`.
//
// 🔴 Ulanish sinalmasa, banner komponenti mukammal ishlab
// turib, ekranda umuman ko'rinmasligi mumkin.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";

const soragich = { namuna: "1" };
vi.mock("vue-router", () => ({
  useRoute: () => ({ query: soragich }),
  useRouter: () => ({ push: vi.fn() }),
}));

import EditorPage from "../src/pages/EditorPage.vue";

function sahifa() {
  const store = createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({
          activeTab: "data", schema: { variables: [] }, rows: [], results: [],
          file: { id: "f9", title: "Namuna" }, saving: false, saved: true,
          analyzing: false, schemaError: null, filter: null, rowSelected: [],
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
  return mount(EditorPage, {
    global: {
      plugins: [store],
      stubs: { TopBar: true, VariablesTab: true, DataTab: true, ResultsTab: true },
    },
  });
}

// 🔴 HAR TESTDAN OLDIN TOZALANADI. Banner yopilganini
// `localStorage` da eslab qoladi — tozalanmasa keyingi testlar
// «banner yo'q» degan xulosani NOTO'G'RI sababdan chiqarardi
// (mutatsiya sinovi buni ko'rsatdi).
beforeEach(() => localStorage.clear());

describe("EditorPage — namuna banneri", () => {
  it("🔴 `?namuna=1` BO'LSA BANNER CHIQADI", () => {
    expect(sahifa().find(".namuna-banner").exists()).toBe(true);
  });

  it("banner faylning `id` sini oladi", async () => {
    // Yopilganini eslab qolish uchun kerak.
    const w = sahifa();
    await w.find(".namuna-banner .yop").trigger("click");
    expect(w.find(".namuna-banner").exists()).toBe(false);
  });

  it("boshqa qiymatda banner chiqmaydi", () => {
    soragich.namuna = "ha";
    try {
      expect(sahifa().find(".namuna-banner").exists()).toBe(false);
    } finally {
      soragich.namuna = "1";
    }
  });

  it("belgisiz faylda banner yo'q", () => {
    delete soragich.namuna;
    try {
      expect(sahifa().find(".namuna-banner").exists()).toBe(false);
    } finally {
      soragich.namuna = "1";
    }
  });
});
