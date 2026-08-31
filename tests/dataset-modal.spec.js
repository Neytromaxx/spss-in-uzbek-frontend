// tests/dataset-modal.spec.js — import oynasining xatti-harakati.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

vi.mock("../src/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("vuex", async () => {
  const { inject } = await import("vue");
  return { useStore: () => inject("store") };
});

const api = (await import("../src/api")).default;
const DatasetImportModal = (await import("../src/components/DatasetImportModal.vue")).default;

// Backend registridagi uchta manba (`survey/services/dataset.py`).
const MANBALAR = [
  { key: "survey_campaign", label: "So'rovnoma: natijalar" },
  { key: "survey_campaign_timing", label: "So'rovnoma: band-bandlik vaqt" },
  { key: "survey_campaign_journal", label: "So'rovnoma: harakatlar jurnali" },
];

const KAMPANIYALAR = [
  {
    id: "k1", slug: "hexaco-2026", title: "HEXACO bahor",
    is_open: true, session_count: 50, finished_count: 42,
    instrument: { name: "HEXACO-60" },
  },
  {
    id: "k2", slug: "bosh", title: "Hali boshlanmagan",
    is_open: true, session_count: 0, finished_count: 0,
    instrument: { name: "BFI-2" },
  },
  // 🔴 Tashlab ketilgan kampaniya: sessiyalar boshlangan, lekin
  // birortasi yakunlanmagan. Jurnal manbasi uchun AYNAN shu holat
  // eng qimmatli ("nima bo'ldi?"), natijalar uchun esa bo'sh.
  {
    id: "k3", slug: "tashlangan", title: "Tashlab ketilgan",
    is_open: true, session_count: 30, finished_count: 0,
    instrument: { name: "EPQ-R" },
  },
];

function oynaYasa(dispatchImpl) {
  const dispatch = vi.fn(dispatchImpl);
  const store = { state: {}, getters: {}, dispatch };
  const wrapper = mount(DatasetImportModal, {
    props: { visible: false },
    global: { provide: { store } },
  });
  return { wrapper, dispatch };
}

async function ochish(wrapper) {
  await wrapper.setProps({ visible: true });
  // `watch` -> yuklash() -> kampaniyalarniYuklash() zanjiri
  await new Promise((r) => setTimeout(r, 0));
  await wrapper.vm.$nextTick();
  await new Promise((r) => setTimeout(r, 0));
  await wrapper.vm.$nextTick();
}

async function manbaTanla(wrapper, kalit) {
  wrapper.vm.source = kalit;
  await wrapper.vm.$nextTick();
  await new Promise((r) => setTimeout(r, 0));
  await wrapper.vm.$nextTick();
}

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.get.mockResolvedValue({ data: { items: KAMPANIYALAR } });
});

describe("ochilganda", () => {
  it("manbalarni yuklaydi", async () => {
    const { wrapper, dispatch } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);

    expect(dispatch).toHaveBeenCalledWith("files/datasetSources");
    expect(wrapper.vm.sources).toHaveLength(3);
    // Bir nechta manba bor — avtomatik tanlanmaydi.
    expect(wrapper.vm.source).toBe("");
  });

  it("so'rovnoma tanlanganda kampaniyalarni backenddan oladi", async () => {
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign");

    expect(api.get).toHaveBeenCalledWith("/api/v1/survey/campaigns", {
      params: { limit: 100 },
    });
    expect(wrapper.vm.campaigns).toHaveLength(3);
    expect(wrapper.text()).toContain("HEXACO bahor");
    expect(wrapper.text()).toContain("42 ta yakunlangan");
  });
});

describe("yakunlangan ishtirok yo'q bo'lsa", () => {
  // `load_campaign` `finished_only=True` bilan ishlaydi, ya'ni bunday
  // kampaniya backendda 400 beradi. Uni oldindan to'xtatamiz.
  it("yaratishga ruxsat bermaydi va sababini aytadi", async () => {
    const { wrapper, dispatch } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign");

    wrapper.vm.selectedRef = "k2";
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.yuborishMumkin).toBe(false);
    expect(wrapper.text()).toContain("yakunlangan ishtirok yo'q");

    await wrapper.vm.yaratish();
    expect(dispatch).not.toHaveBeenCalledWith("files/createFromDataset", expect.anything());
  });

  it("ma'lumoti bor kampaniyaga ruxsat beradi", async () => {
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign");

    wrapper.vm.selectedRef = "k1";
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.yuborishMumkin).toBe(true);
  });
});

describe("yaratish", () => {
  it("tanlangan kampaniya bilan `created` hodisasini beradi", async () => {
    const yangi = { id: "f9", title: "HEXACO bahor" };
    const { wrapper, dispatch } = oynaYasa(async (nom) => {
      if (nom === "files/datasetSources") return MANBALAR;
      if (nom === "files/createFromDataset") return yangi;
    });
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign");

    wrapper.vm.selectedRef = "k1";
    await wrapper.vm.$nextTick();
    await wrapper.vm.yaratish();

    expect(dispatch).toHaveBeenCalledWith("files/createFromDataset", {
      source: "survey_campaign",
      ref: "k1",
      title: null, // bo'sh nom -> backend manba nomini oladi
    });
    expect(wrapper.emitted("created")[0]).toEqual([yangi]);
  });

  it("yozilgan nomni uzatadi", async () => {
    const { wrapper, dispatch } = oynaYasa(async (nom) => {
      if (nom === "files/datasetSources") return MANBALAR;
      if (nom === "files/createFromDataset") return { id: "f9" };
    });
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign");

    wrapper.vm.selectedRef = "k1";
    wrapper.vm.title = "  Mening tahlilim  ";
    await wrapper.vm.$nextTick();
    await wrapper.vm.yaratish();

    expect(dispatch).toHaveBeenCalledWith(
      "files/createFromDataset",
      expect.objectContaining({ title: "Mening tahlilim" })
    );
  });

  it("backend xatosini o'qiladigan matnda ko'rsatadi", async () => {
    const { wrapper } = oynaYasa(async (nom) => {
      if (nom === "files/datasetSources") return MANBALAR;
      if (nom === "files/createFromDataset") {
        throw { response: { data: { detail: "Kampaniya topilmadi: k1" } } };
      }
    });
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign");

    wrapper.vm.selectedRef = "k1";
    await wrapper.vm.$nextTick();
    await wrapper.vm.yaratish();

    expect(wrapper.vm.error).toBe("Kampaniya topilmadi: k1");
    expect(wrapper.emitted("created")).toBeUndefined();
  });
});

// ── Uchta manba (backend `survey/services/dataset.py`) ───────────────
//
// 🔴 BU BLOK REGRESSIYANI QO'RIQLAYDI.
//
// Backend `survey_campaign` dan tashqari yana ikkita manba qo'shdi
// (`_timing`, `_journal`). Ular ham `ref` sifatida kampaniya id'sini
// oladi, lekin oyna faqat birinchisini tanirdi — qolganlari uchun
// kampaniya tanlagichi o'rniga bo'sh matn maydoni chiqib, tadqiqotchi
// id ni qo'lda ko'chirishga majbur bo'lardi.

describe("kampaniyaga tayanadigan manbalar", () => {
  const kampaniyaManbalari = [
    "survey_campaign",
    "survey_campaign_timing",
    "survey_campaign_journal",
  ];

  it.each(kampaniyaManbalari)("%s — kampaniya tanlagichi chiqadi", async (kalit) => {
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, kalit);

    expect(wrapper.vm.isSurvey).toBe(true);
    expect(wrapper.findAll(".camp")).toHaveLength(3);
    // Qo'lda kiritish maydoni chiqmasin
    expect(wrapper.find('input[placeholder*="id yoki slug"]').exists()).toBe(false);
  });

  it("kelajakdagi survey_campaign_* manbasi ham taniladi", async () => {
    // Prefiks bo'yicha aniqlanadi: backend registri o'sganda bu fayl
    // o'zgarmasdan ishlashi kerak.
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources"
        ? [...MANBALAR, { key: "survey_campaign_yangi", label: "Yangi" }]
        : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign_yangi");
    expect(wrapper.vm.isSurvey).toBe(true);
  });

  it("boshqa moduldagi manba uchun qo'lda kiritish qoladi", async () => {
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources"
        ? [{ key: "boshqa_modul", label: "Boshqa" }]
        : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, "boshqa_modul");

    expect(wrapper.vm.isSurvey).toBe(false);
    expect(wrapper.find('input[placeholder*="id yoki slug"]').exists()).toBe(true);
  });
});

describe("jurnal manbasi yakunlangan ishtirok talab qilmaydi", () => {
  // `load_journal` `finished_only` ISHLATMAYDI — izohi: "Yarim qolgan
  // sessiyalar ham kiradi... tashlab ketilgan ishtirok bunga eng ko'p
  // ma'lumot beradi". Ya'ni jurnal aynan tashlab ketilgan kampaniyada
  // eng qimmatli, va `finished_count` bo'yicha to'sish uni eng kerakli
  // paytda bloklardi.
  const TASHLANGAN = "k3"; // session_count: 30, finished_count: 0

  it("natijalar manbasida tashlab ketilgan kampaniya to'siladi", async () => {
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign");
    wrapper.vm.selectedRef = TASHLANGAN;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.bosLangan).toBe(true);
    expect(wrapper.vm.yuborishMumkin).toBe(false);
  });

  it("vaqt manbasida ham to'siladi (u ham finished_only)", async () => {
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign_timing");
    wrapper.vm.selectedRef = TASHLANGAN;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.bosLangan).toBe(true);
  });

  it("🔴 JURNAL manbasida esa RUXSAT beriladi", async () => {
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign_journal");
    wrapper.vm.selectedRef = TASHLANGAN;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.bosLangan).toBe(false);
    expect(wrapper.vm.yuborishMumkin).toBe(true);
  });

  it("jurnalda sessiyasi umuman yo'q kampaniya to'siladi", async () => {
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);
    await manbaTanla(wrapper, "survey_campaign_journal");
    wrapper.vm.selectedRef = "k2"; // session_count: 0
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.bosLangan).toBe(true);
  });

  it("ro'yxatda manbaga mos sanoq ko'rsatiladi", async () => {
    // "12 ta yakunlangan" deb turgan kampaniya jurnalda ishlamay
    // qolsa, sabab ko'rinmasdi.
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);

    await manbaTanla(wrapper, "survey_campaign");
    expect(wrapper.text()).toContain("42 ta yakunlangan");

    await manbaTanla(wrapper, "survey_campaign_journal");
    expect(wrapper.text()).toContain("50 ta boshlangan");
    expect(wrapper.text()).toContain("30 ta boshlangan");
  });
});
