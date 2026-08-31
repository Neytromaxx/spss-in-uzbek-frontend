// tests/dataset-import.spec.js — survey -> statistika ko'prigi.
//
// 🔴 NIMA UCHUN BU FAYL BOR
//
// Backendda `GET /files/dataset-sources` va `POST /files/from-dataset`
// tayyor edi (`CLAUDE_SURVEY.md` §7), testlari ham bor edi — lekin
// frontend ularning BITTASINI HAM chaqirmasdi. Ya'ni qobiliyat bor,
// foydalanuvchi uchun esa mavjud emas.
//
// Testlar aynan shu ulanishni qo'riqlaydi: to'g'ri manzil, to'g'ri
// payload, va rolga qarab tugma ko'rinishi.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const api = (await import("../src/api")).default;
const files = (await import("../src/store/files")).default;
const auth = (await import("../src/store/auth")).default;

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
});

describe("files/datasetSources", () => {
  it("backenddagi manzilni chaqiradi va ro'yxatni ochadi", async () => {
    api.get.mockResolvedValue({
      data: { sources: [{ key: "survey_campaign", label: "So'rovnoma kampaniyasi" }] },
    });
    const natija = await files.actions.datasetSources({ commit: vi.fn() });

    expect(api.get).toHaveBeenCalledWith("/files/dataset-sources");
    expect(natija).toEqual([{ key: "survey_campaign", label: "So'rovnoma kampaniyasi" }]);
  });

  it("bo'sh javobda bo'sh massiv beradi", async () => {
    api.get.mockResolvedValue({ data: {} });
    expect(await files.actions.datasetSources({ commit: vi.fn() })).toEqual([]);
  });
});

describe("files/createFromDataset", () => {
  it("backend kutgan payload ni yuboradi", async () => {
    // Backend `DatasetImportRequest`: {source, ref, title?}.
    // Nom mos kelmasa 422 bo'ladi.
    const yangi = { id: "f1", title: "HEXACO tadqiqoti" };
    api.post.mockResolvedValue({ data: yangi });
    const commit = vi.fn();

    const natija = await files.actions.createFromDataset(
      { commit },
      { source: "survey_campaign", ref: "kampaniya-1", title: "HEXACO tadqiqoti" }
    );

    expect(api.post).toHaveBeenCalledWith("/files/from-dataset", {
      source: "survey_campaign",
      ref: "kampaniya-1",
      title: "HEXACO tadqiqoti",
    });
    expect(commit).toHaveBeenCalledWith("ADD_FILE", yangi);
    expect(natija).toBe(yangi);
  });

  it("yangi faylni ro'yxat boshiga qo'shadi", () => {
    const state = { list: [{ id: "eski" }] };
    files.mutations.ADD_FILE(state, { id: "yangi" });
    expect(state.list[0].id).toBe("yangi");
  });
});

describe("auth/isLibrarian", () => {
  // Backenddagi `UserOut.role` izohi: rolga to'g'ri kelmaydigan tugmalar
  // umuman chizilmasin. `load_campaign` kutubxonachi rolini talab qiladi.
  const holatlar = [
    ["admin", true],
    ["librarian", true],
    ["reader", false],
    [undefined, false],
  ];

  it.each(holatlar)("role=%s -> %s", (role, kutilgan) => {
    const state = { user: role ? { role } : null };
    expect(auth.getters.isLibrarian(state)).toBe(kutilgan);
  });

  it("login qilinmagan holatda false", () => {
    expect(auth.getters.isLibrarian({ user: null })).toBe(false);
  });
});
