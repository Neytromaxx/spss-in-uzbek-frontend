export default {
  namespaced: true,

  state: () => ({
    activeTab: "variables",
    file: null,
    schema: {
      variables: [],
    },
    saving: false,
    saved: true,
  }),

  mutations: {
    SET_FILE(state, file) {
      state.file = file;
    },

    SET_SCHEMA(state, schema) {
      state.schema = {
        variables: schema.variables || [],
      };
      state.saved = true;
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
      state.file = null;
      state.schema = { variables: [] };
      state.activeTab = "variables";
      state.saved = true;
    },
  },

  actions: {
    async open({ commit, dispatch }, fileId) {
      const res = await api.get(`/files/${fileId}`);
    
      commit("SET_FILE", res.data.file);
      commit("SET_SCHEMA", {
        variables: res.data.schema?.variables ?? [],
      });
    
      dispatch("editorData/loadRows", null, { root: true });
    },

    async saveSchema({ state, commit }) {
      if (!state.file) return;

      commit("SET_SAVING", true);

      await api.put(`/files/${state.file.id}/schema`, {
        variables: state.schema.variables.map(v => {
          const { _showValues, ...clean } = v;
          return clean;
        }),
      });

      commit("SET_SAVING", false);
      commit("SET_SAVED", true);
    },
  },
};
