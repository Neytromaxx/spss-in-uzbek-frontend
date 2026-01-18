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
      const res = await api.get("/files");
      commit("SET_FILES", res.data);
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
