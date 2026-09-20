// tests/results-list.spec.js — natijalar ro'yxati (08-vazifa).
//
// ── NIMANI HIMOYA QILADI ──
//
// Ro'yxatning uchta xatti-harakati foydalanuvchiga KO'RINMAY
// buziladi:
//
//   1. **Dubl.** Bir xil tahlil ikki marta yugurtirilsa ro'yxatda
//      ikkita bir xil karta paydo bo'ladi. Foydalanuvchi ikkalasini
//      ham belgilab, hujjatga bir xil jadvalni ikki marta qo'yadi.
//
//   2. **Eskirganlik.** Ma'lumot o'zgargach eski natijalar BOSHQA
//      tanlamaga tegishli bo'lib qoladi, lekin ekranda o'zgarishsiz
//      turadi. Nishon bo'lmasa, foydalanuvchi ikki xil tanlamadan
//      chiqqan raqamlarni bitta hisobotga qo'yadi.
//
//   3. **Eskirgan elementni jimgina eksport qilish.** Server uni
//      joriy ma'lumot bilan qayta hisoblaydi — ya'ni hujjatdagi
//      raqam ekrandagidan farq qiladi.
//
// Hech biri istisno tashlamaydi va hech biri konsolda ko'rinmaydi.
//
// ── KANONIK QOIDA IKKI TILDA ──
//
// `src/natijalar.js` — `app/modules/statistics/results.py` ning
// egizagi. Shuning uchun bu yerdagi holatlar ro'yxati
// `tests/test_results_api.py` dagi bilan AYNAN bir xil bo'lishi
// kerak: kalit tartibi, `null` va yo'q maydon, ichma-ich obyekt,
// massiv tartibi.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from "../src/api";
import editor from "../src/store/editor";
import { kanonikParams, natijaKaliti, natijaSarlavhasi } from "../src/natijalar";

const { actions, mutations, state: stateFactory } = editor;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

function javob({ type = "crosstab", params = { variables: ["a", "b"] },
                 rows_hash = "h1", title = "Kesishma jadvali" } = {}) {
  return {
    type,
    params,
    rows_hash,
    result: { analysis: type, title, tables: [{ id: "t", title }], charts: [], meta: {} },
  };
}

function holat() {
  const s = stateFactory();
  s.file = { id: "f1", title: "Sinov" };
  return s;
}

// ══════════════════════ kanonik solishtirish ══════════════════════

describe("kanonikParams", () => {
  it("🔴 kalit tartibi ahamiyatsiz", () => {
    // Frontend `params` ni JS obyektidan yig'adi va kalit tartibini
    // kafolatlamaydi. Tartibga tayanilsa, bir xil tahlil har safar
    // yangi element bo'lib qo'shilardi.
    expect(kanonikParams({ a: 1, b: 2 })).toBe(kanonikParams({ b: 2, a: 1 }));
  });

  it("🔴 `null` va YO'Q maydon bir xil", () => {
    // Frontend `method` ni ba'zan `null` yuboradi, ba'zan umuman
    // yubormaydi — ikkalasi ham «sukut usuli» degani.
    expect(kanonikParams({ a: 1, method: null })).toBe(kanonikParams({ a: 1 }));
    expect(kanonikParams({ a: 1, method: undefined })).toBe(kanonikParams({ a: 1 }));
  });

  it("ichma-ich obyektda ham saralaydi", () => {
    expect(kanonikParams({ x: { d: 1, c: 2 } })).toBe(kanonikParams({ x: { c: 2, d: 1 } }));
  });

  it("🔴 MASSIV TARTIBI SAQLANADI", () => {
    // Korrelyatsiya matritsasida ustunlar tartibi natijada
    // ko'rinadi — ular ikki xil tahlil.
    expect(kanonikParams({ v: ["a", "b"] })).not.toBe(kanonikParams({ v: ["b", "a"] }));
  });

  it("bo'sh, `null` va massiv — hammasi `{}`", () => {
    expect(kanonikParams(null)).toBe("{}");
    expect(kanonikParams(undefined)).toBe("{}");
    expect(kanonikParams({})).toBe("{}");
    expect(kanonikParams([1, 2])).toBe("{}");
  });
});

describe("natijaKaliti", () => {
  it("uchala maydon ham kalitga kiradi", () => {
    const k = natijaKaliti("anova", { a: 1 }, "h1");
    expect(natijaKaliti("kruskal", { a: 1 }, "h1")).not.toBe(k);
    expect(natijaKaliti("anova", { a: 2 }, "h1")).not.toBe(k);
    expect(natijaKaliti("anova", { a: 1 }, "h2")).not.toBe(k);
  });

  it("tur yo'q bo'lsa `auto`", () => {
    expect(natijaKaliti(null, {}, "h")).toBe(natijaKaliti("auto", {}, "h"));
  });
});

// ══════════════════════ ADD_RESULT — Q2 ══════════════════════

describe("ADD_RESULT", () => {
  it("🔴 bir xil (type, params, rows_hash) DUBL YASAMAYDI", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob());
    mutations.ADD_RESULT(s, javob());
    expect(s.results).toHaveLength(1);
  });

  it("🔴 `params` kalitlari boshqa tartibda bo'lsa ham dubl yasamaydi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ params: { a: 1, b: 2 } }));
    mutations.ADD_RESULT(s, javob({ params: { b: 2, a: 1 } }));
    expect(s.results).toHaveLength(1);
  });

  it("birlashtirishda `id` va tanlov saqlanadi", () => {
    // Aks holda ro'yxat qayta tahlildan keyin sakrab ketardi va
    // foydalanuvchining belgisi yo'qolardi.
    const s = holat();
    mutations.ADD_RESULT(s, javob());
    const id = s.results[0].id;
    mutations.TOGGLE_SELECTED(s, id);
    expect(s.results[0].selected).toBe(false);

    mutations.ADD_RESULT(s, javob());
    expect(s.results[0].id).toBe(id);
    expect(s.results[0].selected).toBe(false);
  });

  it("birlashtirishda `saved` yo'qolmaydi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob());
    mutations.SET_RESULT_SAVED(s, { id: s.results[0].id, saved_id: "db1" });

    mutations.ADD_RESULT(s, javob());
    expect(s.results[0].saved).toBe(true);
    expect(s.results[0].saved_id).toBe("db1");
  });

  it("boshqa parametr — YANGI element", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ params: { variables: ["a"] } }));
    mutations.ADD_RESULT(s, javob({ params: { variables: ["b"] } }));
    expect(s.results).toHaveLength(2);
  });

  it("🔴 QAYTA HISOBLASH ESKI ELEMENTNI ALMASHTIRADI", () => {
    // Odatda yangi `rows_hash` yangi element yasaydi va eskisi
    // «eskirgan» bo'lib qoladi. Lekin foydalanuvchi AYNAN shu
    // elementni qayta hisoblashni so'raganda eskisi ro'yxatda
    // qolsa, nishon yo'qolmasdi va bir xil tahlilning ikki
    // nusxasi turardi.
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: "h1" }));
    const id = s.results[0].id;

    mutations.ADD_RESULT(s, { ...javob({ rows_hash: "h2" }), replaceId: id });

    expect(s.results).toHaveLength(1);
    expect(s.results[0].id).toBe(id);
    expect(s.results[0].rows_hash).toBe("h2");
    expect(s.results[0].stale).toBe(false);
  });

  it("almashtirishda ham `saved` va tanlov saqlanadi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: "h1" }));
    const id = s.results[0].id;
    mutations.SET_RESULT_SAVED(s, { id, saved_id: "db1" });
    mutations.TOGGLE_SELECTED(s, id);

    mutations.ADD_RESULT(s, { ...javob({ rows_hash: "h2" }), replaceId: id });
    expect(s.results[0].saved).toBe(true);
    expect(s.results[0].selected).toBe(false);
  });

  it("almashtiriladigan natija allaqachon ro'yxatda bo'lsa, eskisi olib tashlanadi", () => {
    // Foydalanuvchi avval yangi ma'lumot bilan tahlil qilib, keyin
    // eskirganini ham qayta hisoblasa — natija bitta bo'lsin.
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: "h1" }));
    const eskiId = s.results[0].id;
    mutations.ADD_RESULT(s, javob({ rows_hash: "h2" }));
    expect(s.results).toHaveLength(2);

    mutations.ADD_RESULT(s, { ...javob({ rows_hash: "h2" }), replaceId: eskiId });
    expect(s.results).toHaveLength(1);
    expect(s.results[0].rows_hash).toBe("h2");
  });

  it("`replaceId` yo'q bo'lsa eski element ro'yxatda QOLADI", () => {
    // Oddiy tahlilda foydalanuvchi eski raqamni ham ko'rmoqchi
    // bo'lishi mumkin — u shunchaki `eskirgan` deb belgilanadi.
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: "h1" }));
    mutations.ADD_RESULT(s, javob({ rows_hash: "h2" }));
    expect(s.results).toHaveLength(2);
  });

  it("noma'lum `replaceId` yangi element yasaydi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, { ...javob({ rows_hash: "h1" }), replaceId: "yoq" });
    expect(s.results).toHaveLength(1);
  });

  it("yangisi ro'yxat boshiga qo'shiladi va faol bo'ladi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ type: "anova" }));
    mutations.ADD_RESULT(s, javob({ type: "kruskal" }));
    expect(s.results[0].type).toBe("kruskal");
    expect(s.activeId).toBe(s.results[0].id);
  });
});

// ══════════════════════ eskirganlik — Q4 ══════════════════════

describe("eskirganlik", () => {
  it("🔴 yangi `rows_hash` eskilarini ESKIRTIRADI", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: "h1" }));
    mutations.ADD_RESULT(s, javob({ type: "anova", rows_hash: "h2" }));

    const eski = s.results.find(e => e.rows_hash === "h1");
    expect(eski.stale).toBe(true);
    expect(s.results.find(e => e.rows_hash === "h2").stale).toBe(false);
  });

  it("🔴 BOSHQA `params` ESKIRTIRMAYDI — u boshqa tahlil", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ params: { variables: ["a"] } }));
    mutations.ADD_RESULT(s, javob({ params: { variables: ["b"] } }));
    expect(s.results.every(e => !e.stale)).toBe(true);
  });

  it("MARK_STALE joriy xesh bilan solishtiradi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: "h1" }));
    mutations.MARK_STALE(s, "h2");
    expect(s.results[0].stale).toBe(true);
    mutations.MARK_STALE(s, "h1");
    expect(s.results[0].stale).toBe(false);
  });

  it("🔴 `rows_hash` yo'q element YANGI TAHLILDAN ham eskirmaydi", () => {
    // `ADD_RESULT` ichidagi tekshiruv `MARK_STALE` dagidan alohida —
    // mutatsiya sinovi ko'rsatdi: biri himoyalangan, ikkinchisi yo'q
    // edi.
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: null }));
    mutations.ADD_RESULT(s, javob({ type: "anova", rows_hash: "h9" }));
    expect(s.results.find(e => !e.rows_hash).stale).toBe(false);
  });

  it("🔴 `rows_hash` yo'q element ESKIRMAYDI", () => {
    // Uning qaysi ma'lumotdan chiqqani noma'lum; «eskirgan» deb
    // belgilash yolg'on ma'lumot berardi.
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: null }));
    mutations.MARK_STALE(s, "h9");
    expect(s.results[0].stale).toBe(false);
  });
});

// ══════════════════════ tanlash va tartib ══════════════════════

describe("tanlash", () => {
  it("yangi element sukut bo'yicha belgilangan", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob());
    expect(s.results[0].selected).toBe(true);
  });

  it("SELECT_ALL hammasini almashtiradi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ type: "a" }));
    mutations.ADD_RESULT(s, javob({ type: "b" }));
    mutations.SELECT_ALL(s, false);
    expect(s.results.every(e => !e.selected)).toBe(true);
    mutations.SELECT_ALL(s, true);
    expect(s.results.every(e => e.selected)).toBe(true);
  });
});

describe("faol element", () => {
  it("o'sha elementni qayta bosish uni yopadi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob());
    const id = s.results[0].id;
    mutations.SET_ACTIVE_RESULT(s, id);
    expect(s.activeId).toBeNull();
    mutations.SET_ACTIVE_RESULT(s, id);
    expect(s.activeId).toBe(id);
  });

  it("o'chirilgan element faol bo'lsa, boshqasiga o'tadi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ type: "a" }));
    mutations.ADD_RESULT(s, javob({ type: "b" }));
    const faol = s.activeId;
    mutations.REMOVE_RESULT(s, faol);
    expect(s.results).toHaveLength(1);
    expect(s.activeId).toBe(s.results[0].id);
  });

  it("oxirgi element o'chirilsa faol yo'q bo'ladi", () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob());
    mutations.REMOVE_RESULT(s, s.results[0].id);
    expect(s.activeId).toBeNull();
  });
});

describe("tartib — Q6", () => {
  it("sukut — yangisi tepada", () => {
    expect(stateFactory().resultsOrder).toBe("yangi");
  });

  it("🔴 tanlov `localStorage` da saqlanadi, natijalar esa YO'Q", () => {
    // Natija JSON'i megabaytlarga yetishi mumkin va baribir
    // serverdan qayta o'qiladi; tartib esa bitta qisqa satr.
    const s = holat();
    mutations.SET_ORDER(s, "eski");
    expect(localStorage.getItem("mtt.results.order")).toBe("eski");
    expect(stateFactory().resultsOrder).toBe("eski");
  });

  it("noma'lum qiymat sukutga qaytadi", () => {
    const s = holat();
    mutations.SET_ORDER(s, "xayoliy");
    expect(s.resultsOrder).toBe("yangi");
  });
});

// ══════════════════════ amallar ══════════════════════

describe("loadSavedResults", () => {
  const javobRoyxat = {
    data: {
      current_rows_hash: "h2",
      items: [
        { id: "db1", type: "anova", params: { v: ["a"] }, title: "ANOVA",
          rows_hash: "h2", created_at: "2026-01-01T00:00:00Z",
          result: { title: "ANOVA", tables: [] } },
        { id: "db2", type: "kruskal", params: {}, title: "Kruskal",
          rows_hash: "h1", created_at: "2026-01-02T00:00:00Z",
          result: { title: "Kruskal", tables: [] } },
      ],
    },
  };

  it("anonim foydalanuvchida SO'ROV YUBORMAYDI", async () => {
    // `GET /results` login talab qiladi — chaqirilsa har fayl
    // ochilishida kutilgan `401` konsolga tushardi.
    await actions.loadSavedResults(
      { state: holat(), commit: vi.fn(), rootState: { auth: { user: null } } },
    );
    expect(api.get).not.toHaveBeenCalled();
  });

  it("saqlanganlar `saved: true` bilan tushadi", async () => {
    api.get.mockResolvedValue(javobRoyxat);
    const commit = vi.fn();
    await actions.loadSavedResults(
      { state: holat(), commit, rootState: { auth: { user: { id: "u" } } } },
    );

    const [, elementlar] = commit.mock.calls.find(c => c[0] === "SET_RESULTS");
    expect(elementlar).toHaveLength(2);
    expect(elementlar.every(e => e.saved)).toBe(true);
    expect(elementlar.map(e => e.saved_id)).toEqual(["db1", "db2"]);
  });

  it("🔴 ESKIRGAN ELEMENT SUKUT BO'YICHA BELGILANMAYDI", () => {
    // Eksport uni joriy ma'lumot bilan qayta hisoblaydi, ya'ni
    // hujjatdagi raqam ekrandagidan farq qilishi mumkin.
    api.get.mockResolvedValue(javobRoyxat);
    const commit = vi.fn();
    return actions.loadSavedResults(
      { state: holat(), commit, rootState: { auth: { user: { id: "u" } } } },
    ).then(() => {
      const [, elementlar] = commit.mock.calls.find(c => c[0] === "SET_RESULTS");
      const eskirgan = elementlar.find(e => e.saved_id === "db2");
      expect(eskirgan.stale).toBe(true);
      expect(eskirgan.selected).toBe(false);
      expect(elementlar.find(e => e.saved_id === "db1").selected).toBe(true);
    });
  });

  it("🔴 saqlanmagan sessiya elementlari YO'QOLMAYDI", async () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ type: "sessiya", rows_hash: "h2" }));
    api.get.mockResolvedValue(javobRoyxat);
    const commit = vi.fn();

    await actions.loadSavedResults(
      { state: s, commit, rootState: { auth: { user: { id: "u" } } } },
    );
    const [, elementlar] = commit.mock.calls.find(c => c[0] === "SET_RESULTS");
    expect(elementlar.some(e => e.type === "sessiya")).toBe(true);
  });

  it("serverda ham bor sessiya elementi ikki marta ko'rinmaydi", async () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ type: "anova", params: { v: ["a"] }, rows_hash: "h2" }));
    api.get.mockResolvedValue(javobRoyxat);
    const commit = vi.fn();

    await actions.loadSavedResults(
      { state: s, commit, rootState: { auth: { user: { id: "u" } } } },
    );
    const [, elementlar] = commit.mock.calls.find(c => c[0] === "SET_RESULTS");
    expect(elementlar.filter(e => e.type === "anova")).toHaveLength(1);
  });
});

describe("analyze", () => {
  it("🔴 `replaceId` NI ADD_RESULT GACHA OLIB BORADI", () => {
    // Zanjir uch bo'g'inli: `recomputeEntry` → `analyze` →
    // `ADD_RESULT`. O'rtadagi bo'g'in uni tashlab yuborsa, qayta
    // hisoblash yana dubl yasardi.
    const s = holat();
    api.post.mockResolvedValue({ data: javob({ rows_hash: "h2" }) });
    const commit = vi.fn();

    return actions.analyze({ state: s, commit }, { type: "crosstab", replaceId: "e9" })
      .then(() => {
        const [, tana] = commit.mock.calls.find(c => c[0] === "ADD_RESULT");
        expect(tana.replaceId).toBe("e9");
      });
  });

  it("`replaceId` berilmasa `null` uzatiladi", () => {
    const s = holat();
    api.post.mockResolvedValue({ data: javob() });
    const commit = vi.fn();

    return actions.analyze({ state: s, commit }, { type: "crosstab" }).then(() => {
      const [, tana] = commit.mock.calls.find(c => c[0] === "ADD_RESULT");
      expect(tana.replaceId).toBeNull();
    });
  });
});

describe("open — eskirganlik", () => {
  it("🔴 ANONIM FOYDALANUVCHIDA HAM ESKIRGANLIK BELGILANADI", async () => {
    // Xesh `GET /files/{id}` javobidan olinadi, `GET /results`
    // dan emas: ikkinchisi login talab qiladi va anonim
    // foydalanuvchi eski natijalarni o'zgarishsiz ko'rib
    // turaverardi.
    api.get.mockResolvedValue({
      data: {
        file: { id: "f1" }, schema: { variables: [] }, rows: [],
        filter: null, rows_hash: "h2",
      },
    });
    const commit = vi.fn();
    await actions.open({ commit, dispatch: vi.fn() }, "f1");

    expect(commit).toHaveBeenCalledWith("MARK_STALE", "h2");
  });

  it("xesh kelmasa MARK_STALE chaqirilmaydi", async () => {
    api.get.mockResolvedValue({
      data: { file: { id: "f1" }, schema: { variables: [] }, rows: [], filter: null },
    });
    const commit = vi.fn();
    await actions.open({ commit, dispatch: vi.fn() }, "f1");
    expect(commit.mock.calls.some(c => c[0] === "MARK_STALE")).toBe(false);
  });

  it("ro'yxat yuklanmasa ham fayl ochiladi", async () => {
    api.get.mockResolvedValue({
      data: { file: { id: "f1" }, schema: { variables: [] }, rows: [],
              filter: null, rows_hash: "h1" },
    });
    const commit = vi.fn();
    const dispatch = vi.fn().mockRejectedValue(new Error("401"));

    await actions.open({ commit, dispatch }, "f1");
    expect(commit).toHaveBeenCalledWith("SET_FILE", { id: "f1" });
  });
});

describe("deleteResultEntry", () => {
  it("saqlangan element SERVERDAN ham o'chadi", async () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob());
    mutations.SET_RESULT_SAVED(s, { id: s.results[0].id, saved_id: "db1" });
    const commit = vi.fn();

    await actions.deleteResultEntry({ state: s, commit }, s.results[0].id);
    expect(api.delete).toHaveBeenCalledWith("/analyze/files/f1/results/db1");
    expect(commit).toHaveBeenCalledWith("REMOVE_RESULT", s.results[0].id);
  });

  it("saqlanmagan element uchun so'rov yuborilmaydi", async () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob());
    const commit = vi.fn();

    await actions.deleteResultEntry({ state: s, commit }, s.results[0].id);
    expect(api.delete).not.toHaveBeenCalled();
    expect(commit).toHaveBeenCalledWith("REMOVE_RESULT", s.results[0].id);
  });
});

describe("exportSelected", () => {
  it("🔴 FAQAT (type, params) YUBORADI, natija JSON'ini emas", async () => {
    // Server hammasini joriy ma'lumot bilan qayta hisoblaydi —
    // hujjatning barcha jadvallari bitta tanlamadan chiqadi.
    const s = holat();
    mutations.ADD_RESULT(s, javob({ type: "anova", params: { v: ["a"] } }));
    mutations.ADD_RESULT(s, javob({ type: "kruskal", params: {} }));
    api.post.mockResolvedValue({ data: { ok: true } });

    await actions.exportSelected(
      { state: s, dispatch: vi.fn() }, { fmt: "docx", deliver: "telegram" },
    );

    const [yol, tana] = api.post.mock.calls[0];
    expect(yol).toBe("/analyze/files/f1/export");
    expect(tana.items).toEqual([
      { type: "kruskal", params: {} },
      { type: "anova", params: { v: ["a"] } },
    ]);
    expect(JSON.stringify(tana)).not.toContain("tables");
  });

  it("belgilanmagan element yuborilmaydi", async () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ type: "anova" }));
    mutations.ADD_RESULT(s, javob({ type: "kruskal" }));
    mutations.TOGGLE_SELECTED(s, s.results.find(e => e.type === "anova").id);
    api.post.mockResolvedValue({ data: { ok: true } });

    await actions.exportSelected(
      { state: s, dispatch: vi.fn() }, { fmt: "docx", deliver: "telegram" },
    );
    expect(api.post.mock.calls[0][1].items.map(i => i.type)).toEqual(["kruskal"]);
  });

  it("hech narsa belgilanmagan bo'lsa so'rov yubormaydi", async () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob());
    mutations.SELECT_ALL(s, false);

    await actions.exportSelected({ state: s, dispatch: vi.fn() }, { fmt: "docx" });
    expect(api.post).not.toHaveBeenCalled();
  });

  it("🔴 eksportdan keyin eskirganlar QAYTA HISOBLANADI", async () => {
    // Hujjat joriy ma'lumot bilan yasaldi; ekrandagi eski raqamlar
    // endi hujjatdagilar bilan mos emas.
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: "h1" }));
    mutations.MARK_STALE(s, "h2");
    const dispatch = vi.fn();
    api.post.mockResolvedValue({ data: { ok: true } });

    await actions.exportSelected(
      { state: s, dispatch }, { fmt: "docx", deliver: "telegram" },
    );
    expect(dispatch).toHaveBeenCalledWith("refreshStale");
  });
});

describe("refreshStale", () => {
  it("🔴 QAYTA HISOBLASH `replaceId` BILAN ketadi", async () => {
    // Usiz eksportdan keyin `eskirgan` nishoni yo'qolmasdi —
    // eski element ro'yxatda qolib ketardi.
    const s = holat();
    mutations.ADD_RESULT(s, javob({ rows_hash: "h1" }));
    mutations.MARK_STALE(s, "h2");
    const id = s.results[0].id;
    const dispatch = vi.fn();

    await actions.recomputeEntry({ state: s, dispatch }, id);
    expect(dispatch).toHaveBeenCalledWith("analyze", expect.objectContaining({ replaceId: id }));
  });

  it("faqat eskirgan VA belgilangan elementlarni qayta hisoblaydi", async () => {
    const s = holat();
    mutations.ADD_RESULT(s, javob({ type: "a", rows_hash: "h1" }));
    mutations.ADD_RESULT(s, javob({ type: "b", rows_hash: "h1" }));
    mutations.MARK_STALE(s, "h2");
    mutations.TOGGLE_SELECTED(s, s.results.find(e => e.type === "a").id);

    const dispatch = vi.fn();
    await actions.refreshStale({ state: s, dispatch });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toBe("recomputeEntry");
  });
});

// ══════════════════════ ko'rsatish ══════════════════════

describe("natijaSarlavhasi", () => {
  it("sarlavha bo'lmasa tur, u ham bo'lmasa sukut", () => {
    expect(natijaSarlavhasi({ title: "ANOVA", type: "anova_oneway" })).toBe("ANOVA");
    expect(natijaSarlavhasi({ type: "anova_oneway" })).toBe("anova_oneway");
    expect(natijaSarlavhasi({})).toBe("Tahlil natijasi");
    expect(natijaSarlavhasi(null)).toBe("Tahlil natijasi");
  });
});

// ══════════════════════ ResultsTab ══════════════════════
//
// Komponent testlari: kartalar, faqat faol elementning chizilishi,
// eksport tugmasidagi son va tasdiq oynalari.

import { mount } from "@vue/test-utils";
import { createStore } from "vuex";
import ResultsTab from "../src/components/ResultsTab.vue";

function element(qismlar = {}) {
  return {
    id: "e1", type: "anova", params: {}, title: "Bir omilli ANOVA",
    meta: { warnings: [], assumptions: [] },
    columns: {}, tables: [{ id: "t1", title: "ANOVA jadvali", columns: [], rows: [] }],
    charts: [], rows_hash: "h1", created_at: "2026-01-01T10:00:00Z",
    saved: false, saved_id: null, stale: false, selected: true,
    ...qismlar,
  };
}

function dokon({ results = [], activeId = null, order = "yangi", user = { id: "u" } } = {}) {
  return createStore({
    modules: {
      editor: {
        namespaced: true,
        state: () => ({ results, activeId, resultsOrder: order, file: { id: "f1" },
                        schema: { variables: [] }, rows: [] }),
        mutations: {
          SET_ACTIVE_RESULT: (s, id) => { s.activeId = s.activeId === id ? null : id; },
          TOGGLE_SELECTED: (s, id) => {
            const e = s.results.find(x => x.id === id);
            if (e) e.selected = !e.selected;
          },
          SELECT_ALL: (s, v) => s.results.forEach(e => { e.selected = !!v; }),
          SET_ORDER: (s, v) => { s.resultsOrder = v; },
        },
        actions: {
          exportSelected: vi.fn(), recomputeEntry: vi.fn(),
          saveResultEntry: vi.fn(), deleteResultEntry: vi.fn(), analyze: vi.fn(),
        },
      },
      auth: {
        namespaced: true,
        state: () => ({ user }),
        getters: { isAuthenticated: s => !!s.user },
        mutations: { SET_LOGIN_VISIBLE: () => {} },
      },
    },
  });
}

function tab(cfg) {
  return mount(ResultsTab, {
    global: {
      plugins: [dokon(cfg)],
      stubs: { AnalysisPanel: true, ResultTable: true, ResultChart: true },
    },
  });
}

describe("ResultsTab — kartalar", () => {
  it("bo'sh ro'yxatda eslatma chiqadi", () => {
    const w = tab();
    expect(w.find(".empty").exists()).toBe(true);
    expect(w.findAll(".karta")).toHaveLength(0);
  });

  it("har bir element uchun bitta karta", () => {
    const w = tab({ results: [element(), element({ id: "e2", title: "Kruskal" })] });
    expect(w.findAll(".karta")).toHaveLength(2);
    expect(w.text()).toContain("2 ta natija");
  });

  it("🔴 FAQAT FAOL ELEMENT TO'LIQ CHIZILADI", () => {
    // 10 ta natijaning hammasini DOM'ga chiqarish telefonda
    // sezilarli sekinlik beradi.
    const w = tab({
      results: [element(), element({ id: "e2", title: "Kruskal" })],
      activeId: "e1",
    });
    expect(w.findAll(".karta-tana")).toHaveLength(1);
    expect(w.findAll("result-table-stub")).toHaveLength(1);
  });

  it("nishonlar faqat tegishli elementda", () => {
    const w = tab({
      results: [element({ stale: true }), element({ id: "e2", saved: true })],
    });
    const kartalar = w.findAll(".karta");
    expect(kartalar[0].find(".nishon.stale").exists()).toBe(true);
    expect(kartalar[0].find(".nishon.saved").exists()).toBe(false);
    expect(kartalar[1].find(".nishon.saved").exists()).toBe(true);
  });

  it("saqlangan elementda «Saqlash» tugmasi yo'q", () => {
    const w = tab({ results: [element({ saved: true })] });
    expect(w.find(".karta-amallar").text()).not.toContain("Saqlash");
  });
});

describe("ResultsTab — tartib", () => {
  it("«eski» tanlansa ro'yxat teskari chiziladi", async () => {
    const w = tab({
      results: [element({ id: "e1", title: "Birinchi" }),
                element({ id: "e2", title: "Ikkinchi" })],
    });
    expect(w.findAll(".nom")[0].text()).toBe("Birinchi");

    await w.find(".panel-chap .link").trigger("click");
    expect(w.findAll(".nom")[0].text()).toBe("Ikkinchi");
  });
});

describe("ResultsTab — eksport paneli", () => {
  it("tugmada belgilanganlar soni ko'rinadi", async () => {
    const w = tab({ results: [element(), element({ id: "e2" })] });
    expect(w.find(".eksport").text()).toContain("(2)");

    await w.findAll(".belgi")[0].trigger("change");
    expect(w.find(".eksport").text()).toContain("(1)");
  });

  it("hech narsa belgilanmagan bo'lsa tugma o'chiq", async () => {
    const w = tab({ results: [element()] });
    await w.findAll(".panel-ong .link")[1].trigger("click");
    expect(w.find(".eksport").attributes("disabled")).toBeDefined();
  });

  it("🔴 ESKIRGAN ELEMENT TANLANGAN BO'LSA TASDIQ SO'RALADI", async () => {
    // Server uni joriy ma'lumot bilan qayta hisoblaydi — hujjatdagi
    // raqam ekrandagidan farq qilishi mumkin.
    const w = tab({ results: [element({ stale: true })] });
    await w.find(".eksport").trigger("click");

    const oyna = w.find(".modal");
    expect(oyna.exists()).toBe(true);
    expect(oyna.text()).toContain("qayta hisoblanadi");
  });

  it("eskirgan yo'q bo'lsa tasdiqsiz ketadi", async () => {
    const w = tab({ results: [element()] });
    await w.find(".eksport").trigger("click");
    expect(w.find(".modal").exists()).toBe(false);
  });
});

describe("ResultsTab — o'chirish", () => {
  it("🔴 TASDIQ SO'RALADI", async () => {
    const w = tab({ results: [element()] });
    await w.find(".link.ochir").trigger("click");
    expect(w.find(".modal").text()).toContain("Bir omilli ANOVA");
  });

  it("saqlangan element uchun server haqida ogohlantiradi", async () => {
    const w = tab({ results: [element({ saved: true })] });
    await w.find(".link.ochir").trigger("click");
    expect(w.find(".modal").text()).toContain("profilingizdan ham");
  });

  it("saqlanmagan elementda bunday jumla yo'q", async () => {
    const w = tab({ results: [element()] });
    await w.find(".link.ochir").trigger("click");
    expect(w.find(".modal").text()).not.toContain("profilingizdan ham");
  });
});

describe("ResultsTab — anonim foydalanuvchi", () => {
  it("🔴 RO'YXAT YO'QOLISHI HAQIDA ESLATMA", () => {
    // Anonim ro'yxat sahifa yangilanganda yo'qoladi — bu kutilgan
    // holat, lekin aytilmasa foydalanuvchi uni yo'qotib qo'yadi.
    const w = tab({ results: [element()], user: null });
    const banner = w.find(".login-banner");
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain("yo'qoladi");
  });

  it("login qilganda eslatma yo'q", () => {
    expect(tab({ results: [element()] }).find(".login-banner").exists()).toBe(false);
  });
});
