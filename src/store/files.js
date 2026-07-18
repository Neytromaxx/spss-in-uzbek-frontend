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
      } catch (e) {
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
  },
};
