import api from "../api";

export default {
  namespaced: true,

  state: () => ({
    activeTab: "variables",

    file: null,

    schema: {
      variables: [],
    },

    rows: [],

    result: {
      columns: {},
      rows: []
    },

    saving: false,
    saved: true,
    analyze: false,
  }),

  mutations: {
    /* ===== CORE ===== */

    SET_FILE(state, file) {
      state.file = file;
    },
    
    SET_RESULT(state, result) {
      console.log("Result called", result)
      state.result = result;
    },

    SET_SCHEMA(state, schema) {
      console.log("SET_SCHEMA CALLED");
      state.schema = {
        variables: schema.variables || [],
      };
      state.saved = true;
    },

    SET_ROWS(state, rows) {
      console.log("SET_ROWS CALLED");
      state.rows = rows;
      state.saved = false;
    },

    SET_TAB(state, tab) {
      state.activeTab = tab;
    },

    SET_SAVING(state, value) {
      state.saving = value;
    },

    SET_SAVED(state, value) {
      state.saved = value;
    },

    SET_ANALYZING(state, v) {
      state.analyzing = v;
    },

    RESET(state) {
      state.file = null;
      state.schema = { variables: [] };
      state.rows = [];
      state.result = null;
      state.saved = true;
    },

    /* ===== VARIABLES ===== */

    ADD_VARIABLE(state, variable) {
      state.schema.variables.push({
        ...variable,
        label: variable.label || "",
        measure: variable.measure || "scale",
        values: variable.values || null,
        _showValues: false,
      });

      // barcha qatorlarga yangi ustun qo‘shamiz
      state.rows.forEach(row => {
        row[variable.name] = "";
      });

      state.saved = false;
    },

    UPDATE_VARIABLE(state, { index, key, value }) {
      const v = state.schema.variables[index];
      if (!v) return;

      v[key] = value;
      state.saved = false;
    },

    TOGGLE_VALUES_EDITOR(state, index) {
      const v = state.schema.variables[index];
      if (!v) return;

      v._showValues = !v._showValues;

      if (!v.values) {
        v.values = {};
      }
    },

    ADD_VALUE_LABEL(state, index) {
      const v = state.schema.variables[index];
      if (!v) return;

      if (!v.values) v.values = {};

      // avtomatik key: 1,2,3,...
      let i = 1;
      while (v.values[String(i)]) i++;

      v.values[String(i)] = "";
      state.saved = false;
    },

    UPDATE_VALUE_LABEL(state, { index, valKey, valLabel }) {
      const v = state.schema.variables[index];
      if (!v || !v.values) return;

      v.values[valKey] = valLabel;
      state.saved = false;
    },

    REMOVE_VALUE_LABEL(state, { index, valKey }) {
      const v = state.schema.variables[index];
      if (!v || !v.values) return;

      delete v.values[valKey];
      state.saved = false;
    },

    /* ===== ROWS ===== */

    ADD_ROW(state) {
      const row = {};
      state.schema.variables.forEach(v => {
        row[v.name] = "";
      });

      state.rows.push(row);
      state.saved = false;
    },

    REMOVE_ROW(state, index) {
      state.rows.splice(index, 1);
      state.saved = false;
    },
  },

  actions: {
    /* ===== LOAD FILE ===== */

    async open({ commit }, fileId) {
      const res = await api.get(`/files/${fileId}`);

      commit("SET_FILE", res.data.file);

      commit("SET_SCHEMA", {
        variables: res.data.schema?.variables ?? [],
      });

      commit(
        "SET_ROWS",
        res.data.rows.map(r => r.values)
      );
    },

    /* ===== SAVE ===== */

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

    async saveRows({ state, commit }) {
      if (!state.file) return;

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

    /* ===== ANALYZE ===== */

    async analyze({ state, commit }) {
      if (!state.file) return;
    
      commit("SET_ANALYZING", true);
    
      const res = await api.post(
        `/analyze/files/${state.file.id}`,
        { saveToProfile: false }
      );
    
      commit("SET_RESULT", res.data.result);
      commit("SET_ANALYZING", false);
    }
  },
};
