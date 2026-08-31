import api from "../api";

export default {
  namespaced: true,
  state: () => ({
    list: [],
  }),
  mutations: {
    SET_FILES(state, files) {
      state.list = files;
    },
    ADD_FILE(state, file) {
      state.list.unshift(file);
    },
    REMOVE_FILE(state, id) {
      state.list = state.list.filter(f => f.id !== id);
    },
  },
  actions: {
    async load({ commit }) {
      try {
        const res = await api.get("/files");
        commit("SET_FILES", res.data);
      } catch {
        // Anonim (loginsiz) yoki backend mavjud bo'lmasa — bo'sh ro'yxat.
        // Saqlangan tadqiqotlar login qilingandan keyin ko'rinadi.
        commit("SET_FILES", []);
      }
    },
    async create({ commit }, title) {
      const res = await api.post("/files", { title });
      commit("ADD_FILE", res.data);
      return res.data;
    },
    async delete({ commit }, id) {
      await api.delete(`/files/${id}`);
      commit("REMOVE_FILE", id);
    },

    // Tahlilga uzatish mumkin bo'lgan manbalar (`core/datasets` registri).
    // Bugun bitta: so'rovnoma kampaniyasi. Ro'yxat backenddan keladi,
    // shuning uchun yangi manba qo'shilsa frontend o'zgarmaydi.
    async datasetSources() {
      const res = await api.get("/files/dataset-sources");
      return res.data.sources || [];
    },

    // Boshqa moduldagi ma'lumotdan darhol SPSS fayli yaratadi.
    // Sxemani (o'zgaruvchi turlarini) backend o'zi aniqlaydi — CSV
    // importi bilan bir xil qoida bo'yicha.
    async createFromDataset({ commit }, { source, ref, title }) {
      const res = await api.post("/files/from-dataset", { source, ref, title });
      commit("ADD_FILE", res.data);
      return res.data;
    },
  },
};
