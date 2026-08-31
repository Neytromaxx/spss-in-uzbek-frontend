<script setup>
import { ref, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import api from "../api";

const store = useStore();
const router = useRouter();

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
    } catch {
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
  router.push("/");
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
  padding: 12px clamp(16px, 4vw, 32px);
  background: rgba(6, 8, 16, .88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--bd);
  position: sticky;
  top: 0;
  z-index: 250;
}

.back {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  padding: 0;
  flex-shrink: 0;
}

.title-input {
  flex: 1;
  font-size: 1rem;
  font-weight: 700;
  background: transparent;
  border: 1px solid transparent;
  color: var(--t1);
  width: auto;
}

.title-input:focus {
  outline: none;
  border-color: var(--bd);
  box-shadow: none;
}

.status {
  font-size: .72rem;
  color: var(--t3);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
