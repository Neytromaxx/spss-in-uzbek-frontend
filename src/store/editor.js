import api from "../api";

export default {
  namespaced: true,
  state: () => ({
    file: null,
    schema: [],
    rows: [],
    activeTab: "variables",
    result: null,
  }),

  mutations: {
    SET_FILE(state, file) {
      state.file = file;
    },
    SET_SCHEMA(state, schema) {
      state.schema = schema;
    },
    SET_ROWS(state, rows) {
      state.rows = rows;
    },
    SET_TAB(state, tab) {
      state.activeTab = tab;
    },
    SET_RESULT(state, result) {
      state.result = result;
    },
  },

  actions: {
    async open({ commit }, fileId) {
      const res = await api.get(`/files/${fileId}`);
      commit("SET_FILE", res.data.file);
      commit("SET_SCHEMA", res.data.schema.variables || []);
      commit("SET_ROWS", res.data.rows || []);
    },

    async saveSchema({ state }) {
      await api.put(`/files/${state.file.id}/schema`, {
        variables: state.schema,
      });
    },

    async saveRows({ state }) {
      await api.put(`/files/${state.file.id}/rows:bulk`, {
        rows: state.rows.map((r, i) => ({
          rowIndex: i,
          values: r,
        })),
      });
    },

    async analyze({ commit, state }) {
      const res = await api.post(`/analyze/files/${state.file.id}`, {
        type: "descriptive",
        params: {
          columns: state.schema
            .filter((v) => v.type === "numeric")
            .map((v) => v.name),
        },
      });
      commit("SET_RESULT", res.data.result);
      commit("SET_TAB", "results");
    },
  },
};