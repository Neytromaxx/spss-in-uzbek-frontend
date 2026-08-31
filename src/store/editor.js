// store/editor.js
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

    // BACKEND FORMATGA MOS — shakli `SET_RESULT` bilan bir xil bo'lsin,
    // aks holda komponentlar `undefined` bilan ishlashga majbur bo'ladi.
    result: {
      type: null,
      params: null,
      title: null,
      meta: null,
      columns: {},
      tables: [],
      charts: [],
    },

    saving: false,
    saved: true,
    analyzing: false,
  }),

  mutations: {
    /* ===== CORE ===== */

    SET_FILE(state, file) {
      state.file = file;
    },

    SET_SCHEMA(state, schema) {
      state.schema = {
        variables: schema.variables || [],
      };
      state.saved = true;
    },

    SET_ROWS(state, rows) {
      state.rows = rows;
      state.saved = false;
    },

    SET_RESULT(state, payload) {
      // payload = AnalyzeResponse: { type, params, result }.
      // `result` — kanonik sxema: { analysis, title, tables, meta }.
      // Ustunli ko'rinish vaqtincha legacy_columns'dan olinadi.
      //
      // 🔴 `title` va `meta` NI TASHLAB YUBORMAYMIZ.
      //
      // Ilgari bu yerda faqat type/params/columns/tables olinardi va
      // ikkita narsa jimgina yo'qolardi:
      //
      //   1. `title` — ResultsTab uni ko'rsatmoqchi bo'lardi, lekin u
      //      hech qachon kelmagani uchun DOIM "Tahlil natijasi" zaxira
      //      matni chiqardi. Ya'ni "Chiziqli regressiya" ham,
      //      "Kruskal-Uollis H testi" ham bir xil ko'rinardi.
      //
      //   2. `meta.warnings` va `meta.assumptions` — backend ularni
      //      to'ldiradi (correlation.py, normality.py, regression.py,
      //      categorical.py). Bular statistikada bezak emas: masalan
      //      kategorik tahlilda "kutilgan chastota 5 dan kichik"
      //      ogohlantirishi natijani ishonchsiz qiladi. Foydalanuvchi
      //      buni umuman ko'rmasdi.
      const r = payload.result || {};
      state.result = {
        type: payload.type ?? null,
        params: payload.params ?? null,
        title: r.title ?? null,
        meta: r.meta ?? null,
        charts: r.charts ?? [],
        columns: r.legacy_columns?.columns ?? r.columns ?? {},
        tables: r.tables ?? [],
      };
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

    SET_ANALYZING(state, v) {
      state.analyzing = v;
    },

    RESET(state) {
      state.file = null;
      state.schema = { variables: [] };
      state.rows = [];
      state.result = {
        type: null, params: null, title: null, meta: null,
        columns: {}, tables: [], charts: [],
      };
      state.saved = true;
      state.analyzing = false;
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

      state.rows.forEach(r => {
        r[variable.name] = "";
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
      if (!v.values) v.values = {};
    },

    ADD_VALUE_LABEL(state, index) {
      const v = state.schema.variables[index];
      if (!v) return;
      if (!v.values) v.values = {};

      let i = 1;
      while (v.values[String(i)]) i++;
      v.values[String(i)] = "";

      state.saved = false;
    },

    UPDATE_VALUE_LABEL(state, { index, valKey, valLabel }) {
      const v = state.schema.variables[index];
      if (!v?.values) return;
      v.values[valKey] = valLabel;
      state.saved = false;
    },

    REMOVE_VALUE_LABEL(state, { index, valKey }) {
      const v = state.schema.variables[index];
      if (!v?.values) return;
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

    UPDATE_CELL(state, { rowIndex, varName, value }) {
      if (!state.rows[rowIndex]) return;
      state.rows[rowIndex][varName] = value;
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

    async analyze({ state, commit }, payload = {}) {
      if (!state.file) return;

      commit("SET_ANALYZING", true);

      try {
        const res = await api.post(`/analyze/files/${state.file.id}`, {
          type: payload.type ?? "auto",
          params: payload.params ?? {},
          saveToProfile: payload.saveToProfile ?? false,
        });

        commit("SET_RESULT", res.data);
      } finally {
        commit("SET_ANALYZING", false);
      }
    },

    // ── Fayldan qiymatlarni o'qish ──
    //
    // 🔴 IKKI BOSQICH: avval KO'RISH, keyin YOZISH.
    //
    // Import mavjud o'zgaruvchilar va barcha qatorlarni almashtiradi.
    // Ilgari bu so'ramasdan bajarilardi — tasodifan bosilgan tugma
    // bir necha soatlik ishni o'chirib yuborardi.
    //
    // Fayl ikki marta yuboriladi (ko'rish + tasdiqlash). Chegara
    // 5 MB bo'lgani uchun bu arzon va server holatsiz qoladi:
    // vaqtinchalik saqlash yoki kesh kerak emas.
    async parseImport({ state }, { file, sheet = null }) {
      if (!state.file) return null;
      const form = new FormData();
      form.append("file", file);
      if (sheet) form.append("sheet", sheet);
      const res = await api.post(`/files/${state.file.id}/import:parse`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },

    async applyImport({ state, dispatch }, { file, sheet = null }) {
      if (!state.file) return null;
      const form = new FormData();
      form.append("file", file);
      if (sheet) form.append("sheet", sheet);
      const res = await api.post(`/files/${state.file.id}/import:apply`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // faylni qayta ochamiz (yangi sxema + qatorlar)
      await dispatch("open", state.file.id);
      return res.data;
    },

    // Natijani profilga saqlash (oxirgi tanlangan metod bilan; login talab)
    async saveResult({ state, dispatch }) {
      if (!state.file) return;
      await dispatch("analyze", {
        type: state.result?.type || "auto",
        params: state.result?.params || {},
        saveToProfile: true,
      });
    },

    // Natijani .docx / .pdf sifatida yetkazish (login talab qilinadi).
    // deliver: "browser" (brauzerdan yuklab olish) | "telegram" (botga yuborish)
    async exportResult({ state }, { fmt, deliver = "browser" }) {
      if (!state.file) return;

      // oxirgi tanlangan metod va parametrlarini eksportga uzatamiz
      const type = state.result?.type || "auto";
      const params = JSON.stringify(state.result?.params || {});

      if (deliver === "telegram") {
        const res = await api.get(`/analyze/files/${state.file.id}/export`, {
          params: { fmt, deliver: "telegram", type, params },
        });
        return res.data; // { ok, delivered: "telegram" }
      }

      const res = await api.get(`/analyze/files/${state.file.id}/export`, {
        params: { fmt, deliver: "browser", type, params },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.file.title || "natija"}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  },
};