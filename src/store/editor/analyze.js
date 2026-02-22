// store/editor/analyze.js

import api from "../../api";

export default {
  namespaced: true,

  state: () => ({
    result: null,   // butun backend object shu yerda saqlanadi
    analyzing: false,
    error: null,
  }),

  mutations: {
    SET_RESULT(state, payload) {
      state.result = payload; // { analysis, data, meta }
      state.error = null;
    },

    SET_ERROR(state, message) {
      state.error = message;
      state.result = null;
    },

    SET_ANALYZING(state, v) {
      state.analyzing = v;
    },

    RESET(state) {
      state.result = null;
      state.analyzing = false;
      state.error = null;
    },
  },

  actions: {
    async run({ commit, rootState }, payload) {
      const file = rootState.editor.core.file;
      if (!file) return;

      commit("SET_ANALYZING", true);
      commit("SET_ERROR", null);

      try {
        const res = await api.post(
          `/analyze/files/${file.id}`,
          payload   // MUHIM: type va params yuboriladi
        );

        commit("SET_RESULT", res.data);

      } catch (err) {
        const message =
          err.response?.data?.detail ||
          "Analysis failed";

        commit("SET_ERROR", message);

      } finally {
        commit("SET_ANALYZING", false);
      }
    },
  },
};