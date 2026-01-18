<script setup>
import { ref, watch } from "vue";
import { useStore } from "vuex";
import api from "../api";

const store = useStore();

const title = ref("");
const savingTitle = ref(false);

/* ===============================
   INIT TITLE
================================ */
watch(
  () => store.state.editor.file,
  (file) => {
    if (file) title.value = file.title;
  },
  { immediate: true }
);

/* ===============================
   RENAME (DEBOUNCED)
================================ */
let renameTimer = null;

watch(title, (val, old) => {
  if (!store.state.editor.file) return;
  if (val === old) return;
  if (!val.trim()) return;

  store.commit("editor/SET_SAVED", false);

  if (renameTimer) clearTimeout(renameTimer);

  renameTimer = setTimeout(async () => {
    try {
      savingTitle.value = true;

      await api.patch(`/files/${store.state.editor.file.id}`, {
        title: val.trim(),
      });

      store.state.editor.file.title = val.trim();
      store.commit("editor/SET_SAVED", true);
    } catch (e) {
      alert("Nomni saqlashda xatolik");
      title.value = store.state.editor.file.title;
    } finally {
      savingTitle.value = false;
    }
  }, 800);
});

/* ===============================
   BACK
================================ */
function back() {
  store.commit("editor/RESET");
}
</script>

<template>
  <div class="topbar">
    <button class="back" @click="back">←</button>

    <input
      class="title-input"
      v-model="title"
      :disabled="savingTitle"
    />

    <div class="status">
      <span v-if="store.state.editor.saving">Saqlanmoqda…</span>
      <span v-else-if="store.state.editor.saved">✓ Saqlandi</span>
      <span v-else>● Saqlanmagan</span>
    </div>
  </div>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #020617;
  border-bottom: 1px solid #1f2937;
}

.back {
  font-size: 16px;
}

.title-input {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  background: transparent;
  border: none;
  color: #fff;
}

.title-input:focus {
  outline: none;
  border-bottom: 1px solid #2563eb;
}

.status {
  font-size: 12px;
  opacity: 0.8;
  white-space: nowrap;
}
</style>
