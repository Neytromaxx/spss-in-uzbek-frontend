<script setup>
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { useStore } from "vuex";

const store = useStore();

/* ===============================
   STATE
================================ */
const variables = computed(() => store.state.editor.schema.variables);
const rows = computed(() => store.state.editor.rows);

/* ===============================
   CSV IMPORT
================================ */
const fileInput = ref(null);
const importing = ref(false);
const importMsg = ref("");

function pickCsv() {
  importMsg.value = "";
  fileInput.value?.click();
}

async function onCsvChosen(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    await store.dispatch("editor/importCsv", file);
    importMsg.value = "✓ CSV yuklandi";
  } catch (err) {
    importMsg.value = err.response?.data?.detail || "CSV yuklashda xatolik";
  } finally {
    importing.value = false;
    e.target.value = "";
  }
}

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
    <div class="dt-head">
      <h3>Ma’lumotlar ({{ rows.length }} qator)</h3>
      <button class="csv-btn" :disabled="importing" @click="pickCsv">
        {{ importing ? "Yuklanmoqda…" : "📁 CSV yuklash" }}
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".csv,text/csv"
        style="display: none"
        @change="onCsvChosen"
      />
    </div>
    <p v-if="importMsg" class="csv-msg">{{ importMsg }}</p>

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
  color: var(--t1);
}
.data-tab h3 {
  font-family: 'Instrument Serif', serif;
  font-size: 1.5rem;
}
.dt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.csv-btn {
  background: var(--s3);
  border: 1px solid var(--bd);
  color: var(--t1);
  border-radius: var(--r3);
  padding: 8px 14px;
  font-size: .82rem;
  white-space: nowrap;
}
.csv-msg {
  font-size: .8rem;
  color: var(--a3);
  margin: 0;
}

.table-wrapper {
  overflow: auto;
  border: 1px solid var(--bd);
  border-radius: var(--r);
  background: var(--s1);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

thead {
  position: sticky;
  top: 0;
  background: var(--s3);
  z-index: 1;
}

th, td {
  border-bottom: 1px solid var(--bd);
  padding: 8px 10px;
  text-align: left;
}

th {
  color: var(--t3);
  font-weight: 700;
  font-size: .68rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  white-space: nowrap;
}

.row-index {
  color: var(--t3);
  width: 40px;
  font-family: 'JetBrains Mono', monospace;
  font-size: .78rem;
}

table input,
table select {
  padding: 7px 8px;
  font-size: .82rem;
  min-width: 90px;
}

button.small {
  padding: 6px 10px;
  font-size: .78rem;
}

.empty {
  color: var(--t3);
  font-size: .9rem;
  padding: 32px 0;
  text-align: center;
}
</style>