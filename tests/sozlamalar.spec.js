// tests/sozlamalar.spec.js — o'lchov nomlari, nom prefiksi va profil.
//
// ── NIMANI HIMOYA QILADI ──
//
// Uchala narsa ham jimgina buziladi:
//
//   1. **O'lchov nomi.** Ilgari uchta ekranda uch xil yozilgan edi
//      va `ImportPreview` nominal shkalani «Matn» derdi. Nusxa
//      qaytsa, hech narsa yiqilmaydi — foydalanuvchi shunchaki
//      ikki ekranda ikki xil so'z ko'radi.
//
//   2. **Prefiks tekshiruvi.** Yaroqsiz prefiks («1a», apostrofli
//      nom) saqlansa, xato ustun yasalganda emas, ancha keyin —
//      filtr shartida chiqardi.
//
//   3. **Nom to'qnashuvi.** `uzunlik + 1` ustun o'chirilgandan
//      keyin band nomni qayta yasardi.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";

import { OLCHOV, OLCHOVLAR, olchovMisoli, olchovNomi, olchovYorligi } from "../src/olchov";
import {
  MAX_PREFIKS,
  SUKUT_PREFIKS,
  prefiksXatosi,
  prefiksniOqi,
  yangiNom,
} from "../src/sozlamalar";
import sozlamalar from "../src/store/sozlamalar";
import ProfilPage from "../src/pages/ProfilPage.vue";
import VariablesTab from "../src/components/VariablesTab.vue";
import ComputeModal from "../src/components/ComputeModal.vue";
import RecodeModal from "../src/components/RecodeModal.vue";

beforeEach(() => localStorage.clear());

// ══════════════════════ o'lchov nomlari ══════════════════════

describe("olchovNomi", () => {
  it("🔴 NOMLAR ODDIY TILDA", () => {
    // `Nominal / Ordinal / Scale` statistika o'rganmagan odam
    // uchun ma'nosiz so'zlar: u qaysi biri o'z ustuniga tegishli
    // ekanini bilmaydi va tur tanlash bosqichi devorga aylanadi.
    expect(olchovNomi("nominal")).toBe("Guruh kodi");
    expect(olchovNomi("ordinal")).toBe("Tartib / baho");
    expect(olchovNomi("scale")).toBe("O'lchov / ball");
  });

  it("🔴 TEXNIK ATAMA QAVSDA QOLADI", () => {
    // SPSS bilan ishlagan foydalanuvchi «Guruh kodi» nimaligini
    // taxmin qilib o'tirmasin.
    expect(olchovYorligi("nominal")).toBe("Guruh kodi (Nominal)");
    expect(olchovYorligi("scale")).toBe("O'lchov / ball (Scale)");
  });

  it("misol har bir daraja uchun qaytadi", () => {
    expect(olchovMisoli("nominal")).toBe("1 = erkak, 2 = ayol");
    expect(olchovMisoli("scale")).toBe("yosh, test balli");
    expect(olchovMisoli("interval")).toBe("");
  });

  it("har bir darajada uchala maydon ham bor", () => {
    for (const o of Object.values(OLCHOV)) {
      expect(o.nom).toBeTruthy();
      expect(o.texnik).toBeTruthy();
      expect(o.misol).toBeTruthy();
    }
  });

  it("🔴 nominal «Matn» EMAS", () => {
    // Nominal shkala — tartibsiz TOIFA, matn emas: raqam bilan
    // kodlangan nominal ham bo'ladi (1 = erkak, 2 = ayol).
    expect(olchovNomi("nominal")).not.toBe("Matn");
    expect(OLCHOV.nominal.misol).toContain("erkak");
  });

  it("noma'lum daraja o'z kaliti bilan chiqadi", () => {
    // Backend yangi daraja qo'shsa, ekranda bo'sh joy qolmasin.
    expect(olchovNomi("interval")).toBe("interval");
    expect(olchovNomi(null)).toBe("");
    expect(olchovYorligi("interval")).toBe("interval");
  });

  it("ro'yxat kuchli shkaladan kuchsizga", () => {
    expect(OLCHOVLAR.map(o => o.key)).toEqual(["scale", "ordinal", "nominal"]);
  });

  it("ro'yxatdagi nom lug'atdagi bilan bir xil", () => {
    // Ikkita eksport bir manbadan chiqsin.
    for (const o of OLCHOVLAR) expect(o.nom).toBe(OLCHOV[o.key].nom);
  });
});

describe("🔴 o'lchov nomi BITTA joyda", () => {
  // Nusxa qaytsa hech narsa yiqilmaydi — foydalanuvchi shunchaki
  // ikki ekranda ikki xil so'z ko'radi. Shuning uchun manbaning
  // o'zi tekshiriladi.
  //
  // Beshinchi nusxa qo'shilishi oson: `<option value="scale">`
  // yozish `olchov.js` dan import qilishdan qisqaroq. Aynan shu
  // sababli bu yerda to'sib qo'yilgan.
  const FAYLLAR = [
    "src/components/VariablesTab.vue",
    "src/components/ComputeModal.vue",
    "src/components/RecodeModal.vue",
    "src/components/ImportPreview.vue",
    "src/components/analysis/AnalysisPanel.vue",
  ];

  it.each(FAYLLAR)("%s o'lchov nomini qo'lda yozmaydi", yol => {
    const manba = readFileSync(resolve(__dirname, "..", yol), "utf8");
    for (const kalit of Object.keys(OLCHOV)) {
      expect(manba).not.toContain(`<option value="${kalit}">`);
    }
    for (const o of Object.values(OLCHOV)) {
      expect(manba).not.toContain(`>${o.texnik}<`);
      expect(manba).not.toContain(`"${o.nom}"`);
    }
  });
});

// ══════════════════════ prefiks tekshiruvi ══════════════════════

describe("prefiksXatosi", () => {
  it.each(["ozg", "x", "_a", "Var", "ozgaruvchi", "a1"])(
    "«%s» yaroqli", p => expect(prefiksXatosi(p)).toBe(""),
  );

  it("🔴 APOSTROFLI PREFIKS RAD ETILADI", () => {
    // `o'zg_1 > 5` shartida tokenizer `'` da to'xtaydi. Xato
    // ustun yasalganda emas, filtr yozilganda chiqardi.
    expect(prefiksXatosi("o'zg")).toContain("Apostrof");
    expect(prefiksXatosi("o‘zg")).toContain("Apostrof");
  });

  it("raqam bilan boshlanmaydi", () => {
    expect(prefiksXatosi("1a")).not.toBe("");
  });

  it("bo'sh bo'lmaydi", () => {
    expect(prefiksXatosi("")).toContain("bo'sh");
    expect(prefiksXatosi("   ")).toContain("bo'sh");
    expect(prefiksXatosi(null)).toContain("bo'sh");
  });

  it("uzunlik chegarasi bor", () => {
    expect(prefiksXatosi("a".repeat(MAX_PREFIKS))).toBe("");
    expect(prefiksXatosi("a".repeat(MAX_PREFIKS + 1))).toContain(String(MAX_PREFIKS));
  });

  it("🔴 zahiralangan so'z prefiks bo'lmaydi", () => {
    expect(prefiksXatosi("and")).toContain("zahiralangan");
    expect(prefiksXatosi("NOT")).toContain("zahiralangan");
  });

  it("bo'sh joy kesiladi", () => {
    expect(prefiksXatosi("  ozg  ")).toBe("");
  });
});

// ══════════════════════ nom yasash ══════════════════════

describe("yangiNom", () => {
  it("bo'sh ro'yxatda birinchi raqam", () => {
    expect(yangiNom([], "ozg")).toBe("ozg_1");
  });

  it("🔴 BAND NOMNI QAYTA YASAMAYDI", () => {
    // Eski kod `uzunlik + 1` ishlatardi: ikkita ustun qo'shib,
    // birinchisini o'chirsangiz, keyingisi `ozg_2` bo'lib
    // mavjudi bilan to'qnashardi.
    expect(yangiNom(["ozg_2"], "ozg")).toBe("ozg_1");
    expect(yangiNom(["ozg_1"], "ozg")).toBe("ozg_2");
    expect(yangiNom(["ozg_1", "ozg_3"], "ozg")).toBe("ozg_2");
  });

  it("boshqa nomlar to'sqinlik qilmaydi", () => {
    expect(yangiNom(["yosh", "jins"], "ozg")).toBe("ozg_1");
  });

  it("katta-kichik harf farqsiz taqqoslanadi", () => {
    // Backend nomlarni ham shunday ko'radi — `OZG_1` va `ozg_1`
    // bitta ustun sifatida to'qnashardi.
    expect(yangiNom(["OZG_1"], "ozg")).toBe("ozg_2");
  });

  it("prefiks berilmasa sukut ishlatiladi", () => {
    expect(yangiNom([])).toBe(`${SUKUT_PREFIKS}_1`);
  });
});

// ══════════════════════ store ══════════════════════

describe("sozlamalar store", () => {
  function s() {
    return sozlamalar.state();
  }

  it("sukut prefiks `ozg`", () => {
    expect(s().nomPrefiksi).toBe("ozg");
  });

  it("saqlaydi va `localStorage` ga yozadi", () => {
    const st = s();
    sozlamalar.mutations.SET_NOM_PREFIKSI(st, "col");
    expect(st.nomPrefiksi).toBe("col");
    expect(prefiksniOqi()).toBe("col");
  });

  it("🔴 YAROQSIZ QIYMAT SAQLANMAYDI", () => {
    const st = s();
    sozlamalar.mutations.SET_NOM_PREFIKSI(st, "1a");
    expect(st.nomPrefiksi).toBe(SUKUT_PREFIKS);
    sozlamalar.mutations.SET_NOM_PREFIKSI(st, "o'zg");
    expect(st.nomPrefiksi).toBe(SUKUT_PREFIKS);
  });

  it("bo'sh joy kesib saqlanadi", () => {
    const st = s();
    sozlamalar.mutations.SET_NOM_PREFIKSI(st, "  col  ");
    expect(st.nomPrefiksi).toBe("col");
  });

  it("sukutga qaytaradi", () => {
    const st = s();
    sozlamalar.mutations.SET_NOM_PREFIKSI(st, "col");
    sozlamalar.mutations.SOZLAMALARNI_TIKLA(st);
    expect(st.nomPrefiksi).toBe(SUKUT_PREFIKS);
    expect(prefiksniOqi()).toBe(SUKUT_PREFIKS);
  });

  it("🔴 `localStorage` dagi BUZUQ qiymat sukutga qaytadi", () => {
    // Qiymat eski versiyadan yoki qo'lda o'zgartirilgan bo'lishi
    // mumkin — u holda ilova yaroqsiz nom yasab qo'ymasin.
    localStorage.setItem("mtt.sozlamalar.nomPrefiksi", "1a");
    expect(prefiksniOqi()).toBe(SUKUT_PREFIKS);
  });
});

// ══════════════════════ VariablesTab ══════════════════════

function tahrirDokon(variables = [], prefiks = "ozg") {
  const qoshilgan = [];
  return {
    qoshilgan,
    store: createStore({
      modules: {
        editor: {
          namespaced: true,
          state: () => ({ schema: { variables }, schemaError: null, rows: [], file: { id: "f1" } }),
          mutations: { ADD_VARIABLE: (_s, v) => qoshilgan.push(v) },
          actions: { saveSchema: vi.fn() },
        },
        sozlamalar: {
          namespaced: true,
          state: () => ({ nomPrefiksi: prefiks }),
        },
      },
    }),
  };
}

function tahrir(variables, prefiks) {
  const d = tahrirDokon(variables, prefiks);
  const w = mount(VariablesTab, {
    global: { plugins: [d.store], stubs: { ComputeModal: true, RecodeModal: true } },
  });
  return { ...d, w };
}

describe("VariablesTab — sarlavhalar", () => {
  it("🔴 INGLIZCHA SARLAVHA QOLMAGAN", () => {
    const { w } = tahrir([{ name: "yosh", label: "", measure: "scale", values: null }]);
    const sarlavhalar = w.findAll("thead th").map(t => t.text());
    expect(sarlavhalar).toEqual(["Nom", "Yorliq", "O‘lchov", "Qiymatlar", "Yo‘q qiymatlar"]);
  });

  it("o'lchov ro'yxati `olchov.js` dan", () => {
    const { w } = tahrir([{ name: "yosh", label: "", measure: "scale", values: null }]);
    const variantlar = w.findAll("tbody select option").map(o => o.text());
    expect(variantlar).toEqual(OLCHOVLAR.map(o => `${o.nom} (${o.texnik})`));
  });

  it("🔴 TANLANGAN TURNING MISOLI KO'RINADI", () => {
    // Foydalanuvchi «Guruh kodi» nimaligini taxmin qilmasin —
    // `1 = erkak, 2 = ayol` bitta qarashda tanitadi.
    const { w } = tahrir([{ name: "jins", label: "", measure: "nominal", values: null }]);
    expect(w.find(".olchov-misoli").text()).toBe(olchovMisoli("nominal"));
  });

  it("yorliq maydonining ko'rsatmasi o'zbekcha", () => {
    const { w } = tahrir([{ name: "yosh", label: "", measure: "scale", values: null }]);
    expect(w.find("tbody input").attributes("placeholder")).toBe("Yorliq");
  });
});

describe("VariablesTab — yangi o'zgaruvchi nomi", () => {
  it("🔴 PREFIKS SOZLAMADAN OLINADI", () => {
    const { w, qoshilgan } = tahrir([], "col");
    w.vm.addVariable();
    expect(qoshilgan[0].name).toBe("col_1");
  });

  it("sukut prefiksda `ozg_1`", () => {
    const { w, qoshilgan } = tahrir([]);
    w.vm.addVariable();
    expect(qoshilgan[0].name).toBe("ozg_1");
  });

  it("🔴 BAND NOM QAYTA YASALMAYDI", () => {
    const { w, qoshilgan } = tahrir([
      { name: "ozg_1", label: "", measure: "scale", values: null },
      { name: "ozg_3", label: "", measure: "scale", values: null },
    ]);
    w.vm.addVariable();
    expect(qoshilgan[0].name).toBe("ozg_2");
  });
});

// ══════════════════════ ProfilPage ══════════════════════

function profilDokon({ user = null, method = null } = {}) {
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: () => ({ user, method, loginVisible: false }),
        getters: {
          isAuthenticated: st => !!st.user,
          displayName: st => st.user?.email || "",
        },
        mutations: { SET_LOGIN_VISIBLE: () => {} },
        actions: { logout: vi.fn() },
      },
      sozlamalar,
    },
  });
}

function profil(cfg) {
  return mount(ProfilPage, {
    global: {
      plugins: [profilDokon(cfg)],
      mocks: { $router: { push: vi.fn() } },
      stubs: { RouterLink: true },
    },
  });
}

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("ProfilPage", () => {
  it("anonim foydalanuvchiga SOZLAMA KO'RINADI", () => {
    // Tahlil login talab qilmaydi — prefiks ham `localStorage` da.
    const w = profil();
    expect(w.find("#prefiks").exists()).toBe(true);
    expect(w.text()).toContain("Kirish");
  });

  it("login qilganda hisob ma'lumoti chiqadi", () => {
    const w = profil({ user: { email: "a@b.uz", role: "librarian" }, method: "email" });
    const matn = w.text();
    expect(matn).toContain("a@b.uz");
    expect(matn).toContain("Kutubxonachi");
    expect(matn).toContain("Elektron pochta");
  });

  it("🔴 TELEGRAM BOG'LANMAGANI AYTILADI", () => {
    // `POST /export` `deliver: "telegram"` da aynan shuni talab
    // qiladi — foydalanuvchi sababini oldindan bilsin.
    const w = profil({ user: { email: "a@b.uz", role: "user" }, method: "email" });
    expect(w.text()).toContain("Telegram bog");
  });

  it("Telegram bor bo'lsa eslatma yo'q", () => {
    const w = profil({ user: { telegram_id: "123", role: "user" }, method: "telegram" });
    expect(w.text()).not.toContain("bog‘lanmagan");
  });

  it("🔴 JONLI KO'RINISH natijani darhol ko'rsatadi", async () => {
    const w = profil();
    await w.find("#prefiks").setValue("col");
    expect(w.find(".namuna").text()).toContain("col_1, col_2, col_3");
  });

  it("🔴 YAROQSIZ PREFIKSDA SAQLASH O'CHADI", async () => {
    const w = profil();
    await w.find("#prefiks").setValue("1a");
    expect(w.find(".xato-matn").exists()).toBe(true);
    expect(w.find(".saqla").attributes("disabled")).toBeDefined();
    expect(w.find(".namuna").exists()).toBe(false);
  });

  it("apostrofli prefiksda sabab ko'rsatiladi", async () => {
    const w = profil();
    await w.find("#prefiks").setValue("o'zg");
    expect(w.find(".xato-matn").text()).toContain("Apostrof");
  });

  it("saqlash sozlamani o'zgartiradi", async () => {
    const w = profil();
    await w.find("#prefiks").setValue("col");
    await w.find(".saqla").trigger("click");
    expect(w.vm.$store.state.sozlamalar.nomPrefiksi).toBe("col");
    expect(w.text()).toContain("saqlandi");
  });

  it("sukut qiymatda «qaytarish» tugmasi yo'q", () => {
    expect(profil().find(".link").exists()).toBe(false);
  });

  it("o'zgartirilganda «qaytarish» tugmasi chiqadi", async () => {
    const w = profil();
    await w.find("#prefiks").setValue("col");
    expect(w.find(".link").text()).toContain(SUKUT_PREFIKS);
  });
});


// ══════════════════════ Compute / Recode oynalari ══════════════════════
//
// Ikkalasida ham o'lchov tanlovi bor va ikkalasi ham ilgari
// `<option value="scale">Scale</option>` ni QO'LDA yozardi.
// Manba tekshiruvi nusxani topadi, bu yerdagi testlar esa
// chizilgan YORLIQNI tekshiradi — qavsdagi texnik atama
// tushib qolmasin.

function modalDokon() {
  return createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({
          schema: { variables: [{ name: "yosh", measure: "scale" }] },
          rows: [],
          file: { id: "f1" },
        }),
        actions: {
          previewCompute: vi.fn(), computeVariable: vi.fn(),
          previewRecode: vi.fn(), recodeVariable: vi.fn(),
        },
      },
    },
  });
}

describe.each([
  ["ComputeModal", ComputeModal],
  ["RecodeModal", RecodeModal],
])("%s — o'lchov tanlovi", (_nom, Komponent) => {
  it("yorliqlar `olchov.js` dagi shaklda", () => {
    const w = mount(Komponent, {
      props: { open: true },
      global: { plugins: [modalDokon()] },
    });
    const yorliqlar = w.findAll("option")
      .map(o => o.text())
      .filter(t => OLCHOVLAR.some(x => t.startsWith(x.nom)));

    expect(yorliqlar).toEqual(OLCHOVLAR.map(o => olchovYorligi(o.key)));
  });
});
