<script setup>
import { watch, onBeforeUnmount } from "vue"
import { useStore } from "vuex";

const store = useStore();

/* ===============================
   ADD VARIABLE
================================ */
function addVariable() {
  store.commit("editor/ADD_VARIABLE", {
    name: "o'zg_",
    type: "string",
    label: "New variable",
  });
}

defineExpose({
  addVariable,
});

/* ===============================
   REMOVE VARIABLE
================================ */
function removeVariable(id){
  store.state.editor.schema = store.state.editor.schema.filter(v => v.id !== id);

  markUnsaved();
}

/* ===============================
   DIRTY / SAVED STATE
================================ */
function markUnsaved(){
  store.commit("editor/SET_SAVED", false)
}

/* ===============================
   AUTOSAVE (DEBOUNCE)
================================ */
let autosaveTimer = null

watch(
  ()=> store.state.editor.schema,
  ()=> {
    markUnsaved();

    if(autosaveTimer) clearTimeout(autosaveTimer)

    autosaveTimer = setTimeout( async ()=> {
      try{
        await store.dispatch('editor/saveSchema');
      }catch (e) {
        console.error("Autosave schema failed", e);
      }
    }, 1500)
  },
  {deep:true}
)

onBeforeUnmount(() => {
  if (autosaveTimer) clearTimeout(autosaveTimer);
});
</script>

<template>
  <div class="variables-tab">
    <h3>O‘zgaruvchilar ({{ store.state.editor.schema.length }})</h3>

    <div v-if="store.state.editor.schema.length === 0" class="empty">
      Avval o‘zgaruvchi qo‘shing
    </div>

    <div class="variables-list">
      <div
        class="variable-row"
        v-for="v in store.state.editor.schema"
        :key="v.id"
      >
        <input
          v-model="v.name"
          @input="markUnsaved"
          placeholder="O‘zgaruvchi nomi"
        />

        <select v-model="v.type" @change="markUnsaved">
          <option value="numeric">Raqamli</option>
          <option value="categorical">Kategoriya</option>
        </select>

        <button class="danger" @click="removeVariable(v.id)">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.variables-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.variable-row {
  display: grid;
  grid-template-columns: 1fr 160px 40px;
  gap: 8px;
  align-items: center;
}

.variable-row button {
  padding: 8px;
}

.empty {
  opacity: 0.6;
  font-style: italic;
}
</style>