// store/editor.js
import api from "../api";
import { xatoMatni } from "../api/errors";
import { natijaElementi, natijaKaliti } from "../natijalar";

// Tartib tanlovi `localStorage` da: bu bitta qisqa satr, natija
// JSON'i emas. Natijalarning o'zi saqlanmaydi — ular megabaytlarga
// yetishi mumkin va baribir serverdan qayta o'qiladi.
const TARTIB_KALITI = "mtt.results.order";

function tartibniOqi() {
  try {
    return localStorage.getItem(TARTIB_KALITI) === "eski" ? "eski" : "yangi";
  } catch {
    // Shaxsiy rejimda `localStorage` istisno tashlashi mumkin.
    return "yangi";
  }
}

function tartibniYoz(qiymat) {
  try {
    localStorage.setItem(TARTIB_KALITI, qiymat);
  } catch {
    // Saqlanmasa ham ro'yxat ishlayveradi.
  }
}

// 🔴 SPSS cheklovi — backenddagi `schemas.py` bilan BIR XIL bo'lishi shart.
//
// Ikkala tomonda ham tekshiruv bor va bu ataylab: backend to'siq,
// frontend esa foydalanuvchiga limitni KO'RSATADI (tugma o'chadi).
// Faqat backendda bo'lsa, foydalanuvchi 4-kodni kiritib, 1.5 soniyadan
// keyin tushunarsiz 422 olardi.
const MAX_KOD_ORALIQSIZ = 3;
const MAX_KOD_ORALIQ_BILAN = 1;

function kodChegarasi(v) {
  return v?.missing?.range ? MAX_KOD_ORALIQ_BILAN : MAX_KOD_ORALIQSIZ;
}

function tarifBoshmi(m) {
  return !m || (!(m.discrete || []).length && !m.range);
}

export default {
  namespaced: true,

  state: () => ({
    activeTab: "variables",

    file: null,

    schema: {
      variables: [],
    },

    rows: [],

    // Select Cases filtri (07-vazifa).
    //
    // `filter` — fayldagi ta'rif: {expression, enabled, updated_at}
    //   yoki `null` (hech qachon yozilmagan).
    // `rowSelected` — har qator uchun bayroq, FAQAT filtr yoqilgan
    //   bo'lsa to'ladi. Uni frontend o'zi hisoblamaydi: shart
    //   backendda baholanadi, aks holda jadvalda chizilgan qatorlar
    //   tahlilga kirganlaridan farq qilib qolishi mumkin edi.
    filter: null,
    rowSelected: [],

    // Natijalar ro'yxati (08-vazifa).
    //
    // 🔴 IERARXIYA YO'Q — teng huquqli elementlar. «Asosiy natija +
    // qo'shilganlar» modeli javobsiz savol tug'dirardi: birinchisi
    // nimasi bilan alohida, uni o'chirsa nima bo'ladi, eksportda u
    // majburiymi?
    //
    // Sessiya elementlari va saqlanganlar ham IKKI XIL RO'YXAT EMAS:
    // bittasi, har elementda `saved` bayrog'i bilan. Ikkitasi bo'lsa,
    // bir xil tahlil ikkala ro'yxatda ham turib qolardi.
    results: [],

    // Hozir ochiq turgan element. Faqat u to'liq chiziladi — 10 ta
    // natijaning hammasini DOM'ga chiqarish telefonda sezilarli
    // sekinlik beradi.
    activeId: null,

    // "yangi" — yangisi tepada (sukut), "eski" — yangisi pastda.
    resultsOrder: tartibniOqi(),

    saving: false,
    saved: true,
    analyzing: false,

    // 🔴 Sxema AVTOSAQLANADI (VariablesTab, 1.5 s debounce).
    //
    // Ya'ni foydalanuvchi «Saqlash» tugmasini bosmaydi va xatoni
    // ko'radigan joyi yo'q. Noto'g'ri yo'q qiymat ta'rifida backend 422
    // qaytaradi, ilgari esa `catch` faqat `console.error` qilardi —
    // foydalanuvchi «saqlandi» deb o'ylab tahlilga o'tardi va `99` lar
    // yana o'rtachaga qo'shilardi. Ya'ni endigina tuzatilgan xato
    // jimgina qaytardi. Shu sababli xato holati ko'rinadigan bo'lishi
    // shart.
    schemaError: null,
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

    /* ===== NATIJALAR RO'YXATI (08-vazifa) ===== */

    ADD_RESULT(state, payload) {
      // payload = AnalyzeResponse: { type, params, result, rows_hash,
      // saved_id }. `result` — kanonik sxema.
      const element = natijaElementi(payload);

      // 🔴 YANGI `rows_hash` ESKILARINI ESKIRTIRADI.
      //
      // Foydalanuvchi ANOVA qiladi, keyin Compute bilan ustun
      // qo'shadi yoki filtrni yoqadi — eski natijalar endi BOSHQA
      // tanlamaga tegishli, lekin ekranda o'zgarishsiz turadi.
      // Belgilanmasa, u ikki xil tanlamadan chiqqan raqamlarni
      // bitta hujjatga qo'yadi va buni hech kim sezmaydi.
      if (element.rows_hash) {
        for (const e of state.results) {
          if (e.rows_hash && e.rows_hash !== element.rows_hash) e.stale = true;
        }
      }

      const kalit = natijaKaliti(element.type, element.params, element.rows_hash);
      let orin = state.results.findIndex(
        e => natijaKaliti(e.type, e.params, e.rows_hash) === kalit,
      );

      // 🔴 QAYTA HISOBLASH ESKI ELEMENTNI ALMASHTIRADI, qo'shmaydi.
      //
      // Odatda yangi `rows_hash` YANGI element yasaydi va eskisi
      // «eskirgan» bo'lib qoladi — bu to'g'ri, chunki foydalanuvchi
      // eski raqamni ham ko'rmoqchi bo'lishi mumkin. Lekin u
      // AYNAN shu elementni qayta hisoblashni so'raganda, eskisi
      // ro'yxatda qolsa, `eskirgan` nishoni yo'qolmasdi va
      // ro'yxatda bir xil tahlilning ikki nusxasi turardi.
      if (orin < 0 && payload?.replaceId) {
        orin = state.results.findIndex(e => e.id === payload.replaceId);
      }

      if (orin >= 0) {
        // Bir xil tahlil, bir xil ma'lumot — O'SHA element
        // yangilanadi. `id` va foydalanuvchi tanlovlari saqlanadi,
        // aks holda ro'yxat qayta tahlildan keyin sakrab ketardi.
        const eski = state.results[orin];
        state.results[orin] = {
          ...element,
          id: eski.id,
          selected: eski.selected,
          saved: eski.saved || element.saved,
          saved_id: element.saved_id ?? eski.saved_id,
          created_at: eski.created_at,
        };
        state.activeId = eski.id;

        // Kalit bo'yicha boshqa element topilgan bo'lsa, qayta
        // hisoblangan eskisi ortiqcha qoladi.
        if (payload?.replaceId && eski.id !== payload.replaceId) {
          state.results = state.results.filter(e => e.id !== payload.replaceId);
        }
        return;
      }

      state.results.unshift(element);
      state.activeId = element.id;
    },

    SET_RESULTS(state, elementlar) {
      state.results = elementlar;
      if (!elementlar.some(e => e.id === state.activeId)) {
        state.activeId = elementlar[0]?.id ?? null;
      }
    },

    REMOVE_RESULT(state, id) {
      state.results = state.results.filter(e => e.id !== id);
      if (state.activeId === id) state.activeId = state.results[0]?.id ?? null;
    },

    SET_ACTIVE_RESULT(state, id) {
      // O'sha elementni qayta bosish uni YOPADI.
      state.activeId = state.activeId === id ? null : id;
    },

    TOGGLE_SELECTED(state, id) {
      const e = state.results.find(x => x.id === id);
      if (e) e.selected = !e.selected;
    },

    SELECT_ALL(state, qiymat) {
      for (const e of state.results) e.selected = !!qiymat;
    },

    MARK_STALE(state, joriyXesh) {
      // `rows_hash` yo'q element eskirmaydi: uning qaysi ma'lumotdan
      // chiqqani noma'lum, «eskirgan» deb belgilash esa yolg'on
      // ma'lumot berardi.
      for (const e of state.results) {
        if (e.rows_hash) e.stale = e.rows_hash !== joriyXesh;
      }
    },

    SET_RESULT_SAVED(state, { id, saved_id }) {
      const e = state.results.find(x => x.id === id);
      if (!e) return;
      e.saved = true;
      e.saved_id = saved_id ?? e.saved_id;
    },

    SET_ORDER(state, tartib) {
      state.resultsOrder = tartib === "eski" ? "eski" : "yangi";
      tartibniYoz(state.resultsOrder);
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

    SET_FILTER(state, { filter, rowSelected }) {
      state.filter = filter || null;
      state.rowSelected = rowSelected || [];
    },

    SET_SCHEMA_ERROR(state, v) {
      state.schemaError = v;
    },

    RESET(state) {
      state.file = null;
      state.schema = { variables: [] };
      state.rows = [];
      state.results = [];
      state.activeId = null;
      state.schemaError = null;
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
        missing: variable.missing || null,
        derived: variable.derived || null,
        _showValues: false,
        _showMissing: false,
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

    /* ===== YO'Q QIYMATLAR ===== */

    TOGGLE_MISSING_EDITOR(state, index) {
      const v = state.schema.variables[index];
      if (!v) return;
      v._showMissing = !v._showMissing;
      if (v._showMissing && !v.missing) {
        v.missing = { discrete: [], range: null };
      }
    },

    ADD_MISSING_CODE(state, index) {
      const v = state.schema.variables[index];
      if (!v) return;
      if (!v.missing) v.missing = { discrete: [], range: null };
      if (!v.missing.discrete) v.missing.discrete = [];
      // Limitdan oshsa HECH NARSA QILMAYDI — tugma ham o'chirilgan
      // bo'ladi, lekin qoida shu yerda ham turishi kerak: mutatsiyani
      // boshqa joydan chaqirish mumkin.
      if (v.missing.discrete.length >= kodChegarasi(v)) return;
      v.missing.discrete.push("");
      state.saved = false;
    },

    UPDATE_MISSING_CODE(state, { index, codeIndex, value }) {
      const v = state.schema.variables[index];
      if (!v?.missing?.discrete) return;
      if (codeIndex < 0 || codeIndex >= v.missing.discrete.length) return;
      v.missing.discrete[codeIndex] = value;
      state.saved = false;
    },

    REMOVE_MISSING_CODE(state, { index, codeIndex }) {
      const v = state.schema.variables[index];
      if (!v?.missing?.discrete) return;
      v.missing.discrete.splice(codeIndex, 1);
      state.saved = false;
    },

    SET_MISSING_RANGE(state, { index, low, high }) {
      const v = state.schema.variables[index];
      if (!v) return;
      if (!v.missing) v.missing = { discrete: [], range: null };

      const bosh = (x) => x === null || x === undefined || x === "";

      if (bosh(low) && bosh(high)) {
        // 🔴 Ikkala chegara ham bo'sh -> oraliq YO'Q.
        //
        // `{low: null, high: null}` yuborilsa backend uni rad etadi
        // (422), chunki u hech narsani ta'riflamaydi. Bu yerda
        // `null` ga aylantirmaslik foydalanuvchini tushunarsiz xatoga
        // olib borardi — u shunchaki maydonlarni tozalagan bo'lardi.
        v.missing.range = null;
      } else {
        v.missing.range = {
          low: bosh(low) ? null : Number(low),
          high: bosh(high) ? null : Number(high),
        };
        // Oraliq qo'shilganda SPSS chegarasi 1 taga tushadi.
        if ((v.missing.discrete || []).length > MAX_KOD_ORALIQ_BILAN) {
          v.missing.discrete = v.missing.discrete.slice(0, MAX_KOD_ORALIQ_BILAN);
        }
      }
      state.saved = false;
    },

    CLEAR_MISSING(state, index) {
      const v = state.schema.variables[index];
      if (!v) return;
      v.missing = null;
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

    async open({ commit, dispatch }, fileId) {
      const res = await api.get(`/files/${fileId}`);

      commit("SET_FILE", res.data.file);
      commit("SET_SCHEMA", {
        variables: res.data.schema?.variables ?? [],
      });
      commit(
        "SET_ROWS",
        res.data.rows.map(r => r.values)
      );
      commit("SET_FILTER", {
        filter: res.data.filter,
        // `selected` faqat filtr yoqilganda keladi; yo'q bo'lsa
        // bo'sh ro'yxat qoladi va hech bir qator chizilmaydi.
        rowSelected: res.data.rows.some(r => "selected" in r)
          ? res.data.rows.map(r => r.selected !== false)
          : [],
      });

      // 🔴 FAYL OCHILGANDA ESKIRGANLIK DARROV HISOBLANADI.
      //
      // Aks holda foydalanuvchi kecha bajarilgan tahlilni bugungi
      // (o'zgargan) ma'lumotga tegishli deb o'qirdi.
      //
      // Xesh AYNAN SHU javobdan olinadi, `GET /results` dan emas:
      // ro'yxat anonim foydalanuvchida ham ishlaydi, `GET /results`
      // esa login talab qiladi. Xesh faqat o'sha yerdan kelsa,
      // anonim foydalanuvchi ustun qo'shgandan keyin eski
      // natijalarni o'zgarishsiz ko'rib turaverardi.
      if (res.data.rows_hash) commit("MARK_STALE", res.data.rows_hash);

      try {
        await dispatch("loadSavedResults");
      } catch {
        // Ro'yxat yuklanmasa ham fayl ochilaveradi — tahlil
        // qilish uchun u shart emas.
      }
    },

    /* ===== SAVE ===== */

    async saveSchema({ state, commit }) {
      if (!state.file) return;

      commit("SET_SAVING", true);

      const variables = state.schema.variables.map(v => {
        // `_showValues` / `_showMissing` — faqat UI holati, backend
        // sxemasida bunday maydon yo'q va u 422 berardi.
        const { _showValues, _showMissing, ...clean } = v;

        if (clean.missing) {
          const kodlar = (clean.missing.discrete || [])
            .map(k => String(k).trim())
            .filter(Boolean);
          const tarif = { discrete: kodlar, range: clean.missing.range || null };
          // Bo'sh ta'rif sxemada ma'nosiz obyekt bo'lib qolmasin.
          clean.missing = tarifBoshmi(tarif) ? null : tarif;
        }
        return clean;
      });

      try {
        await api.put(`/files/${state.file.id}/schema`, { variables });
        commit("SET_SCHEMA_ERROR", null);
        commit("SET_SAVED", true);
      } catch (e) {
        // 🔴 Xato KO'RINADIGAN bo'lishi shart — avtosaqlashda
        // foydalanuvchi javobni boshqa hech qayerda ko'rmaydi.
        commit("SET_SCHEMA_ERROR", xatoMatni(e, "Sxemani saqlab bo'lmadi."));
        throw e;
      } finally {
        // Ilgari `finally` yo'q edi: 422 dan keyin `saving` abadiy
        // `true` bo'lib qolardi va interfeys «saqlanmoqda» holatida
        // muzlab turardi.
        commit("SET_SAVING", false);
      }
    },

    /* ===== HISOBLANGAN O'ZGARUVCHI ===== */

    async validateExpression({ state }, { expression, name, overwrite }) {
      // Saqlamasdan tekshiradi: foydalanuvchi xatoni SAQLASHDAN OLDIN
      // ko'rsin. Qatorlar o'qilmaydi, ya'ni katta faylda ham tez.
      if (!state.file) return;
      await api.post(`/files/${state.file.id}/compute:validate`, {
        expression,
        name: name || null,
        overwrite: !!overwrite,
      });
    },

    async computeVariable({ state, dispatch }, payload) {
      if (!state.file) return null;
      const res = await api.post(`/files/${state.file.id}/compute`, payload);
      // 🔴 Faylni QAYTA O'QIYMIZ. Backend yangi ustunni BARCHA
      // qatorlarga yozdi va sxemaga o'zgaruvchi qo'shdi — mahalliy
      // holatni qo'lda yamash ikkinchi haqiqat manbai bo'lardi va
      // vaqt o'tib ajralib ketardi.
      await dispatch("open", state.file.id);
      return res.data;
    },

    async previewRecode({ state }, { source, rules, name, overwrite }) {
      // Saqlamasdan sanaydi. `validateExpression` dan farqi: bu yerda
      // qatorlar O'QILADI, chunki `by_target` ni ularsiz hisoblab
      // bo'lmaydi. Ya'ni bu tez tekshiruv emas, quruq yugurtirish.
      if (!state.file) return null;
      const res = await api.post(`/files/${state.file.id}/recode:preview`, {
        source,
        rules,
        name: name || null,
        overwrite: !!overwrite,
      });
      return res.data;
    },

    async recodeVariable({ state, dispatch }, payload) {
      if (!state.file) return null;
      const res = await api.post(`/files/${state.file.id}/recode`, payload);
      // 🔴 Faylni QAYTA O'QIYMIZ — `computeVariable` dagi bilan bir xil
      // sabab: backend yangi ustunni barcha qatorlarga yozdi va sxemaga
      // o'zgaruvchi qo'shdi. Mahalliy holatni qo'lda yamash ikkinchi
      // haqiqat manbai bo'lardi.
      await dispatch("open", state.file.id);
      return res.data;
    },

    async previewFilter({ state }, { expression }) {
      // Saqlamasdan sanaydi. Foydalanuvchi filtrni YOQISHDAN OLDIN
      // nechta qator qolishini ko'rishi kerak: yoqib qo'yib, keyin
      // barcha tahlillar «mos qator topilmadi» deb yiqilishini
      // kutish yomon oqim.
      if (!state.file) return null;
      const res = await api.post(`/files/${state.file.id}/filter:preview`, {
        expression,
      });
      return res.data;
    },

    async saveFilter({ state, dispatch }, { expression, enabled = true }) {
      if (!state.file) return null;
      const res = await api.put(`/files/${state.file.id}/filter`, {
        expression,
        enabled,
      });
      // Faylni qayta o'qiymiz: qator bayroqlari serverdan keladi.
      await dispatch("open", state.file.id);
      return res.data;
    },

    async deleteFilter({ state, dispatch }) {
      if (!state.file) return;
      await api.delete(`/files/${state.file.id}/filter`);
      await dispatch("open", state.file.id);
    },

    async toggleFilter({ state, dispatch }) {
      // 🔴 O'chirish SHARTNI YO'QOTMAYDI — `enabled` almashadi,
      // matn joyida qoladi. Butunlay olib tashlash `deleteFilter` da.
      if (!state.filter?.expression) return;
      await dispatch("saveFilter", {
        expression: state.filter.expression,
        enabled: !state.filter.enabled,
      });
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

        commit("ADD_RESULT", { ...res.data, replaceId: payload.replaceId ?? null });
        return res.data;
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

    /* ===== NATIJALAR RO'YXATI (08-vazifa) ===== */

    /** Saqlangan natijalarni yuklaydi va ro'yxatga qo'shadi.
     *
     * 🔴 ANONIM FOYDALANUVCHIDA CHAQIRILMAYDI. `GET /results` login
     * talab qiladi (saqlash ham talab qiladi, ya'ni anonim uchun
     * qaytariladigan narsa yo'q) — chaqirilsa har fayl ochilishida
     * kutilgan `401` konsolga tushardi.
     */
    async loadSavedResults({ state, commit, rootState }) {
      if (!state.file) return;
      if (!rootState.auth?.user) return;

      const res = await api.get(`/analyze/files/${state.file.id}/results`);
      const joriy = res.data.current_rows_hash;

      const saqlanganlar = (res.data.items || []).map(item =>
        natijaElementi(
          { type: item.type, params: item.params, result: item.result,
            rows_hash: item.rows_hash, saved_id: item.id },
          {
            id: item.id,
            created_at: item.created_at,
            saved: true,
            stale: !!item.rows_hash && item.rows_hash !== joriy,
            // 🔴 ESKIRGAN ELEMENT SUKUT BO'YICHA BELGILANMAYDI.
            // Eksport uni JORIY ma'lumot bilan qayta hisoblaydi,
            // ya'ni hujjatdagi raqam ekrandagidan farq qilishi
            // mumkin. Belgilangan holda kelsa, foydalanuvchi buni
            // sezmasdan hisobotga kiritardi.
            selected: !item.rows_hash || item.rows_hash === joriy,
          },
        ),
      );

      // Sessiyada bajarilgan, lekin saqlanmagan tahlillar yo'qolmasin.
      const kalitlar = new Set(
        saqlanganlar.map(e => natijaKaliti(e.type, e.params, e.rows_hash)),
      );
      const saqlanmaganlar = state.results.filter(
        e => !e.saved && !kalitlar.has(natijaKaliti(e.type, e.params, e.rows_hash)),
      );

      commit("SET_RESULTS", [...saqlanmaganlar, ...saqlanganlar]);
      commit("MARK_STALE", joriy);
    },

    /** Elementni profilga saqlaydi (login talab qilinadi). */
    async saveResultEntry({ state, commit }, id) {
      const e = state.results.find(x => x.id === id);
      if (!state.file || !e) return;

      const res = await api.post(`/analyze/files/${state.file.id}`, {
        type: e.type ?? "auto",
        params: e.params ?? {},
        saveToProfile: true,
      });
      commit("SET_RESULT_SAVED", { id, saved_id: res.data.saved_id });
      return res.data;
    },

    /** Elementni o'chiradi — saqlangan bo'lsa serverdan ham. */
    async deleteResultEntry({ state, commit }, id) {
      const e = state.results.find(x => x.id === id);
      if (!e) return;

      if (e.saved && e.saved_id && state.file) {
        await api.delete(`/analyze/files/${state.file.id}/results/${e.saved_id}`);
      }
      commit("REMOVE_RESULT", id);
    },

    /** Elementni joriy ma'lumot bilan qayta hisoblaydi. */
    async recomputeEntry({ state, dispatch }, id) {
      const e = state.results.find(x => x.id === id);
      if (!e) return;
      // `replaceId` — `ADD_RESULT` eski elementni O'RNIDA
      // almashtirsin: aks holda ro'yxatda bir xil tahlilning
      // ikki nusxasi qolardi (biri `eskirgan` nishoni bilan).
      return dispatch("analyze", {
        type: e.type ?? "auto",
        params: e.params ?? {},
        replaceId: id,
      });
    },

    /** Belgilangan natijalarni BITTA hujjatga eksport qiladi.
     *
     * 🔴 NATIJA JSON'I YUBORILMAYDI — faqat `(type, params)`.
     * Server hammasini joriy ma'lumot bilan qayta hisoblaydi, ya'ni
     * hujjatning barcha jadvallari bitta tanlamadan chiqadi.
     */
    async exportSelected({ state, dispatch }, { fmt, deliver = "browser" }) {
      if (!state.file) return;
      const tanlangan = state.results.filter(e => e.selected);
      if (!tanlangan.length) return;

      const items = tanlangan.map(e => ({
        type: e.type ?? "auto",
        params: e.params ?? {},
      }));

      if (deliver === "telegram") {
        const res = await api.post(
          `/analyze/files/${state.file.id}/export`,
          { fmt, deliver: "telegram", items },
        );
        await dispatch("refreshStale");
        return res.data;
      }

      const res = await api.post(
        `/analyze/files/${state.file.id}/export`,
        { fmt, deliver: "browser", items },
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.file.title || "natija"}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      await dispatch("refreshStale");
    },

    /** Eksportdan keyin eskirgan elementlarni qayta hisoblaydi.
     *
     * Hujjat joriy ma'lumot bilan yasaldi, ya'ni ekrandagi eski
     * raqamlar endi hujjatdagilar bilan MOS EMAS. Ularni shu
     * yerda yangilamasak, foydalanuvchi ikki xil raqamni ko'rib,
     * qaysi biri hujjatga tushganini bilmasdi.
     */
    async refreshStale({ state, dispatch }) {
      for (const e of state.results.filter(x => x.stale && x.selected)) {
        await dispatch("recomputeEntry", e.id);
      }
    },
  },
};