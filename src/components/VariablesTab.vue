<script setup>
import { computed, watch, onBeforeUnmount } from "vue";
import { useStore } from "vuex";

const store = useStore();

/* ===============================
   STATE
================================ */
const variables = computed(() => store.state.editor.schema.variables);

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
  });
}

defineExpose({ addVariable });

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
        </tr>
      </thead>

      <tbody>
        <template v-for="(v, i) in variables" :key="v.name">
          <!-- MAIN ROW -->
          <tr>
            <td class="mono">{{ v.name }}</td>

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
          </tr>

          <!-- VALUES EDITOR -->
          <tr v-if="v._showValues">
            <td colspan="4">
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
</style>