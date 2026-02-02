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

watch(
  () => store.state.editor.schema.variables,
  async () => {
    if (store.state.editor.analyzing) return;
    markUnsaved();
    debounceSave();
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
  color: #e5e7eb;
}

.empty {
  opacity: 0.6;
  font-style: italic;
}

.vars-table {
  width: 100%;
  border-collapse: collapse;
}

.vars-table th,
.vars-table td {
  border-bottom: 1px solid #1f2937;
  padding: 8px;
  text-align: left;
}

.mono {
  font-family: monospace;
  color: #93c5fd;
}

input,
select {
  width: 100%;
  background: #020617;
  border: 1px solid #1f2937;
  color: #e5e7eb;
  padding: 6px;
}

.link {
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
}

.muted {
  color: #6b7280;
}

.values-editor {
  background: #020617;
  border: 1px solid #1f2937;
  padding: 10px;
}

.value-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.value-key {
  width: 40px;
  font-family: monospace;
  color: #a7f3d0;
}

.small {
  margin-top: 6px;
  padding: 4px 8px;
}

.danger {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
}
</style>
