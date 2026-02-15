import api from "../../api";

export default {
  namespaced: true,

  state: () => ({
    results: [],
    analyzing: false,
  }),

  mutations: {
    ADD_RESULT(state, payload) {
      state.results.push({
        id: Date.now(),
        ...payload,
      });
    },

    REMOVE_RESULT(state, id) {
      state.results = state.results.filter(r => r.id !== id);
    },

    CLEAR_RESULTS(state) {
      state.results = [];
    },

    SET_ANALYZING(state, v) {
      state.analyzing = v;
    },
  },

  actions: {
    async analyze({ commit, rootState }, { type, params }) {
      const file = rootState.editor.file;
      if (!file) return;

      commit("SET_ANALYZING", true);

      const res = await api.post(
        `/analyze/files/${file.id}`,
        {
          type,
          params,
          saveToProfile: false,
        }
      );

      commit("ADD_RESULT", {
        type: res.data.type,
        params: res.data.params,
        data: res.data.result,
      });

      commit("SET_ANALYZING", false);
    },
  },
};
