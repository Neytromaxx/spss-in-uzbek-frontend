<script setup>
import { computed, watch, onBeforeUnmount } from "vue";
import { useStore } from "vuex";

const store = useStore();

/* ===============================
   STATE
================================ */
const variables = computed(() => store.state.editor.schema.variables);
const rows = computed(() => store.state.editor.rows);

/* ===============================
   ADD ROW (EXPOSED)
================================ */
function addRow() {
  store.commit("editor/ADD_ROW");
}

defineExpose({ addRow });

/* ===============================
   REMOVE ROW
================================ */
function removeRow(index) {
  store.commit("editor/REMOVE_ROW", index);
}

/* ===============================
   UPDATE CELL
================================ */
function updateCell(rowIndex, varName, value) {
  store.commit("editor/UPDATE_CELL", {
    rowIndex,
    varName,
    value,
  });
}

/* ===============================
   AUTOSAVE (ROWS)
================================ */
let autosaveTimer = null;

function scheduleSave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);

  autosaveTimer = setTimeout(async () => {
    try {
      await store.dispatch("editor/saveRows");
    } catch (e) {
      console.error("Autosave schema failed", e);
    }
  }, 1500);
}

watch(
  () => store.state.editor.rows,
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
  <div class="data-tab">
    <h3>Ma’lumotlar ({{ rows.length }} qator)</h3>

    <div v-if="variables.length === 0" class="empty">
      Avval o‘zgaruvchilarni yarating
    </div>

    <div v-else-if="rows.length === 0" class="empty">
      Ma’lumot yo‘q. Pastdan qator qo‘shing.
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th v-for="v in variables" :key="v.name">
              {{ v.label || v.name }}
            </th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, rIndex) in rows" :key="rIndex">
            <td class="row-index">{{ rIndex + 1 }}</td>

            <td v-for="v in variables" :key="v.name">
              <!-- SCALE -->
              <input
                v-if="v.measure === 'scale'"
                type="number"
                :value="row[v.name]"
                @input="updateCell(rIndex, v.name, $event.target.value)"
              />

              <!-- NOMINAL / ORDINAL -->
              <select
                v-else
                :value="row[v.name]"
                @change="updateCell(rIndex, v.name, $event.target.value)"
              >
                <option value="">—</option>
                <option
                  v-for="(label, key) in v.values || {}"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </td>

            <td>
              <button
                class="danger small"
                @click="removeRow(rIndex)"
              >
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.data-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #e5e7eb;
}

.table-wrapper {
  overflow: auto;
  border: 1px solid #1f2937;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

thead {
  position: sticky;
  top: 0;
  background: #020617;
  z-index: 1;
}

th, td {
  border-bottom: 1px solid #1f2937;
  padding: 8px;
  text-align: left;
}

th {
  color: #9ca3af;
  font-weight: 600;
}

.row-index {
  opacity: 0.6;
  width: 40px;
}

input, select {
  width: 100%;
  background: #020617;
  border: 1px solid #1f2937;
  color: #e5e7eb;
  padding: 4px;
}

button.small {
  padding: 6px;
  font-size: 12px;
}

.empty {
  opacity: 0.6;
  font-style: italic;
}
</style>