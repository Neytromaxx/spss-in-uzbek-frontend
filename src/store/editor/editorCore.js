import api from "../../api";

export default {
  namespaced: true,

  state: () => ({
    activeTab: "variables",
    file: null,
    saving: false,
    saved: true,
  }),

  mutations: {
    SET_FILE(state, file) {
      state.file = file;
    },
    SET_TAB(state, tab) {
      state.activeTab = tab;
    },
    SET_SAVING(state, v) {
      state.saving = v;
    },
    SET_SAVED(state, v) {
      state.saved = v;
    },
    RESET(state) {
      state.activeTab = "variables";
      state.file = null;
      state.saving = false;
      state.saved = true;
    },
  },

  actions: {
    async open({ commit, dispatch }, fileId) {
      const res = await api.get(`/files/${fileId}`);

      commit("SET_FILE", res.data.file);

      dispatch("schema/setFromApi", res.data.schema, { root: true });
      dispatch("data/setFromApi", res.data.rows, { root: true });
      dispatch("editor/analyze/RESET", null, { root: true });
    },
  },
};