import api from "../../api";

export default {
  namespaced: true,

  state: () => ({
    rows: [],
  }),

  mutations: {
    SET_ROWS(state, rows) {
      state.rows = rows;
    },

    ADD_ROW(state, variables) {
      const row = {};
      variables.forEach(v => {
        row[v.name] = "";
      });
      state.rows.push(row);
    },

    REMOVE_ROW(state, index) {
      state.rows.splice(index, 1);
    },

    UPDATE_CELL(state, { rowIndex, varName, value }) {
      if (!state.rows[rowIndex]) return;
      state.rows[rowIndex][varName] = value;
    },

    ADD_VARIABLE_COLUMN(state, variable) {
      state.rows.forEach(r => {
        r[variable.name] = "";
      });
    },
  },

  actions: {
    async loadRows({ commit, rootState }) {
      const file = rootState.editor.file;
      if (!file) return;

      const res = await api.get(`/files/${file.id}`);
      commit(
        "SET_ROWS",
        res.data.rows.map(r => r.values)
      );
    },

    async saveRows({ state, rootState }) {
      const file = rootState.editor.file;
      if (!file) return;

      await api.put(`/files/${file.id}/rows:bulk`, {
        rows: state.rows.map((r, i) => ({
          rowIndex: i,
          values: r,
        })),
      });
    },
  },
};