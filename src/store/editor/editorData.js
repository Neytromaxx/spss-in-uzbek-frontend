// store/editor/editorData.js
import api from "../../api";

export default {
  namespaced: true,

  state: () => ({
    rows: [],
  }),

  mutations: {
    SET_ROWS(state, rows) {
      state.rows = rows.map(r => r.values);
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
  },

  actions: {
    setFromApi({ commit }, rows) {
      commit("SET_ROWS", rows || []);
    },

    async save({ state, rootState, commit }) {
      const file = rootState.editor.core.file;
      if (!file) return;

      commit("editor/core/SET_SAVING", true, { root: true });

      await api.put(`/files/${file.id}/rows:bulk`, {
        rows: state.rows.map((r, i) => ({
          rowIndex: i,
          values: r,
        })),
      });

      commit("editor/core/SET_SAVING", false, { root: true });
      commit("editor/core/SET_SAVED", true, { root: true });
    },
  },
};