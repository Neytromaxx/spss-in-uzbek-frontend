<script setup>
import { watch, onBeforeUnmount } from "vue";
import { useStore } from "vuex";

const store = useStore();

/* ===============================
   ADD ROW
================================ */
function addRow() {
  const row = {};
  store.state.editor.schema.forEach(v => {
    row[v.name] = "";
  });

  store.state.editor.rows.push(row);
  markUnsaved();
}

defineExpose({
  addRow,
})

/* ===============================
   REMOVE ROW
================================ */
function removeRow(index) {
  store.state.editor.rows.splice(index, 1);
  markUnsaved();
}

/* ===============================
   DIRTY FLAG
================================ */
function markUnsaved() {
  store.commit("editor/SET_SAVED", false);
}

/* ===============================
   AUTOSAVE (DEBOUNCE)
================================ */
let autosaveTimer = null;

watch(
  () => store.state.editor.rows,
  () => {
    markUnsaved();

    if (autosaveTimer) clearTimeout(autosaveTimer);

    autosaveTimer = setTimeout(async () => {
      try {
        await store.dispatch("editor/saveRows");
      } catch (e) {
        console.error("Autosave rows failed", e);
      }
    }, 1500);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (autosaveTimer) clearTimeout(autosaveTimer);
});
</script>

<template>
  <div class="data-tab">
    <h3>Ma’lumotlar ({{ store.state.editor.rows.length }} qator)</h3>

    <div v-if="store.state.editor.schema.length === 0" class="empty">
      Avval o‘zgaruvchilarni yarating
    </div>

    <div v-else-if="store.state.editor.rows.length === 0" class="empty">
      Ma’lumot yo‘q. Pastdan qator qo‘shing.
    </div>

    <!-- TABLE WRAPPER -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th v-for="v in store.state.editor.schema" :key="v.id">
              {{ v.name }}
            </th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, rowIndex) in store.state.editor.rows" :key="rowIndex">
            <td class="row-index">{{ rowIndex + 1 }}</td>

            <td
              v-for="v in store.state.editor.schema"
              :key="v.id"
            >
              <input
                v-model="row[v.name]"
                @input="markUnsaved"
                :type="v.type === 'numeric' ? 'number' : 'text'"
              />
            </td>

            <td>
              <button
                class="danger small"
                @click="removeRow(rowIndex)"
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
}

/* scrollni faqat shu joyga qamash */
.table-wrapper {
  overflow: auto;
  border: 1px solid #1f2937;
  border-radius: 8px;
  max-height: 100%;
}

/* TABLE */
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

input {
  width: 100%;
}

/* BUTTONS */
button.small {
  padding: 6px;
  font-size: 12px;
}

.empty {
  opacity: 0.6;
  font-style: italic;
}
</style>
