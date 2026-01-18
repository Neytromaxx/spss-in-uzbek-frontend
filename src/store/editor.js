import api from "../api";

export default {
  namespaced: true,
  state: () => ({
    activeTab:"variable",
    file: null,
    schema: [],
    rows: [],
    result: null,
    saving: false,
    saved: true,
  }),
  mutations: {
    SET_FILE(state, file) { state.file = file; },
    SET_SCHEMA(state, s) {
      state.schema = s;
      state.saved = false;
    },
    SET_ROWS(state, r) {
      state.rows = r;
      state.saved = false;
    },
    SET_RESULT(state, r) { state.result = r; },
    SET_SAVING(state, v) { state.saving = v; },
    SET_SAVED(state, v) { state.saved = v; },
    RESET(state) {
      state.file = null;
      state.schema = [];
      state.rows = [];
      state.result = null;
      state.saved = true;
    },
    SET_TAB(state, tab) {
      state.activeTab = tab;
    },
    ADD_ROW(state) {
      const row = {};
      state.schema.forEach(v => {
        row[v.name] = "";
      });
  
      state.rows.push(row);
      state.saved = false;
    },
  
    ADD_VARIABLE(state, variable) {
      state.schema.push(variable);
  
      // mavjud qatorlarga yangi ustun qo‘shish
      state.rows.forEach(row => {
        row[variable.name] = "";
      });
  
      state.saved = false;
    },
  },
  actions: {
    async open({ commit }, id) {
      const res = await api.get(`/files/${id}`);
      commit("SET_FILE", res.data.file);
      commit(
        "SET_SCHEMA",
        res.data.schema?.variables ?? []
      );
      commit("SET_ROWS", res.data.rows.map(r => r.values));
    },

    async saveSchema({ state, commit }) {
      commit("SET_SAVING", true);
      await api.put(`/files/${state.file.id}/schema`, {
        variables: state.schema,
      });
      commit("SET_SAVING", false);
      commit("SET_SAVED", true);
    },

    async saveRows({ state, commit }) {
      commit("SET_SAVING", true);
      await api.put(`/files/${state.file.id}/rows:bulk`, {
        rows: state.rows.map((r, i) => ({
          rowIndex: i,
          values: r,
        })),
      });
      commit("SET_SAVING", false);
      commit("SET_SAVED", true);
    },

    async analyze({ state, commit }) {
      const res = await api.post(`/analyze/files/${state.file.id}`, {
        type: "descriptive",
        params: {
          columns: state.schema.map(v => v.name),
        },
      });
      commit("SET_RESULT", res.data.result);
    },
  },
};
