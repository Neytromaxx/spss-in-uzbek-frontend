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
    
      try {
        const res = await api.post(
          `/analyze/files/${file.id}`,
          {
            type: payload.type,
            params: payload.params || {},
            saveToProfile: false,
          }
        );
    
        commit("SET_RESULT", res.data);
        
    
      } catch (err) {
        console.error(err.response?.data);
      } finally {
        commit("SET_ANALYZING", false);
      }
      console.log("ANALYZE PAYLOAD:", payload);
        console.log("REQUEST BODY:", {
          type: payload.type,
          params: payload.params || {},
          saveToProfile: false,
        });
    },
  },
};