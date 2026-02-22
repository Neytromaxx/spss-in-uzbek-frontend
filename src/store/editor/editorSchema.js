// store/editor/editorSchema.js
import api from "../../api";

export default {
  namespaced: true,

  state: () => ({
    variables: [],
  }),

  mutations: {
    SET_VARIABLES(state, vars) {
      state.variables = vars || [];
    },

    ADD_VARIABLE(state, variable) {
      state.variables.push({
        ...variable,
        label: variable.label || "",
        measure: variable.measure || "scale",
        values: variable.values || null,
        _showValues: false,
      });
    },

    UPDATE_VARIABLE(state, { index, key, value }) {
      const v = state.variables[index];
      if (!v) return;
      v[key] = value;
    },

    TOGGLE_VALUES_EDITOR(state, index) {
      const v = state.variables[index];
      if (!v) return;
      v._showValues = !v._showValues;
      if (!v.values) v.values = {};
    },

    ADD_VALUE_LABEL(state, index) {
      const v = state.variables[index];
      if (!v) return;
      if (!v.values) v.values = {};

      let i = 1;
      while (v.values[String(i)]) i++;
      v.values[String(i)] = "";
    },

    UPDATE_VALUE_LABEL(state, { index, valKey, valLabel }) {
      const v = state.variables[index];
      if (!v?.values) return;
      v.values[valKey] = valLabel;
    },

    REMOVE_VALUE_LABEL(state, { index, valKey }) {
      const v = state.variables[index];
      if (!v?.values) return;
      delete v.values[valKey];
    },
  },

  actions: {
    setFromApi({ commit }, schema) {
      commit("SET_VARIABLES", schema?.variables ?? []);
    },

    async save({ state, rootState, commit }) {
      const file = rootState.editor.core.file;
      if (!file) return;

      commit("editor/core/SET_SAVING", true, { root: true });

      await api.put(`/files/${file.id}/schema`, {
        variables: state.variables.map(v => {
          const { _showValues, ...clean } = v;
          return clean;
        }),
      });

      commit("editor/core/SET_SAVING", false, { root: true });
      commit("editor/core/SET_SAVED", true, { root: true });
    },
  },
};