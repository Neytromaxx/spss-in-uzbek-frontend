<script setup>
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { useStore } from "vuex";

import ComputeModal from "./ComputeModal.vue";

const store = useStore();

/* ===============================
   STATE
================================ */
const variables = computed(() => store.state.editor.schema.variables);

// Sxema avtosaqlanadi, ya'ni foydalanuvchi javobni boshqa hech qayerda
// ko'rmaydi — xato shu yerda ko'rsatiladi.
const schemaError = computed(() => store.state.editor.schemaError);

// Hisoblangan o'zgaruvchi oynasi.
const computeOchiq = ref(false);

// Backenddagi `schemas.py` bilan bir xil (SPSS cheklovi).
const MAX_KOD_ORALIQSIZ = 3;
const MAX_KOD_ORALIQ_BILAN = 1;

function kodChegarasi(v) {
  return v?.missing?.range ? MAX_KOD_ORALIQ_BILAN : MAX_KOD_ORALIQSIZ;
}

function kodQoshaOladi(v) {
  return (v?.missing?.discrete || []).length < kodChegarasi(v);
}

function missingXulosa(v) {
  const m = v?.missing;
  if (!m) return "—";
  const qismlar = [];
  const kodlar = (m.discrete || []).filter(k => String(k).trim());
  if (kodlar.length) qismlar.push(kodlar.join(", "));
  if (m.range) {
    const past = m.range.low === null || m.range.low === undefined ? "eng past" : m.range.low;
    const yuqori = m.range.high === null || m.range.high === undefined ? "eng yuqori" : m.range.high;
    qismlar.push(`${past}–${yuqori}`);
  }
  return qismlar.length ? qismlar.join("; ") : "—";
}

/* ===============================
   ADD VARIABLE (EXPOSED)
================================ */
function addVariable() {
  const index = variables.value.length + 1;

  store.commit("editor/ADD_VARIABLE", {
    name: `var_${index}`,
    type: "numeric",
    label: "",
    measure: "scale",
    values: null,
    missing: null,
  });
}

defineExpose({ addVariable });

function ifodaMatni(v) {
  return v?.derived?.expression || "";
}

/* ===============================
   UPDATE HELPERS
================================ */
function updateVar(index, key, value) {
  store.commit("editor/UPDATE_VARIABLE", {
    index,
    key,
    value,
  });
}

function toggleValues(index) {
  store.commit("editor/TOGGLE_VALUES_EDITOR", index);
}

function addValue(index) {
  store.commit("editor/ADD_VALUE_LABEL", index);
}

function updateValue(index, valKey, valLabel) {
  store.commit("editor/UPDATE_VALUE_LABEL", {
    index,
    valKey,
    valLabel,
  });
}

function toggleMissing(index) {
  store.commit("editor/TOGGLE_MISSING_EDITOR", index);
}

function addMissingCode(index) {
  store.commit("editor/ADD_MISSING_CODE", index);
}

function updateMissingCode(index, codeIndex, value) {
  store.commit("editor/UPDATE_MISSING_CODE", { index, codeIndex, value });
}

function removeMissingCode(index, codeIndex) {
  store.commit("editor/REMOVE_MISSING_CODE", { index, codeIndex });
}

function setMissingRange(index, low, high) {
  store.commit("editor/SET_MISSING_RANGE", { index, low, high });
}

function clearMissing(index) {
  store.commit("editor/CLEAR_MISSING", index);
}

function removeValue(index, valKey) {
  store.commit("editor/REMOVE_VALUE_LABEL", {
    index,
    valKey,
  });
}

/* ===============================
   AUTOSAVE (DEBOUNCE)
================================ */
let autosaveTimer = null;

function scheduleSave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);

  autosaveTimer = setTimeout(async () => {
    try {
      await store.dispatch("editor/saveSchema");
    } catch (e) {
      console.error("Autosave schema failed", e);
    }
  }, 1500);
}

watch(
  () => store.state.editor.schema.variables,
  () => {
    if (store.state.editor.analyzing) return;

    store.commit("editor/SET_SAVED", false);
    scheduleSave();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (autosaveTimer) clearTimeout(autosaveTimer);
});
</script>

<template>
  <div class="variables-tab">
    <h3>O‘zgaruvchilar ({{ variables.length }})</h3>

    <div class="asboblar">
      <button class="link" @click="computeOchiq = true">
        ƒ Hisoblangan o‘zgaruvchi
      </button>
    </div>

    <ComputeModal :open="computeOchiq" @close="computeOchiq = false" />

    <!-- Sxema avtosaqlanadi: xatoni ko'rsatadigan boshqa joy yo'q. -->
    <div v-if="schemaError" class="schema-error">
      <strong>Sxema saqlanmadi.</strong> {{ schemaError }}
    </div>

    <div v-if="variables.length === 0" class="empty">
      Avval o‘zgaruvchi qo‘shing
    </div>

    <table v-else class="vars-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Label</th>
          <th>Measure</th>
          <th>Values</th>
          <th>Yo‘q qiymatlar</th>
        </tr>
      </thead>

      <tbody>
        <template v-for="(v, i) in variables" :key="v.name">
          <!-- MAIN ROW -->
          <tr>
            <td class="mono">
              <span
                v-if="ifodaMatni(v)"
                class="derived-belgi"
                :title="'Ifoda: ' + ifodaMatni(v)"
              >ƒ</span>
              {{ v.name }}
            </td>

            <td>
              <input
                :value="v.label"
                placeholder="Label"
                @input="updateVar(i, 'label', $event.target.value)"
              />
            </td>

            <td>
              <select
                :value="v.measure"
                @change="updateVar(i, 'measure', $event.target.value)"
              >
                <option value="nominal">Nominal</option>
                <option value="ordinal">Ordinal</option>
                <option value="scale">Scale</option>
              </select>
            </td>

            <td>
              <button
                v-if="v.measure !== 'scale'"
                class="link"
                @click="toggleValues(i)"
              >
                {{ v._showValues ? "Yopish" : "Tahrirlash" }}
              </button>
              <span v-else class="muted">—</span>
            </td>

            <td>
              <button class="link" @click="toggleMissing(i)">
                {{ missingXulosa(v) }}
              </button>
            </td>
          </tr>

          <!-- VALUES EDITOR -->
          <tr v-if="v._showValues">
            <td colspan="5">
              <div class="values-editor">
                <div
                  v-for="(label, key) in v.values"
                  :key="key"
                  class="value-row"
                >
                  <span class="value-key">{{ key }}</span>
                  <input
                    :value="label"
                    placeholder="Label"
                    @input="updateValue(i, key, $event.target.value)"
                  />
                  <button
                    class="danger"
                    @click="removeValue(i, key)"
                  >
                    ✕
                  </button>
                </div>

                <button class="small" @click="addValue(i)">
                  + Value qo‘shish
                </button>
              </div>
            </td>
          </tr>

          <!-- YO'Q QIYMATLAR TAHRIRLAGICHI -->
          <tr v-if="v._showMissing">
            <td colspan="5">
              <div class="missing-editor">
                <p class="hint">
                  So‘rovnomada <code>99</code> = «javob bermadi» kabi kodlar
                  bo‘ladi. Ular bu yerda belgilansa, tahlildan chiqarib
                  tashlanadi va o‘rtachani buzmaydi.
                </p>

                <div class="missing-block">
                  <div class="missing-label">Alohida kodlar</div>
                  <div
                    v-for="(kod, ki) in (v.missing?.discrete || [])"
                    :key="ki"
                    class="value-row"
                  >
                    <input
                      :value="kod"
                      placeholder="masalan 99"
                      @input="updateMissingCode(i, ki, $event.target.value)"
                    />
                    <button class="danger" @click="removeMissingCode(i, ki)">✕</button>
                  </div>

                  <button
                    class="small"
                    :disabled="!kodQoshaOladi(v)"
                    @click="addMissingCode(i)"
                  >
                    + Kod qo‘shish
                  </button>
                  <span class="hint inline">
                    eng ko‘pi {{ kodChegarasi(v) }} ta
                    <template v-if="v.missing?.range">(oraliq bilan birga)</template>
                  </span>
                </div>

                <div class="missing-block">
                  <div class="missing-label">Oraliq</div>
                  <div class="value-row">
                    <input
                      type="number"
                      class="range-input"
                      placeholder="dan"
                      :value="v.missing?.range?.low ?? ''"
                      @input="setMissingRange(i, $event.target.value, v.missing?.range?.high ?? '')"
                    />
                    <span class="muted">—</span>
                    <input
                      type="number"
                      class="range-input"
                      placeholder="gacha"
                      :value="v.missing?.range?.high ?? ''"
                      @input="setMissingRange(i, v.missing?.range?.low ?? '', $event.target.value)"
                    />
                  </div>
                  <span class="hint inline">
                    bitta chegara bo‘sh qoldirilsa — cheksiz
                  </span>
                </div>

                <button class="small danger-text" @click="clearMissing(i)">
                  Ta‘rifni o‘chirish
                </button>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.variables-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--t1);
}
.variables-tab h3 {
  font-family: 'Instrument Serif', serif;
  font-size: 1.5rem;
}

.empty {
  color: var(--t3);
  font-size: .9rem;
  padding: 32px 0;
  text-align: center;
}

.vars-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--s1);
  border: 1px solid var(--bd);
  border-radius: var(--r);
  overflow: hidden;
}

.vars-table th {
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
}

.vars-table th,
.vars-table td {
  border-bottom: 1px solid var(--bd);
  padding: 10px 12px;
  text-align: left;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
  color: var(--a1);
  font-size: .82rem;
}

.vars-table input,
.vars-table select {
  padding: 8px 10px;
  font-size: .84rem;
}

.link {
  background: transparent;
  border: 1px solid var(--bd);
  color: var(--a1);
  font-size: .78rem;
  padding: 6px 12px;
}

.muted {
  color: var(--t3);
}

.values-editor {
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: var(--r3);
  padding: 12px;
}

.value-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.value-key {
  width: 36px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--a3);
  flex-shrink: 0;
}

.small {
  margin-top: 6px;
  padding: 7px 14px;
  font-size: .78rem;
}

.value-row .danger {
  padding: 6px 10px;
  flex-shrink: 0;
}

/* ===== YO'Q QIYMATLAR ===== */

.asboblar {
  display: flex;
  gap: 8px;
}

.derived-belgi {
  font-family: 'JetBrains Mono', monospace;
  color: var(--a3);
  margin-right: 4px;
  cursor: help;
}

.schema-error {
  background: var(--s1);
  border: 1px solid var(--er, #b4453c);
  border-left-width: 3px;
  border-radius: var(--r3);
  padding: 10px 14px;
  font-size: .84rem;
  color: var(--t1);
}

.missing-editor {
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: var(--r3);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.missing-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.missing-label {
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
}

.hint {
  color: var(--t3);
  font-size: .78rem;
  line-height: 1.5;
}

.hint.inline {
  font-size: .72rem;
}

.range-input {
  width: 110px;
}

.small:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.danger-text {
  align-self: flex-start;
  color: var(--er, #b4453c);
}
</style>