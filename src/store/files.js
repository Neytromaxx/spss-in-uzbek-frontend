import api from "../api";

export default {
  namespaced: true,
  state: () => ({
    list: [],
    loading: false,
  }),

  mutations: {
    SET_FILES(state, files) {
      state.list = files;
    },
    ADD_FILE(state, file) {
      state.list.unshift(file);
    },
    REMOVE_FILE(state, id) {
      state.list = state.list.filter((f) => f.id !== id);
    },
  },

  actions: {
    async load({ commit }) {
      commit("SET_FILES", []);
      const res = await api.get("/files");
      commit("SET_FILES", res.data);
    },

    async create({ commit }) {
      const res = await api.post("/files", { title: "Yangi tadqiqot" });
      commit("ADD_FILE", res.data);
      return res.data;
    },

    async delete({ commit }, id) {
      await api.delete(`/files/${id}`);
      commit("REMOVE_FILE", id);
    },
  },
};