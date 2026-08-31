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

const MANBALAR = [{ key: "survey_campaign", label: "So'rovnoma kampaniyasi" }];

const KAMPANIYALAR = [
  {
    id: "k1", slug: "hexaco-2026", title: "HEXACO bahor",
    is_open: true, finished_count: 42, instrument: { name: "HEXACO-60" },
  },
  {
    id: "k2", slug: "bosh", title: "Hali boshlanmagan",
    is_open: true, finished_count: 0, instrument: { name: "BFI-2" },
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

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.get.mockResolvedValue({ data: { items: KAMPANIYALAR } });
});

describe("ochilganda", () => {
  it("manbalarni yuklaydi va bitta bo'lsa o'zi tanlaydi", async () => {
    const { wrapper, dispatch } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);

    expect(dispatch).toHaveBeenCalledWith("files/datasetSources");
    expect(wrapper.vm.source).toBe("survey_campaign");
  });

  it("so'rovnoma tanlanganda kampaniyalarni backenddan oladi", async () => {
    const { wrapper } = oynaYasa(async (nom) =>
      nom === "files/datasetSources" ? MANBALAR : undefined
    );
    await ochish(wrapper);

    expect(api.get).toHaveBeenCalledWith("/api/v1/survey/campaigns", {
      params: { limit: 100 },
    });
    expect(wrapper.vm.campaigns).toHaveLength(2);
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

    wrapper.vm.selectedRef = "k1";
    await wrapper.vm.$nextTick();
    await wrapper.vm.yaratish();

    expect(wrapper.vm.error).toBe("Kampaniya topilmadi: k1");
    expect(wrapper.emitted("created")).toBeUndefined();
  });
});
